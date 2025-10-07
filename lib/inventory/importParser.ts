/**
 * Parser for inventory import spreadsheets
 * Handles header normalization and data parsing
 */

export const numberFields = [
  'coldRoomQuantity',
  'houseQuantity',
  'salePointQuantity',
  'coldRoomMinStock',
  'houseMinStock',
  'salePointMinStock',
  'reservedQuantity',
  'damagedQuantity',
  'inTransitQuantity',
  'safetyStock',
] as const;

export type NumericField = (typeof numberFields)[number];

export type ParsedImportRow = {
  sku?: string;
  name?: string;
} & Partial<Record<NumericField, number>>;

export type NormalizedRow = ParsedImportRow & {
  rowNumber: number;
};

export const headerMap: Record<string, keyof ParsedImportRow> = {
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
  safety_stock: 'safetyStock',
};

/**
 * Normalize header strings for comparison
 */
export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s_]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/**
 * Parse a value to number, handling various formats
 */
export function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = (() => {
    const sanitized = trimmed.replace(/\s+/g, '');
    const hasComma = sanitized.includes(',');
    const hasDot = sanitized.includes('.');

    if (hasComma && hasDot) {
      return sanitized.replace(/\./g, '').replace(',', '.');
    }

    if (hasComma) {
      return sanitized.replace(',', '.');
    }

    return sanitized;
  })();

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Parse spreadsheet rows into normalized data
 */
export function parseSpreadsheetRows(
  rows: Record<string, unknown>[]
): {
  normalizedRows: NormalizedRow[];
  recognizedColumns: Set<keyof ParsedImportRow>;
} {
  const normalizedRows: NormalizedRow[] = [];
  const recognizedColumns = new Set<keyof ParsedImportRow>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // First row is header
    const parsedRow: ParsedImportRow = {};

    Object.entries(row).forEach(([rawHeader, value]) => {
      if (!rawHeader) return;

      const normalizedKey = normalizeHeader(String(rawHeader));
      const mappedKey = headerMap[normalizedKey];
      if (!mappedKey) return;

      recognizedColumns.add(mappedKey);

      if (mappedKey === 'sku' || mappedKey === 'name') {
        const stringValue =
          typeof value === 'string'
            ? value.trim()
            : value != null
              ? String(value).trim()
              : '';
        if (stringValue) {
          parsedRow[mappedKey] = stringValue;
        }
      } else {
        const numericValue = parseNumber(value);
        if (typeof numericValue === 'number') {
          parsedRow[mappedKey as NumericField] = numericValue;
        }
      }
    });

    normalizedRows.push({ ...parsedRow, rowNumber });
  });

  return { normalizedRows, recognizedColumns };
}
