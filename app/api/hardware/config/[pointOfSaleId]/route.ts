import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { hardwareConfigParamsSchema } from '@/lib/validations'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Buscar configuração de hardware por ponto de venda
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pointOfSaleId: string }> }
) {
  try {
    const routeParams = await params
    const { pointOfSaleId } = hardwareConfigParamsSchema.parse(routeParams)

    const config = await prisma.hardwareConfig.findUnique({
      where: { pointOfSaleId },
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues.at(0)
      return NextResponse.json(
        { error: issue?.message ?? 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    logger.error('Erro ao buscar configuração:', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
