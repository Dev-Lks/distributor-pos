# 🚀 Quick Start - Começar Melhorias AGORA

> Guia rápido para começar as melhorias mais impactantes imediatamente

## ⚡ Rápido e Fácil (30 minutos)

### 1️⃣ Remover Dependências Não Usadas

```bash
# Abrir package.json e remover:
pnpm remove react-grid-layout react-window react-window-infinite-loader \
  react-resizable-panels cmdk input-otp iconv-lite \
  @react-spring/web @use-gesture/react @types/react-window

# Limpar e reinstalar
pnpm install
pnpm build # Testar se funciona
```

**Resultado**: ~15-20MB economizados ✅

---

### 2️⃣ Criar Sistema de Logger (15 minutos)

Copie e cole este arquivo:

**`lib/logger.ts`:**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDev) console.log('🔍', message, context || '')
  }

  info(message: string, context?: Record<string, unknown>) {
    console.info('ℹ️', message, context || '')
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn('⚠️', message, context || '')
  }

  error(message: string, context?: Record<string, unknown>) {
    console.error('❌', message, context || '')
  }
}

export const logger = new Logger()
```

**Resultado**: Logger profissional criado ✅

---

### 3️⃣ Substituir Console.log Principais (15 minutos)

**`middleware.ts`** - Linha 38:
```typescript
// ❌ ANTES
console.log("🔍 DEBUG Middleware:", { ... })

// ✅ DEPOIS
import { logger } from '@/lib/logger'
logger.debug("Middleware permission check", { ... })
```

**`lib/googleSheets.ts`** - Linha 64:
```typescript
// ❌ ANTES
console.log(`✅ Venda salva no Google Sheets...`)

// ✅ DEPOIS
import { logger } from '@/lib/logger'
logger.info(`Venda salva no Google Sheets`, { saleId: result.saleId })
```

**`components/SidebarLayout.tsx`** - Linha 203:
```typescript
// ❌ ANTES
console.log("🔍 SidebarLayout Debug:", { ... })

// ✅ DEPOIS
import { logger } from '@/lib/logger'
logger.debug("SidebarLayout render", { ... })
```

**Resultado**: Console.log limpo em produção ✅

---

## 🎯 Médio Impacto (1-2 horas)

### 4️⃣ Criar Tipos para Erros

**`lib/errors.ts`:**
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404)
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code }
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR' }
  }
  return { message: 'Erro desconhecido', code: 'UNKNOWN_ERROR' }
}
```

---

### 5️⃣ Substituir `catch (error: any)` 

**Exemplo em `app/(app)/dashboard/sales/hooks/useCheckout.ts`:**

```typescript
// ❌ ANTES
} catch (error: any) {
  toast.error(error.message || "Erro ao processar")
}

// ✅ DEPOIS
import { handleError } from '@/lib/errors'
import { logger } from '@/lib/logger'

} catch (error) {
  const { message } = handleError(error)
  logger.error("Erro no checkout", { error })
  toast.error(message)
}
```

Repita para todos os arquivos com `catch (error: any)`.

---

### 6️⃣ Criar Tipos Básicos

**`types/api.ts`:**
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  permissions: Permission[]
}

export interface Permission {
  id: string
  permission: string
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}
```

**Uso:**
```typescript
// ❌ ANTES
const [userData, setUserData] = useState<any>(null)

// ✅ DEPOIS
import { User } from '@/types/api'
const [userData, setUserData] = useState<User | null>(null)
```

---

## 🏆 Alto Impacto (3-4 horas)

### 7️⃣ Refatorar Middleware

**`lib/middleware/permissions.ts`:**
```typescript
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/admin': ['ADMIN'],
  '/dashboard/sales': ['CREATE_SALES', 'VIEW_OWN_SALES', 'VIEW_ALL_SALES'],
  '/dashboard/products': ['VIEW_PRODUCTS'],
  '/dashboard/inventory': ['VIEW_INVENTORY'],
  '/dashboard/inventory/edit': ['MANAGE_INVENTORY'],
}

export function hasPermission(
  path: string,
  isAdmin: boolean,
  permissions: string[]
): boolean {
  if (isAdmin) return true
  
  // Busca a rota mais específica que coincide
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
    .filter(route => path.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]
  
  if (!matchedRoute) return true
  
  const required = ROUTE_PERMISSIONS[matchedRoute]
  return required.some(p => permissions.includes(p))
}
```

**`middleware.ts`** (simplificado):
```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { hasPermission } from "@/lib/middleware/permissions"
import { logger } from "@/lib/logger"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rotas públicas
    if (path.startsWith("/login") || path.startsWith("/api/auth")) {
      return NextResponse.next()
    }

    // Não autenticado
    if (!token) {
      logger.debug("Unauthenticated access attempt", { path })
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", path)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar permissões
    const isAdmin = token.isAdmin as boolean
    const permissions = (token.permissions as string[]) || []
    
    if (!hasPermission(path, isAdmin, permissions)) {
      logger.warn("Unauthorized access attempt", { 
        path, 
        email: token.email,
        permissions 
      })
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/sales/:path*",
    "/products/:path*",
    "/inventory/:path*",
    "/pdv/:path*",
  ],
}
```

**Resultado**: Middleware de 180 linhas → ~60 linhas ✅

---

## 📦 Comandos Úteis

```bash
# Verificar uso de dependência
grep -r "nome-da-lib" --include="*.ts" --include="*.tsx" .

# Encontrar todos os console.log
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ components/ lib/

# Encontrar todos os 'any'
grep -r ": any" --include="*.ts" --include="*.tsx" app/ components/ lib/

# Rodar build e verificar
pnpm build

# Verificar tamanho do bundle
pnpm build && du -sh .next/static

# Rodar linter
pnpm lint

# Fix automático
pnpm lint --fix
```

---

## ✅ Checklist Rápida

- [ ] Dependências removidas
- [ ] Logger criado
- [ ] Console.log principais substituídos
- [ ] Tipos de erro criados
- [ ] Catch blocks melhorados
- [ ] Tipos básicos criados
- [ ] Middleware refatorado
- [ ] Build testado e funcionando

---

## 🎯 Ordem Recomendada

1. **15min**: Criar logger
2. **15min**: Substituir 5 console.log principais
3. **30min**: Remover dependências + testar build
4. **1h**: Criar tipos de erro + melhorar catches
5. **1h**: Criar tipos básicos + substituir 10 any
6. **2h**: Refatorar middleware

**Total: ~5 horas para 80% do impacto**

---

## 💡 Dicas

- Faça um commit após cada etapa
- Teste a aplicação entre mudanças
- Use busca e substituição no editor
- Peça review se possível
- Não tenha pressa - qualidade > velocidade

---

**Pronto para começar?** Escolha uma tarefa e mãos à obra! 🚀
