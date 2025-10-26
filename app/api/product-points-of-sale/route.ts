import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0
const prismaProductPoints = (prisma as unknown as {
  productPointOfSale: {
    findUnique(arg0: { where: { id: string } }): unknown
    findMany: (args?: unknown) => Promise<unknown>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
}).productPointOfSale

export async function GET() {
  try {
    const productPointsOfSale = await prismaProductPoints.findMany({
      include: {
        product: true,
        pointOfSale: true
      }
  }) as unknown[]
    
    logger.info('Product points of sale fetched', { count: productPointsOfSale.length })
    
    return NextResponse.json(productPointsOfSale)
  } catch (error) {
    logger.error('Failed to fetch product points of sale:', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ 
      error: 'Erro ao buscar alocações de produto',
      details: [{ 
        field: 'unknown', 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }]
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, pointOfSaleId, quantity = 0, minStock = 2 } = body as {
      productId?: string
      pointOfSaleId?: string
      quantity?: number
      minStock?: number
    }

    if (!productId || !pointOfSaleId) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: [
          !productId && { field: 'productId', message: 'ID do produto é obrigatório' },
          !pointOfSaleId && { field: 'pointOfSaleId', message: 'ID do ponto de venda é obrigatório' }
        ].filter(Boolean)
      }, { status: 400 })
    }

    // Verificar se product e pointOfSale existem (e não estão deletados/inativos)
    const [product, pointOfSale] = await Promise.all([
      prisma.product.findFirst({ where: { id: productId, deletedAt: null } }),
      prisma.pointOfSale.findFirst({ where: { id: pointOfSaleId, deletedAt: null, isActive: true } })
    ])

    if (!product) {
      return NextResponse.json({ 
        error: 'Produto não encontrado ou inativo',
        details: [{ field: 'productId', message: 'Produto com este ID não existe ou está inativo' }]
      }, { status: 404 })
    }

    if (!pointOfSale) {
      return NextResponse.json({ 
        error: 'Ponto de venda não encontrado ou inativo',
        details: [{ field: 'pointOfSaleId', message: 'Ponto de venda com este ID não existe ou está inativo' }]
      }, { status: 404 })
    }

    const productPointOfSale = await prismaProductPoints.create({
      data: {
        productId,
        pointOfSaleId,
        quantity: quantity || 0,
        minStock: minStock || 2
      },
      include: {
        product: true,
        pointOfSale: true
      }
  }) as Record<string, unknown>
    
    logger.info('Product point of sale created', { 
      productId, 
      pointOfSaleId, 
      quantity,
      minStock
    })

    return NextResponse.json(productPointOfSale, { status: 201 })
  } catch (error) {
    logger.error('Failed to create product point of sale:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Verificar se é erro de constraint unique (já existe)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: 'Este produto já está alocado neste ponto de venda',
        details: [{ 
          field: 'combination', 
          message: 'Combinação de produto e ponto de venda já existe. Use PATCH para atualizar.' 
        }]
      }, { status: 409 })
    }

    return NextResponse.json({ 
      error: 'Erro ao criar alocação de produto',
      details: [{ 
        field: 'unknown', 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }]
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, quantity, minStock } = body as {
      id?: string
      quantity?: number
      minStock?: number
    }

    if (!id) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: [{ field: 'id', message: 'ID é obrigatório' }]
      }, { status: 400 })
    }

    // Verificar se registro existe
    const existing = await prismaProductPoints.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ 
        error: 'Registro não encontrado',
        details: [{ field: 'id', message: 'Alocação de produto não encontrada' }]
      }, { status: 404 })
    }

    const productPointOfSale = await prismaProductPoints.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(minStock !== undefined && { minStock })
      },
      include: {
        product: true,
        pointOfSale: true
      }
  }) as Record<string, unknown>
    
    logger.info('Product point of sale updated', { id, quantity, minStock })

    return NextResponse.json(productPointOfSale)
  } catch (error) {
    logger.error('Failed to update product point of sale:', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ 
      error: 'Erro ao atualizar alocação',
      details: [{ 
        field: 'unknown', 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }]
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: [{ field: 'id', message: 'ID é obrigatório' }]
      }, { status: 400 })
    }

    // Verificar se registro existe
    const existing = await prismaProductPoints.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ 
        error: 'Registro não encontrado',
        details: [{ field: 'id', message: 'Alocação de produto não encontrada' }]
      }, { status: 404 })
    }

    await prismaProductPoints.delete({
      where: { id }
    })
    
    logger.info('Product point of sale deleted', { id })

    return NextResponse.json({ success: true, message: 'Alocação removida com sucesso' })
  } catch (error) {
    logger.error('Failed to delete product point of sale:', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return NextResponse.json({ 
      error: 'Erro ao remover alocação',
      details: [{ 
        field: 'unknown', 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }]
    }, { status: 500 })
  }
}
