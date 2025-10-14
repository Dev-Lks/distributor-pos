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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const params = await context.params
    const userId = params.id

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

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Nova senha é obrigatória' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: 'Senha deve conter letras maiúsculas, minúsculas e números' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const passwordHash = await hash(newPassword, 10)

    // Atualizar senha e marcar data de mudança
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        password: passwordHash, // Manter compatibilidade com campo legado
        passwordChangedAt: new Date(),
      },
    })

    logger.info('Senha alterada com sucesso', { userId })

    return NextResponse.json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    })
  } catch (error) {
    logger.error('Erro ao alterar senha', { error })
    return NextResponse.json(
      { error: 'Erro ao alterar senha' },
      { status: 500 }
    )
  }
}
