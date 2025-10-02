'use client'

import { Check, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/ThemeProvider'
import { themes, type ThemeName } from '@/lib/themes'

export function ThemeToggle() {
  const { theme: currentTheme, setTheme } = useTheme()

  const lightThemes = Object.values(themes).filter(t => t.type === 'light')
  const darkThemes = Object.values(themes).filter(t => t.type === 'dark')

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <DropdownMenuLabel>Light Themes</DropdownMenuLabel>
        {lightThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => setTheme(theme.name as ThemeName)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{theme.label}</span>
              <span className="text-xs text-muted-foreground">{theme.description}</span>
            </div>
            {currentTheme === theme.name && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Dark Themes</DropdownMenuLabel>
        {darkThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => setTheme(theme.name as ThemeName)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{theme.label}</span>
              <span className="text-xs text-muted-foreground">{theme.description}</span>
            </div>
            {currentTheme === theme.name && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}