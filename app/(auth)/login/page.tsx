"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { AlertCircle, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const defaultError = searchParams.get("error")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Usar o sistema de redirecionamento nativo do NextAuth
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: true, // Deixar NextAuth gerenciar o redirecionamento
        callbackUrl,
      })

      // Se chegou aqui e result existe, houve erro
      if (result?.error) {
        setErrorMessage(result.error || "Credenciais inválidas. Verifique e tente novamente.")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      setErrorMessage("Erro ao processar login. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  const resolvedError = errorMessage ?? (defaultError ? "Sessão expirada. Faça login novamente." : null)
  
  if (!mounted) {
    return null // Evitar hydration mismatch
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Floating elements for visual interest */}
      <div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-amber-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full bg-amber-500/5 blur-3xl animation-delay-2000" />
      
      <Card className="relative w-full max-w-md border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-4xl shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/20">
            🍺
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
              NitroBeer POS
            </CardTitle>
            <CardDescription className="text-base text-slate-400">
              Sistema de Gestão Inteligente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                E-mail Corporativo
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 pl-11 pr-4 border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                Senha
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 pl-11 pr-12 border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={isSubmitting}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {resolvedError && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-in slide-in-from-top-2 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{resolvedError}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="h-12 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Autenticando...
                </span>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Suporte</span>
              </div>
            </div>
            
            <p className="text-center text-sm text-slate-400">
              Problemas de acesso?{" "}
              <span className="text-amber-500 font-medium">Contate o administrador</span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-slate-600">
        <p>© 2025 NitroBeer POS • Sistema Seguro de Gestão</p>
      </div>
    </div>
  )
}
