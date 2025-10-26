import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'

import { prisma } from "@/lib/prisma"
import { generateDailyReport } from "@/lib/dailyReports"

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REPORTS_CRON_SECRET

    if (secret) {
      const header = request.headers.get("authorization") ?? request.headers.get("Authorization")
      if (header !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const now = new Date()
    const referenceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)

    const pointsOfSale = await prisma.pointOfSale.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    const reportPromises = [
      generateDailyReport({ date: referenceDate }),
      ...pointsOfSale.map((point) =>
        generateDailyReport({
          date: referenceDate,
          pointOfSaleId: point.id,
        })
      ),
    ]

    const reports = await Promise.all(reportPromises)

    return NextResponse.json({
      data: reports,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Daily report cron failed", { error })
    return NextResponse.json({ error: "Daily report cron failed" }, { status: 500 })
  }
}
