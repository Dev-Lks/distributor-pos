import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/reports/[id]/pdf
 * Serve o PDF de um relatório diretamente do banco de dados
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id

    // Buscar relatório com PDF
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        pdfData: true,
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

    // Verificar se há PDF armazenado
    if (!report.pdfData) {
      return NextResponse.json(
        { error: "PDF não disponível para este relatório" },
        { status: 404 }
      )
    }

    // Extrair nome do arquivo do metadata se disponível
    let filename = "relatorio-z.pdf"
    
    if (report.metadata && typeof report.metadata === "object") {
      const metadata = report.metadata as Record<string, any>
      if (metadata.files?.pdf?.filename) {
        filename = metadata.files.pdf.filename
      }
    }

    // Servir o PDF
    return new NextResponse(report.pdfData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Erro ao servir PDF:", error)
    return NextResponse.json(
      { error: "Erro ao carregar PDF" },
      { status: 500 }
    )
  }
}
