import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import type { InventoryImportError, InventoryImportResponse, InventoryImportSummary } from '@/lib/inventoryImport'

export const runtime = 'nodejs'

const numberFields = [
  'coldRoomQuantity',
  'houseQuantity',
  'salePointQuantity',
  'coldRoomMinStock',
  'houseMinStock',
  'salePointMinStock',
  'reservedQuantity',
  'damagedQuantity',
  'inTransitQuantity',
  'safetyStock'
] as const

type NumericField = (typeof numberFields)[number]

type ParsedImportRow = {
  sku?: string
  name?: string
} & Partial<Record<NumericField, number>>

type NormalizedRow = ParsedImportRow & {
  rowNumber: number
}

const headerMap: Record<string, keyof ParsedImportRow> = {
  sku: 'sku',
  codigo: 'sku',
  codigoproduto: 'sku',
  productcode: 'sku',
  code: 'sku',
  nome: 'name',
  produto: 'name',
  product: 'name',
  name: 'name',
  camara_fria: 'coldRoomQuantity',
  camerafria: 'coldRoomQuantity',
  camara: 'coldRoomQuantity',
  estoque_camara: 'coldRoomQuantity',
  estoque_camara_fria: 'coldRoomQuantity',
  estoque_camara_frio: 'coldRoomQuantity',
  cold_room: 'coldRoomQuantity',
  coldroom: 'coldRoomQuantity',
  refrigerado: 'coldRoomQuantity',
  casa: 'houseQuantity',
  estoque_casa: 'houseQuantity',
  house: 'houseQuantity',
  apoio: 'houseQuantity',
  pontos_de_venda: 'salePointQuantity',
  ponto_de_venda: 'salePointQuantity',
  pontos: 'salePointQuantity',
  pdv: 'salePointQuantity',
  estoque_pdv: 'salePointQuantity',
  sale_point: 'salePointQuantity',
  estoque_minimo_camara: 'coldRoomMinStock',
  estoque_min_camara: 'coldRoomMinStock',
  estoque_minimo_camara_fria: 'coldRoomMinStock',
  minimo_camara: 'coldRoomMinStock',
  min_camara: 'coldRoomMinStock',
  estoque_minimo_casa: 'houseMinStock',
  estoque_min_casa: 'houseMinStock',
  minimo_casa: 'houseMinStock',
  min_casa: 'houseMinStock',
  estoque_minimo_pontos: 'salePointMinStock',
  estoque_min_pontos: 'salePointMinStock',
  estoque_minimo_pdv: 'salePointMinStock',
  minimo_pdv: 'salePointMinStock',
  min_pdv: 'salePointMinStock',
  reservado: 'reservedQuantity',
  quantidade_reservada: 'reservedQuantity',
  reserved: 'reservedQuantity',
  avariado: 'damagedQuantity',
  danificado: 'damagedQuantity',
  damaged: 'damagedQuantity',
  em_transito: 'inTransitQuantity',
  transito: 'inTransitQuantity',
  in_transit: 'inTransitQuantity',
  transit: 'inTransitQuantity',
  estoque_seguro: 'safetyStock',
  estoque_de_seguranca: 'safetyStock',
  safety_stock: 'safetyStock'
}

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s_]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const normalized = (() => {
    const sanitized = trimmed.replace(/\s+/g, '')
    const hasComma = sanitized.includes(',')
    const hasDot = sanitized.includes('.')

    if (hasComma && hasDot) {
      return sanitized.replace(/\./g, '').replace(',', '.')
    }

    if (hasComma) {
      return sanitized.replace(',', '.')
    }

    return sanitized
  })()

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildSummary(base: Partial<InventoryImportSummary> & Pick<InventoryImportSummary, 'errors' | 'warnings'>): InventoryImportSummary {
  return {
    totalRows: base.totalRows ?? 0,
    processedCount: base.processedCount ?? 0,
    createdCount: base.createdCount ?? 0,
    updatedCount: base.updatedCount ?? 0,
    ignoredCount: base.ignoredCount ?? 0,
    errors: base.errors,
    warnings: base.warnings
  }
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
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Nenhum arquivo foi enviado.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(arrayBuffer, { type: 'array' })
    } catch (error) {
      console.error('Import inventory: invalid workbook', error)
      return NextResponse.json({ error: 'Não foi possível ler a planilha enviada.' }, { status: 400 })
    }

    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'A planilha enviada não contém abas.' }, { status: 400 })
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!worksheet) {
      return NextResponse.json({ error: 'Não foi possível acessar a primeira aba da planilha.' }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null })
    const totalRows = rows.length

    if (totalRows === 0) {
      const summary = buildSummary({ totalRows, errors: [], warnings: ['A planilha não possui linhas para importação.'] })
      return NextResponse.json<InventoryImportResponse>({ summary }, { status: 400 })
    }

    const errors: InventoryImportError[] = []
    const warnings: string[] = []
    const normalizedRows: NormalizedRow[] = []
    let recognizedColumns = new Set<keyof ParsedImportRow>()

    rows.forEach((row, index) => {
      const rowNumber = index + 2 // Considering the first row as header
      const parsedRow: ParsedImportRow = {}

      Object.entries(row).forEach(([rawHeader, value]) => {
        if (!rawHeader) {
          return
        }

        const normalizedKey = normalizeHeader(String(rawHeader))
        const mappedKey = headerMap[normalizedKey]
        if (!mappedKey) {
          return
        }

        recognizedColumns.add(mappedKey)

        if (mappedKey === 'sku' || mappedKey === 'name') {
          const stringValue = typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : ''
          if (stringValue) {
            parsedRow[mappedKey] = stringValue
          }
        } else {
          const numericValue = parseNumber(value)
          if (typeof numericValue === 'number') {
            parsedRow[mappedKey as NumericField] = numericValue
          }
        }
      })

      normalizedRows.push({ ...parsedRow, rowNumber })
    })

    if (!recognizedColumns.size) {
      const summary = buildSummary({
        totalRows,
        errors: [],
        warnings: ['A planilha não contém colunas reconhecíveis. Verifique o modelo disponível para download.']
      })
      return NextResponse.json<InventoryImportResponse>({ summary }, { status: 400 })
    }

    const validRows: NormalizedRow[] = []
    let ignoredCount = 0

    normalizedRows.forEach((row) => {
      if (!row.sku && !row.name) {
        errors.push({ row: row.rowNumber, message: 'Informe o SKU ou Nome do produto.' })
        ignoredCount += 1
        return
      }

      const hasNumbers = numberFields.some((field) => typeof row[field] === 'number')
      if (!hasNumbers) {
        warnings.push(`Linha ${row.rowNumber}: nenhuma quantidade numérica válida encontrada. Linha ignorada.`)
        ignoredCount += 1
        return
      }

      validRows.push(row)
    })

    if (!validRows.length) {
      const summary = buildSummary({
        totalRows,
        ignoredCount,
        errors,
        warnings
      })
      return NextResponse.json<InventoryImportResponse>({ summary }, { status: 400 })
    }

    const skuList = Array.from(new Set(validRows.map((row) => row.sku).filter(Boolean) as string[]))
    const nameList = Array.from(new Set(validRows.map((row) => row.name?.trim()).filter(Boolean) as string[]))

    const orFilters = [] as Array<{ sku?: { in: string[] }; name?: { in: string[] } }>
    if (skuList.length) {
      orFilters.push({ sku: { in: skuList } })
    }
    if (nameList.length) {
      orFilters.push({ name: { in: nameList } })
    }

    const products = await prisma.product.findMany({
      where: orFilters.length ? { OR: orFilters } : undefined,
      include: {
        inventory: true
      }
    })

    const productBySku = new Map<string, (typeof products)[number]>()
    const productByName = new Map<string, (typeof products)[number]>()
    products.forEach((product) => {
      if (product.sku) {
        productBySku.set(product.sku, product)
      }
      productByName.set(product.name.toLowerCase(), product)
    })

    let processedCount = 0
    let createdCount = 0
    let updatedCount = 0
    const seenProducts = new Set<string>()

    const operations = validRows.map((row) => {
      let product = row.sku ? productBySku.get(row.sku) : undefined
      if (!product && row.name) {
        product = productByName.get(row.name.toLowerCase())
      }

      if (!product) {
        errors.push({
          row: row.rowNumber,
          message: row.sku
            ? `Produto com SKU "${row.sku}" não foi encontrado.`
            : `Produto "${row.name}" não foi encontrado.`
        })
        ignoredCount += 1
        return null
      }

      const productKey = product.id
      if (seenProducts.has(productKey)) {
        warnings.push(`Linha ${row.rowNumber}: múltiplas linhas para o produto ${product.name}. Apenas a primeira foi considerada.`)
        ignoredCount += 1
        return null
      }
      seenProducts.add(productKey)

      const updatePayload: Partial<Record<NumericField, number>> = {}
      numberFields.forEach((field) => {
        const value = row[field]
        if (typeof value === 'number' && Number.isFinite(value)) {
          updatePayload[field] = value
        }
      })

      if (!Object.keys(updatePayload).length) {
        warnings.push(`Linha ${row.rowNumber}: valores numéricos inválidos ou ausentes.`)
        ignoredCount += 1
        return null
      }

      processedCount += 1
      if (product.inventory) {
        updatedCount += 1
      } else {
        createdCount += 1
      }

      return prisma.inventory.upsert({
        where: { productId: product.id },
        update: updatePayload,
        create: { productId: product.id, ...updatePayload }
      })
    })

    const filteredOperations = operations.filter((operation): operation is NonNullable<typeof operation> => Boolean(operation))

    if (filteredOperations.length) {
      await prisma.$transaction(filteredOperations)
    }

    const summary = buildSummary({
      totalRows,
      processedCount,
      createdCount,
      updatedCount,
      ignoredCount,
      errors,
      warnings
    })

    return NextResponse.json<InventoryImportResponse>({ summary })
  } catch (error) {
    console.error('Import inventory: unexpected error', error)
    return NextResponse.json({ error: 'Ocorreu um erro inesperado ao processar a planilha.' }, { status: 500 })
  }
}
