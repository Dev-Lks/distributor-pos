import { prisma } from '../lib/prisma'
import { hash, compare } from 'bcryptjs'

async function testFullPasswordFlow() {
  console.log('🧪 Teste Completo: Fluxo de Mudança de Senha\n')
  console.log('═══════════════════════════════════════════════\n')

  const adminEmail = 'nitrobeer.chopp@gmail.com'
  const oldPassword = 'admin'
  const newPassword = 'NovaS3nha123'

  try {
    // 1. Buscar admin
    console.log('1️⃣  Buscando admin...')
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        passwordHash: true,
        password: true,
        passwordChangedAt: true,
        createdAt: true
      }
    })

    if (!admin) {
      console.log('❌ Admin não encontrado!')
      return
    }

    console.log('✅ Admin encontrado:', {
      id: admin.id,
      email: admin.email,
      hasPasswordHash: !!admin.passwordHash,
      hasPasswordLegacy: !!admin.password,
      passwordChangedAt: admin.passwordChangedAt
    })
    console.log()

    // 2. Verificar senha atual (simular login)
    console.log('2️⃣  Verificando senha atual (simulando login)...')
    const currentHash = admin.passwordHash || admin.password || ''
    const isCurrentValid = await compare(oldPassword, currentHash)
    
    console.log('   Senha atual válida:', isCurrentValid ? '✅' : '❌')
    if (!isCurrentValid) {
      console.log('   ⚠️  A senha atual não é "admin". Tentando com "NovaS3nha123"...')
      const isNewValid = await compare(newPassword, currentHash)
      if (isNewValid) {
        console.log('   ✅ Senha já foi alterada para "NovaS3nha123"')
        console.log('   passwordChangedAt:', admin.passwordChangedAt)
        console.log()
        console.log('🎯 TESTE: Faça login com:')
        console.log(`   Email: ${adminEmail}`)
        console.log(`   Senha: ${newPassword}`)
        return
      } else {
        console.log('   ❌ Senha não reconhecida. Por favor, verifique manualmente.')
        return
      }
    }
    console.log()

    // 3. Resetar para senha padrão (preparar teste)
    console.log('3️⃣  Preparando teste: resetando para senha padrão...')
    const defaultHash = await hash(oldPassword, 10)
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash: defaultHash,
        password: defaultHash,
        passwordChangedAt: null
      }
    })
    console.log('✅ Admin resetado para senha padrão: "admin"')
    console.log('   passwordChangedAt: null')
    console.log()

    // 4. Verificar estado antes da mudança
    console.log('4️⃣  Estado ANTES da mudança de senha:')
    admin = await prisma.user.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
        passwordChangedAt: true
      }
    })
    console.log(JSON.stringify(admin, null, 2))
    console.log(`   requiresPasswordChange: ${!admin?.passwordChangedAt}`)
    console.log()

    // 5. Simular mudança de senha (o que a API faz)
    console.log('5️⃣  Simulando mudança de senha...')
    const newPasswordHash = await hash(newPassword, 10)
    
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        password: newPasswordHash,
        passwordChangedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        passwordChangedAt: true
      }
    })
    
    console.log('✅ Senha alterada no banco!')
    console.log(JSON.stringify(updated, null, 2))
    console.log()

    // 6. Verificar nova senha
    console.log('6️⃣  Verificando nova senha...')
    admin = await prisma.user.findUnique({
      where: { id: admin.id }
    })
    
    const isNewPasswordValid = await compare(newPassword, admin?.passwordHash || admin?.password || '')
    console.log('   Nova senha válida:', isNewPasswordValid ? '✅' : '❌')
    console.log()

    // 7. Verificar que senha antiga não funciona mais
    console.log('7️⃣  Verificando que senha antiga não funciona...')
    const isOldPasswordStillValid = await compare(oldPassword, admin?.passwordHash || admin?.password || '')
    console.log('   Senha antiga ainda válida:', isOldPasswordStillValid ? '❌ ERRO!' : '✅')
    console.log()

    console.log('═══════════════════════════════════════════════')
    console.log('✅ TESTE COMPLETO!')
    console.log()
    console.log('🎯 Agora teste manualmente:')
    console.log()
    console.log('1. Acesse: http://localhost:3000/login')
    console.log(`2. Login: ${adminEmail}`)
    console.log(`3. Senha: ${oldPassword}`)
    console.log('4. Deve redirecionar para /change-password')
    console.log('5. Troque a senha para:', newPassword)
    console.log('6. Deve fazer logout e voltar ao login')
    console.log('7. Faça login novamente com a nova senha')
    console.log('8. Deve acessar dashboard normalmente')
    console.log()
    console.log('📊 Logs esperados no servidor:')
    console.log('   Login: 🔒 Admin requires password change')
    console.log('   Troca: ✅ Password updated successfully')
    console.log('   Novo login: ✅ Admin has changed password')
    console.log()

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

testFullPasswordFlow()
  .then(() => {
    console.log('✅ Script concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error)
    process.exit(1)
  })
