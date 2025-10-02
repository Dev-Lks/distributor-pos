export type ThemeName = 'light-minimal' | 'light-brutalist' | 'dark-minimal' | 'dark-brutalist' | 'dark-cyberpunk' | 'lucao'

export interface Theme {
  name: ThemeName
  label: string
  description: string
  type: 'light' | 'dark'
  cssVars: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
    chart1: string
    chart2: string
    chart3: string
    chart4: string
    chart5: string
    sidebar: string
    sidebarForeground: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarAccent: string
    sidebarAccentForeground: string
    sidebarBorder: string
    sidebarRing: string
    radius: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  'light-minimal': {
    name: 'light-minimal',
    label: 'Light Minimal',
    description: 'Clean and minimalist light theme',
    type: 'light',
    cssVars: {
      background: 'oklch(0.99 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(0.98 0 0)',
      cardForeground: 'oklch(0.15 0 0)',
      popover: 'oklch(0.98 0 0)',
      popoverForeground: 'oklch(0.15 0 0)',
      primary: 'oklch(0.25 0 0)',
      primaryForeground: 'oklch(0.99 0 0)',
      secondary: 'oklch(0.96 0 0)',
      secondaryForeground: 'oklch(0.15 0 0)',
      muted: 'oklch(0.95 0 0)',
      mutedForeground: 'oklch(0.45 0 0)',
      accent: 'oklch(0.94 0 0)',
      accentForeground: 'oklch(0.15 0 0)',
      destructive: 'oklch(0.55 0.20 25)',
      destructiveForeground: 'oklch(0.99 0 0)',
      border: 'oklch(0.90 0 0)',
      input: 'oklch(0.90 0 0)',
      ring: 'oklch(0.25 0 0)',
      chart1: 'oklch(0.40 0.15 250)',
      chart2: 'oklch(0.50 0.15 150)',
      chart3: 'oklch(0.60 0.15 50)',
      chart4: 'oklch(0.45 0.15 320)',
      chart5: 'oklch(0.55 0.15 180)',
      sidebar: 'oklch(0.97 0 0)',
      sidebarForeground: 'oklch(0.15 0 0)',
      sidebarPrimary: 'oklch(0.25 0 0)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)',
      sidebarAccent: 'oklch(0.94 0 0)',
      sidebarAccentForeground: 'oklch(0.15 0 0)',
      sidebarBorder: 'oklch(0.90 0 0)',
      sidebarRing: 'oklch(0.25 0 0)',
      radius: '0.5rem',
    }
  },
  
  'light-brutalist': {
    name: 'light-brutalist',
    label: 'Light Brutalist',
    description: 'Bold and high-contrast light theme',
    type: 'light',
    cssVars: {
      background: 'oklch(0.98 0 0)',
      foreground: 'oklch(0.05 0 0)',
      card: 'oklch(1.0 0 0)',
      cardForeground: 'oklch(0.05 0 0)',
      popover: 'oklch(1.0 0 0)',
      popoverForeground: 'oklch(0.05 0 0)',
      primary: 'oklch(0.98 0.25 85)',
      primaryForeground: 'oklch(0.05 0 0)',
      secondary: 'oklch(0.85 0 0)',
      secondaryForeground: 'oklch(0.05 0 0)',
      muted: 'oklch(0.92 0 0)',
      mutedForeground: 'oklch(0.35 0 0)',
      accent: 'oklch(0.75 0.20 275)',
      accentForeground: 'oklch(1.0 0 0)',
      destructive: 'oklch(0.50 0.25 25)',
      destructiveForeground: 'oklch(1.0 0 0)',
      border: 'oklch(0.10 0 0)',
      input: 'oklch(0.10 0 0)',
      ring: 'oklch(0.98 0.25 85)',
      chart1: 'oklch(0.98 0.25 85)',
      chart2: 'oklch(0.75 0.20 275)',
      chart3: 'oklch(0.65 0.22 150)',
      chart4: 'oklch(0.70 0.20 320)',
      chart5: 'oklch(0.80 0.18 45)',
      sidebar: 'oklch(0.10 0 0)',
      sidebarForeground: 'oklch(0.98 0 0)',
      sidebarPrimary: 'oklch(0.98 0.25 85)',
      sidebarPrimaryForeground: 'oklch(0.05 0 0)',
      sidebarAccent: 'oklch(0.20 0 0)',
      sidebarAccentForeground: 'oklch(0.98 0 0)',
      sidebarBorder: 'oklch(0.98 0.25 85)',
      sidebarRing: 'oklch(0.98 0.25 85)',
      radius: '0rem',
    }
  },
  
  'dark-minimal': {
    name: 'dark-minimal',
    label: 'Dark Minimal',
    description: 'Elegant and soft dark theme',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.12 0 0)',
      foreground: 'oklch(0.95 0 0)',
      card: 'oklch(0.15 0 0)',
      cardForeground: 'oklch(0.95 0 0)',
      popover: 'oklch(0.15 0 0)',
      popoverForeground: 'oklch(0.95 0 0)',
      primary: 'oklch(0.85 0 0)',
      primaryForeground: 'oklch(0.12 0 0)',
      secondary: 'oklch(0.20 0 0)',
      secondaryForeground: 'oklch(0.95 0 0)',
      muted: 'oklch(0.18 0 0)',
      mutedForeground: 'oklch(0.60 0 0)',
      accent: 'oklch(0.25 0 0)',
      accentForeground: 'oklch(0.95 0 0)',
      destructive: 'oklch(0.60 0.18 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      border: 'oklch(0.25 0 0)',
      input: 'oklch(0.25 0 0)',
      ring: 'oklch(0.85 0 0)',
      chart1: 'oklch(0.65 0.15 250)',
      chart2: 'oklch(0.70 0.15 150)',
      chart3: 'oklch(0.75 0.15 50)',
      chart4: 'oklch(0.68 0.15 320)',
      chart5: 'oklch(0.72 0.15 180)',
      sidebar: 'oklch(0.10 0 0)',
      sidebarForeground: 'oklch(0.95 0 0)',
      sidebarPrimary: 'oklch(0.85 0 0)',
      sidebarPrimaryForeground: 'oklch(0.12 0 0)',
      sidebarAccent: 'oklch(0.25 0 0)',
      sidebarAccentForeground: 'oklch(0.95 0 0)',
      sidebarBorder: 'oklch(0.25 0 0)',
      sidebarRing: 'oklch(0.85 0 0)',
      radius: '0.5rem',
    }
  },
  
  'dark-brutalist': {
    name: 'dark-brutalist',
    label: 'Dark Brutalist',
    description: 'High contrast dark theme with bold elements',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.08 0 0)',
      foreground: 'oklch(1.0 0 0)',
      card: 'oklch(0.05 0 0)',
      cardForeground: 'oklch(1.0 0 0)',
      popover: 'oklch(0.05 0 0)',
      popoverForeground: 'oklch(1.0 0 0)',
      primary: 'oklch(0.85 0.30 85)',
      primaryForeground: 'oklch(0.05 0 0)',
      secondary: 'oklch(0.95 0 0)',
      secondaryForeground: 'oklch(0.05 0 0)',
      muted: 'oklch(0.15 0 0)',
      mutedForeground: 'oklch(0.70 0 0)',
      accent: 'oklch(0.80 0.25 320)',
      accentForeground: 'oklch(0.05 0 0)',
      destructive: 'oklch(0.65 0.25 25)',
      destructiveForeground: 'oklch(0.05 0 0)',
      border: 'oklch(0.95 0 0)',
      input: 'oklch(0.95 0 0)',
      ring: 'oklch(0.85 0.30 85)',
      chart1: 'oklch(0.85 0.30 85)',
      chart2: 'oklch(0.80 0.25 320)',
      chart3: 'oklch(0.75 0.28 150)',
      chart4: 'oklch(0.82 0.23 200)',
      chart5: 'oklch(0.88 0.20 45)',
      sidebar: 'oklch(0.95 0 0)',
      sidebarForeground: 'oklch(0.05 0 0)',
      sidebarPrimary: 'oklch(0.05 0 0)',
      sidebarPrimaryForeground: 'oklch(0.85 0.30 85)',
      sidebarAccent: 'oklch(0.85 0.30 85)',
      sidebarAccentForeground: 'oklch(0.05 0 0)',
      sidebarBorder: 'oklch(0.05 0 0)',
      sidebarRing: 'oklch(0.85 0.30 85)',
      radius: '0rem',
    }
  },
  
  'dark-cyberpunk': {
    name: 'dark-cyberpunk',
    label: 'Dark Cyberpunk',
    description: 'Neon-infused vibrant dark theme',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.10 0.02 280)',
      foreground: 'oklch(0.92 0.05 280)',
      card: 'oklch(0.14 0.03 280)',
      cardForeground: 'oklch(0.92 0.05 280)',
      popover: 'oklch(0.14 0.03 280)',
      popoverForeground: 'oklch(0.92 0.05 280)',
      primary: 'oklch(0.70 0.25 330)',
      primaryForeground: 'oklch(0.95 0 0)',
      secondary: 'oklch(0.65 0.22 180)',
      secondaryForeground: 'oklch(0.95 0 0)',
      muted: 'oklch(0.22 0.03 280)',
      mutedForeground: 'oklch(0.65 0.05 280)',
      accent: 'oklch(0.75 0.28 150)',
      accentForeground: 'oklch(0.10 0 0)',
      destructive: 'oklch(0.60 0.25 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      border: 'oklch(0.35 0.15 280)',
      input: 'oklch(0.35 0.15 280)',
      ring: 'oklch(0.70 0.25 330)',
      chart1: 'oklch(0.70 0.25 330)',
      chart2: 'oklch(0.75 0.28 150)',
      chart3: 'oklch(0.65 0.22 180)',
      chart4: 'oklch(0.68 0.26 280)',
      chart5: 'oklch(0.72 0.24 45)',
      sidebar: 'oklch(0.08 0.02 280)',
      sidebarForeground: 'oklch(0.92 0.05 280)',
      sidebarPrimary: 'oklch(0.70 0.25 330)',
      sidebarPrimaryForeground: 'oklch(0.95 0 0)',
      sidebarAccent: 'oklch(0.22 0.03 280)',
      sidebarAccentForeground: 'oklch(0.92 0.05 280)',
      sidebarBorder: 'oklch(0.35 0.15 280)',
      sidebarRing: 'oklch(0.70 0.25 330)',
      radius: '0.75rem',
    }
  },
  
  'lucao': {
    name: 'lucao',
    label: 'Lucao',
    description: 'Custom theme with green accents',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.1822 0 0)',
      foreground: 'oklch(0.9288 0.0126 255.5078)',
      card: 'oklch(0.2046 0 0)',
      cardForeground: 'oklch(0.9288 0.0126 255.5078)',
      popover: 'oklch(0.2603 0 0)',
      popoverForeground: 'oklch(0.7348 0 0)',
      primary: 'oklch(0.4365 0.1044 156.7556)',
      primaryForeground: 'oklch(0.9213 0.0135 167.1556)',
      secondary: 'oklch(0.2603 0 0)',
      secondaryForeground: 'oklch(0.9851 0 0)',
      muted: 'oklch(0.2393 0 0)',
      mutedForeground: 'oklch(0.7122 0 0)',
      accent: 'oklch(0.3132 0 0)',
      accentForeground: 'oklch(0.9851 0 0)',
      destructive: 'oklch(0.3123 0.0852 29.7877)',
      destructiveForeground: 'oklch(0.9368 0.0045 34.3092)',
      border: 'oklch(0.2809 0 0)',
      input: 'oklch(0.2603 0 0)',
      ring: 'oklch(0.8003 0.1821 151.7110)',
      chart1: 'oklch(0.8003 0.1821 151.7110)',
      chart2: 'oklch(0.7137 0.1434 254.6240)',
      chart3: 'oklch(0.7090 0.1592 293.5412)',
      chart4: 'oklch(0.8369 0.1644 84.4286)',
      chart5: 'oklch(0.7845 0.1325 181.9120)',
      sidebar: 'oklch(0.1822 0 0)',
      sidebarForeground: 'oklch(0.6301 0 0)',
      sidebarPrimary: 'oklch(0.4365 0.1044 156.7556)',
      sidebarPrimaryForeground: 'oklch(0.9213 0.0135 167.1556)',
      sidebarAccent: 'oklch(0.3132 0 0)',
      sidebarAccentForeground: 'oklch(0.9851 0 0)',
      sidebarBorder: 'oklch(0.2809 0 0)',
      sidebarRing: 'oklch(0.8003 0.1821 151.7110)',
      radius: '0.5rem',
    }
  },
}

export function getTheme(name: ThemeName): Theme {
  return themes[name]
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  // Remove all theme classes
  root.classList.remove('light-minimal', 'light-brutalist', 'dark-minimal', 'dark-brutalist', 'dark-cyberpunk', 'lucao')
  root.classList.remove('light', 'dark')
  
  // Add new theme classes
  root.classList.add(theme.name)
  root.classList.add(theme.type)
  
  // Apply CSS variables
  Object.entries(theme.cssVars).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    root.style.setProperty(cssVarName, value)
  })
  
  // Save to localStorage
  localStorage.setItem('theme', theme.name)
}

export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'dark-minimal'
  
  const stored = localStorage.getItem('theme') as ThemeName
  if (stored && themes[stored]) {
    return stored
  }
  
  return 'dark-minimal'
}
