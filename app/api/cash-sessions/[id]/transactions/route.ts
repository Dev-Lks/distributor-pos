import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { createCashTransaction } from "@/lib/cashSessions"
import { prisma } from "@/lib/prisma"
import { CashTransactionType } from "@prisma/client"

const createTransactionSchema = z.object({
  type: z.nativeEnum(CashTransactionType).refine(
    (value) => value !== CashTransactionType.OPENING,
    "Não é possível registrar abertura manualmente."
  ),
  amount: z.number().refine((value) => value !== 0, {
    message: "Valor deve ser diferente de zero",
  }),
  description: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
})

type CreateTransactionInput = z.infer<typeof createTransactionSchema>

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  return session.user
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: issue?.message,
        },
        { status: 400 },
      )
    }

  const data = parsed.data as CreateTransactionInput

    const session = await prisma.cashSession.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Cash session not found" }, { status: 404 })
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.status !== "OPEN") {
      return NextResponse.json({ error: "Cash session is closed" }, { status: 409 })
    }

    const snapshot = await createCashTransaction({
      sessionId: params.id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      paymentMethod: data.paymentMethod,
      performedById: user.id,
    })

    return NextResponse.json(snapshot)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      if (error.message === "SESSION_NOT_FOUND") {
        return NextResponse.json({ error: "Cash session not found" }, { status: 404 })
      }

      if (error.message === "SESSION_NOT_OPEN") {
        return NextResponse.json({ error: "Cash session is closed" }, { status: 409 })
      }
    }

    console.error("Failed to create cash transaction", error)
    return NextResponse.json({ error: "Failed to create cash transaction" }, { status: 500 })
  }
}
