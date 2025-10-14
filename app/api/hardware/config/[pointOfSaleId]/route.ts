import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// GET - Buscar configuração de hardware por ponto de venda
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pointOfSaleId: string }> }
) {
  try {
    const { pointOfSaleId } = await params

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
    logger.error('Erro ao buscar configuração:', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
