import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type {
  InventoryImportError,
  InventoryImportResponse,
  InventoryImportSummary,
} from '@/lib/inventoryImport';
import { parseSpreadsheetRows } from '@/lib/inventory/importParser';
import { validateRows } from '@/lib/inventory/importValidator';
import { processInventoryUpdates } from '@/lib/inventory/importProcessor';
import { logger } from '@/lib/logger';

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const runtime = 'nodejs';

function buildSummary(
  base: Partial<InventoryImportSummary> & Pick<InventoryImportSummary, 'errors' | 'warnings'>
): InventoryImportSummary {
  return {
    totalRows: base.totalRows ?? 0,
    processedCount: base.processedCount ?? 0,
    createdCount: base.createdCount ?? 0,
    updatedCount: base.updatedCount ?? 0,
    ignoredCount: base.ignoredCount ?? 0,
    errors: base.errors,
    warnings: base.warnings,
  };
}

export async function GET() {
  const workbook = XLSX.utils.book_new()
  const data = [
    [
      'SKU',
      'Nome',
      'Câmara Fria',
      'Casa',
      'Pontos de Venda',
      'Estoque mínimo câmara fria',
      'Estoque mínimo casa',
      'Estoque mínimo pontos de venda',
      'Reservado',
      'Avariado',
      'Em trânsito',
      'Estoque de segurança'
    ],
    ['NB-LAGER-600', 'Nitro Lager', 120, 36, 48, 60, 18, 24, 8, 2, 12, 30]
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventário')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo-importacao-inventario.xlsx"',
      'Cache-Control': 'no-cache'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Nenhum arquivo foi enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(arrayBuffer, { type: 'array' });
    } catch (error) {
      logger.error('Import inventory: invalid workbook', { error });
      return NextResponse.json({ error: 'Não foi possível ler a planilha enviada.' }, { status: 400 });
    }

    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'A planilha enviada não contém abas.' }, { status: 400 });
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) {
      return NextResponse.json({ error: 'Não foi possível acessar a primeira aba da planilha.' }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });
    const totalRows = rows.length;

    if (totalRows === 0) {
      const summary = buildSummary({
        totalRows,
        errors: [],
        warnings: ['A planilha não possui linhas para importação.'],
      });
      return NextResponse.json<InventoryImportResponse>({ summary }, { status: 400 });
    }

    // Parse spreadsheet rows
    const { normalizedRows, recognizedColumns } = parseSpreadsheetRows(rows);

    if (!recognizedColumns.size) {
      const summary = buildSummary({
        totalRows,
        errors: [],
        warnings: ['A planilha não contém colunas reconhecíveis. Verifique o modelo disponível para download.'],
      });
      return NextResponse.json<InventoryImportResponse>({ summary }, { status: 400 });
    }

    // Validate rows
    const validation = validateRows(normalizedRows);

    if (!validation.validRows.length) {
      const summary = buildSummary({
        totalRows,
        ignoredCount: validation.ignoredCount,
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return NextResponse.json<InventoryImportResponse>({ summary }, { status: 400 });
    }

    // Process inventory updates
    const result = await processInventoryUpdates(validation.validRows);

    // Merge errors and warnings
    const allErrors = [...validation.errors, ...result.errors];
    const allWarnings = [...validation.warnings, ...result.warnings];

    const summary = buildSummary({
      totalRows,
      processedCount: result.processedCount,
      createdCount: result.createdCount,
      updatedCount: result.updatedCount,
      ignoredCount: validation.ignoredCount + result.ignoredCount,
      errors: allErrors,
      warnings: allWarnings,
    });

    return NextResponse.json<InventoryImportResponse>({ summary });
  } catch (error) {
    logger.error('Import inventory: unexpected error', { error });
    return NextResponse.json({ error: 'Ocorreu um erro inesperado ao processar a planilha.' }, { status: 500 });
  }
}
