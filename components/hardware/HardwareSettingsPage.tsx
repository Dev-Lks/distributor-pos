'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Printer, Scan, Save, TestTube } from 'lucide-react'
import { useThermalPrinter } from '@/lib/hardware/useThermalPrinter'
import type { PrinterConfig, HardwareConfig } from '@/lib/hardware/types'

interface HardwareSettingsPageProps {
  pointOfSaleId?: string
}

export function HardwareSettingsPage({ pointOfSaleId }: HardwareSettingsPageProps) {
  const { status: printerStatus, testPrint, configure } = useThermalPrinter()
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  
  const [config, setConfig] = useState<Partial<HardwareConfig>>({
    scannerEnabled: false,
    scannerAutoAdd: true,
    scannerPrefix: '',
    scannerSuffix: '',
    printerEnabled: false,
    printerType: 'USB',
    printerConnection: '',
    printerWidth: 48,
    printerEncoding: 'UTF-8',
    autoPrint: true,
    logoUrl: '',
    footerMessage: 'Obrigado pela preferência!',
  })

  // Carrega configurações existentes
  useEffect(() => {
    const loadConfig = async () => {
      if (!pointOfSaleId) return
      
      try {
        const response = await fetch(`/api/hardware/config/${pointOfSaleId}`)
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
    
    loadConfig()
  }, [pointOfSaleId])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/hardware/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          pointOfSaleId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações')
      }

      toast.success('Configurações salvas com sucesso!')

      // Se a impressora foi configurada, aplica as configurações
      if (config.printerEnabled && config.printerConnection) {
        const printerConfig: PrinterConfig = {
          type: config.printerType as 'USB' | 'Network' | 'Serial',
          connectionString: config.printerConnection,
          width: config.printerWidth as 32 | 48 | 58 | 80,
          encoding: config.printerEncoding as 'UTF-8' | 'GB18030' | 'ISO-8859-1',
        }
        
        await configure(printerConfig)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    
    try {
      await testPrint()
      toast.success('Teste de impressão enviado!')
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro ao testar impressora')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Hardware</h1>
        <p className="text-muted-foreground mt-2">
          Configure o leitor de código de barras e a impressora térmica
        </p>
      </div>

      <Separator />

      {/* Scanner Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Leitor de Código de Barras
          </CardTitle>
          <CardDescription>
            Configure o comportamento do scanner de código de barras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Scanner</Label>
              <p className="text-sm text-muted-foreground">
                Ativa a detecção automática de código de barras
              </p>
            </div>
            <Switch
              checked={config.scannerEnabled}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, scannerEnabled: checked }))
              }
            />
          </div>

          {config.scannerEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Adicionar Automaticamente ao Carrinho</Label>
                  <p className="text-sm text-muted-foreground">
                    Produtos escaneados são adicionados automaticamente
                  </p>
                </div>
                <Switch
                  checked={config.scannerAutoAdd}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, scannerAutoAdd: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scannerPrefix">Prefixo</Label>
                  <Input
                    id="scannerPrefix"
                    placeholder="Ex: SCAN:"
                    value={config.scannerPrefix || ''}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, scannerPrefix: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Caracteres que o scanner envia antes do código
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scannerSuffix">Sufixo</Label>
                  <Input
                    id="scannerSuffix"
                    placeholder="Ex: Enter"
                    value={config.scannerSuffix || ''}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, scannerSuffix: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Caracteres que o scanner envia após o código
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Printer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impressora Térmica
          </CardTitle>
          <CardDescription>
            Configure a impressora de recibos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Impressora</Label>
              <p className="text-sm text-muted-foreground">
                Ativa a impressão automática de recibos
              </p>
            </div>
            <Switch
              checked={config.printerEnabled}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, printerEnabled: checked }))
              }
            />
          </div>

          {config.printerEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="printerType">Tipo de Conexão</Label>
                  <Select
                    value={config.printerType}
                    onValueChange={(value) => 
                      setConfig(prev => ({ ...prev, printerType: value }))
                    }
                  >
                    <SelectTrigger id="printerType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USB">USB</SelectItem>
                      <SelectItem value="Network">Rede (TCP/IP)</SelectItem>
                      <SelectItem value="Serial">Serial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="printerWidth">Largura do Papel</Label>
                  <Select
                    value={config.printerWidth?.toString()}
                    onValueChange={(value) => 
                      setConfig(prev => ({ ...prev, printerWidth: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="printerWidth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="32">32 caracteres</SelectItem>
                      <SelectItem value="48">48 caracteres</SelectItem>
                      <SelectItem value="58">58 caracteres</SelectItem>
                      <SelectItem value="80">80 caracteres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="printerConnection">String de Conexão</Label>
                <Input
                  id="printerConnection"
                  placeholder={
                    config.printerType === 'USB' 
                      ? 'Ex: /dev/usb/lp0' 
                      : config.printerType === 'Network'
                      ? 'Ex: 192.168.1.100:9100'
                      : 'Ex: COM3'
                  }
                  value={config.printerConnection || ''}
                  onChange={(e) => 
                    setConfig(prev => ({ ...prev, printerConnection: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {config.printerType === 'USB' && 'Caminho do dispositivo USB'}
                  {config.printerType === 'Network' && 'IP:Porta da impressora'}
                  {config.printerType === 'Serial' && 'Porta serial (COM)'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="printerEncoding">Codificação</Label>
                <Select
                  value={config.printerEncoding}
                  onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, printerEncoding: value }))
                  }
                >
                  <SelectTrigger id="printerEncoding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTF-8">UTF-8</SelectItem>
                    <SelectItem value="GB18030">GB18030</SelectItem>
                    <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Imprimir Automaticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Imprime o recibo automaticamente após finalizar a venda
                  </p>
                </div>
                <Switch
                  checked={config.autoPrint}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, autoPrint: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="footerMessage">Mensagem de Rodapé</Label>
                <Textarea
                  id="footerMessage"
                  placeholder="Obrigado pela preferência!"
                  value={config.footerMessage || ''}
                  onChange={(e) => 
                    setConfig(prev => ({ ...prev, footerMessage: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestPrint}
                  disabled={isTesting || !printerStatus.connected}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isTesting ? 'Testando...' : 'Teste de Impressão'}
                </Button>
                
                <div className="flex-1" />
                
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  Status: 
                  <span className={`font-medium ${
                    printerStatus.connected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {printerStatus.connected ? 'Conectada' : 'Desconectada'}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
