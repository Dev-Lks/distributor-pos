'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

const PWA_DISMISSED_KEY = 'distribuidora-pwa-dismissed'
const PWA_SHOW_AGAIN_KEY = 'distribuidora-pwa-show-again'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listener para quando o app for instalado
    window.addEventListener('appinstalled', () => {
      logger.info('PWA installed successfully')
      setIsInstalled(true)
      setIsInstallable(false)
      localStorage.removeItem(PWA_DISMISSED_KEY)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      logger.warn('No deferred prompt available')
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      logger.info('PWA install prompt result', { outcome })
      
      if (outcome === 'accepted') {
        localStorage.removeItem(PWA_DISMISSED_KEY)
        return true
      }
      
      return false
    } catch (error) {
      logger.error('Error prompting PWA install', { error })
      return false
    }
  }

  const showPromptAgain = () => {
    localStorage.setItem(PWA_SHOW_AGAIN_KEY, 'true')
    localStorage.removeItem(PWA_DISMISSED_KEY)
  }

  const isDismissed = () => {
    return localStorage.getItem(PWA_DISMISSED_KEY) === 'true'
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    showPromptAgain,
    isDismissed,
    canPrompt: !!deferredPrompt && !isInstalled
  }
}
