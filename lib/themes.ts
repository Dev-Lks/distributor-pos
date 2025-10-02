export type ThemeName = 
  | 'light-minimal' 
  | 'light-warm' 
  | 'light-ocean' 
  | 'light-rose' 
  | 'dark-minimal' 
  | 'dark-slate' 
  | 'dark-purple' 
  | 'dark-forest' 
  | 'lucao' 
  | 'dark-amber'

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
  // ===== LIGHT THEMES =====
  
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
  
  'light-warm': {
    name: 'light-warm',
    label: 'Light Warm',
    description: 'Warm and cozy light theme with orange accents',
    type: 'light',
    cssVars: {
      background: 'oklch(0.98 0.01 80)',
      foreground: 'oklch(0.20 0.02 60)',
      card: 'oklch(0.99 0.01 80)',
      cardForeground: 'oklch(0.20 0.02 60)',
      popover: 'oklch(0.99 0.01 80)',
      popoverForeground: 'oklch(0.20 0.02 60)',
      primary: 'oklch(0.55 0.18 50)',
      primaryForeground: 'oklch(0.99 0 0)',
      secondary: 'oklch(0.94 0.02 70)',
      secondaryForeground: 'oklch(0.25 0.02 60)',
      muted: 'oklch(0.96 0.01 70)',
      mutedForeground: 'oklch(0.50 0.02 60)',
      accent: 'oklch(0.92 0.03 65)',
      accentForeground: 'oklch(0.25 0.02 60)',
      destructive: 'oklch(0.55 0.22 30)',
      destructiveForeground: 'oklch(0.99 0 0)',
      border: 'oklch(0.88 0.02 70)',
      input: 'oklch(0.88 0.02 70)',
      ring: 'oklch(0.55 0.18 50)',
      chart1: 'oklch(0.60 0.18 50)',
      chart2: 'oklch(0.55 0.16 30)',
      chart3: 'oklch(0.65 0.14 70)',
      chart4: 'oklch(0.50 0.15 20)',
      chart5: 'oklch(0.58 0.17 85)',
      sidebar: 'oklch(0.97 0.01 75)',
      sidebarForeground: 'oklch(0.25 0.02 60)',
      sidebarPrimary: 'oklch(0.55 0.18 50)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)',
      sidebarAccent: 'oklch(0.92 0.03 65)',
      sidebarAccentForeground: 'oklch(0.25 0.02 60)',
      sidebarBorder: 'oklch(0.88 0.02 70)',
      sidebarRing: 'oklch(0.55 0.18 50)',
      radius: '0.75rem',
    }
  },
  
  'light-ocean': {
    name: 'light-ocean',
    label: 'Light Ocean',
    description: 'Fresh and calm light theme with blue tones',
    type: 'light',
    cssVars: {
      background: 'oklch(0.98 0.01 220)',
      foreground: 'oklch(0.18 0.03 230)',
      card: 'oklch(0.99 0.01 220)',
      cardForeground: 'oklch(0.18 0.03 230)',
      popover: 'oklch(0.99 0.01 220)',
      popoverForeground: 'oklch(0.18 0.03 230)',
      primary: 'oklch(0.50 0.14 235)',
      primaryForeground: 'oklch(0.99 0 0)',
      secondary: 'oklch(0.94 0.02 220)',
      secondaryForeground: 'oklch(0.20 0.03 230)',
      muted: 'oklch(0.95 0.01 220)',
      mutedForeground: 'oklch(0.48 0.03 230)',
      accent: 'oklch(0.90 0.04 210)',
      accentForeground: 'oklch(0.20 0.03 230)',
      destructive: 'oklch(0.55 0.20 25)',
      destructiveForeground: 'oklch(0.99 0 0)',
      border: 'oklch(0.87 0.02 220)',
      input: 'oklch(0.87 0.02 220)',
      ring: 'oklch(0.50 0.14 235)',
      chart1: 'oklch(0.55 0.14 235)',
      chart2: 'oklch(0.60 0.13 200)',
      chart3: 'oklch(0.50 0.15 260)',
      chart4: 'oklch(0.58 0.12 190)',
      chart5: 'oklch(0.52 0.16 250)',
      sidebar: 'oklch(0.96 0.01 220)',
      sidebarForeground: 'oklch(0.20 0.03 230)',
      sidebarPrimary: 'oklch(0.50 0.14 235)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)',
      sidebarAccent: 'oklch(0.90 0.04 210)',
      sidebarAccentForeground: 'oklch(0.20 0.03 230)',
      sidebarBorder: 'oklch(0.87 0.02 220)',
      sidebarRing: 'oklch(0.50 0.14 235)',
      radius: '0.6rem',
    }
  },
  
  'light-rose': {
    name: 'light-rose',
    label: 'Light Rose',
    description: 'Elegant light theme with pink and purple accents',
    type: 'light',
    cssVars: {
      background: 'oklch(0.98 0.01 340)',
      foreground: 'oklch(0.22 0.02 330)',
      card: 'oklch(0.99 0.01 340)',
      cardForeground: 'oklch(0.22 0.02 330)',
      popover: 'oklch(0.99 0.01 340)',
      popoverForeground: 'oklch(0.22 0.02 330)',
      primary: 'oklch(0.55 0.16 330)',
      primaryForeground: 'oklch(0.99 0 0)',
      secondary: 'oklch(0.93 0.03 340)',
      secondaryForeground: 'oklch(0.25 0.02 330)',
      muted: 'oklch(0.95 0.02 340)',
      mutedForeground: 'oklch(0.50 0.02 330)',
      accent: 'oklch(0.88 0.05 320)',
      accentForeground: 'oklch(0.25 0.02 330)',
      destructive: 'oklch(0.55 0.20 25)',
      destructiveForeground: 'oklch(0.99 0 0)',
      border: 'oklch(0.86 0.03 340)',
      input: 'oklch(0.86 0.03 340)',
      ring: 'oklch(0.55 0.16 330)',
      chart1: 'oklch(0.60 0.16 330)',
      chart2: 'oklch(0.58 0.14 350)',
      chart3: 'oklch(0.56 0.15 310)',
      chart4: 'oklch(0.62 0.13 280)',
      chart5: 'oklch(0.54 0.17 340)',
      sidebar: 'oklch(0.96 0.02 340)',
      sidebarForeground: 'oklch(0.25 0.02 330)',
      sidebarPrimary: 'oklch(0.55 0.16 330)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)',
      sidebarAccent: 'oklch(0.88 0.05 320)',
      sidebarAccentForeground: 'oklch(0.25 0.02 330)',
      sidebarBorder: 'oklch(0.86 0.03 340)',
      sidebarRing: 'oklch(0.55 0.16 330)',
      radius: '0.8rem',
    }
  },
  
  // ===== DARK THEMES =====
  
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
  
  'dark-slate': {
    name: 'dark-slate',
    label: 'Dark Slate',
    description: 'Professional dark theme with blue-gray tones',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.14 0.01 240)',
      foreground: 'oklch(0.93 0.02 240)',
      card: 'oklch(0.17 0.01 240)',
      cardForeground: 'oklch(0.93 0.02 240)',
      popover: 'oklch(0.17 0.01 240)',
      popoverForeground: 'oklch(0.93 0.02 240)',
      primary: 'oklch(0.65 0.13 240)',
      primaryForeground: 'oklch(0.98 0 0)',
      secondary: 'oklch(0.22 0.01 240)',
      secondaryForeground: 'oklch(0.93 0.02 240)',
      muted: 'oklch(0.20 0.01 240)',
      mutedForeground: 'oklch(0.62 0.02 240)',
      accent: 'oklch(0.28 0.02 240)',
      accentForeground: 'oklch(0.93 0.02 240)',
      destructive: 'oklch(0.60 0.18 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      border: 'oklch(0.28 0.02 240)',
      input: 'oklch(0.28 0.02 240)',
      ring: 'oklch(0.65 0.13 240)',
      chart1: 'oklch(0.70 0.13 240)',
      chart2: 'oklch(0.68 0.12 210)',
      chart3: 'oklch(0.65 0.14 260)',
      chart4: 'oklch(0.72 0.11 200)',
      chart5: 'oklch(0.66 0.15 250)',
      sidebar: 'oklch(0.12 0.01 240)',
      sidebarForeground: 'oklch(0.93 0.02 240)',
      sidebarPrimary: 'oklch(0.65 0.13 240)',
      sidebarPrimaryForeground: 'oklch(0.98 0 0)',
      sidebarAccent: 'oklch(0.28 0.02 240)',
      sidebarAccentForeground: 'oklch(0.93 0.02 240)',
      sidebarBorder: 'oklch(0.28 0.02 240)',
      sidebarRing: 'oklch(0.65 0.13 240)',
      radius: '0.4rem',
    }
  },
  
  'dark-purple': {
    name: 'dark-purple',
    label: 'Dark Purple',
    description: 'Rich dark theme with purple and violet accents',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.13 0.02 290)',
      foreground: 'oklch(0.94 0.02 290)',
      card: 'oklch(0.16 0.02 290)',
      cardForeground: 'oklch(0.94 0.02 290)',
      popover: 'oklch(0.16 0.02 290)',
      popoverForeground: 'oklch(0.94 0.02 290)',
      primary: 'oklch(0.68 0.18 290)',
      primaryForeground: 'oklch(0.98 0 0)',
      secondary: 'oklch(0.23 0.02 290)',
      secondaryForeground: 'oklch(0.94 0.02 290)',
      muted: 'oklch(0.21 0.02 290)',
      mutedForeground: 'oklch(0.64 0.02 290)',
      accent: 'oklch(0.30 0.04 280)',
      accentForeground: 'oklch(0.94 0.02 290)',
      destructive: 'oklch(0.60 0.18 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      border: 'oklch(0.30 0.04 290)',
      input: 'oklch(0.30 0.04 290)',
      ring: 'oklch(0.68 0.18 290)',
      chart1: 'oklch(0.72 0.18 290)',
      chart2: 'oklch(0.70 0.16 270)',
      chart3: 'oklch(0.68 0.17 310)',
      chart4: 'oklch(0.74 0.15 260)',
      chart5: 'oklch(0.66 0.19 300)',
      sidebar: 'oklch(0.11 0.02 290)',
      sidebarForeground: 'oklch(0.94 0.02 290)',
      sidebarPrimary: 'oklch(0.68 0.18 290)',
      sidebarPrimaryForeground: 'oklch(0.98 0 0)',
      sidebarAccent: 'oklch(0.30 0.04 280)',
      sidebarAccentForeground: 'oklch(0.94 0.02 290)',
      sidebarBorder: 'oklch(0.30 0.04 290)',
      sidebarRing: 'oklch(0.68 0.18 290)',
      radius: '0.7rem',
    }
  },
  
  'dark-forest': {
    name: 'dark-forest',
    label: 'Dark Forest',
    description: 'Natural dark theme with green and earthy tones',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.14 0.02 150)',
      foreground: 'oklch(0.92 0.02 140)',
      card: 'oklch(0.17 0.02 150)',
      cardForeground: 'oklch(0.92 0.02 140)',
      popover: 'oklch(0.17 0.02 150)',
      popoverForeground: 'oklch(0.92 0.02 140)',
      primary: 'oklch(0.62 0.14 155)',
      primaryForeground: 'oklch(0.98 0 0)',
      secondary: 'oklch(0.24 0.02 150)',
      secondaryForeground: 'oklch(0.92 0.02 140)',
      muted: 'oklch(0.22 0.02 150)',
      mutedForeground: 'oklch(0.63 0.02 140)',
      accent: 'oklch(0.32 0.04 140)',
      accentForeground: 'oklch(0.92 0.02 140)',
      destructive: 'oklch(0.60 0.18 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      border: 'oklch(0.30 0.03 150)',
      input: 'oklch(0.30 0.03 150)',
      ring: 'oklch(0.62 0.14 155)',
      chart1: 'oklch(0.68 0.14 155)',
      chart2: 'oklch(0.65 0.13 130)',
      chart3: 'oklch(0.70 0.12 170)',
      chart4: 'oklch(0.63 0.15 140)',
      chart5: 'oklch(0.72 0.11 180)',
      sidebar: 'oklch(0.12 0.02 150)',
      sidebarForeground: 'oklch(0.92 0.02 140)',
      sidebarPrimary: 'oklch(0.62 0.14 155)',
      sidebarPrimaryForeground: 'oklch(0.98 0 0)',
      sidebarAccent: 'oklch(0.32 0.04 140)',
      sidebarAccentForeground: 'oklch(0.92 0.02 140)',
      sidebarBorder: 'oklch(0.30 0.03 150)',
      sidebarRing: 'oklch(0.62 0.14 155)',
      radius: '0.6rem',
    }
  },
  
  'dark-amber': {
    name: 'dark-amber',
    label: 'Dark Amber',
    description: 'Warm dark theme with amber and gold accents',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.15 0.02 60)',
      foreground: 'oklch(0.93 0.02 70)',
      card: 'oklch(0.18 0.02 60)',
      cardForeground: 'oklch(0.93 0.02 70)',
      popover: 'oklch(0.18 0.02 60)',
      popoverForeground: 'oklch(0.93 0.02 70)',
      primary: 'oklch(0.70 0.16 70)',
      primaryForeground: 'oklch(0.15 0.02 60)',
      secondary: 'oklch(0.25 0.02 60)',
      secondaryForeground: 'oklch(0.93 0.02 70)',
      muted: 'oklch(0.23 0.02 60)',
      mutedForeground: 'oklch(0.65 0.02 70)',
      accent: 'oklch(0.32 0.04 55)',
      accentForeground: 'oklch(0.93 0.02 70)',
      destructive: 'oklch(0.60 0.18 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      border: 'oklch(0.32 0.03 60)',
      input: 'oklch(0.32 0.03 60)',
      ring: 'oklch(0.70 0.16 70)',
      chart1: 'oklch(0.75 0.16 70)',
      chart2: 'oklch(0.72 0.15 50)',
      chart3: 'oklch(0.70 0.14 85)',
      chart4: 'oklch(0.68 0.17 40)',
      chart5: 'oklch(0.73 0.13 90)',
      sidebar: 'oklch(0.13 0.02 60)',
      sidebarForeground: 'oklch(0.93 0.02 70)',
      sidebarPrimary: 'oklch(0.70 0.16 70)',
      sidebarPrimaryForeground: 'oklch(0.15 0.02 60)',
      sidebarAccent: 'oklch(0.32 0.04 55)',
      sidebarAccentForeground: 'oklch(0.93 0.02 70)',
      sidebarBorder: 'oklch(0.32 0.03 60)',
      sidebarRing: 'oklch(0.70 0.16 70)',
      radius: '0.65rem',
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
  root.classList.remove(
    'light-minimal', 'light-warm', 'light-ocean', 'light-rose',
    'dark-minimal', 'dark-slate', 'dark-purple', 'dark-forest', 'dark-amber', 'lucao'
  )
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
