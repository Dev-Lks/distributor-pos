import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAuth() {
  // Verificar vendedor
  const vendedor = await prisma.user.findUnique({
    where: { email: 'vendedor@nitrobeer.com' },
    include: {
      permissions: {
        where: { granted: true },
      },
    },
  })

  if (!vendedor) {
    console.log('❌ Vendedor não encontrado')
    return
  }

  console.log('\n📋 Dados do Vendedor:')
  console.log('Email:', vendedor.email)
  console.log('isAdmin:', vendedor.isAdmin)
  console.log('\n🔑 Permissões no banco:')
  vendedor.permissions.forEach((p) => {
    console.log(`  ✅ ${p.permission}`)
  })
  console.log(`\nTotal: ${vendedor.permissions.length} permissões`)

  console.log('\n📝 Formato que deveria estar no JWT:')
  const permissionsArray = vendedor.permissions.map((p) => p.permission)
  console.log('permissions:', JSON.stringify(permissionsArray))
}

checkAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
