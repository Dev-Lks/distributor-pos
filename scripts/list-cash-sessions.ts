import { prisma } from "@/lib/prisma"

async function main() {
  const sessions = await prisma.cashSession.findMany({
    select: {
      id: true,
      userId: true,
      status: true,
      pointOfSaleId: true,
      openedAt: true,
    },
    orderBy: { openedAt: 'desc' },
  })

  console.log('Cash sessions:', sessions)
}

main()
  .catch((error) => {
    console.error('List cash sessions failed', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
