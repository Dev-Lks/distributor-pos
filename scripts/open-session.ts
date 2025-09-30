import { prisma } from "@/lib/prisma"
import { openCashSession } from "@/lib/cashSessions"

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) {
    throw new Error('No user found')
  }

  await prisma.cashSession.deleteMany({ where: { userId: user.id } })

  const session = await openCashSession({
    userId: user.id,
    openingAmount: 200,
    notes: "script test",
  })

  console.log('Created session', session)
}

main()
  .catch((error) => {
    console.error('Open session failed', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
