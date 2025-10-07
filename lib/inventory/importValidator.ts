/**
 * Validator for inventory import data
 * Validates rows and builds error/warning lists
 */

import type { InventoryImportError } from '@/lib/inventoryImport';
import type { NormalizedRow, NumericField } from './importParser';
import { numberFields } from './importParser';

export type ValidationResult = {
  validRows: NormalizedRow[];
  ignoredCount: number;
  errors: InventoryImportError[];
  warnings: string[];
};

/**
 * Validate normalized rows and filter out invalid data
 */
export function validateRows(normalizedRows: NormalizedRow[]): ValidationResult {
  const errors: InventoryImportError[] = [];
  const warnings: string[] = [];
  const validRows: NormalizedRow[] = [];
  let ignoredCount = 0;

  normalizedRows.forEach((row) => {
    // Check if row has required identifiers
    if (!row.sku && !row.name) {
      errors.push({
        row: row.rowNumber,
        message: 'Informe o SKU ou Nome do produto.',
      });
      ignoredCount += 1;
      return;
    }

    // Check if row has at least one numeric value
    const hasNumbers = numberFields.some((field) => typeof row[field] === 'number');
    if (!hasNumbers) {
      warnings.push(
        `Linha ${row.rowNumber}: nenhuma quantidade numérica válida encontrada. Linha ignorada.`
      );
      ignoredCount += 1;
      return;
    }

    validRows.push(row);
  });

  return { validRows, ignoredCount, errors, warnings };
}

/**
 * Check if row has valid numeric values
 */
export function hasValidNumericValues(
  row: NormalizedRow,
  fields: readonly NumericField[]
): boolean {
  return fields.some((field) => {
    const value = row[field];
    return typeof value === 'number' && Number.isFinite(value);
  });
}
