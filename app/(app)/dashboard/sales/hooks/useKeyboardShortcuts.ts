import { useEffect } from "react"

interface KeyboardShortcutsConfig {
  onF1?: () => void
  onF2?: () => void
  onF3?: () => void
  onEscape?: () => void
  onEnter?: () => void
  enabled?: boolean
}

/**
 * Hook para gerenciar atalhos de teclado do PDV
 * @param config - Configuração dos atalhos
 */
export function useKeyboardShortcuts({
  onF1,
  onF2,
  onF3,
  onEscape,
  onEnter,
  enabled = true,
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver em um input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return
      }

      switch (e.key) {
        case "F1":
          e.preventDefault()
          onF1?.()
          break
        case "F2":
          e.preventDefault()
          onF2?.()
          break
        case "F3":
          e.preventDefault()
          onF3?.()
          break
        case "Escape":
          onEscape?.()
          break
        case "Enter":
          if (e.ctrlKey) {
            e.preventDefault()
            onEnter?.()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onF1, onF2, onF3, onEscape, onEnter, enabled])
}
