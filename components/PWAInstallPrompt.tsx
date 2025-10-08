'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

const PWA_DISMISSED_KEY = 'nitrobeer-pwa-dismissed'
const PWA_SHOW_AGAIN_KEY = 'nitrobeer-pwa-show-again'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já recusou anteriormente
    const isDismissed = localStorage.getItem(PWA_DISMISSED_KEY) === 'true'
    const showAgain = localStorage.getItem(PWA_SHOW_AGAIN_KEY) === 'true'
    
    // Se foi recusado e não foi pedido para mostrar novamente, não mostrar
    if (isDismissed && !showAgain) {
      return
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Só mostrar se não foi recusado OU se foi pedido para mostrar novamente
      if (!isDismissed || showAgain) {
        setShowPrompt(true)
        // Limpar o flag de "mostrar novamente" se foi usado
        if (showAgain) {
          localStorage.removeItem(PWA_SHOW_AGAIN_KEY)
        }
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      logger.info('PWA install prompt interaction', { outcome })
      
      if (outcome === 'accepted') {
        // Se aceitou, remover o flag de recusado
        localStorage.removeItem(PWA_DISMISSED_KEY)
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    // Salvar que o usuário recusou
    localStorage.setItem(PWA_DISMISSED_KEY, 'true')
    setShowPrompt(false)
    logger.info('PWA install prompt dismissed by user')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-card/90 backdrop-blur-md border border-border/50 rounded-lg p-4 shadow-lg animate-fade-in">
      <div className="flex items-center gap-3">
        <Download className="w-6 h-6 text-primary flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Instalar NitroBeer POS</h3>
          <p className="text-xs text-muted-foreground">App funciona offline e é mais rápido!</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstall} className="text-xs">
            Instalar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}