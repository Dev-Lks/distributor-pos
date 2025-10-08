import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { resendDailyReport } from "@/lib/dailyReports"

const schema = z.object({
  recipients: z.array(z.string().email()).optional(),
})

async function requireUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireUser()

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json({ error: issue?.message ?? "Invalid payload" }, { status: 400 })
    }

    const report = await resendDailyReport({
      reportId: id,
      recipients: parsed.data.recipients,
    })

    return NextResponse.json(report)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      if (error.message === "REPORT_NOT_FOUND") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 })
      }
    }

    console.error("Failed to resend daily report", error)
    return NextResponse.json({ error: "Failed to resend daily report" }, { status: 500 })
  }
}
