# 🚀 Roadmap Multi-Tenant - NitroBeer SaaS

## 📊 Visão Geral

Transformar o NitroBeer POS em um SaaS multi-tenant para vender para outros bares e cervejarias.

### Estratégia Escolhida: **Shared Database com Row Level Security**

---

## 🎯 Fase 1: Fundação Multi-Tenant (2-3 semanas)

### 1.1 - Adicionar Modelo de Tenant/Organization

**Arquivos a modificar:**
- [ ] `prisma/schema.prisma` - Adicionar modelo Tenant
- [ ] `prisma/migrations/` - Criar migration
- [ ] `lib/tenant.ts` - Criar utility functions
- [ ] `middleware.ts` - Adicionar tenant resolution

**Mudanças no Schema:**

```prisma
model Tenant {
  id        String   @id @default(cuid())
  slug      String   @unique // nitrobeer, cervejaria-abc
  name      String   // "NitroBeer Tap House"
  
  // Billing
  plan      TenantPlan @default(FREE)
  stripeCustomerId String? @unique
  subscriptionStatus SubscriptionStatus @default(TRIALING)
  subscriptionId String?
  trialEndsAt DateTime?
  
  // Limits
  maxUsers  Int @default(3)
  maxProducts Int @default(100)
  maxPointsOfSale Int @default(2)
  
  // Branding
  logo      String?
  primaryColor String? @default("#fbbf24")
  domain    String? @unique // custom-domain.com
  
  // Settings
  settings  Json? // Configurações customizadas
  timezone  String @default("America/Sao_Paulo")
  currency  String @default("BRL")
  
  // Status
  isActive  Boolean @default(true)
  suspendedAt DateTime?
  suspendedReason String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  users     User[]
  products  Product[]
  sales     Sale[]
  customers Customer[]
  pointsOfSale PointOfSale[]
  inventory Inventory[]
  // ... todas as outras relações
}

enum TenantPlan {
  FREE      // 30 dias trial
  STARTER   // R$ 99/mês
  BUSINESS  // R$ 299/mês
  ENTERPRISE // R$ 899/mês
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
}
```

### 1.2 - Adicionar tenantId em TODOS os modelos

**Exemplo:**
```prisma
model User {
  id        String   @id @default(cuid())
  tenantId  String   // <<< ADICIONAR
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // ... resto dos campos
  
  @@unique([tenantId, email]) // Email único por tenant
  @@index([tenantId])
}

model Product {
  id        String   @id @default(cuid())
  tenantId  String   // <<< ADICIONAR
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // ... resto
  
  @@index([tenantId])
  @@unique([tenantId, sku]) // SKU único por tenant
}

// Repetir para TODOS os modelos...
```

### 1.3 - Criar Middleware de Tenant

**`middleware.ts`:**
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Extrair subdomain
  // app.nitrobeer.com.br -> nitrobeer
  // cervejaria-abc.seudominio.com.br -> cervejaria-abc
  
  const subdomain = getSubdomain(hostname)
  
  // Reescrever URL com tenant
  if (subdomain && subdomain !== 'www') {
    const url = request.nextUrl.clone()
    url.searchParams.set('tenant', subdomain)
    return NextResponse.rewrite(url)
  }
  
  return NextResponse.next()
}

function getSubdomain(hostname: string): string | null {
  // localhost:3000 -> null
  // nitrobeer.seudominio.com.br -> nitrobeer
  // cervejaria.seudominio.com.br -> cervejaria
  
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  return null
}
```

### 1.4 - Criar Tenant Context/Hook

**`lib/useTenant.ts`:**
```typescript
import { createContext, useContext } from 'react'

type TenantContextType = {
  tenantId: string
  tenant: Tenant | null
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | null>(null)

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

export function TenantProvider({ children, tenantSlug }: Props) {
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () => fetchTenant(tenantSlug),
  })
  
  return (
    <TenantContext.Provider value={{ 
      tenantId: tenant?.id || '', 
      tenant, 
      isLoading 
    }}>
      {children}
    </TenantContext.Provider>
  )
}
```

---

## 🎯 Fase 2: Isolamento de Dados (1-2 semanas)

### 2.1 - Criar Prisma Wrapper com Tenant Filter

**`lib/prisma-tenant.ts`:**
```typescript
import { PrismaClient } from '@prisma/client'

export function createTenantClient(tenantId: string) {
  const prisma = new PrismaClient()
  
  // Middleware para SEMPRE filtrar por tenantId
  prisma.$use(async (params, next) => {
    // Models que têm tenantId
    const tenantModels = [
      'User', 'Product', 'Sale', 'Customer', 
      'Inventory', 'PointOfSale', // ... todos
    ]
    
    if (tenantModels.includes(params.model || '')) {
      // Inject tenantId em todas as queries
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          tenantId,
        }
      }
      
      if (params.action === 'create') {
        params.args.data = {
          ...params.args.data,
          tenantId,
        }
      }
      
      // ... outros actions
    }
    
    return next(params)
  })
  
  return prisma
}
```

### 2.2 - Atualizar TODAS as APIs

**Antes:**
```typescript
export async function GET() {
  const products = await prisma.product.findMany()
  return NextResponse.json(products)
}
```

**Depois:**
```typescript
export async function GET(request: NextRequest) {
  const tenantId = await getTenantIdFromRequest(request)
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }
  
  const db = createTenantClient(tenantId)
  const products = await db.product.findMany()
  
  return NextResponse.json(products)
}
```

---

## 🎯 Fase 3: Autenticação Multi-Tenant (1 semana)

### 3.1 - Atualizar NextAuth

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ...
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId // <<< ADICIONAR
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.tenantId = token.tenantId // <<< ADICIONAR
        session.user.role = token.role
      }
      return session
    },
  },
}
```

### 3.2 - Login com Tenant Slug

```typescript
// app/(auth)/login/[tenant]/page.tsx
export default function LoginPage({ params }: { params: { tenant: string } }) {
  // Validar se tenant existe
  // Mostrar logo do tenant
  // Login vinculado ao tenant
}
```

---

## 🎯 Fase 4: Billing & Subscriptions (2-3 semanas)

### 4.1 - Integração com Stripe

```bash
pnpm add stripe @stripe/stripe-js
```

**`lib/stripe.ts`:**
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Criar customer
export async function createStripeCustomer(tenant: Tenant) {
  const customer = await stripe.customers.create({
    email: tenant.ownerEmail,
    name: tenant.name,
    metadata: {
      tenantId: tenant.id,
    },
  })
  return customer
}

// Criar subscription
export async function createSubscription(
  customerId: string,
  priceId: string
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 30,
  })
  return subscription
}
```

### 4.2 - Webhooks do Stripe

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
  
  switch (event.type) {
    case 'customer.subscription.updated':
      // Atualizar status da subscription
      break
    case 'customer.subscription.deleted':
      // Suspender tenant
      break
    case 'invoice.payment_failed':
      // Notificar cliente
      break
  }
  
  return NextResponse.json({ received: true })
}
```

### 4.3 - Planos e Pricing

```typescript
// config/plans.ts
export const PLANS = {
  FREE: {
    name: 'Trial',
    price: 0,
    maxUsers: 2,
    maxProducts: 50,
    maxPointsOfSale: 1,
    features: [
      'PDV Básico',
      'Controle de Estoque',
      'Relatórios Simples',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 99,
    stripePriceId: 'price_xxx',
    maxUsers: 5,
    maxProducts: 500,
    maxPointsOfSale: 3,
    features: [
      'Tudo do Free +',
      'Dashboard Completo',
      'Clientes Ilimitados',
      'Suporte por Email',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 299,
    stripePriceId: 'price_yyy',
    maxUsers: 20,
    maxProducts: 5000,
    maxPointsOfSale: 10,
    features: [
      'Tudo do Starter +',
      'API Access',
      'Integrações',
      'Suporte Prioritário',
      'Relatórios Avançados',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 899,
    stripePriceId: 'price_zzz',
    maxUsers: -1, // Ilimitado
    maxProducts: -1,
    maxPointsOfSale: -1,
    features: [
      'Tudo do Business +',
      'White Label',
      'Onboarding Dedicado',
      'SLA Garantido',
      'Custom Features',
    ],
  },
}
```

---

## 🎯 Fase 5: Onboarding (1-2 semanas)

### 5.1 - Página de Registro

```typescript
// app/(marketing)/signup/page.tsx
export default function SignupPage() {
  return (
    <form onSubmit={handleSignup}>
      <Input name="companyName" placeholder="Nome do seu negócio" />
      <Input name="slug" placeholder="seu-negocio" />
      <Input name="ownerName" placeholder="Seu nome" />
      <Input name="email" placeholder="seu@email.com" />
      <Input name="password" type="password" />
      
      <Select name="plan">
        <option value="STARTER">Starter - R$ 99/mês</option>
        <option value="BUSINESS">Business - R$ 299/mês</option>
      </Select>
      
      <Button type="submit">Começar Trial Grátis</Button>
    </form>
  )
}
```

### 5.2 - Setup Wizard

```typescript
// app/[tenant]/setup/page.tsx
// Wizard de 5 passos:
// 1. Configurar perfil da empresa
// 2. Adicionar primeiro ponto de venda
// 3. Importar produtos
// 4. Convidar equipe
// 5. Abrir primeiro caixa
```

---

## 🎯 Fase 6: Admin Dashboard (1 semana)

### 6.1 - Super Admin

```typescript
// app/admin/page.tsx
// Dashboard para você gerenciar todos os tenants
// - Lista de clientes
// - Métricas de uso
// - Billing overview
// - Suporte
```

---

## 📊 Estimativa de Esforço

| Fase | Tempo | Complexidade |
|------|-------|--------------|
| 1. Fundação | 2-3 semanas | ⭐⭐⭐ |
| 2. Isolamento | 1-2 semanas | ⭐⭐⭐⭐ |
| 3. Auth | 1 semana | ⭐⭐ |
| 4. Billing | 2-3 semanas | ⭐⭐⭐⭐ |
| 5. Onboarding | 1-2 semanas | ⭐⭐ |
| 6. Admin | 1 semana | ⭐⭐ |
| **TOTAL** | **8-12 semanas** | |

---

## 💰 Custos Estimados (MRR)

### Infraestrutura
- Vercel Pro: $20/mês
- Neon PostgreSQL: $20-100/mês (varia com uso)
- Stripe: 3.99% + R$ 0.39 por transação
- Email (SendGrid): $15-80/mês
- Total: ~$100-250/mês

### Break-even
- Com 3 clientes no plano Starter: R$ 297/mês
- Margem: ~70% após break-even

---

## 🚀 MVP Mínimo para Lançar

**O que precisa estar pronto:**
- [x] Multi-tenant funcionando
- [x] Signup/Login por tenant
- [x] Billing básico (Stripe)
- [x] Trial de 30 dias
- [x] 2 planos (Starter e Business)
- [x] Onboarding wizard
- [x] Landing page de marketing

**Pode vir depois:**
- [ ] White label completo
- [ ] API pública
- [ ] App mobile
- [ ] Integrações avançadas

---

## 🎯 Próximos Passos IMEDIATOS

1. **Decidir subdomain strategy**
   - `empresa.seudominio.com.br`
   - Ou custom domains desde o início?

2. **Registrar domínio**
   - Sugestão: `nitrobeer.app` ou `poscraft.com.br`

3. **Configurar Stripe**
   - Conta business
   - Definir preços
   - Testar webhooks

4. **Começar pela Fase 1**
   - Adicionar modelo Tenant
   - Migration
   - Tenant context

---

## 📚 Recursos Úteis

- [Stripe Billing Docs](https://stripe.com/docs/billing)
- [Next.js Multi-Tenant](https://vercel.com/guides/nextjs-multi-tenant-application)
- [Prisma Row Level Security](https://www.prisma.io/blog/row-level-security)
- [SaaS Metrics](https://www.forentrepreneurs.com/saas-metrics-2/)

---

## 🤝 Need Help?

Posso te ajudar em cada fase! Só me avisar quando quiser começar a implementar.
