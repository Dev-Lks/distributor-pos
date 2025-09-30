import { prisma } from "@/lib/prisma"

async function main() {
  const customerColumns = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Customer'
    ORDER BY column_name;
  `

  console.log('Customer columns:', customerColumns.map((row) => row.column_name))

  const salePaymentColumns = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'SalePayment'
    ORDER BY column_name;
  `
  console.log('SalePayment columns:', salePaymentColumns.map((row) => row.column_name))

  const enums = await prisma.$queryRaw<{ typname: string }[]>`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e';
  `
  console.log('Enums:', enums.map((row) => row.typname))

  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `
  console.log('Tables:', tables.map((row) => row.table_name))
}

main()
  .catch((error) => {
    console.error('Schema inspection failed', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
