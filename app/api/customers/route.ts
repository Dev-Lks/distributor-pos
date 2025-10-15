import { NextRequest, NextResponse } from "next/server"
import { prisma, type Prisma } from "@/lib/prisma"
import { detectPersonType, sanitizeDocument, validateCpfCnpj } from "@/lib/documents"
import { getServerAuth, notAuthenticated, unauthorized } from "@/lib/serverAuth"
import { logger } from "@/lib/logger"
import { z } from 'zod'
import {
  createCustomerCurrentSchema,
  updateCustomerCurrentSchema,
  deleteCustomerCurrentSchema,
} from '@/lib/validations'
import { softDelete, withoutDeleted } from '@/lib/soft-delete'

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  document: true,
  phone: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bonifications: true,
    },
  },
} satisfies Prisma.CustomerSelect

const mapCustomer = (customer: Prisma.CustomerGetPayload<{ select: typeof CUSTOMER_SELECT }>) => ({
  id: customer.id,
  name: customer.name,
  document: customer.document ?? null,
  phone: customer.phone ?? null,
  address: customer.address ?? null,
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
  bonificationsCount: customer._count?.bonifications ?? 0,
})

const handlePrismaError = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
    const prismaError = error as { meta?: { target?: string[] } }
    const target = Array.isArray(prismaError.meta?.target) ? prismaError.meta?.target.join(", ") : undefined
    const friendlyField = target?.includes("document") ? "documento (CPF/CNPJ)" : target
    return NextResponse.json(
      { error: `Já existe um cliente cadastrado com este ${friendlyField ?? "valor único"}.` },
      { status: 409 }
    )
  }
  return NextResponse.json({ error: "Erro interno ao processar clientes." }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("VIEW_CUSTOMERS")) return unauthorized("Você não tem permissão para visualizar clientes")

  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get("search")?.trim()
    const sort = searchParams.get("sort") // 'lastPurchaseAt', 'name', 'totalSpend'
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined
    const sanitizedSearchDocument = sanitizeDocument(search ?? undefined)

    const where: Prisma.CustomerWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            ...(sanitizedSearchDocument
              ? [{ document: { contains: sanitizedSearchDocument } }]
              : []),
          ],
        }
      : undefined

    // Definir ordenação baseada no parâmetro sort
    let orderBy: Prisma.CustomerOrderByWithRelationInput = { name: "asc" }
    if (sort === "lastPurchaseAt") {
      orderBy = { lastPurchaseAt: "desc" }
    } else if (sort === "totalSpend") {
      orderBy = { totalSpend: "desc" }
    } else if (sort === "createdAt") {
      orderBy = { createdAt: "desc" }
    }

    const customers = await prisma.customer.findMany({
      where: withoutDeleted(where),
      orderBy,
      take: limit,
      select: CUSTOMER_SELECT,
    })

    return NextResponse.json(customers.map(mapCustomer))
  } catch (error) {
    logger.error("Failed to fetch customers", { error })
    return NextResponse.json({ error: "Não foi possível carregar os clientes." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("CREATE_CUSTOMERS")) return unauthorized("Você não tem permissão para criar clientes")

  try {
    const body = await request.json()
    
    // Validação com Zod
    const validated = createCustomerCurrentSchema.parse(body)

    // Validação de CPF/CNPJ usando funções existentes (validação de negócio)
    const sanitizedDocument = validated.document ? sanitizeDocument(validated.document) ?? null : null
    if (sanitizedDocument && !validateCpfCnpj(sanitizedDocument)) {
      return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 })
    }

    // Verificar duplicados por telefone ou documento
    if (validated.phone?.trim() || sanitizedDocument) {
      const existing = await prisma.customer.findFirst({
        where: withoutDeleted({
          OR: [
            validated.phone?.trim() ? { phone: validated.phone.trim() } : {},
            sanitizedDocument ? { document: sanitizedDocument } : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        }),
        select: { id: true, name: true, phone: true, document: true },
      })

      if (existing) {
        return NextResponse.json(
          { 
            error: "Cliente já cadastrado com este telefone ou documento",
            existingCustomer: existing
          },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone?.trim() || null,
        address: validated.address?.trim() || null,
        document: sanitizedDocument,
        type: detectPersonType(validated.document ?? undefined),
      },
      select: CUSTOMER_SELECT,
    })

    logger.audit('customer_created', session.user.email || 'unknown', {
      customerId: customer.id,
      customerName: customer.name,
    })

    return NextResponse.json(mapCustomer(customer), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Failed to create customer", { error })
    return handlePrismaError(error)
  }
}

export async function PATCH(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("EDIT_CUSTOMERS")) return unauthorized("Você não tem permissão para editar clientes")

  try {
    const body = await request.json()
    
    // Validação com Zod
    const validated = updateCustomerCurrentSchema.parse(body)

    const existing = await prisma.customer.findFirst({
      where: withoutDeleted({ id: validated.id }),
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      )
    }

    const data: Prisma.CustomerUpdateInput = {
      ...(validated.name !== undefined ? { name: validated.name } : {}),
      ...(validated.phone !== undefined ? { phone: validated.phone?.trim() || null } : {}),
      ...(validated.address !== undefined ? { address: validated.address?.trim() || null } : {}),
    }

    if (validated.document !== undefined) {
      const sanitizedDocument = sanitizeDocument(validated.document) ?? null
      if (sanitizedDocument && !validateCpfCnpj(sanitizedDocument)) {
        return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 })
      }
      data.document = sanitizedDocument
      data.type = detectPersonType(validated.document ?? undefined)
    }

    const customer = await prisma.customer.update({
      where: { id: validated.id },
      data,
      select: CUSTOMER_SELECT,
    })

    logger.audit('customer_updated', session.user.email || 'unknown', {
      customerId: customer.id,
      customerName: customer.name,
    })

    return NextResponse.json(mapCustomer(customer))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Failed to update customer", { error })
    return handlePrismaError(error)
  }
}

export async function DELETE(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("DELETE_CUSTOMERS")) return unauthorized("Você não tem permissão para deletar clientes")

  try {
    const body = await request.json().catch(() => null)
    
    // Validação com Zod
    const validated = deleteCustomerCurrentSchema.parse(body)

    // Verificar se o cliente existe antes de deletar
    const existing = await prisma.customer.findFirst({
      where: withoutDeleted({ id: validated.id }),
      select: { id: true, name: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      )
    }

  await softDelete('customer', validated.id)

    logger.audit('customer_deleted', session.user.email || 'unknown', {
      customerId: validated.id,
      customerName: existing.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Failed to delete customer", { error })
    return NextResponse.json({ error: "Não foi possível remover o cliente." }, { status: 500 })
  }
}
