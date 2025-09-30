import { prisma } from "@/lib/prisma"

async function main() {
  const [products, customers, sales, sessions] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.sale.count(),
    prisma.cashSession.count(),
  ])

  console.log({ products, customers, sales, sessions })
}

main()
  .catch((error) => {
    console.error('Counts failed', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
