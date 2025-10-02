'use client'

import { useTheme } from '@/components/ThemeProvider'
import { themes } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ThemeShowcase() {
  const { theme: currentTheme, setTheme } = useTheme()

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Theme Showcase</h1>
        <p className="text-muted-foreground">
          Explore all available themes. Click on a theme card to apply it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(themes).map((theme) => {
          const isActive = currentTheme === theme.name
          
          return (
            <Card
              key={theme.name}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isActive ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setTheme(theme.name)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {theme.label}
                  {isActive && (
                    <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                      Active
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{theme.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div 
                      className="w-12 h-12 rounded border-2"
                      style={{ backgroundColor: theme.cssVars.background }}
                      title="Background"
                    />
                    <div 
                      className="w-12 h-12 rounded border-2"
                      style={{ backgroundColor: theme.cssVars.primary }}
                      title="Primary"
                    />
                    <div 
                      className="w-12 h-12 rounded border-2"
                      style={{ backgroundColor: theme.cssVars.secondary }}
                      title="Secondary"
                    />
                    <div 
                      className="w-12 h-12 rounded border-2"
                      style={{ backgroundColor: theme.cssVars.accent }}
                      title="Accent"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Type:</span>{' '}
                      <span className="capitalize">{theme.type}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Border Radius:</span>{' '}
                      {theme.cssVars.radius}
                    </p>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation()
                      setTheme(theme.name)
                    }}
                  >
                    {isActive ? 'Current Theme' : 'Apply Theme'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Theme Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Light Minimal</CardTitle>
              <CardDescription>Clean and minimalist light theme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Perfect for a professional, distraction-free work environment with soft colors and subtle shadows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Light Brutalist</CardTitle>
              <CardDescription>Bold and high-contrast light theme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Features sharp edges, no border radius, strong shadows, and high contrast for a striking visual impact.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dark Minimal</CardTitle>
              <CardDescription>Elegant and soft dark theme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A sophisticated dark theme with muted colors, perfect for long coding sessions and reduced eye strain.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dark Brutalist</CardTitle>
              <CardDescription>High contrast dark with bold elements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Maximum contrast with white borders on black background, no transitions, and strong geometric shapes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dark Cyberpunk</CardTitle>
              <CardDescription>Neon-infused vibrant dark theme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Inspired by cyberpunk aesthetics with neon glows, vibrant colors, and futuristic vibes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
