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
import { softDelete, withoutDeleted } from '@/lib/soft-delete'

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
        where: withoutDeleted({}),
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

    const response = NextResponse.json(productsWithPoints)
    response.headers.set('Cache-Control', 'private, max-age=180, stale-while-revalidate=900')
    response.headers.set('Vary', 'Cookie, Authorization, Origin')
    return response
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
    
    // Campos permitidos no banco de produção (whitelist)
    const allowedFields = [
      'name', 'size', 'cost', 'salePrice', 'isBonified', 'bonifications',
      'category', 'supplier', 'isActive', 'sku', 'brand', 'origin',
      'packaging', 'abv', 'ibu', 'shelfLifeDays', 'tags',
      'lastPurchaseCost', 'lastPurchaseAt', 'avgCost', 'priceLastUpdatedAt',
      'expirationDate', 'batchNumber', 'supplierProductCode', 'barcode',
      'weight', 'volume', 'image', 'description', 'nutritionalInfo',
      'allergens', 'storageInstructions', 'isOrderOnly', 'leadTimeDays',
      'minOrderQuantity', 'maxOrderQuantity', 'requiresDeposit',
      'depositPercentage', 'availableForOrder'
    ]
    
    let productData: any
    
    if (isQuickCreate) {
      // Validar com schema de cadastro rápido
      const validatedData = quickCreateProductSchema.parse(body)
      
      // Preencher campos obrigatórios automaticamente para o Prisma
      productData = {
        name: validatedData.name,
        barcode: validatedData.barcode,
        sku: validatedData.barcode, // Usar barcode como SKU
        size: validatedData.size || '-', // Obrigatório no Prisma
        cost: validatedData.cost || 0, // Obrigatório no Prisma
        salePrice: validatedData.price, // Prisma usa 'salePrice', não 'price'
        description: validatedData.size 
          ? `${validatedData.name} - ${validatedData.size}`
          : validatedData.name,
        image: validatedData.image || '', // Placeholder
        isActive: validatedData.isActive,
      }
    } else {
      // Validar com schema completo
      const validated = createProductSchemaBase.parse(body)
      
      // Filtrar apenas campos permitidos e mapear 'price' para 'salePrice'
      productData = (Object.keys(validated) as Array<keyof typeof validated>)
        .filter(key => key !== 'price' && allowedFields.includes(key as string))
        .reduce((obj, key) => {
          obj[key] = validated[key]
          return obj
        }, {} as Record<string, string | number | boolean | undefined>)
      
      // Adicionar salePrice mapeado de price
      productData.salePrice = validated.price
      
      // Garantir size tem valor
      if (!productData.size) {
        productData.size = '-'
      }
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
    
    // Log detalhado do erro
    logger.error('Failed to create product', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    
    return NextResponse.json({ 
      error: 'Erro ao criar produto',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
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
    const product = await prisma.product.findFirst({
      where: withoutDeleted({ id }),
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }
    
    await softDelete('product', id, {
      data: { isActive: false },
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