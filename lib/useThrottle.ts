import { useEffect, useRef, useState } from 'react'

/**
 * Hook para throttling de valores
 * Útil para eventos de scroll que não devem executar a cada frame
 * 
 * @param value - Valor a ser throttled
 * @param limit - Intervalo mínimo em ms entre updates (padrão: 500ms)
 * @returns Valor throttled
 */
export function useThrottle<T>(value: T, limit: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => clearTimeout(handler)
  }, [value, limit])

  return throttledValue
}
