"use client"

import Link from "next/link"
import { AlertTriangle, PackageSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StockAlertsProps {
  lowStockCount: number
  outOfStockCount: number
}

export function StockAlerts({ lowStockCount, outOfStockCount }: StockAlertsProps) {
  if (lowStockCount <= 0 && outOfStockCount <= 0) {
    return null
  }

  return (
    <Card className="border-destructive/40 bg-destructive/5 dark:border-destructive/60 dark:bg-destructive/10">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive dark:text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Atenção ao estoque
        </CardTitle>
        <Button asChild size="sm" variant="secondary" className="bg-background">
          <Link href="/inventory" className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4" />
            Revisar estoque
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {lowStockCount > 0 && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-100/60 p-3 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden />
            <div>
              <p className="text-sm font-semibold">
                {lowStockCount} produto{lowStockCount > 1 ? "s" : ""} com estoque baixo
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                Programe uma reposição para evitar rupturas.
              </p>
            </div>
          </div>
        )}
        {outOfStockCount > 0 && (
          <div className="flex items-start gap-3 rounded-lg bg-red-100/60 p-3 text-red-900 dark:bg-red-900/20 dark:text-red-200">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden />
            <div>
              <p className="text-sm font-semibold">
                {outOfStockCount} produto{outOfStockCount > 1 ? "s" : ""} esgotado{outOfStockCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-800/80 dark:text-red-200/80">
                Reavalie promoções ou transfira estoque entre pontos.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
