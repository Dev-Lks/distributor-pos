-- AlterTable
ALTER TABLE "DailyReport" 
ADD COLUMN "pdfData" BYTEA,
ADD COLUMN "csvData" BYTEA;

-- Comentário: Armazena PDFs e CSVs diretamente no banco
-- Tamanho médio esperado: 100-200 KB por PDF, 10-50 KB por CSV
-- Limite PostgreSQL: 1 GB por campo (suficiente para milhares de relatórios)
