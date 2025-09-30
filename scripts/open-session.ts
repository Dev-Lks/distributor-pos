import { prisma } from "@/lib/prisma"

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) {
    throw new Error('No user found')
  }

  const session = await prisma.cashSession.create({
    data: {
      userId: user.id,
      openingAmount: 0,
    },
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
