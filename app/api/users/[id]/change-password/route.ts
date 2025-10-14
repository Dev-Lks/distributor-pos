import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { hash } from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/users/[id]/change-password
 * Permite que um usuário mude sua própria senha (obrigatório para admin no primeiro login)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔐 Change password request received', {
      hasSession: !!session,
      userId: session?.user?.id
    })
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const params = await context.params
    const userId = params.id
    
    console.log('🔍 Checking user permissions', {
      requestingUserId: session.user.id,
      targetUserId: userId,
      match: session.user.id === userId
    })

    // Verificar se o usuário está mudando sua própria senha
    if (session.user.id !== userId) {
      logger.warn('Tentativa de mudar senha de outro usuário', { 
        requestingUser: session.user.id, 
        targetUser: userId 
      })
      return NextResponse.json(
        { error: 'Você só pode mudar sua própria senha' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newPassword } = body
    
    console.log('🔑 Password validation', {
      hasPassword: !!newPassword,
      length: newPassword?.length
    })

    if (!newPassword || typeof newPassword !== 'string') {
      console.log('❌ Invalid password format')
      return NextResponse.json({ error: 'Nova senha é obrigatória' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      console.log('❌ Password too short')
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    
    console.log('🔐 Password strength check', {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      valid: hasUpperCase && hasLowerCase && hasNumber
    })
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      console.log('❌ Password does not meet strength requirements')
      return NextResponse.json(
        { error: 'Senha deve conter letras maiúsculas, minúsculas e números' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    console.log('🔒 Hashing password...')
    const passwordHash = await hash(newPassword, 10)
    
    console.log('💾 Updating user in database...')
    // Atualizar senha e marcar data de mudança
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        password: passwordHash, // Manter compatibilidade com campo legado
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        passwordChangedAt: true
      }
    })
    
    console.log('✅ Password updated successfully', {
      userId: updatedUser.id,
      email: updatedUser.email,
      passwordChangedAt: updatedUser.passwordChangedAt
    })

    logger.info('Senha alterada com sucesso', { userId })

    return NextResponse.json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    })
  } catch (error) {
    console.error('❌ Error changing password:', error)
    logger.error('Erro ao alterar senha', { error })
    return NextResponse.json(
      { error: 'Erro ao alterar senha' },
      { status: 500 }
    )
  }
}
