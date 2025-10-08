import { notFound } from "next/navigation"

import { listDailyReports } from "@/lib/dailyReports"
import { prisma } from "@/lib/prisma"
import { DailyReportsClient } from "./DailyReportsClient"

export const metadata = {
  title: "Relatórios Z",
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DailyReportsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = {
    status: "all" as const,
  }

  const take = 100

  const [{ reports, total }, pointsOfSale] = await Promise.all([
    listDailyReports({ take }),
    prisma.pointOfSale.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  if (!reports) {
    notFound()
  }

  return (
    <DailyReportsClient
      initialData={reports}
      initialTotal={total}
      pointsOfSale={pointsOfSale}
      initialFilters={filters}
    />
  )
}
