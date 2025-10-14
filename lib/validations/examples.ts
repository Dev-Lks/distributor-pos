/**
 * Exemplos de Uso das Validações Zod
 * 
 * Este arquivo demonstra como usar as validações centralizadas
 * nas rotas de API do sistema.
 * 
 * ⚠️ ATENÇÃO: Este é um arquivo de EXEMPLOS (pseudo-código)
 * Não será executado diretamente. Use os exemplos como referência
 * ao implementar suas rotas de API.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import {
  // Validações comuns
  emailSchema,
  phoneSchema,
  cpfSchema,
  moneySchema,
  quantitySchema,
  paginationSchema,
  
  // Validações de produtos
  createProductSchema,
  updateProductSchema,
  searchProductsSchema,
  bulkPriceUpdateSchema,
  
  // Validações de vendas
  createSaleSchema,
  searchSalesSchema,
  cancelSaleSchema,
  
  // Validações de inventário
  inventoryUpdateSchema,
  inventoryTransferSchema,
  searchInventorySchema,
  
  // Validações de clientes
  createCustomerSchema,
  updateCustomerSchema,
  searchCustomersSchema,
  creditLimitAdjustmentSchema,
} from '@/lib/validations'

// ===================================
// EXEMPLO 1: Criar Produto
// ===================================

export async function createProduct(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar com Zod
    const validatedData = createProductSchema.parse(body)
    
    // Se chegou aqui, os dados são válidos e type-safe
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        sku: validatedData.sku,
        price: validatedData.price,
        // ... outros campos validados
      }
    })
    
    logger.info('Product created', { productId: product.id })
    
    return NextResponse.json(product, { status: 201 })
    
  } catch (error) {
    // Tratar erros de validação
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 2: Buscar Produtos com Filtros
// ===================================

export async function searchProducts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar query params
    const filters = searchProductsSchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      orderBy: searchParams.get('orderBy'),
      order: searchParams.get('order'),
    })
    
    // Buscar produtos com filtros validados
    const products = await prisma.product.findMany({
      where: {
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
          ]
        }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { price: { gte: filters.minPrice } }),
        ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { [filters.orderBy]: filters.order },
    })
    
    return NextResponse.json(products)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Filtros inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to search products', { error })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 3: Criar Venda
// ===================================

export async function createSale(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar venda completa
    const validatedSale = createSaleSchema.parse(body)
    
    // A validação já garante que:
    // - Subtotal = soma dos itens
    // - Total = subtotal - desconto + taxa
    // - Total pago = total da venda
    // - Todos os valores estão em ranges válidos
    
    const sale = await prisma.sale.create({
      data: {
        customerId: validatedSale.customerId,
        pointOfSaleId: validatedSale.pointOfSaleId,
        subtotal: validatedSale.subtotal,
        discount: validatedSale.discount,
        tax: validatedSale.tax,
        total: validatedSale.total,
        items: {
          create: validatedSale.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.subtotal,
          }))
        },
        payments: {
          create: validatedSale.payments.map(payment => ({
            method: payment.method,
            amount: payment.amount,
            installments: payment.installments,
            cardLastDigits: payment.cardLastDigits,
            transactionId: payment.transactionId,
          }))
        }
      },
      include: {
        items: true,
        payments: true,
      }
    })
    
    logger.audit('CREATE_SALE', session.user.id, {
      saleId: sale.id,
      total: sale.total,
      itemsCount: sale.items.length,
    })
    
    return NextResponse.json(sale, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados da venda inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to create sale', { error })
    return NextResponse.json(
      { error: 'Erro ao processar venda' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 4: Atualizar Inventário
// ===================================

export async function updateInventory(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar atualização de inventário
    const validatedData = inventoryUpdateSchema.parse(body)
    
    // Atualizar inventário
    const inventory = await prisma.inventory.upsert({
      where: {
        productId_location: {
          productId: validatedData.productId,
          location: validatedData.location,
        }
      },
      update: {
        quantity: { increment: validatedData.quantity },
        updatedAt: new Date(),
      },
      create: {
        productId: validatedData.productId,
        location: validatedData.location,
        quantity: validatedData.quantity,
      }
    })
    
    logger.info('Inventory updated', {
      productId: validatedData.productId,
      location: validatedData.location,
      quantity: validatedData.quantity,
    })
    
    return NextResponse.json(inventory)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados de inventário inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to update inventory', { error })
    return NextResponse.json(
      { error: 'Erro ao atualizar inventário' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 5: Criar Cliente
// ===================================

export async function createCustomer(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar cliente
    const validatedCustomer = createCustomerSchema.parse(body)
    
    // A validação já garante que:
    // - CPF é válido se pessoa física
    // - CNPJ é válido se pessoa jurídica
    // - Idade mínima de 16 anos
    // - Endereço completo
    
    // Verificar se CPF/CNPJ já existe
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          validatedCustomer.cpf ? { cpf: validatedCustomer.cpf } : {},
          validatedCustomer.cnpj ? { cnpj: validatedCustomer.cnpj } : {},
        ]
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Cliente já cadastrado com este CPF/CNPJ' },
        { status: 409 }
      )
    }
    
    const customer = await prisma.customer.create({
      data: validatedCustomer
    })
    
    logger.audit('CREATE_CUSTOMER', session.user.id, {
      customerId: customer.id,
      type: customer.type,
    })
    
    return NextResponse.json(customer, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados do cliente inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to create customer', { error })
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 6: Validação Parcial (Update)
// ===================================

export async function updateProduct(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    // updateProductSchema permite campos parciais
    const validatedData = updateProductSchema.parse(body)
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData
    })
    
    logger.audit('UPDATE_PRODUCT', session.user.id, {
      productId: product.id,
      changes: Object.keys(validatedData),
    })
    
    return NextResponse.json(product)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to update product', { error })
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 7: Validação de Arrays
// ===================================

export async function bulkUpdatePrices(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar atualização em massa
    const validatedData = bulkPriceUpdateSchema.parse(body)
    
    // Aplicar ajuste de preços
    const updates = validatedData.productIds.map(async (productId) => {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })
      
      if (!product) return null
      
      let newPrice = product.price
      
      if (validatedData.adjustmentType === 'percentage') {
        newPrice = product.price * (1 + validatedData.adjustmentValue / 100)
      } else {
        newPrice = product.price + validatedData.adjustmentValue
      }
      
      return prisma.product.update({
        where: { id: productId },
        data: { price: newPrice }
      })
    })
    
    const results = await Promise.all(updates)
    const updated = results.filter(Boolean)
    
    logger.audit('BULK_PRICE_UPDATE', session.user.id, {
      productsCount: updated.length,
      adjustmentType: validatedData.adjustmentType,
      adjustmentValue: validatedData.adjustmentValue,
    })
    
    return NextResponse.json({
      success: true,
      updated: updated.length
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to bulk update prices', { error })
    return NextResponse.json(
      { error: 'Erro na atualização em massa' },
      { status: 500 }
    )
  }
}

// ===================================
// EXEMPLO 8: Validação Manual
// ===================================

export async function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export async function validateCPF(cpf: string): boolean {
  try {
    cpfSchema.parse(cpf)
    return true
  } catch {
    return false
  }
}

// ===================================
// EXEMPLO 9: Safe Parse (não lança exceção)
// ===================================

export async function safeCreateProduct(request: NextRequest) {
  const body = await request.json()
  
  // safeParse não lança exceção
  const result = createProductSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json(
      { 
        error: 'Dados inválidos',
        details: result.error.errors 
      },
      { status: 400 }
    )
  }
  
  // result.data é type-safe
  const product = await prisma.product.create({
    data: result.data
  })
  
  return NextResponse.json(product, { status: 201 })
}

// ===================================
// DICAS E BOAS PRÁTICAS
// ===================================

/**
 * 1. SEMPRE valide no backend, nunca confie apenas no frontend
 * 
 * 2. Use .parse() quando quiser que erros sejam lançados (try/catch)
 * 
 * 3. Use .safeParse() quando quiser tratar erros manualmente
 * 
 * 4. Schemas de update são .partial() dos schemas de create
 * 
 * 5. Validações complexas (relacionamentos) usam .refine()
 * 
 * 6. Sempre retorne mensagens de erro claras em português
 * 
 * 7. Use logger.audit() para ações críticas
 * 
 * 8. Schemas são reutilizáveis entre rotas
 * 
 * 9. TypeScript infere os tipos automaticamente
 * 
 * 10. Mantenha validações comuns em common.ts
 */
