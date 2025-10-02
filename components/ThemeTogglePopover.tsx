'use client'

import { Check, Palette } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTheme } from '@/components/ThemeProvider'
import { themes, type ThemeName } from '@/lib/themes'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'

export function ThemeTogglePopover() {
  const { theme: currentTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const lightThemes = Object.values(themes).filter(t => t.type === 'light')
  const darkThemes = Object.values(themes).filter(t => t.type === 'dark')

  const handleThemeSelect = (themeName: ThemeName) => {
    setTheme(themeName)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-md border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Select theme"
        >
          <Palette className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0" sideOffset={8}>
        <div className="p-3 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground px-2 py-1">
            Light Themes
          </p>
          {lightThemes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => handleThemeSelect(theme.name as ThemeName)}
              className="w-full flex items-start justify-between p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="font-medium text-sm">{theme.label}</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {theme.description}
                </span>
              </div>
              {currentTheme === theme.name && (
                <Check className="h-4 w-4 ml-2 mt-0.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
        
        <Separator />
        
        <div className="p-3 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground px-2 py-1">
            Dark Themes
          </p>
          {darkThemes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => handleThemeSelect(theme.name as ThemeName)}
              className="w-full flex items-start justify-between p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="font-medium text-sm">{theme.label}</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {theme.description}
                </span>
              </div>
              {currentTheme === theme.name && (
                <Check className="h-4 w-4 ml-2 mt-0.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
