'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSales } from '@/lib/useSales'

export function BackupManager() {
  const { backupAllSales, getSheetsSummary } = useSales()
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackup, setLastBackup] = useState<{
    successCount: number
    errorCount: number
    total: number
    timestamp: Date
  } | null>(null)
  const [sheetsSummary, setSheetsSummary] = useState<any>(null)

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const result = await backupAllSales()
      setLastBackup({
        ...result,
        timestamp: new Date()
      })

      // Atualizar resumo do Sheets
      const summary = await getSheetsSummary()
      setSheetsSummary(summary)
    } catch (error) {
      console.error('Erro no backup:', error)
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleCheckSheets = async () => {
    try {
      const summary = await getSheetsSummary()
      setSheetsSummary(summary)
    } catch (error) {
      console.error('Erro ao verificar Sheets:', error)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="w-5 h-5" />
          Backup Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="flex-1"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fazendo backup...
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 mr-2" />
                Backup Manual
              </>
            )}
          </Button>

          <Button
            onClick={handleCheckSheets}
            variant="outline"
          >
            Verificar Sheets
          </Button>
        </div>

        {lastBackup && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {lastBackup.errorCount === 0 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                Último backup: {lastBackup.timestamp.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {lastBackup.successCount}/{lastBackup.total} vendas backupadas
              {lastBackup.errorCount > 0 && ` (${lastBackup.errorCount} erros)`}
            </div>
          </div>
        )}

        {sheetsSummary && (
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <div className="text-sm font-medium mb-1">📊 Dados no Google Sheets:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Total de vendas: {sheetsSummary.totalSales}</div>
              <div>Receita total: R$ {sheetsSummary.totalRevenue.toFixed(2)}</div>
              <div>Vendas hoje: {sheetsSummary.todaySales}</div>
              <div>Receita hoje: R$ {sheetsSummary.todayRevenue.toFixed(2)}</div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 As vendas são salvas automaticamente no Google Sheets quando criadas.
          Use o backup manual para sincronizar vendas antigas.
        </div>
      </CardContent>
    </Card>
  )
}