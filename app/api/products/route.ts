import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getServerAuth, notAuthenticated, unauthorized } from '@/lib/serverAuth'
import { logger } from '@/lib/logger'
import { LIMITS } from '@/lib/constants/limits'
import { sanitizeString } from '@/lib/utils/sanitize'

const prismaProductPoints = (prisma as unknown as {
  productPointOfSale: {
    findMany: (args?: unknown) => Promise<unknown>
  }
}).productPointOfSale

export async function GET() {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("VIEW_PRODUCTS")) return unauthorized("Você não tem permissão para visualizar produtos")

  try {
    const [products, productPoints] = await Promise.all([
      prisma.product.findMany({
        include: {
          inventory: true,
        },
      }),
      prismaProductPoints.findMany({
        include: {
          pointOfSale: true,
        },
      }),
    ])

    type ProductPointOfSaleWithRelation = {
      id: string
      productId: string
      pointOfSaleId: string
      quantity: number
      minStock: number
      pointOfSale: {
        id: string
        name: string
        isActive: boolean
        createdAt: Date
        updatedAt: Date
      }
    }

    const pointsByProductId = (productPoints as ProductPointOfSaleWithRelation[]).reduce<
      Map<string, ProductPointOfSaleWithRelation[]>
    >((acc, productPoint) => {
      const list = acc.get(productPoint.productId) ?? []
      list.push(productPoint)
      acc.set(productPoint.productId, list)
      return acc
    }, new Map())

    const productsWithPoints = products.map((product) => ({
      ...product,
      productPointsOfSale: pointsByProductId.get(product.id) ?? [],
    }))

    return NextResponse.json(productsWithPoints)
  } catch (error) {
    logger.error('Error fetching products', { error })
    return NextResponse.json({ error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("CREATE_PRODUCTS")) return unauthorized("Você não tem permissão para criar produtos")

  try {
    const body = await request.json()
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Validar e sanitizar dados
    if (body.name && typeof body.name === 'string') {
      body.name = sanitizeString(body.name, LIMITS.MAX_NAME_LENGTH)
    }
    if (body.description && typeof body.description === 'string') {
      body.description = sanitizeString(body.description, LIMITS.MAX_DESCRIPTION_LENGTH)
    }
    if (body.price && typeof body.price === 'number' && body.price > LIMITS.MAX_PRICE) {
      return NextResponse.json({ error: `Preço excede limite máximo (${LIMITS.MAX_PRICE})` }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: body as Prisma.ProductCreateInput,
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    logger.error('Failed to create product', { error })
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("EDIT_PRODUCTS")) return unauthorized("Você não tem permissão para editar produtos")

  try {
    const body = await request.json()
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const { id, ...rawUpdateData } = body as { id?: string } & Record<string, unknown>
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Validar e sanitizar dados
    if (rawUpdateData.name && typeof rawUpdateData.name === 'string') {
      rawUpdateData.name = sanitizeString(rawUpdateData.name, LIMITS.MAX_NAME_LENGTH)
    }
    if (rawUpdateData.description && typeof rawUpdateData.description === 'string') {
      rawUpdateData.description = sanitizeString(rawUpdateData.description, LIMITS.MAX_DESCRIPTION_LENGTH)
    }
    if (rawUpdateData.price && typeof rawUpdateData.price === 'number' && rawUpdateData.price > LIMITS.MAX_PRICE) {
      return NextResponse.json({ error: `Preço excede limite máximo (${LIMITS.MAX_PRICE})` }, { status: 400 })
    }

    const updateData = rawUpdateData as Prisma.ProductUpdateInput
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(product)
  } catch (error) {
    logger.error('Failed to update product', { error })
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("DELETE_PRODUCTS")) return unauthorized("Você não tem permissão para deletar produtos")

  try {
    const body = await request.json()
    const { id } = body as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    await prisma.product.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    logger.error('Failed to delete product', { error })
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}