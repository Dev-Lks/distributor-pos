import { prisma } from '../lib/prisma'
import { hash } from 'bcryptjs'

async function testPasswordChange() {
  console.log('🧪 Testando fluxo de mudança de senha...\n')

  const adminEmail = 'nitrobeer.chopp@gmail.com'

  // 1. Verificar estado inicial
  console.log('1️⃣  Estado ANTES da mudança:')
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      passwordChangedAt: true
    }
  })
  console.log(JSON.stringify(admin, null, 2))
  console.log(`   requiresPasswordChange: ${admin?.isAdmin && !admin?.passwordChangedAt}\n`)

  // 2. Simular mudança de senha
  console.log('2️⃣  Mudando senha...')
  const newPasswordHash = await hash('NovaS3nha123', 10)
  
  await prisma.user.update({
    where: { id: admin!.id },
    data: {
      passwordHash: newPasswordHash,
      password: newPasswordHash,
      passwordChangedAt: new Date()
    }
  })
  console.log('   ✅ Senha alterada no banco\n')

  // 3. Verificar estado após mudança
  console.log('3️⃣  Estado DEPOIS da mudança:')
  admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      passwordChangedAt: true
    }
  })
  console.log(JSON.stringify(admin, null, 2))
  console.log(`   requiresPasswordChange: ${admin?.isAdmin && !admin?.passwordChangedAt}\n`)

  console.log('✅ Teste concluído!')
  console.log('\nAgora tente fazer login com:')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Senha: NovaS3nha123`)
  console.log('\nVocê deve conseguir acessar o dashboard normalmente.')
}

testPasswordChange()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
