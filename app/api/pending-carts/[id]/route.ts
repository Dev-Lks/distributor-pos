import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { cancelPendingCart, updatePendingCart } from "@/lib/pendingCarts"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
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
  ).optional(),
})

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  return session.user
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()

    const cart = await prisma.pendingCart.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                salePrice: true,
              },
            },
          },
        },
        customer: true,
        pointOfSale: true,
      },
    })

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    return NextResponse.json(cart)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.error("Failed to load pending cart", error)
    return NextResponse.json({ error: "Failed to load pending cart" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json({ error: issue?.message ?? "Invalid payload" }, { status: 400 })
    }

    const cart = await updatePendingCart(params.id, parsed.data)

    return NextResponse.json(cart)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      if (error.message === "CART_NOT_FOUND") {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 })
      }
      if (error.message === "CART_NOT_ACTIVE") {
        return NextResponse.json({ error: "Cart is not active" }, { status: 409 })
      }
    }

    console.error("Failed to update pending cart", error)
    return NextResponse.json({ error: "Failed to update pending cart" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()

    await cancelPendingCart(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      if (error.message === "CART_NOT_FOUND") {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 })
      }
    }

    console.error("Failed to cancel pending cart", error)
    return NextResponse.json({ error: "Failed to cancel pending cart" }, { status: 500 })
  }
}
