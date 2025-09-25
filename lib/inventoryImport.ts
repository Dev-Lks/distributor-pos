export type InventoryImportError = {
  row: number
  message: string
}

export type InventoryImportSummary = {
  totalRows: number
  processedCount: number
  createdCount: number
  updatedCount: number
  ignoredCount: number
  errors: InventoryImportError[]
  warnings: string[]
}

export type InventoryImportResponse = {
  summary: InventoryImportSummary
}
