import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Connection successful!')
    console.log('Result:', result)
    
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
  } catch (error) {
    console.error('❌ Connection failed:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
