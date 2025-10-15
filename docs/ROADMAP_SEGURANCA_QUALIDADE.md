# 🛡️ Roadmap: Segurança e Qualidade de Código

**Objetivo:** Elevar o projeto a padrões enterprise de segurança e qualidade  
**Objetivo:** Substituir `console.log` por sistema robusto e compatível com Edge Runtime
**Status:** � Em andamento — sanitização concluída, falta integrar monitoramento externo

**Pontos-chave do `lib/logger.ts`:**
```typescript
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private sanitize(context?: LogContext) {
    if (!context) return {}
    const sanitized = { ...context }
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'passwordHash', 'jwt']
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]'
      }
    })
    return sanitized
  }

  debug(message: string, context?: LogContext) {
if (path.startsWith('/api/auth/') || path === '/login') {
  try {
    await authLimiter.check(5, ip) // 5 tentativas em 15min
  } catch {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
    const sanitized = this.sanitize(context)
    if (!process.env.NODE_ENV || this.isDevelopment) {
      console.info('ℹ️', message, sanitized)
    }
**Dependência:**

  warn(message: string, context?: LogContext) {
    console.warn('⚠️', message, this.sanitize(context))
  }

  error(message: string, context?: LogContext) {
    console.error('❌', message, this.sanitize(context))
    // TODO: Integrar Sentry/DataDog aqui
  }

  performance(label: string, startTime: number) {
    const duration = Date.now() - startTime
    if (this.isDevelopment || duration > 1000) {
      this.info(`⏱️  ${label}: ${duration}ms`, { duration })
    }
  }

  audit(action: string, userId: string, context?: LogContext) {
    this.info(`[AUDIT] ${action}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...this.sanitize(context),
    })
  }
}

export const logger = new Logger()
```

**Como usar:**
- `logger.error('Failed to create product', { error })`
- `logger.audit('CREATE_SALE', userId, { saleId })`
- `logger.performance('DB query', start)`
class Logger {
  private logDir = join(process.cwd(), 'logs')
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProd = process.env.NODE_ENV === 'production'

  constructor() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private sanitize(context?: LogContext) {
    if (!context) return {}
    
    const sanitized = { ...context }
    
    // Remove dados sensíveis
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  private writeToFile(level: string, message: string, context?: LogContext) {
    if (!this.isProd) return
    
    const timestamp = new Date().toISOString()
    const logEntry = JSON.stringify({
      timestamp,
      level,
      message,
      context: this.sanitize(context)
    }) + '\n'
    
    const filename = `${new Date().toISOString().split('T')[0]}.log`
    const filepath = join(this.logDir, filename)
    
    appendFileSync(filepath, logEntry)
  }

  error(message: string, context?: LogContext & { error?: Error }) {
    const sanitized = this.sanitize(context)
    
    console.error('❌', message, sanitized)
    
    // Em produção, salvar em arquivo
    this.writeToFile('ERROR', message, {
      ...sanitized,
      stack: context?.error?.stack
    })
    
    // Opcional: Enviar para serviço de monitoramento
    // this.sendToSentry(message, context)
  }

  warn(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    console.warn('⚠️', message, sanitized)
    this.writeToFile('WARN', message, sanitized)
  }

  info(message: string, context?: LogContext) {
    if (this.isProd) {
      // Em produção, apenas warnings e errors no console
      this.writeToFile('INFO', message, context)
    } else {
      console.info('ℹ️', message, context || '')
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log('🔍', message, context || '')
    }
    // Não salvar debug em produção
  }
}

export const logger = new Logger()
```

**Substituir em todos os arquivos:**
```bash
# Buscar e substituir (fazer manualmente para revisar cada caso)
console.log → logger.debug
console.error → logger.error
console.warn → logger.warn
console.info → logger.info
```

**Arquivos prioritários:**
- `app/api/**/*.ts` (todas as rotas)
- `lib/**/*.ts`
- `middleware.ts`

**Testes:**
- [ ] Logs são escritos em arquivo em produção
- [ ] Dados sensíveis são sanitizados
- [ ] Performance não é afetada
- [ ] Rotação de logs funciona

---

### Task 1.3: Validação de Inputs Completa
**Prioridade:** 🔴 ALTA  
**Estimativa:** 6 horas

**Objetivo:** Adicionar validação Zod em todas as rotas críticas

**Schema de validação para inventário:**
```typescript
// lib/validations/inventory.ts
import { z } from 'zod'

export const inventoryUpdateSchema = z.object({
  productId: z.string().cuid('ID de produto inválido'),
  location: z.enum(['coldRoom', 'house', 'salePoint'], {
    errorMap: () => ({ message: 'Local inválido' })
  }),
  quantity: z.number()
    .int('Quantidade deve ser inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .max(999999, 'Quantidade excede limite máximo'),
})

export const inventoryTransferSchema = z.object({
  productId: z.string().cuid(),
  fromLocation: z.enum(['coldRoom', 'house', 'salePoint']),
  toLocation: z.enum(['coldRoom', 'house', 'salePoint']),
  quantity: z.number().int().positive().max(999999),
}).refine(
  data => data.fromLocation !== data.toLocation,
  { message: 'Locais de origem e destino devem ser diferentes' }
)

export const inventoryBulkUpdateSchema = z.object({
  updates: z.array(inventoryUpdateSchema)
    .min(1, 'Pelo menos uma atualização necessária')
    .max(100, 'Máximo 100 atualizações por vez'),
})
```

**Aplicar nas rotas:**
```typescript
// app/api/inventory/route.ts
import { inventoryUpdateSchema } from '@/lib/validations/inventory'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar com Zod
    const validationResult = inventoryUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }
    
    const { productId, location, quantity } = validationResult.data
    
    // Resto da lógica...
  } catch (error) {
    logger.error('Erro ao atualizar inventário', { error })
    return NextResponse.json(
      { error: 'Erro ao atualizar inventário' },
      { status: 500 }
    )
  }
}
```

**Criar schemas para:**
- [ ] `lib/validations/inventory.ts`
- [ ] `lib/validations/sales.ts` (já existe parcialmente)
- [ ] `lib/validations/users.ts`
- [ ] `lib/validations/customers.ts`
- [ ] `lib/validations/cash-sessions.ts`
- [ ] `lib/validations/orders.ts`

**Rotas prioritárias:**
1. `app/api/inventory/**/*.ts`
2. `app/api/cash-sessions/**/*.ts`
3. `app/api/users/**/*.ts`

---

### Task 1.4: Forçar Mudança de Senha Admin
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 2 horas

**Implementação:**
```typescript
// lib/auth.ts - Adicionar no callback jwt
async jwt({ token, user }) {
  if (user) {
    const typedUser = user as AdapterUser & {
      isAdmin?: boolean
      passwordChangedAt?: Date
      createdAt?: Date
    }
    
    token.id = user.id
    token.isAdmin = typedUser.isAdmin || false
    token.requiresPasswordChange = false
    
    // Verificar se é admin com senha padrão
    if (typedUser.isAdmin && !typedUser.passwordChangedAt) {
      const daysSinceCreation = 
        (Date.now() - typedUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      
      // Se admin foi criado há mais de 1 dia e nunca mudou senha
      if (daysSinceCreation > 1) {
        token.requiresPasswordChange = true
      }
    }
  }
  return token
}
```

**Criar página de mudança obrigatória:**
```typescript
// app/(auth)/change-password/page.tsx
'use client'

export default function ChangePasswordPage() {
  // Força mudança de senha
  // Não permite sair da página até completar
  // Valida senha forte (min 8 chars, maiúscula, número, especial)
}
```

**Adicionar no middleware:**
```typescript
// middleware.ts
if (token.requiresPasswordChange && path !== '/change-password') {
  return NextResponse.redirect(new URL('/change-password', req.url))
}
```

---

## 📅 Sprint 2: Robustez e Auditoria (Semana 2)

### Task 2.1: Implementar Soft Delete
**Prioridade:** 🟡 ALTA  
**Estimativa:** 5 horas

**Objetivo:** Nunca deletar dados críticos permanentemente

**Modificar schema:**
```prisma
// prisma/schema.prisma
model Product {
  id        String   @id @default(cuid())
  // ... campos existentes
  deletedAt DateTime?
  deletedBy String?
  deletedByUser User? @relation("ProductDeletedBy", fields: [deletedBy], references: [id])
}

model Sale {
  id        String   @id @default(cuid())
  // ... campos existentes
  deletedAt DateTime?
  deletedBy String?
  deletedByUser User? @relation("SaleDeletedBy", fields: [deletedBy], references: [id])
  voidReason String?
}

model User {
  id        String   @id @default(cuid())
  // ... campos existentes
  deletedAt DateTime?
  deletedBy String?
  deletedByUser User? @relation("UserDeletedBy", fields: [deletedBy], references: [id])
}
```

**Criar helper:**
```typescript
// lib/soft-delete.ts
import { prisma } from './prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function softDelete<T extends keyof typeof prisma>(
  model: T,
  id: string,
  reason?: string
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('Not authenticated')
  }
  
  // @ts-expect-error - Prisma types são complexos
  return prisma[model].update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
      ...(reason && { voidReason: reason })
    }
  })
}

export function withoutDeleted<T>(where: T): T & { deletedAt: null } {
  return { ...where, deletedAt: null } as T & { deletedAt: null }
}
```

**Substituir DELETE por soft delete:**
```typescript
// app/api/products/route.ts
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  
  // Ao invés de:
  // await prisma.product.delete({ where: { id } })
  
  // Usar:
  await softDelete('product', id)
  
  return NextResponse.json({ success: true })
}
```

**Adicionar filtros em queries:**
```typescript
// app/api/products/route.ts
export async function GET() {
  const products = await prisma.product.findMany({
    where: withoutDeleted({}),
    include: { inventory: true }
  })
  return NextResponse.json(products)
}
```

**Migração:**
```bash
pnpm prisma migrate dev --name add_soft_delete
```

---

### Task 2.2: Sistema de Backup Automatizado
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 4 horas

**Objetivo:** Backup diário automático do banco de dados

**Script de backup:**
```typescript
// scripts/backup-database.ts
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const execAsync = promisify(exec)

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const backupDir = join(process.cwd(), 'backups')
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }
  
  const filename = `backup-${timestamp}.sql`
  const filepath = join(backupDir, filename)
  
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found')
  }
  
  // Extrair dados da connection string
  const url = new URL(dbUrl)
  const database = url.pathname.slice(1)
  const host = url.hostname
  const port = url.port || '5432'
  const username = url.username
  const password = url.password
  
  // Usar pg_dump
  const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${filepath}`
  
  try {
    await execAsync(command)
    console.log(`✅ Backup criado: ${filename}`)
    
    // Deletar backups antigos (manter últimos 30 dias)
    await cleanOldBackups(backupDir, 30)
    
    return filepath
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error)
    throw error
  }
}

async function cleanOldBackups(dir: string, daysToKeep: number) {
  const files = await fs.readdir(dir)
  const now = Date.now()
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000
  
  for (const file of files) {
    const filepath = join(dir, file)
    const stats = await fs.stat(filepath)
    
    if (now - stats.mtimeMs > maxAge) {
      await fs.unlink(filepath)
      console.log(`🗑️ Backup antigo deletado: ${file}`)
    }
  }
}

backupDatabase().catch(console.error)
```

**Adicionar ao package.json:**
```json
{
  "scripts": {
    "backup": "tsx scripts/backup-database.ts",
    "backup:cron": "tsx scripts/backup-database.ts >> logs/backup.log 2>&1"
  }
}
```

**Configurar cron (servidor Linux):**
```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 3h)
0 3 * * * cd /path/to/project && pnpm backup:cron
```

**Ou usar Vercel Cron:**
```typescript
// app/api/backup/cron/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Executar backup
  // Salvar em S3 ou storage externo
  
  return NextResponse.json({ success: true })
}
```

**Adicionar ao vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/backup/cron",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

### Task 2.3: Adicionar Validações Zod Faltantes
**Prioridade:** 🟡 ALTA  
**Estimativa:** 4 horas

**Objetivo:** 100% das rotas críticas com validação

**Schemas a criar:**
```typescript
// lib/validations/users.ts
export const createUserSchema = z.object({
  fullName: z.string().min(3).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma maiúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter pelo menos um caractere especial'),
  phone: z.string().optional(),
  cpf: z.string().optional().refine(validateCpf, 'CPF inválido'),
  isAdmin: z.boolean().default(false),
  pointsOfSaleIds: z.array(z.string().cuid()).optional(),
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().cuid(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

// lib/validations/customers.ts
export const createCustomerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  document: z.string().optional().refine(
    val => !val || validateCpfCnpj(val),
    'CPF/CNPJ inválido'
  ),
  address: z.string().max(500).optional(),
  creditLimit: z.number().min(0).max(1000000).optional(),
})

// lib/validations/cash-sessions.ts
export const openCashSessionSchema = z.object({
  pointOfSaleId: z.string().cuid(),
  initialAmount: z.number().min(0).max(100000),
  notes: z.string().max(500).optional(),
})

export const closeCashSessionSchema = z.object({
  cashSessionId: z.string().cuid(),
  finalAmount: z.number().min(0),
  notes: z.string().max(500).optional(),
})

export const cashTransactionSchema = z.object({
  cashSessionId: z.string().cuid(),
  type: z.enum(['CASH_IN', 'CASH_OUT', 'WITHDRAWAL', 'DEPOSIT']),
  amount: z.number().min(0.01).max(100000),
  description: z.string().min(3).max(200),
  notes: z.string().max(500).optional(),
})
```

**Aplicar em todas as rotas:**
- [ ] `app/api/users/route.ts`
- [ ] `app/api/users/[id]/route.ts`
- [ ] `app/api/customers/route.ts`
- [ ] `app/api/cash-sessions/**/*.ts`
- [ ] `app/api/orders/**/*.ts`

---

### Task 2.4: Proteção CSRF Adicional
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 3 horas

**Objetivo:** Adicionar tokens CSRF para operações sensíveis

**Implementação:**
```typescript
// lib/csrf.ts
import { randomBytes } from 'crypto'

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  // Validar token contra sessão
  return token === sessionToken
}

// middleware.ts - adicionar
if (req.method !== 'GET' && req.method !== 'HEAD') {
  const csrfToken = req.headers.get('x-csrf-token')
  const sessionCsrf = token.csrfToken as string
  
  if (!csrfToken || csrfToken !== sessionCsrf) {
    return NextResponse.json(
      { error: 'CSRF token inválido' },
      { status: 403 }
    )
  }
}
```

---

## 📅 Sprint 3: Monitoramento e Testes (Semana 3)

### Task 3.1: Configurar CORS Adequadamente
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 1 hora

```typescript
// next.config.js - adicionar
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.ALLOWED_ORIGINS || 'https://yourdomain.com'
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, X-CSRF-Token'
        },
      ],
    },
  ]
}
```

---

### Task 3.2: Implementar Monitoramento
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 4 horas

**Opções:**
1. **Sentry** - Rastreamento de erros
2. **LogRocket** - Session replay
3. **DataDog** - APM completo
4. **Vercel Analytics** - Já disponível

**Implementação básica com Sentry:**
```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// lib/logger.ts - integrar
error(message: string, context?: LogContext) {
  // ... código existente
  
  // Enviar para Sentry
  Sentry.captureException(context?.error || new Error(message), {
    extra: this.sanitize(context)
  })
}
```

---

### Task 3.3: Testes de Segurança
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 4 horas

**Criar testes automatizados:**
```typescript
// tests/security/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should block after 100 requests per minute', async () => {
    // Fazer 101 requisições
    // Última deve retornar 429
  })
  
  it('should block login after 5 attempts', async () => {
    // Testar brute force
  })
})

// tests/security/auth.test.ts
describe('Authentication', () => {
  it('should not allow access without token', async () => {
    // Testar rotas protegidas
  })
  
  it('should validate permissions correctly', async () => {
    // Testar cada permissão
  })
})

// tests/security/input-validation.test.ts
describe('Input Validation', () => {
  it('should reject negative quantities', async () => {
    // Testar validações Zod
  })
  
  it('should sanitize SQL injection attempts', async () => {
    // Prisma já protege, mas testar
  })
})
```

---

## 📋 Checklist Geral

### Segurança
- [ ] Rate limiting implementado
- [ ] Logger centralizado em uso
- [ ] Validação Zod em 100% das rotas críticas
- [ ] Mudança de senha admin obrigatória
- [ ] Soft delete implementado
- [ ] CORS configurado corretamente
- [ ] CSRF tokens em operações sensíveis
- [ ] Headers de segurança configurados

### Qualidade
- [ ] Zero console.log em produção
- [ ] Testes de segurança passando
- [ ] Documentação atualizada
- [ ] Code review realizado

### Infraestrutura
- [ ] Backup automatizado funcionando
- [ ] Monitoramento configurado
- [ ] Logs sendo salvos corretamente
- [ ] Rotação de logs configurada

---

## 🎯 Métricas de Sucesso

- ✅ 0 console.log em arquivos de produção
- ✅ 100% das rotas críticas com validação
- ✅ 100% das rotas com rate limiting
- ✅ Backup diário funcionando
- ✅ Logs centralizados e sanitizados
- ✅ Tempo de resposta < 200ms após implementações
- ✅ 0 erros de segurança em auditoria

---

**Próximo Documento:** `ROADMAP_FUNCIONALIDADES_NOVAS.md`
