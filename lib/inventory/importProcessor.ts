/**
 * Processor for inventory import operations
 * Handles database operations and updates
 */

import { prisma } from '@/lib/prisma';
import type { InventoryImportError } from '@/lib/inventoryImport';
import type { NormalizedRow, NumericField } from './importParser';
import { numberFields } from './importParser';

export type ProcessResult = {
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  ignoredCount: number;
  errors: InventoryImportError[];
  warnings: string[];
};

/**
 * Process valid rows and update inventory
 */
export async function processInventoryUpdates(
  validRows: NormalizedRow[]
): Promise<ProcessResult> {
  const errors: InventoryImportError[] = [];
  const warnings: string[] = [];
  let processedCount = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;

  // Extract SKUs and names for batch lookup
  const skuList = Array.from(
    new Set(validRows.map((row) => row.sku).filter(Boolean) as string[])
  );
  const nameList = Array.from(
    new Set(validRows.map((row) => row.name?.trim()).filter(Boolean) as string[])
  );

  // Build OR filters for product lookup
  const orFilters: Array<{ sku?: { in: string[] }; name?: { in: string[] } }> = [];
  if (skuList.length) {
    orFilters.push({ sku: { in: skuList } });
  }
  if (nameList.length) {
    orFilters.push({ name: { in: nameList } });
  }

  // Fetch products with existing inventory
  const products = await prisma.product.findMany({
    where: orFilters.length ? { OR: orFilters } : undefined,
    include: {
      inventory: true,
    },
  });

  // Create lookup maps
  const productBySku = new Map<string, (typeof products)[number]>();
  const productByName = new Map<string, (typeof products)[number]>();
  products.forEach((product) => {
    if (product.sku) {
      productBySku.set(product.sku, product);
    }
    productByName.set(product.name.toLowerCase(), product);
  });

  // Track processed products to avoid duplicates
  const seenProducts = new Set<string>();

  // Build database operations
  const operations = validRows.map((row) => {
    // Find product by SKU or name
    let product = row.sku ? productBySku.get(row.sku) : undefined;
    if (!product && row.name) {
      product = productByName.get(row.name.toLowerCase());
    }

    // Product not found
    if (!product) {
      errors.push({
        row: row.rowNumber,
        message: row.sku
          ? `Produto com SKU "${row.sku}" não foi encontrado.`
          : `Produto "${row.name}" não foi encontrado.`,
      });
      ignoredCount += 1;
      return null;
    }

    // Check for duplicate rows
    const productKey = product.id;
    if (seenProducts.has(productKey)) {
      warnings.push(
        `Linha ${row.rowNumber}: múltiplas linhas para o produto ${product.name}. Apenas a primeira foi considerada.`
      );
      ignoredCount += 1;
      return null;
    }
    seenProducts.add(productKey);

    // Build update payload with valid numeric values
    const updatePayload: Partial<Record<NumericField, number>> = {};
    numberFields.forEach((field) => {
      const value = row[field];
      if (typeof value === 'number' && Number.isFinite(value)) {
        updatePayload[field] = value;
      }
    });

    // No valid updates
    if (!Object.keys(updatePayload).length) {
      warnings.push(`Linha ${row.rowNumber}: valores numéricos inválidos ou ausentes.`);
      ignoredCount += 1;
      return null;
    }

    // Track stats
    processedCount += 1;
    if (product.inventory) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }

    // Return upsert operation
    return prisma.inventory.upsert({
      where: { productId: product.id },
      update: updatePayload,
      create: { productId: product.id, ...updatePayload },
    });
  });

  // Filter out null operations
  const filteredOperations = operations.filter(
    (operation): operation is NonNullable<typeof operation> => Boolean(operation)
  );

  // Execute all operations in a transaction
  if (filteredOperations.length) {
    await prisma.$transaction(filteredOperations);
  }

  return {
    processedCount,
    createdCount,
    updatedCount,
    ignoredCount,
    errors,
    warnings,
  };
}
