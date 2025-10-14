import { NextRequest, NextResponse } from "next/server"

import { prisma, type Prisma } from "@/lib/prisma"
import { detectPersonType, sanitizeDocument, validateCpfCnpj } from "@/lib/documents"
import { getServerAuth, notAuthenticated, unauthorized } from "@/lib/serverAuth"
import { logger } from "@/lib/logger"
import { sanitizeString, sanitizeEmail } from "@/lib/utils/sanitize"
import { LIMITS } from "@/lib/constants/limits"

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
      where,
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
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
    }

    const { name, phone, address, document } = body as {
      name?: string
      phone?: string | null
      address?: string | null
      document?: string | null
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "O nome do cliente é obrigatório." }, { status: 400 })
    }

    const sanitizedDocument = document !== undefined ? sanitizeDocument(document) ?? null : null
    if (sanitizedDocument && !validateCpfCnpj(sanitizedDocument)) {
      return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 })
    }

    // Verificar duplicados por telefone ou documento
    if (phone?.trim() || sanitizedDocument) {
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            phone?.trim() ? { phone: phone.trim() } : {},
            sanitizedDocument ? { document: sanitizedDocument } : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        },
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
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        document: sanitizedDocument,
        type: detectPersonType(document ?? undefined),
      },
      select: CUSTOMER_SELECT,
    })

    return NextResponse.json(mapCustomer(customer), { status: 201 })
  } catch (error) {
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
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
    }

    const { id, name, phone, address, document } = body as {
      id?: string
      name?: string
      phone?: string | null
      address?: string | null
      document?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: "ID do cliente é obrigatório." }, { status: 400 })
    }

    const data: Prisma.CustomerUpdateInput = {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
      ...(address !== undefined ? { address: address?.trim() || null } : {}),
    }

    if (document !== undefined) {
      const sanitizedDocument = sanitizeDocument(document) ?? null
      if (sanitizedDocument && !validateCpfCnpj(sanitizedDocument)) {
        return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 })
      }
  data.document = sanitizedDocument
  data.type = detectPersonType(document ?? undefined)
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
      select: CUSTOMER_SELECT,
    })

    return NextResponse.json(mapCustomer(customer))
  } catch (error) {
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
    const id = (body as { id?: string } | null)?.id

    if (!id) {
      return NextResponse.json({ error: "ID do cliente é obrigatório." }, { status: 400 })
    }

    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to delete customer", { error })
    return NextResponse.json({ error: "Não foi possível remover o cliente." }, { status: 500 })
  }
}
