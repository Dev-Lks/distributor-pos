import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  buildSessionSnapshot,
  openCashSession,
} from "@/lib/cashSessions"
import { CashSessionStatus } from "@prisma/client"
import { logger } from "@/lib/logger"
import { LIMITS } from "@/lib/constants/limits"

const openSessionSchema = z.object({
  openingAmount: z.number().min(0, "Opening amount must be zero or greater").max(LIMITS.MAX_CASH_SESSION_AMOUNT, `Valor não pode exceder ${LIMITS.MAX_CASH_SESSION_AMOUNT}`),
  pointOfSaleId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(LIMITS.MAX_NOTES_LENGTH).optional(),
})

const statusParamSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
  )
  .pipe(
    z
      .array(z.nativeEnum(CashSessionStatus))
      .nonempty()
      .optional()
  )

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

    const statusParam = request.nextUrl.searchParams.get("status")
    const statuses = statusParam ? statusParamSchema.parse(statusParam) : undefined

    const cashSessions = await prisma.cashSession.findMany({
      where: {
        userId: user.id,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      orderBy: {
        openedAt: "desc",
      },
      take: 25,
    })

    const snapshots = await Promise.all(
  cashSessions.map((session: { id: string }) => buildSessionSnapshot(session.id))
    )

    return NextResponse.json(snapshots.filter(Boolean))
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to list cash sessions", { error })
    return NextResponse.json({ error: "Failed to list cash sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const payload = openSessionSchema.safeParse(body)

    if (!payload.success) {
      const issue = payload.error.issues.at(0)
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: issue?.message,
        },
        { status: 400 },
      )
    }

    const snapshot = await openCashSession({
      userId: user.id,
      pointOfSaleId: payload.data.pointOfSaleId,
      openingAmount: payload.data.openingAmount,
      notes: payload.data.notes,
    })

    return NextResponse.json(snapshot, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      if (error.message === "ACTIVE_SESSION_EXISTS") {
        return NextResponse.json(
          {
            error: "Existing session",
            details: "Finalize the caixa atual antes de abrir outro.",
          },
          { status: 409 },
        )
      }
    }

    logger.error("Failed to open cash session", { error })
    return NextResponse.json({ error: "Failed to open cash session" }, { status: 500 })
  }
}
