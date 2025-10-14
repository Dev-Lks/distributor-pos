import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerAuth, notAuthenticated, unauthorized } from '@/lib/serverAuth'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import {
  createProductSchemaBase,
  quickCreateProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from '@/lib/validations'

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
    
    // Detectar se é cadastro rápido (tem price mas não tem sku)
    const isQuickCreate = body.price !== undefined && !body.sku
    
    let productData: any
    
    if (isQuickCreate) {
      // Validar com schema de cadastro rápido
      const validatedData = quickCreateProductSchema.parse(body)
      
      // Preencher campos obrigatórios automaticamente
      productData = {
        ...validatedData,
        sku: validatedData.barcode, // Usar barcode como SKU
        description: validatedData.size 
          ? `${validatedData.name} - ${validatedData.size}`
          : validatedData.name,
        image: '', // Placeholder
      }
    } else {
      // Validar com schema completo
      productData = createProductSchemaBase.parse(body)
    }

    const product = await prisma.product.create({
      data: productData,
    })
    
    // Audit log
    logger.audit?.('CREATE_PRODUCT', session.user?.id ?? 'unknown', {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quickCreate: isQuickCreate,
    })
    
    logger.info('Product created successfully', { productId: product.id, quickCreate: isQuickCreate })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    logger.error('Failed to create product', { error })
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("EDIT_PRODUCTS")) return unauthorized("Você não tem permissão para editar produtos")

  try {
    const body = await request.json()
    const { id, ...updateFields } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    // Validar com Zod (parcial)
    const validatedData = updateProductSchema.parse(updateFields)

    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
    })
    
    // Audit log
    logger.audit?.('UPDATE_PRODUCT', session.user?.id ?? 'unknown', {
      productId: product.id,
      changes: Object.keys(validatedData),
    })
    
    logger.info('Product updated successfully', { productId: product.id })
    
    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    logger.error('Failed to update product', { error })
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("DELETE_PRODUCTS")) return unauthorized("Você não tem permissão para deletar produtos")

  try {
    const body = await request.json()
    
    // Validar com Zod
    const { id } = deleteProductSchema.parse(body)
    
    // Buscar produto antes de deletar para o log
    const product = await prisma.product.findUnique({
      where: { id }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }
    
    await prisma.product.delete({
      where: { id },
    })
    
    // Audit log
    logger.audit?.('DELETE_PRODUCT', session.user?.id ?? 'unknown', {
      productId: id,
      productName: product.name,
      sku: product.sku,
    })
    
    logger.info('Product deleted successfully', { productId: id })
    
    return NextResponse.json({ message: 'Produto deletado com sucesso' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    logger.error('Failed to delete product', { error })
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 })
  }
}