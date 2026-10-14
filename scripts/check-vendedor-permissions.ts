import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const vendedor = await prisma.user.findUnique({
    where: { email: 'vendedor@exemplo.com' },
    include: { permissions: true },
  })

  if (!vendedor) {
    console.log('❌ Vendedor não encontrado')
    return
  }

  console.log('\n📋 Permissões do vendedor:')
  console.log('Email:', vendedor.email)
  console.log('isAdmin:', vendedor.isAdmin)
  console.log('\nPermissões:')
  vendedor.permissions.forEach((p) => {
    console.log(`  ✅ ${p.permission}`)
  })
  console.log(`\nTotal: ${vendedor.permissions.length} permissões`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
