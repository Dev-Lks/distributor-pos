import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser()

    const report = await prisma.dailyReport.findUnique({
      where: { id: params.id },
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

    console.error("Failed to load daily report", error)
    return NextResponse.json({ error: "Failed to load daily report" }, { status: 500 })
  }
}
