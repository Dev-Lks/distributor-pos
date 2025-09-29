import { prisma } from "@/lib/prisma"
import { generateDailyReport } from "@/lib/dailyReports"
import {
  CashSessionStatus,
  CashTransactionType,
  type CashTransaction,
  type Sale,
  type SalePayment,
  type User,
} from "@prisma/client"
import type { CashSessionSnapshot } from "@/types/cash"

export async function findActiveSession(userId: string, pointOfSaleId?: string | null) {
  const session = await prisma.cashSession.findFirst({
    where: {
      userId,
      status: CashSessionStatus.OPEN,
      ...(pointOfSaleId
        ? {
            OR: [
              { pointOfSaleId },
              { pointOfSaleId: null },
            ],
          }
        : {}),
    },
    orderBy: {
      openedAt: "desc",
    },
  })

  return session
}

export async function buildSessionSnapshot(sessionId: string): Promise<CashSessionSnapshot | null> {
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      pointOfSale: true,
      transactions: {
        orderBy: { createdAt: "asc" },
        include: {
          performedBy: true,
        },
      },
      sales: {
        select: {
          id: true,
          total: true,
          date: true,
          paymentMethod: true,
        },
        orderBy: { date: "desc" },
        take: 30,
      },
      payments: {
        select: {
          id: true,
          method: true,
          amount: true,
        },
      },
    },
  })

  if (!session) {
    return null
  }

  const transactions = session.transactions as Array<
    CashTransaction & {
      performedBy: User | null
    }
  >

  const payments = session.payments as SalePayment[]
  const sales = session.sales as Sale[]

  const supplies = transactions
    .filter((tx) => tx.type === CashTransactionType.SUPPLY)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const withdrawals = transactions
    .filter((tx) => tx.type === CashTransactionType.WITHDRAWAL)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const adjustments = transactions
    .filter((tx) => tx.type === CashTransactionType.ADJUSTMENT)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const opening = session.openingAmount

  const totalsByPaymentMethod = payments.reduce<Record<string, number>>((acc, payment) => {
    const key = payment.method ?? "unknown"
    acc[key] = (acc[key] ?? 0) + payment.amount
    return acc
  }, {})

  const entries = Object.entries(totalsByPaymentMethod) as Array<[string, number]>

  const cashPayments = entries
    .filter(([method]) => method === "cash")
    .reduce((sum, [, value]) => sum + value, 0)

  const nonCashPayments = entries
    .filter(([method]) => method !== "cash")
    .reduce((sum, [, value]) => sum + value, 0)

  const expectedClosingAmount = opening + supplies - withdrawals + adjustments + cashPayments

  const runningBalance = expectedClosingAmount

  const differenceAmount = session.closingAmount !== null ? session.closingAmount - expectedClosingAmount : null

  return {
    id: session.id,
    status: session.status,
    userId: session.userId,
    pointOfSaleId: session.pointOfSaleId ?? null,
  openedAt: session.openedAt.toISOString(),
  closedAt: session.closedAt ? session.closedAt.toISOString() : null,
    openingAmount: session.openingAmount,
    closingAmount: session.closingAmount ?? null,
    expectedClosingAmount,
    differenceAmount,
    totals: {
      supplies,
      withdrawals,
      adjustments,
      opening,
      cashPayments,
      nonCashPayments,
    },
    totalsByPaymentMethod,
    runningBalance,
    notes: session.notes ?? null,
    pointOfSale: session.pointOfSale
      ? {
          id: session.pointOfSale.id,
          name: session.pointOfSale.name,
          channel: session.pointOfSale.channel,
        }
      : null,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      paymentMethod: tx.paymentMethod,
      createdAt: tx.createdAt.toISOString(),
      performedBy: tx.performedBy
        ? {
            id: tx.performedBy.id,
            name: tx.performedBy.name,
          }
        : null,
    })),
    sales: sales.map((sale) => ({
      id: sale.id,
      total: sale.total,
      date: sale.date.toISOString(),
      paymentMethod: sale.paymentMethod,
    })),
  }
}

export async function ensureNoOpenSession(userId: string, pointOfSaleId?: string | null) {
  const existingSession = await findActiveSession(userId, pointOfSaleId)

  if (existingSession) {
    throw Object.assign(new Error("ACTIVE_SESSION_EXISTS"), {
      data: existingSession,
    })
  }
}

export async function openCashSession(params: {
  userId: string
  pointOfSaleId?: string | null
  openingAmount: number
  notes?: string | null
}) {
  const { userId, pointOfSaleId = null, openingAmount, notes } = params

  await ensureNoOpenSession(userId, pointOfSaleId)

  const session = await prisma.cashSession.create({
    data: {
      userId,
      pointOfSaleId,
      openingAmount,
      notes,
      transactions: {
        create: openingAmount !== 0
          ? {
              type: CashTransactionType.OPENING,
              amount: openingAmount,
              description: "Valor inicial",
            }
          : undefined,
      },
    },
  })

  return buildSessionSnapshot(session.id)
}

export async function createCashTransaction(params: {
  sessionId: string
  type: CashTransactionType
  amount: number
  description?: string | null
  paymentMethod?: string | null
  performedById?: string | null
}) {
  const { sessionId, type, amount, description, paymentMethod, performedById } = params

  if (amount === 0) {
    throw new Error("Transaction amount must be different from zero")
  }

  const session = await prisma.cashSession.findUnique({ where: { id: sessionId } })

  if (!session) {
    throw new Error("SESSION_NOT_FOUND")
  }

  if (session.status !== CashSessionStatus.OPEN) {
    throw new Error("SESSION_NOT_OPEN")
  }

  await prisma.cashTransaction.create({
    data: {
      cashSessionId: sessionId,
      type,
      amount,
      description,
      paymentMethod,
      performedById,
    },
  })

  return buildSessionSnapshot(sessionId)
}

export async function closeCashSession(params: {
  sessionId: string
  userId: string
  closingAmount: number
  notes?: string | null
}) {
  const { sessionId, userId, closingAmount, notes } = params

  const session = await prisma.cashSession.findUnique({ where: { id: sessionId } })

  if (!session) {
    throw new Error("SESSION_NOT_FOUND")
  }

  if (session.userId !== userId) {
    throw new Error("FORBIDDEN")
  }

  if (session.status !== CashSessionStatus.OPEN && session.status !== CashSessionStatus.CLOSING) {
    throw new Error("SESSION_NOT_OPEN")
  }

  const snapshot = await buildSessionSnapshot(sessionId)

  if (!snapshot) {
    throw new Error("SESSION_NOT_FOUND")
  }

  const updated = await prisma.cashSession.update({
    where: { id: sessionId },
    data: {
      status: CashSessionStatus.CLOSED,
      closedAt: new Date(),
      closingAmount,
      expectedClosingAmount: snapshot.expectedClosingAmount,
      differenceAmount: closingAmount - snapshot.expectedClosingAmount,
      notes: notes ?? snapshot.notes,
    },
  })

  try {
    await generateDailyReport({
      date: updated.closedAt ?? new Date(),
      pointOfSaleId: updated.pointOfSaleId ?? undefined,
      cashSessionId: updated.id,
    })
  } catch (error) {
    console.error("Failed to generate daily report after closing session", error)
  }

  return buildSessionSnapshot(updated.id)
}
