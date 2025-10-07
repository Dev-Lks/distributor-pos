'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export function PWAInstall() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('Service Worker registered', { scope: registration.scope });
        })
        .catch((registrationError) => {
          logger.error('Service Worker registration failed', { error: registrationError });
        });
    }
  }, []);

  return null;
}