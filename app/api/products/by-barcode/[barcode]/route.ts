import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    const { barcode } = params

    if (!barcode) {
      return NextResponse.json(
        { error: 'Código de barras não fornecido' },
        { status: 400 }
      )
    }

    // Buscar produto por código de barras
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

    // Verificar se tem estoque
    const totalStock = product.inventory
      ? product.inventory.coldRoomQuantity +
        product.inventory.houseQuantity +
        product.inventory.salePointQuantity
      : 0

    return NextResponse.json({
      ...product,
      totalStock,
    })
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}
