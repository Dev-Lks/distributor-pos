import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    const barcode = params.barcode

    if (!barcode) {
      return NextResponse.json(
        { error: 'Código de barras não fornecido' },
        { status: 400 }
      )
    }

    // Busca produto por código de barras
    const product = await prisma.product.findFirst({
      where: {
        barcode: barcode,
        isActive: true,
      },
      include: {
        inventory: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
