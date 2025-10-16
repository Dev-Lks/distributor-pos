"use client"

import { useEffect, useState } from 'react'

/**
 * Hook para detectar se o dispositivo tem conectividade lenta
 * Útil para ajustar features baseado em performance de rede
 * 
 * @returns boolean - true se conexão é lenta
 */
export function useSlowConnection() {
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // @ts-expect-error - Navigator.connection não está em todos os browsers
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      const updateConnectionStatus = () => {
        // Considera lento se: 2g, slow-2g, ou save-data ativo
        const isSlow = 
          connection.effectiveType === '2g' || 
          connection.effectiveType === 'slow-2g' ||
          connection.saveData === true
        
        setIsSlowConnection(isSlow)
      }

      updateConnectionStatus()
      connection.addEventListener('change', updateConnectionStatus)

      return () => {
        connection.removeEventListener('change', updateConnectionStatus)
      }
    }
  }, [])

  return isSlowConnection
}

/**
 * Hook para detectar se o dispositivo está em modo economia de bateria
 * 
 * @returns boolean - true se está em modo economia
 */
export function useBatterySaver() {
  const [isBatterySaver, setIsBatterySaver] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // @ts-expect-error - Navigator.connection não está em todos os browsers
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection && 'saveData' in connection) {
      setIsBatterySaver(connection.saveData === true)
    }
  }, [])

  return isBatterySaver
}
