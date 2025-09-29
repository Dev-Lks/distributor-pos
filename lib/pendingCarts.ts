import { addHours } from "date-fns"

import { prisma } from "@/lib/prisma"
import { PendingCartStatus } from "@prisma/client"

const DEFAULT_EXPIRATION_HOURS = Number(process.env.PENDING_CART_EXPIRATION_HOURS ?? 4)

export type PendingCartItemInput = {
  productId: string
  quantity: number
  price: number
  discount?: number
  notes?: string | null
}

export type PendingCartPayload = {
  pointOfSaleId?: string | null
  createdById: string
  customerId?: string | null
  expiresAt?: Date | string | null
  discountValue?: number
  serviceCharge?: number
  subtotal?: number
  total?: number
  notes?: string | null
  items: PendingCartItemInput[]
}

export async function createPendingCart(payload: PendingCartPayload) {
  const expiration = payload.expiresAt
    ? new Date(payload.expiresAt)
    : addHours(new Date(), DEFAULT_EXPIRATION_HOURS)

  const totals = computeTotals(payload.items, {
    discountValue: payload.discountValue,
    serviceCharge: payload.serviceCharge,
    subtotal: payload.subtotal,
    total: payload.total,
  })

  return prisma.pendingCart.create({
    data: {
      pointOfSaleId: payload.pointOfSaleId ?? null,
      createdById: payload.createdById,
      customerId: payload.customerId ?? null,
      expiresAt: expiration,
      discountValue: totals.discountValue,
      serviceCharge: totals.serviceCharge,
      subtotal: totals.subtotal,
      total: totals.total,
      notes: payload.notes,
      items: {
        create: payload.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount ?? 0,
          notes: item.notes,
        })),
      },
    },
    include: {
      items: true,
      pointOfSale: true,
      customer: true,
    },
  })
}

export async function updatePendingCart(cartId: string, payload: Partial<PendingCartPayload>) {
  const existing = await prisma.pendingCart.findUnique({ where: { id: cartId }, include: { items: true } })

  if (!existing) {
    throw new Error("CART_NOT_FOUND")
  }

  if (existing.status !== PendingCartStatus.ACTIVE) {
    throw new Error("CART_NOT_ACTIVE")
  }

  const replacementItems = payload.items ?? existing.items.map((item: typeof existing.items[number]) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    notes: item.notes ?? undefined,
  }))

  const totals = computeTotals(replacementItems, {
    discountValue: payload.discountValue ?? existing.discountValue,
    serviceCharge: payload.serviceCharge ?? existing.serviceCharge,
    subtotal: payload.subtotal ?? existing.subtotal,
    total: payload.total ?? existing.total,
  })

  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : existing.expiresAt

  return prisma.pendingCart.update({
    where: { id: cartId },
    data: {
      pointOfSaleId: payload.pointOfSaleId ?? existing.pointOfSaleId,
      customerId: payload.customerId ?? existing.customerId,
      expiresAt,
      discountValue: totals.discountValue,
      serviceCharge: totals.serviceCharge,
      subtotal: totals.subtotal,
      total: totals.total,
      notes: payload.notes ?? existing.notes,
      items: payload.items
        ? {
            deleteMany: { cartId },
            create: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount ?? 0,
              notes: item.notes,
            })),
          }
        : undefined,
    },
    include: {
      items: true,
      pointOfSale: true,
      customer: true,
    },
  })
}

export async function cancelPendingCart(cartId: string, reason?: string | null) {
  return prisma.pendingCart.update({
    where: { id: cartId },
    data: {
      status: PendingCartStatus.CANCELLED,
      metadata: {
        reason,
        cancelledAt: new Date().toISOString(),
      },
    },
  })
}

export async function markPendingCartConverted(cartId: string, saleId: string) {
  return prisma.pendingCart.update({
    where: { id: cartId },
    data: {
      status: PendingCartStatus.CONVERTED,
      sale: {
        connect: {
          id: saleId,
        },
      },
      metadata: {
        convertedAt: new Date().toISOString(),
      },
    },
  })
}

export async function listPendingCarts(params: { pointOfSaleId?: string; includeExpired?: boolean }) {
  await expireStalePendingCarts()

  return prisma.pendingCart.findMany({
    where: {
      status: params.includeExpired ? undefined : PendingCartStatus.ACTIVE,
      ...(params.pointOfSaleId ? { pointOfSaleId: params.pointOfSaleId } : {}),
    },
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
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      sale: {
        select: {
          id: true,
          date: true,
          total: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function expireStalePendingCarts() {
  const now = new Date()

  await prisma.pendingCart.updateMany({
    where: {
      status: PendingCartStatus.ACTIVE,
      expiresAt: {
        lte: now,
      },
    },
    data: {
      status: PendingCartStatus.EXPIRED,
      metadata: {
        expiredAt: now.toISOString(),
      },
    },
  })
}

function computeTotals(items: PendingCartItemInput[], overrides: {
  discountValue?: number
  serviceCharge?: number
  subtotal?: number
  total?: number
}) {
  const subtotal = overrides.subtotal ?? items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discountValue = overrides.discountValue ?? items.reduce((acc, item) => acc + (item.discount ?? 0), 0)
  const serviceCharge = overrides.serviceCharge ?? 0
  const total = overrides.total ?? subtotal - discountValue + serviceCharge

  return {
    subtotal,
    discountValue,
    serviceCharge,
    total,
  }
}
