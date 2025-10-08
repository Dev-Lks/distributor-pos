import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { closeCashSession, buildSessionSnapshot } from "@/lib/cashSessions"
import { prisma } from "@/lib/prisma"

const closeSchema = z.object({
  closingAmount: z.number(),
  notes: z.string().trim().optional(),
})

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  return session.user
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const session = await prisma.cashSession.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Cash session not found" }, { status: 404 })
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const snapshot = await buildSessionSnapshot(session.id)
    return NextResponse.json(snapshot)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.error("Failed to load cash session", error)
    return NextResponse.json({ error: "Failed to load cash session" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const body = await request.json()
    const parsed = closeSchema.safeParse(body)

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

    const snapshot = await closeCashSession({
      sessionId: id,
      userId: user.id,
      closingAmount: parsed.data.closingAmount,
      notes: parsed.data.notes,
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

      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (error.message === "SESSION_NOT_OPEN") {
        return NextResponse.json({ error: "Cash session already closed" }, { status: 409 })
      }
    }

    console.error("Failed to close cash session", error)
    return NextResponse.json({ error: "Failed to close cash session" }, { status: 500 })
  }
}
