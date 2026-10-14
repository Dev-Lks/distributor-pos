import { prisma } from '../lib/prisma'

async function checkAdmin() {
  const admin = await prisma.user.findUnique({
    where: { email: 'distribuidora.chopp@gmail.com' },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      passwordChangedAt: true,
      createdAt: true
    }
  })

  console.log('📊 Admin Status:')
  console.log(JSON.stringify(admin, null, 2))

  if (admin?.isAdmin && !admin.passwordChangedAt) {
    console.log('\n⚠️  Admin NEEDS to change password (passwordChangedAt is NULL)')
  } else if (admin?.isAdmin && admin.passwordChangedAt) {
    console.log('\n✅ Admin has changed password')
    console.log(`   Changed at: ${admin.passwordChangedAt}`)
  }
}

checkAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
