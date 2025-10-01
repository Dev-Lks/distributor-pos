import { NextRequest, NextResponse } from "next/server"
import { BonificationCategory, Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

const BONIFICATION_INCLUDE = {
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
} satisfies Prisma.CustomerBonificationInclude

const mapBonification = (
  bonification: Prisma.CustomerBonificationGetPayload<{ include: typeof BONIFICATION_INCLUDE }>
) => ({
  id: bonification.id,
  customerId: bonification.customerId,
  customer: bonification.customer,
  givenBy: bonification.givenBy,
  observation: bonification.observation ?? null,
  products: Array.isArray(bonification.products) ? (bonification.products as string[]) : [],
  category: bonification.category,
  bonifiedAt: bonification.bonifiedAt,
  createdAt: bonification.createdAt,
  updatedAt: bonification.updatedAt,
})

const parseProducts = (input: unknown) => {
  if (Array.isArray(input)) {
    return input.map((item) => `${item ?? ""}`.trim()).filter(Boolean)
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const sanitizeCategory = (value: unknown): BonificationCategory => {
  if (typeof value !== "string") return BonificationCategory.BONIFICATION
  const normalized = value.toUpperCase()
  return normalized === "DEGUSTATION" ? BonificationCategory.DEGUSTATION : BonificationCategory.BONIFICATION
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const customerId = searchParams.get("customerId") ?? undefined

    const bonifications = await prisma.customerBonification.findMany({
      where: customerId ? { customerId } : undefined,
      include: BONIFICATION_INCLUDE,
      orderBy: { bonifiedAt: "desc" },
    })

    return NextResponse.json(bonifications.map(mapBonification))
  } catch (error) {
    console.error("Failed to fetch customer bonifications", error)
    return NextResponse.json({ error: "Não foi possível carregar as bonificações." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
    }

    const { customerId, givenBy, observation, products, category, bonifiedAt } = body as {
      customerId?: string
      givenBy?: string
      observation?: string | null
      products?: unknown
      category?: string
      bonifiedAt?: string | null
    }

    if (!customerId || !givenBy?.trim()) {
      return NextResponse.json({ error: "Cliente e responsável são obrigatórios." }, { status: 400 })
    }

    const parsedProducts = parseProducts(products)
    const parsedCategory = sanitizeCategory(category)
    const parsedDate = bonifiedAt ? new Date(bonifiedAt) : new Date()
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Data da bonificação inválida." }, { status: 400 })
    }

    const bonification = await prisma.customerBonification.create({
      data: {
        customerId,
        givenBy: givenBy.trim(),
        observation: observation?.trim() || null,
        products: parsedProducts,
        category: parsedCategory,
        bonifiedAt: parsedDate,
      },
      include: BONIFICATION_INCLUDE,
    })

    return NextResponse.json(mapBonification(bonification), { status: 201 })
  } catch (error) {
    console.error("Failed to create customer bonification", error)
    return NextResponse.json({ error: "Não foi possível registrar a bonificação." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
    }

    const { id, customerId, givenBy, observation, products, category, bonifiedAt } = body as {
      id?: string
      customerId?: string
      givenBy?: string
      observation?: string | null
      products?: unknown
      category?: string
      bonifiedAt?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: "ID da bonificação é obrigatório." }, { status: 400 })
    }

    const data: Prisma.CustomerBonificationUpdateInput = {}
    if (customerId) {
      data.customer = { connect: { id: customerId } }
    }
    if (givenBy !== undefined) {
      if (!givenBy.trim()) {
        return NextResponse.json({ error: "Quem concedeu a bonificação é obrigatório." }, { status: 400 })
      }
      data.givenBy = givenBy.trim()
    }
    if (observation !== undefined) {
      data.observation = observation?.trim() || null
    }
    if (products !== undefined) {
      data.products = parseProducts(products)
    }
    if (category !== undefined) {
      data.category = sanitizeCategory(category)
    }
    if (bonifiedAt !== undefined) {
      const parsedDate = bonifiedAt ? new Date(bonifiedAt) : new Date()
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Data da bonificação inválida." }, { status: 400 })
      }
      data.bonifiedAt = parsedDate
    }

    const bonification = await prisma.customerBonification.update({
      where: { id },
      data,
      include: BONIFICATION_INCLUDE,
    })

    return NextResponse.json(mapBonification(bonification))
  } catch (error) {
    console.error("Failed to update customer bonification", error)
    return NextResponse.json({ error: "Não foi possível atualizar a bonificação." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const id = (body as { id?: string } | null)?.id

    if (!id) {
      return NextResponse.json({ error: "ID da bonificação é obrigatório." }, { status: 400 })
    }

    await prisma.customerBonification.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete customer bonification", error)
    return NextResponse.json({ error: "Não foi possível remover a bonificação." }, { status: 500 })
  }
}
