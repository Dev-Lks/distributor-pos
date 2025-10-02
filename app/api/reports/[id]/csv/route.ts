import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/reports/[id]/csv
 * Serve o CSV de um relatório diretamente do banco de dados
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id

    // Buscar relatório com CSV
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        csvData: true,
        reportDate: true,
        metadata: true,
        pointOfSale: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se há CSV armazenado
    if (!report.csvData) {
      return NextResponse.json(
        { error: "CSV não disponível para este relatório" },
        { status: 404 }
      )
    }

    // Extrair nome do arquivo do metadata se disponível
    let filename = "relatorio-z.csv"
    
    if (report.metadata && typeof report.metadata === "object") {
      const metadata = report.metadata as Record<string, any>
      if (metadata.files?.csv?.filename) {
        filename = metadata.files.csv.filename
      }
    }

    // Servir o CSV
    const csvBody =
      report.csvData instanceof Uint8Array
        ? Buffer.from(report.csvData)
        : report.csvData

    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Erro ao servir CSV:", error)
    return NextResponse.json(
      { error: "Erro ao carregar CSV" },
      { status: 500 }
    )
  }
}
