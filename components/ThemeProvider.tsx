'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type ThemeName, getTheme, applyTheme, getStoredTheme } from '@/lib/themes'

interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark-minimal')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = getStoredTheme()
    setThemeState(stored)
    applyTheme(getTheme(stored))
    setMounted(true)
  }, [])

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
    applyTheme(getTheme(newTheme))
  }

  const isDark = theme.startsWith('dark')

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  // Return a default fallback if used outside of ThemeProvider
  if (context === undefined) {
    return {
      theme: 'dark-minimal' as const,
      setTheme: () => {},
      isDark: true,
    }
  }
  
  return context
}
