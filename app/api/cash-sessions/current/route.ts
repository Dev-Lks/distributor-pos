import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { buildSessionSnapshot, findActiveSession } from "@/lib/cashSessions"

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
    const pointOfSaleId = request.nextUrl.searchParams.get("pointOfSaleId")

    const activeSession = await findActiveSession(user.id, pointOfSaleId)

    if (!activeSession) {
      return NextResponse.json(null)
    }

    const snapshot = await buildSessionSnapshot(activeSession.id)
    return NextResponse.json(snapshot)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to fetch current cash session", { error })
    return NextResponse.json({ error: "Failed to fetch current cash session" }, { status: 500 })
  }
}
