// components/hardware/RemotePrinterConfig.tsx
'use client'

import { useState, useEffect } from 'react'
import { remotePrinter } from '@/lib/hardware/remotePrinter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Loader2, Server, Lock } from 'lucide-react'

interface RemotePrinterConfigProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemotePrinterConfig({ open, onOpenChange }: RemotePrinterConfigProps) {
  const [serverUrl, setServerUrl] = useState('http://localhost:3001')
  const [authToken, setAuthToken] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    // Carregar configuração salva
    const config = remotePrinter.loadConfig()
    if (config) {
      setServerUrl(config.serverUrl)
      setAuthToken(config.authToken)
    }
  }, [])

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      // Configurar temporariamente
      remotePrinter.configure({ serverUrl, authToken })

      // Testar conexão
      const connected = await remotePrinter.checkConnection()
      
      if (!connected) {
        setTestResult({
          success: false,
          message: 'Não foi possível conectar ao servidor',
        })
        return
      }

      // Verificar status da impressora
      const status = await remotePrinter.getStatus()
      
      if (!status.connected) {
        setTestResult({
          success: false,
          message: status.error || 'Impressora não conectada',
        })
        return
      }

      setTestResult({
        success: true,
        message: 'Conexão OK! Impressora pronta.',
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    remotePrinter.configure({ serverUrl, authToken })
    onOpenChange(false)
  }

  const handlePrintTest = async () => {
    setTesting(true)
    try {
      const result = await remotePrinter.printTest()
      setTestResult({
        success: result.success,
        message: result.success 
          ? 'Teste impresso! Verifique a impressora.' 
          : result.error || 'Erro ao imprimir',
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao enviar impressão',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Servidor de Impressão</DialogTitle>
          <DialogDescription>
            Configure o servidor local que gerencia a impressora térmica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL do Servidor */}
          <div className="space-y-2">
            <Label htmlFor="serverUrl">
              <Server className="inline w-4 h-4 mr-1" />
              URL do Servidor
            </Label>
            <Input
              id="serverUrl"
              type="url"
              placeholder="http://192.168.1.10:3001"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ex: http://localhost:3001 ou http://192.168.1.10:3001
            </p>
          </div>

          {/* Token de Autenticação */}
          <div className="space-y-2">
            <Label htmlFor="authToken">
              <Lock className="inline w-4 h-4 mr-1" />
              Token de Autenticação
            </Label>
            <Input
              id="authToken"
              type="password"
              placeholder="Seu token secreto"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mesmo token configurado no servidor (AUTH_TOKEN no .env)
            </p>
          </div>

          {/* Resultado do Teste */}
          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleTest}
              disabled={testing || !serverUrl || !authToken}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </Button>

            {testResult?.success && (
              <Button
                variant="outline"
                onClick={handlePrintTest}
                disabled={testing}
              >
                Imprimir Teste
              </Button>
            )}

            <Button
              onClick={handleSave}
              disabled={testing || !serverUrl || !authToken}
              className="flex-1"
            >
              Salvar
            </Button>
          </div>

          {/* Ajuda */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Precisa de ajuda?</strong>
              <br />
              Consulte o arquivo <code>IMPRESSORA_E_VERCEL.md</code> para instruções completas de instalação do servidor.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
