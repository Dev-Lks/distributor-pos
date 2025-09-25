"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackupManager } from "@/components/BackupManager"

interface SupportActionsProps {
  onExportXlsx: () => void
  onExportCsv: () => void
}

export function SupportActions({ onExportCsv, onExportXlsx }: SupportActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5" />
            Exportar dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onExportXlsx}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar vendas para XLSX
          </Button>
          <Button
            onClick={onExportCsv}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar vendas para CSV
          </Button>
        </CardContent>
      </Card>

      <BackupManager />
    </div>
  )
}
