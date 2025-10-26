import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { hardwareConfigUpsertSchema } from '@/lib/validations'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST - Criar ou atualizar configuração de hardware
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = hardwareConfigUpsertSchema.parse(rawBody)
    const { pointOfSaleId, ...configPayload } = parsed

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
      update: configPayload,
      create: {
        pointOfSaleId,
        ...configPayload,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues.at(0)
      return NextResponse.json(
        { error: firstIssue?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

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
