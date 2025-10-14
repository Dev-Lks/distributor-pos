import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { createPendingCart, listPendingCarts } from "@/lib/pendingCarts"

const createSchema = z.object({
  pointOfSaleId: z.string().optional(),
  customerId: z.string().optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  discountValue: z.number().nonnegative().optional(),
  serviceCharge: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
      discount: z.number().nonnegative().optional(),
      notes: z.string().optional(),
    })
  ).min(1),
})

const listSchema = z.object({
  pointOfSaleId: z.string().optional(),
  includeExpired: z.coerce.boolean().optional(),
})

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  return session.user
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    void user

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = listSchema.safeParse(params)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json({ error: issue?.message ?? "Invalid query" }, { status: 400 })
    }

    const carts = await listPendingCarts({
      pointOfSaleId: parsed.data.pointOfSaleId,
      includeExpired: parsed.data.includeExpired,
    })

    return NextResponse.json({ data: carts })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to list pending carts", { error })
    return NextResponse.json({ error: "Failed to list pending carts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json({ error: issue?.message ?? "Invalid payload" }, { status: 400 })
    }

    const cart = await createPendingCart({
      ...parsed.data,
      createdById: user.id,
    })

    return NextResponse.json(cart)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to create pending cart", { error })
    return NextResponse.json({ error: "Failed to create pending cart" }, { status: 500 })
  }
}
