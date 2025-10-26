import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireUser()

    const report = await prisma.dailyReport.findUnique({
      where: { id: id },
      include: {
        pointOfSale: true,
        cashSession: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to load daily report", { error })
    return NextResponse.json({ error: "Failed to load daily report" }, { status: 500 })
  }
}
