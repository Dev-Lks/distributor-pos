'use client'

import { useTheme } from '@/components/ThemeProvider'
import { themes } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function ThemeShowcase() {
  const { theme: currentTheme, setTheme } = useTheme()

  const lightThemes = Object.values(themes).filter(t => t.type === 'light')
  const darkThemes = Object.values(themes).filter(t => t.type === 'dark')

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">🎨 Theme Gallery</h1>
        <p className="text-muted-foreground text-lg">
          Explore all {Object.keys(themes).length} available themes. Click on any theme card to apply it instantly.
        </p>
      </div>

      {/* Light Themes Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold">☀️ Light Themes</h2>
          <span className="text-sm px-3 py-1 rounded-full bg-muted">
            {lightThemes.length} themes
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lightThemes.map((theme) => {
            const isActive = currentTheme === theme.name
            
            return (
              <Card
                key={theme.name}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  isActive ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setTheme(theme.name)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {theme.label}
                    {isActive && (
                      <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                        ✓
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Color Palette */}
                    <div className="grid grid-cols-4 gap-1">
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.background }}
                        title="Background"
                      />
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.primary }}
                        title="Primary"
                      />
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.secondary }}
                        title="Secondary"
                      />
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.accent }}
                        title="Accent"
                      />
                    </div>
                    
                    {/* Theme Info */}
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="font-semibold">Radius:</span> {theme.cssVars.radius}
                      </p>
                    </div>

                    <Button 
                      size="sm"
                      className="w-full"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation()
                        setTheme(theme.name)
                      }}
                    >
                      {isActive ? '✓ Active' : 'Apply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Dark Themes Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold">🌙 Dark Themes</h2>
          <span className="text-sm px-3 py-1 rounded-full bg-muted">
            {darkThemes.length} themes
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {darkThemes.map((theme) => {
            const isActive = currentTheme === theme.name
            
            return (
              <Card
                key={theme.name}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  isActive ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setTheme(theme.name)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {theme.label}
                    {isActive && (
                      <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                        ✓
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Color Palette */}
                    <div className="grid grid-cols-4 gap-1">
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.background }}
                        title="Background"
                      />
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.primary }}
                        title="Primary"
                      />
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.secondary }}
                        title="Secondary"
                      />
                      <div 
                        className="aspect-square rounded border-2"
                        style={{ backgroundColor: theme.cssVars.accent }}
                        title="Accent"
                      />
                    </div>
                    
                    {/* Theme Info */}
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="font-semibold">Radius:</span> {theme.cssVars.radius}
                      </p>
                    </div>

                    <Button 
                      size="sm"
                      className="w-full"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation()
                        setTheme(theme.name)
                      }}
                    >
                      {isActive ? '✓ Active' : 'Apply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">✨ Theme Highlights</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Light Minimal</CardTitle>
              <CardDescription>Clean and minimalist</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Perfect for professional environments with soft neutral tones and subtle accents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔥 Light Warm</CardTitle>
              <CardDescription>Cozy with orange accents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Brings energy and warmth with beautiful orange tones, perfect for creative work.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🌊 Light Ocean</CardTitle>
              <CardDescription>Fresh blue tones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Calm and productive atmosphere with refreshing blue colors inspired by the ocean.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🌸 Light Rose</CardTitle>
              <CardDescription>Elegant pink and purple</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sophisticated and modern with beautiful pink and purple accent colors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🖤 Dark Minimal</CardTitle>
              <CardDescription>Soft and elegant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The perfect dark theme for long work sessions with reduced eye strain.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💼 Dark Slate</CardTitle>
              <CardDescription>Professional blue-gray</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Corporate-friendly dark theme with sophisticated blue-gray tones.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💜 Dark Purple</CardTitle>
              <CardDescription>Rich violet accents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Creative and vibrant with beautiful purple and violet colors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🌲 Dark Forest</CardTitle>
              <CardDescription>Natural green tones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organic and natural with earthy green colors inspired by the forest.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Dark Amber</CardTitle>
              <CardDescription>Warm gold accents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Warm and inviting dark theme with beautiful amber and gold highlights.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💚 Lucao</CardTitle>
              <CardDescription>Custom green theme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your personal custom theme with unique green accents!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
