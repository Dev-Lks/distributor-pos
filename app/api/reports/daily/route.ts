import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { generateDailyReport, listDailyReports } from "@/lib/dailyReports"
import { DailyReportStatus } from "@prisma/client"

const listSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  status: z.nativeEnum(DailyReportStatus).or(z.literal("all")).optional(),
  pointOfSaleId: z.string().optional(),
  take: z.coerce.number().min(1).max(200).optional(),
  skip: z.coerce.number().min(0).optional(),
})

const generateSchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
  pointOfSaleId: z.string().optional(),
  cashSessionId: z.string().optional(),
  regenerate: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
  recipients: z.array(z.string().email()).optional(),
  timezone: z.string().optional(),
})

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  return session.user
}

export async function GET(request: NextRequest) {
  try {
    await requireUser()

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = listSchema.safeParse(params)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json({ error: issue?.message ?? "Invalid query" }, { status: 400 })
    }

    const { reports, total } = await listDailyReports({
      from: parsed.data.from,
      to: parsed.data.to,
      status: parsed.data.status ?? "all",
      pointOfSaleId: parsed.data.pointOfSaleId,
      take: parsed.data.take,
      skip: parsed.data.skip,
    })

    return NextResponse.json({
      data: reports,
      total,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to list daily reports", { error })
    return NextResponse.json({ error: "Failed to list daily reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    void user

    const body = await request.json()
    const parsed = generateSchema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json({ error: issue?.message ?? "Invalid payload" }, { status: 400 })
    }

    const report = await generateDailyReport(parsed.data)

    return NextResponse.json(report)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    logger.error("Failed to generate daily report", { error })
    return NextResponse.json({ error: "Failed to generate daily report" }, { status: 500 })
  }
}
