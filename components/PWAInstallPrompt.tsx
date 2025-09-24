'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User ${outcome} the install prompt`)
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
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
          <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}