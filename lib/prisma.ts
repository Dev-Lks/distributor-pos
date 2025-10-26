import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

export type { Prisma }

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Register graceful shutdown handler only once
if (!('prismaShutdownRegistered' in globalForPrisma)) {
  async function gracefulShutdown() {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }
  }

  // Increase max listeners to prevent warnings
  process.setMaxListeners(15)

  process.once('beforeExit', gracefulShutdown)
  process.once('SIGINT', gracefulShutdown)
  process.once('SIGTERM', gracefulShutdown)

  // Mark as registered to prevent duplicate handlers
  ;(globalForPrisma as any).prismaShutdownRegistered = true
}