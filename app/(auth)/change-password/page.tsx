'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('📝 Form submitted', {
      newPasswordLength: newPassword.length,
      confirmPasswordLength: confirmPassword.length,
      match: newPassword === confirmPassword
    })

    if (newPassword !== confirmPassword) {
      toast.error('Senhas não coincidem')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres')
      return
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    
    console.log('🔐 Password strength validation', {
      hasUpperCase,
      hasLowerCase,
      hasNumber
    })
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error('Senha deve conter letras maiúsculas, minúsculas e números')
      return
    }

    setLoading(true)

    const url = `/api/users/${session?.user?.id}/change-password`
    console.log('🌐 Making API request', {
      url,
      userId: session?.user?.id,
      hasSession: !!session
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      console.log('📡 API response', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      })

      // Log do corpo da resposta como texto primeiro
      const responseText = await response.text()
      console.log('📄 Response body (text):', responseText)

      if (response.ok) {
        let data
        try {
          // Tentar parsear o texto como JSON
          data = responseText ? JSON.parse(responseText) : { success: true }
          console.log('✅ Password changed successfully', data)
        } catch (parseError) {
          console.warn('⚠️ Could not parse JSON response, but status is OK', parseError)
          data = { success: true }
        }
        
        toast.success('Senha alterada! Redirecionando para login...')
        
        // Fazer logout para forçar novo login com token atualizado
        setTimeout(async () => {
          console.log('🚪 Signing out...')
          await signOut({ redirect: false })
          router.push('/login?callbackUrl=/dashboard&passwordChanged=true')
        }, 1500)
      } else {
        let data
        try {
          data = responseText ? JSON.parse(responseText) : { error: 'Erro desconhecido' }
        } catch (parseError) {
          console.error('❌ Could not parse error response', parseError)
          data = { error: responseText || 'Erro ao alterar senha' }
        }
        console.error('❌ API error', {
          status: response.status,
          error: data
        })
        toast.error(data.error || 'Erro ao alterar senha')
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Request failed', error)
      toast.error('Erro ao alterar senha')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-2xl border border-border">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-500/10 rounded-full">
              <ShieldAlert className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Mudança de Senha Obrigatória
          </h2>
          <p className="text-sm text-muted-foreground">
            Por segurança, você deve alterar a senha padrão antes de continuar.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mt-4">
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              ⚠️ Esta é uma medida de segurança obrigatória para contas administrativas.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Deve conter: 8+ caracteres, letras maiúsculas, minúsculas e números
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirmar Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Digite a senha novamente"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? 'Alterando...' : 'Alterar Senha e Continuar'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Precisa de ajuda? Entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  )
}
