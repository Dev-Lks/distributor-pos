'use client'

import { useState } from 'react'
import { Settings, Printer, Scan, Save, TestTube } from 'lucide-react'
import { Button } from '@/components/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'
import { useThermalPrinter } from '@/lib/hardware/useThermalPrinter'
import { toast } from 'sonner'
import type { PrinterConfig } from '@/lib/hardware/types'

interface HardwareSettingsProps {
  pointOfSaleId: string
}

export function HardwareSettings({ pointOfSaleId }: HardwareSettingsProps) {
  const [open, setOpen] = useState(false)
  const { configure, testPrint, isPrinting } = useThermalPrinter()
  
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    type: 'USB',
    connectionString: '/dev/usb/lp0',
    width: 48,
    encoding: 'UTF-8',
  })

  const [scannerConfig, setScannerConfig] = useState({
    enabled: true,
    autoAdd: true,
    prefix: '',
    suffix: '',
  })

  const handleSavePrinter = async () => {
    try {
      await configure(printerConfig)
      toast.success('Configurações da impressora salvas!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    }
  }

  const handleTestPrinter = async () => {
    try {
      await testPrint()
      toast.success('Teste de impressão enviado!')
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro no teste de impressão')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Hardware
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Configurações de Hardware</DialogTitle>
          <DialogDescription>
            Configure o leitor de código de barras e a impressora térmica
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="printer" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="printer">
              <Printer className="h-4 w-4 mr-2" />
              Impressora
            </TabsTrigger>
            <TabsTrigger value="scanner">
              <Scan className="h-4 w-4 mr-2" />
              Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="printer" className="space-y-4 flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="printer-type">Tipo de Conexão</Label>
                <select
                  id="printer-type"
                  value={printerConfig.type}
                  onChange={(e) =>
                    setPrinterConfig((prev) => ({
                      ...prev,
                      type: e.target.value as 'USB' | 'Network' | 'Serial',
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="USB">USB</option>
                  <option value="Network">Rede (TCP/IP)</option>
                  <option value="Serial">Serial (COM)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  📖 Não sabe qual escolher? Veja o arquivo CONFIGURACAO_IMPRESSORA.md
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connection-string">String de Conexão</Label>
                <Input
                  id="connection-string"
                  value={printerConfig.connectionString}
                  onChange={(e) =>
                    setPrinterConfig((prev) => ({
                      ...prev,
                      connectionString: e.target.value,
                    }))
                  }
                  placeholder={
                    printerConfig.type === 'USB'
                      ? '/dev/usb/lp0'
                      : printerConfig.type === 'Network'
                      ? '192.168.1.100:9100'
                      : 'COM3'
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {printerConfig.type === 'USB' && 'Ex: /dev/usb/lp0 ou /dev/ttyUSB0'}
                  {printerConfig.type === 'Network' && 'Ex: 192.168.1.100:9100'}
                  {printerConfig.type === 'Serial' && 'Ex: COM3 ou /dev/ttyS0'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="printer-width">Largura do Papel (caracteres)</Label>
                <select
                  id="printer-width"
                  value={printerConfig.width}
                  onChange={(e) =>
                    setPrinterConfig((prev) => ({
                      ...prev,
                      width: parseInt(e.target.value) as 32 | 48 | 58 | 80,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="32">32 caracteres (58mm)</option>
                  <option value="48">48 caracteres (80mm) - Padrão</option>
                  <option value="58">58 caracteres (80mm)</option>
                  <option value="80">80 caracteres (110mm)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encoding">Codificação</Label>
                <select
                  id="encoding"
                  value={printerConfig.encoding}
                  onChange={(e) =>
                    setPrinterConfig((prev) => ({
                      ...prev,
                      encoding: e.target.value as 'UTF-8' | 'GB18030' | 'ISO-8859-1',
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="UTF-8">UTF-8 (Recomendado)</option>
                  <option value="ISO-8859-1">ISO-8859-1</option>
                  <option value="GB18030">GB18030</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  UTF-8 suporta português e caracteres especiais
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePrinter} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
                <Button
                  onClick={handleTestPrinter}
                  variant="outline"
                  disabled={isPrinting}
                  className="flex-1"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar Impressão
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4 flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scanner-enabled">Habilitar Scanner</Label>
                <input
                  id="scanner-enabled"
                  type="checkbox"
                  checked={scannerConfig.enabled}
                  onChange={(e) =>
                    setScannerConfig((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-add">Adicionar automaticamente ao carrinho</Label>
                <input
                  id="auto-add"
                  type="checkbox"
                  checked={scannerConfig.autoAdd}
                  onChange={(e) =>
                    setScannerConfig((prev) => ({
                      ...prev,
                      autoAdd: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scanner-prefix">Prefixo do Scanner (opcional)</Label>
                <Input
                  id="scanner-prefix"
                  value={scannerConfig.prefix}
                  onChange={(e) =>
                    setScannerConfig((prev) => ({
                      ...prev,
                      prefix: e.target.value,
                    }))
                  }
                  placeholder="Ex: SCAN:"
                />
                <p className="text-xs text-muted-foreground">
                  Alguns scanners enviam um prefixo antes do código
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scanner-suffix">Sufixo do Scanner (opcional)</Label>
                <Input
                  id="scanner-suffix"
                  value={scannerConfig.suffix}
                  onChange={(e) =>
                    setScannerConfig((prev) => ({
                      ...prev,
                      suffix: e.target.value,
                    }))
                  }
                  placeholder="Ex: ENTER"
                />
                <p className="text-xs text-muted-foreground">
                  Alguns scanners enviam um sufixo após o código (geralmente Enter)
                </p>
              </div>

              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
