import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// POST - Criar ou atualizar configuração de hardware
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pointOfSaleId, ...configData } = body

    if (!pointOfSaleId) {
      return NextResponse.json(
        { error: 'ID do ponto de venda é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se o ponto de venda existe
    const pointOfSale = await prisma.pointOfSale.findUnique({
      where: { id: pointOfSaleId },
    })

    if (!pointOfSale) {
      return NextResponse.json(
        { error: 'Ponto de venda não encontrado' },
        { status: 404 }
      )
    }

    // Cria ou atualiza a configuração
    const config = await prisma.hardwareConfig.upsert({
      where: { pointOfSaleId },
      update: configData,
      create: {
        pointOfSaleId,
        ...configData,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    logger.error('Erro ao salvar configuração:', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar todas as configurações
export async function GET() {
  try {
    const configs = await prisma.hardwareConfig.findMany({
      include: {
        pointOfSale: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(configs)
  } catch (error) {
    logger.error('Erro ao buscar configurações:', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
