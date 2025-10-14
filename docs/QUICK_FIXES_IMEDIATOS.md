# 🚀 Quick Fixes - Implementação Imediata

**Data:** 14/10/2025  
**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 2-3 horas

> Estas correções podem ser aplicadas HOJE sem grandes refatorações

---

## 🔥 Fix 1: Melhorar Logger Existente (30 min)

### Problema
Logger existe mas não é usado consistentemente. Muitos console.log espalhados.

### Solução
Melhorar `lib/logger.ts` e criar script para substituir console.log

### Implementação

**Passo 1: Atualizar logger**
```bash
# Editar lib/logger.ts
```

Adicionar:
```typescript
// lib/logger.ts - ADICIONAR ao final

/**
 * Sanitizar dados sensíveis antes de logar
 */
private sanitize(context?: LogContext): LogContext {
  if (!context) return {}
  
  const sanitized = { ...context }
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'passwordHash']
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]'
    }
  })
  
  return sanitized
}

/**
 * Em produção, apenas erros e warnings no console
 */
error(message: string, context?: LogContext) {
  const sanitized = this.sanitize(context)
  console.error('❌', message, sanitized)
}

warn(message: string, context?: LogContext) {
  const sanitized = this.sanitize(context)
  console.warn('⚠️', message, sanitized)
}

info(message: string, context?: LogContext) {
  const sanitized = this.sanitize(context)
  if (!this.isProd) {
    console.info('ℹ️', message, sanitized)
  }
}

debug(message: string, context?: LogContext) {
  if (this.isDevelopment) {
    console.log('🔍', message, context || '')
  }
}

private get isProd() {
  return process.env.NODE_ENV === 'production'
}
```

**Passo 2: Substituir console.error em rotas de API**

Arquivos prioritários:
- `app/api/sales/route.ts`
- `app/api/inventory/route.ts`
- `app/api/products/route.ts`
- `app/api/users/route.ts`

Buscar por:
```typescript
console.error('Failed to fetch...', error)
```

Substituir por:
```typescript
logger.error('Failed to fetch...', { error })
```

---

## 🔥 Fix 2: Adicionar Validação de Ranges (45 min)

### Problema
Rotas de inventário aceitam quantidades sem limite superior.

### Solução
Adicionar validação de ranges seguros.

### Implementação

**Passo 1: Criar constantes de limites**
```typescript
// lib/constants/limits.ts - CRIAR NOVO ARQUIVO
export const LIMITS = {
  // Quantidades
  MAX_QUANTITY: 999999,
  MAX_PRICE: 9999999.99,
  MAX_DISCOUNT_PERCENTAGE: 100,
  MAX_DISCOUNT_VALUE: 999999.99,
  
  // Strings
  MAX_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_NOTES_LENGTH: 1000,
  
  // Arrays
  MAX_ITEMS_PER_SALE: 1000,
  MAX_BULK_UPDATE: 100,
  
  // Monetário
  MAX_CREDIT_LIMIT: 1000000,
  MAX_CASH_SESSION_AMOUNT: 100000,
} as const
```

**Passo 2: Validar em rotas de inventário**
```typescript
// app/api/inventory/route.ts - MODIFICAR

import { LIMITS } from '@/lib/constants/limits'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, location, quantity } = body

    // ✅ ADICIONAR VALIDAÇÃO
    if (!productId || typeof quantity !== 'number' || !location) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // ✅ VALIDAR RANGE
    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantidade não pode ser negativa' },
        { status: 400 }
      )
    }

    if (quantity > LIMITS.MAX_QUANTITY) {
      return NextResponse.json(
        { error: `Quantidade excede limite máximo (${LIMITS.MAX_QUANTITY})` },
        { status: 400 }
      )
    }

    if (!['coldRoom', 'house', 'salePoint'].includes(location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    // Resto do código...
  }
}
```

**Passo 3: Aplicar em outras rotas**

Adicionar validações similares em:
- `app/api/inventory/bulk/route.ts`
- `app/api/inventory/transfer/route.ts`
- `app/api/sales/route.ts` (validar discounts, taxes)
- `app/api/cash-sessions/route.ts` (validar amounts)

---

## 🔥 Fix 3: Forçar Mudança de Senha Admin (45 min)

### Problema
Seed cria admin com senha "admin123" que pode nunca ser trocada.

### Solução
Forçar mudança no primeiro login se senha não foi alterada.

### Implementação

**Passo 1: Adicionar flag no token**
```typescript
// lib/auth.ts - MODIFICAR callback jwt

async jwt({ token, user }) {
  if (user) {
    const typedUser = user as AdapterUser & {
      isAdmin?: boolean
      passwordChangedAt?: Date
      createdAt?: Date
    }
    
    token.id = user.id
    token.isAdmin = typedUser.isAdmin || false
    
    // ✅ ADICIONAR
    token.requiresPasswordChange = false
    
    // Verificar se admin nunca mudou senha
    if (typedUser.isAdmin && !typedUser.passwordChangedAt) {
      token.requiresPasswordChange = true
    }
  }
  return token
}
```

**Passo 2: Criar página de mudança de senha**
```typescript
// app/(auth)/change-password/page.tsx - CRIAR NOVO ARQUIVO

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Senhas não coincidem')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/users/${session?.user?.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      if (response.ok) {
        toast.success('Senha alterada com sucesso!')
        router.push('/dashboard')
      } else {
        toast.error('Erro ao alterar senha')
      }
    } catch (error) {
      toast.error('Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-center">
            Mudança de Senha Obrigatória
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Por segurança, você deve alterar a senha padrão antes de continuar.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 8 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

**Passo 3: Redirecionar no middleware**
```typescript
// middleware.ts - ADICIONAR antes do checkRoutePermission

// ✅ ADICIONAR
if (token.requiresPasswordChange && path !== '/change-password') {
  return NextResponse.redirect(new URL('/change-password', req.url))
}
```

---

## 🔥 Fix 4: Prevenir SQL Injection em Buscas (20 min)

### Problema
Algumas rotas fazem buscas sem sanitização adequada.

### Solução
Prisma já previne SQL injection, mas adicionar validação de caracteres especiais.

### Implementação

**Criar helper de sanitização**
```typescript
// lib/utils/sanitize.ts - CRIAR NOVO ARQUIVO

/**
 * Remove caracteres perigosos de strings de busca
 */
export function sanitizeSearchTerm(term: string): string {
  if (!term) return ''
  
  return term
    .trim()
    .replace(/[<>]/g, '') // Remove < >
    .substring(0, 200) // Limita tamanho
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .substring(0, 255)
}

/**
 * Remove caracteres não numéricos
 */
export function sanitizeNumericString(str: string): string {
  return str.replace(/\D/g, '')
}
```

**Aplicar em rotas de busca**
```typescript
// app/api/products/route.ts - MODIFICAR

import { sanitizeSearchTerm } from '@/lib/utils/sanitize'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  // ✅ SANITIZAR
  const sanitizedSearch = search ? sanitizeSearchTerm(search) : null

  const where: any = {}
  
  if (sanitizedSearch) {
    where.OR = [
      { name: { contains: sanitizedSearch, mode: 'insensitive' } },
      { sku: { contains: sanitizedSearch, mode: 'insensitive' } },
    ]
  }
  
  // Resto do código...
}
```

Aplicar em:
- `app/api/products/route.ts`
- `app/api/customers/route.ts`
- `app/api/users/route.ts`

---

## 🔥 Fix 5: Headers de Segurança Adicionais (15 min)

### Problema
Alguns headers de segurança faltando.

### Solução
Adicionar headers CSP e HSTS.

### Implementação

```javascript
// next.config.js - MODIFICAR headers()

async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        // ✅ Existentes
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        
        // ✅ ADICIONAR
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js precisa de unsafe-eval
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
          ].join('; ')
        },
      ],
    },
  ]
}
```

---

## 🔥 Fix 6: Remover Token Hardcoded (5 min)

### Problema
Token de fallback em teste pode ser commitado.

### Solução
Remover fallback e forçar variável de ambiente.

### Implementação

```javascript
// print-server/test.js - MODIFICAR

// ❌ ANTES
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'meu-token-super-secreto-123456'

// ✅ DEPOIS
const AUTH_TOKEN = process.env.AUTH_TOKEN

if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN não configurado')
  console.log('Configure a variável de ambiente AUTH_TOKEN antes de executar os testes')
  process.exit(1)
}
```

---

## 📋 Checklist de Implementação

### Logger
- [ ] Atualizar `lib/logger.ts` com sanitização
- [ ] Substituir `console.error` em `app/api/sales/route.ts`
- [ ] Substituir `console.error` em `app/api/inventory/route.ts`
- [ ] Substituir `console.error` em `app/api/products/route.ts`
- [ ] Substituir `console.error` em `app/api/users/route.ts`

### Validações
- [ ] Criar `lib/constants/limits.ts`
- [ ] Adicionar validações em `app/api/inventory/route.ts`
- [ ] Adicionar validações em `app/api/inventory/bulk/route.ts`
- [ ] Adicionar validações em `app/api/sales/route.ts`
- [ ] Adicionar validações em `app/api/cash-sessions/route.ts`

### Senha Admin
- [ ] Modificar `lib/auth.ts` (callback jwt)
- [ ] Criar `app/(auth)/change-password/page.tsx`
- [ ] Modificar `middleware.ts` (redirecionamento)
- [ ] Testar fluxo completo

### Sanitização
- [ ] Criar `lib/utils/sanitize.ts`
- [ ] Aplicar em `app/api/products/route.ts`
- [ ] Aplicar em `app/api/customers/route.ts`
- [ ] Aplicar em `app/api/users/route.ts`

### Headers
- [ ] Modificar `next.config.js`
- [ ] Testar com https://securityheaders.com

### Tokens
- [ ] Modificar `print-server/test.js`
- [ ] Verificar que não há outros hardcoded tokens

---

## 🧪 Como Testar

### Teste 1: Logger
```bash
# Em desenvolvimento, deve mostrar logs
NODE_ENV=development pnpm dev

# Em produção, deve sanitizar
NODE_ENV=production pnpm build && pnpm start
```

### Teste 2: Validações
```bash
# Testar com curl
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","location":"coldRoom","quantity":9999999999}'

# Deve retornar erro 400
```

### Teste 3: Senha Admin
```bash
# Fazer login com admin
# Deve redirecionar para /change-password
# Só permitir acesso ao dashboard após troca
```

### Teste 4: Sanitização
```bash
# Testar busca com caracteres especiais
curl "http://localhost:3000/api/products?search=<script>alert(1)</script>"

# Deve retornar resultados normais sem executar script
```

### Teste 5: Headers
```bash
# Verificar headers
curl -I https://seudominio.com

# Ou usar
https://securityheaders.com
```

---

## 🎯 Resultado Esperado

Após implementar estes fixes:

### Antes
```
❌ Console.logs expondo dados
❌ Quantidades sem limite
❌ Senha admin nunca muda
❌ Buscas sem sanitização
❌ Headers incompletos
❌ Tokens hardcoded
```

### Depois
```
✅ Logger sanitizado e consistente
✅ Validações de range em todas rotas críticas
✅ Senha admin obrigatoriamente trocada
✅ Buscas sanitizadas
✅ Headers de segurança completos
✅ Tokens apenas em variáveis de ambiente
```

---

## ⏱️ Cronograma Sugerido

**Total: 3 horas**

```
09:00 - 09:30  → Fix 1: Logger (30 min)
09:30 - 10:15  → Fix 2: Validações (45 min)
10:15 - 10:30  → ☕ Pausa
10:30 - 11:15  → Fix 3: Senha Admin (45 min)
11:15 - 11:35  → Fix 4: Sanitização (20 min)
11:35 - 11:50  → Fix 5: Headers (15 min)
11:50 - 11:55  → Fix 6: Tokens (5 min)
11:55 - 12:00  → Testes finais
```

---

## 🚀 Deploy

Após implementar e testar localmente:

```bash
# Rodar testes
pnpm test

# Build
pnpm build

# Verificar que não há erros
pnpm lint

# Commit
git add .
git commit -m "security: implement quick security fixes

- Add sanitization to logger
- Add range validations to critical routes
- Force admin password change on first login
- Sanitize search inputs
- Add security headers (CSP, HSTS)
- Remove hardcoded tokens"

# Push
git push origin main
```

---

## ✅ Validação

Após deploy, validar:
- [ ] Nenhum erro no console em produção
- [ ] Tentativas de quantidade absurda são bloqueadas
- [ ] Admin é forçado a trocar senha
- [ ] Buscas com caracteres especiais funcionam normalmente
- [ ] Headers de segurança aparecem em securityheaders.com
- [ ] Testes de penetração básicos passam

---

**Bom trabalho! Estas correções já elevam significativamente a segurança do sistema. 🔒**
