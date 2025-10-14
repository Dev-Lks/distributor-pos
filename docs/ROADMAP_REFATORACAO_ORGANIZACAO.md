# 🗂️ Roadmap: Organização e Refatoração

**Objetivo:** Melhorar estrutura, manutenibilidade e performance  
**Duração Estimada:** 2-3 semanas  
**Prioridade:** 🟡 MÉDIA

---

## 📊 Análise da Estrutura Atual

### ✅ Pontos Fortes
- Estrutura Next.js App Router bem organizada
- Separação clara entre páginas, componentes e libs
- Uso de TypeScript em todo projeto
- Componentes UI reutilizáveis com Radix

### ⚠️ Pontos de Melhoria
1. Componentes grandes (>500 linhas)
2. Hooks customizados em `/lib` ao invés de `/hooks`
3. Validações espalhadas (criar `/lib/validations`)
4. Duplicação de código em algumas rotas
5. Falta de testes automatizados
6. Alguns componentes sem documentação JSDoc

---

## 📅 Sprint 1: Reorganização de Estrutura (Semana 1)

### Task 1.1: Reestruturar Diretório de Hooks
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 2 horas

**Problema:**
Hooks estão espalhados em `/lib` misturados com utilitários

**Solução:**
```
Antes:
lib/
  ├── useCashSession.ts
  ├── useCustomers.ts
  ├── useProducts.ts
  ├── useSales.ts
  └── ... (20+ hooks)

Depois:
hooks/
  ├── index.ts (barrel export)
  ├── business/
  │   ├── useCashSession.ts
  │   ├── useCustomers.ts
  │   ├── useProducts.ts
  │   └── useSales.ts
  ├── data/
  │   ├── useInventory.ts
  │   ├── useOrders.ts
  │   └── useKPIs.ts
  ├── ui/
  │   ├── useMediaQuery.ts
  │   ├── usePullToRefresh.ts
  │   ├── useSwipeGesture.ts
  │   └── useReducedMotion.ts
  └── utils/
      ├── useDebounce.ts
      ├── useThrottle.ts
      └── usePerformance.ts

lib/
  ├── validations/
  ├── utils/
  ├── api/
  └── ... (apenas utilitários e configs)
```

**Comando:**
```bash
# Criar estrutura
mkdir -p hooks/{business,data,ui,utils}

# Mover arquivos
mv lib/useCashSession.ts hooks/business/
mv lib/useCustomers.ts hooks/business/
# ... etc

# Criar barrel export
cat > hooks/index.ts << 'EOF'
// Business hooks
export * from './business/useCashSession'
export * from './business/useCustomers'
export * from './business/useProducts'
export * from './business/useSales'

// Data hooks
export * from './data/useInventory'
export * from './data/useOrders'
export * from './data/useKPIs'

// UI hooks
export * from './ui/useMediaQuery'
export * from './ui/usePullToRefresh'

// Utils hooks
export * from './utils/useDebounce'
export * from './utils/useThrottle'
EOF
```

**Atualizar imports:**
```bash
# Buscar e substituir em todos os arquivos
# De: import { useProducts } from '@/lib/useProducts'
# Para: import { useProducts } from '@/hooks'
```

---

### Task 1.2: Consolidar Validações
**Prioridade:** 🟡 ALTA  
**Estimativa:** 3 horas

**Objetivo:** Centralizar todas as validações Zod

**Estrutura:**
```
lib/
  └── validations/
      ├── index.ts
      ├── common.ts (regras compartilhadas)
      ├── sales.ts
      ├── inventory.ts
      ├── users.ts
      ├── customers.ts
      ├── products.ts
      ├── cash-sessions.ts
      └── orders.ts
```

**Criar validações compartilhadas:**
```typescript
// lib/validations/common.ts
import { z } from 'zod'

// Validadores reutilizáveis
export const cuidSchema = z.string().cuid('ID inválido')

export const emailSchema = z.string()
  .email('E-mail inválido')
  .toLowerCase()
  .trim()

export const phoneSchema = z.string()
  .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone inválido')
  .transform(val => val.replace(/\D/g, ''))

export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
  .refine(validateCpf, 'CPF inválido')

export const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido')
  .refine(validateCnpj, 'CNPJ inválido')

export const moneySchema = z.number()
  .min(0, 'Valor não pode ser negativo')
  .max(9999999.99, 'Valor muito alto')
  .multipleOf(0.01, 'Máximo 2 casas decimais')

export const quantitySchema = z.number()
  .int('Quantidade deve ser inteira')
  .min(0, 'Quantidade não pode ser negativa')
  .max(999999, 'Quantidade excede limite')

export const percentageSchema = z.number()
  .min(0, 'Percentual não pode ser negativo')
  .max(100, 'Percentual não pode exceder 100%')

// Validações de data
export const futureDateSchema = z.coerce.date()
  .refine(date => date > new Date(), 'Data deve ser futura')

export const pastDateSchema = z.coerce.date()
  .refine(date => date < new Date(), 'Data deve ser passada')

// Paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})
```

**Barrel export:**
```typescript
// lib/validations/index.ts
export * from './common'
export * from './sales'
export * from './inventory'
export * from './users'
export * from './customers'
export * from './products'
export * from './cash-sessions'
export * from './orders'
```

---

### Task 1.3: Refatorar Componentes Grandes
**Prioridade:** 🟡 ALTA  
**Estimativa:** 6 horas

**Componentes a refatorar:**

#### 1. `app/(app)/dashboard/sales/page.tsx` (~500+ linhas)

**Antes:**
```
sales/page.tsx (500+ linhas)
  - ProductGrid
  - Cart
  - Payment
  - Customer
  - Session
```

**Depois:**
```
sales/
  ├── page.tsx (100 linhas - apenas layout)
  ├── components/
  │   ├── POSLayout.tsx
  │   ├── ProductGrid.tsx (já existe)
  │   ├── CartSection.tsx (já existe)
  │   ├── PaymentPanel.tsx (já existe)
  │   └── CustomerDialog.tsx (já existe)
  └── hooks/
      ├── useCart.ts (já existe)
      ├── useCheckout.ts (já existe)
      └── useCashSessionControls.ts (já existe)
```

**Refatoração:**
```typescript
// app/(app)/dashboard/sales/page.tsx - SIMPLIFICADO
import { POSLayout } from './components/POSLayout'
import { useCart } from './hooks/useCart'
import { useCheckout } from './hooks/useCheckout'

export default function SalesPage() {
  const cart = useCart()
  const checkout = useCheckout()
  
  return (
    <POSLayout
      cart={cart}
      checkout={checkout}
    />
  )
}

// app/(app)/dashboard/sales/components/POSLayout.tsx
export function POSLayout({ cart, checkout }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <ProductGrid onAddToCart={cart.addItem} />
      </div>
      <div>
        <CartSection cart={cart} />
        <PaymentPanel checkout={checkout} />
      </div>
    </div>
  )
}
```

#### 2. `app/(app)/dashboard/inventory/page.tsx` (similar)

**Extrair:**
- `components/inventory/InventoryTable.tsx`
- `components/inventory/InventoryFilters.tsx`
- `components/inventory/InventoryActions.tsx`
- `components/inventory/InventoryStats.tsx`

---

### Task 1.4: Criar Utilitários Compartilhados
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 3 horas

**Objetivo:** DRY - Don't Repeat Yourself

**Criar biblioteca de utilitários:**
```typescript
// lib/utils/formatters.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date))
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

// lib/utils/calculations.ts
export function calculateDiscount(
  total: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number {
  if (discountType === 'percentage') {
    return total * (discountValue / 100)
  }
  return discountValue
}

export function calculateTax(
  subtotal: number,
  taxRate: number
): number {
  return subtotal * (taxRate / 100)
}

export function calculateTotal(
  subtotal: number,
  discount: number,
  tax: number,
  serviceCharge: number = 0
): number {
  return subtotal - discount + tax + serviceCharge
}

// lib/utils/validators.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

// lib/utils/arrays.ts
export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sumBy<T>(
  array: T[],
  key: keyof T
): number {
  return array.reduce((sum, item) => sum + Number(item[key]), 0)
}

export function uniqueBy<T>(
  array: T[],
  key: keyof T
): T[] {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// lib/utils/index.ts
export * from './formatters'
export * from './calculations'
export * from './validators'
export * from './arrays'
```

**Uso:**
```typescript
import { formatCurrency, calculateTotal, sumBy } from '@/lib/utils'

const total = calculateTotal(subtotal, discount, tax)
const formattedTotal = formatCurrency(total)
const totalItems = sumBy(cartItems, 'quantity')
```

---

## 📅 Sprint 2: Performance e Otimizações (Semana 2)

### Task 2.1: Implementar Lazy Loading Agressivo
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 3 horas

**Objetivo:** Reduzir bundle size e melhorar TTI

**Componentes para lazy load:**
```typescript
// app/(app)/dashboard/page.tsx
import dynamic from 'next/dynamic'

// Lazy load componentes pesados
const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Se não precisar de SSR
})

const TopProducts = dynamic(() => import('@/components/dashboard/TopProducts'), {
  loading: () => <CardSkeleton />
})

// Dialogs que não são usados imediatamente
const CreateSaleDialog = dynamic(() => import('@/components/sales/CreateSaleDialog'))
const ImportProductsDialog = dynamic(() => import('@/components/products/ImportDialog'))
```

**Code splitting por rota:**
```typescript
// next.config.js
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'date-fns',
    'recharts', // Adicionar charts
  ],
}
```

---

### Task 2.2: Otimizar Queries do Prisma
**Prioridade:** 🟡 ALTA  
**Estimativa:** 4 horas

**Problemas encontrados:**
```typescript
// ❌ N+1 Query Problem
const sales = await prisma.sale.findMany()
for (const sale of sales) {
  const items = await prisma.saleItem.findMany({
    where: { saleId: sale.id }
  })
}

// ✅ Solução: Usar include
const sales = await prisma.sale.findMany({
  include: {
    items: {
      include: { product: true }
    }
  }
})
```

**Criar queries otimizadas:**
```typescript
// lib/queries/sales.ts
export async function getSalesWithDetails(filters?: SaleFilters) {
  return prisma.sale.findMany({
    where: buildSaleFilters(filters),
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              // Apenas campos necessários
            }
          }
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          document: true,
        }
      },
      payments: true,
      pointOfSale: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { date: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })
}

// lib/queries/inventory.ts
export async function getInventoryWithAlerts() {
  // Usar raw query para performance em cálculos complexos
  return prisma.$queryRaw`
    SELECT 
      i.*,
      p.name,
      p.sku,
      (i.cold_room_quantity + i.house_quantity + i.sale_point_quantity) as total_quantity,
      CASE 
        WHEN i.cold_room_quantity <= i.cold_room_min_stock THEN true
        ELSE false
      END as cold_room_alert
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id
    WHERE i.deleted_at IS NULL
    ORDER BY total_quantity ASC
  `
}
```

**Adicionar índices no Prisma:**
```prisma
// prisma/schema.prisma
model Sale {
  id   String @id @default(cuid())
  date DateTime @default(now())
  
  @@index([date])
  @@index([customerId])
  @@index([pointOfSaleId])
  @@index([date, pointOfSaleId]) // Composite index
}

model Product {
  id  String @id @default(cuid())
  sku String @unique
  
  @@index([name])
  @@index([category])
  @@index([isActive])
}

model Inventory {
  productId String @id
  
  @@index([coldRoomQuantity])
  @@index([houseQuantity])
  @@index([salePointQuantity])
}
```

**Criar migration:**
```bash
pnpm prisma migrate dev --name add_performance_indexes
```

---

### Task 2.3: Implementar Caching
**Prioridade:** 🟡 ALTA  
**Estimativa:** 4 horas

**React Query com cache agressivo:**
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      gcTime: 1000 * 60 * 5, // 5 minutos (antes cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
})

// Cache específico por recurso
export const CACHE_TIMES = {
  products: 1000 * 60 * 5, // 5 minutos
  inventory: 1000 * 30, // 30 segundos
  sales: 1000 * 60, // 1 minuto
  customers: 1000 * 60 * 10, // 10 minutos
  users: 1000 * 60 * 15, // 15 minutos
  kpis: 1000 * 60, // 1 minuto
}
```

**Cache no servidor (Next.js):**
```typescript
// app/api/products/route.ts
import { unstable_cache } from 'next/cache'

const getCachedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: { inventory: true }
    })
  },
  ['products'], // Cache key
  {
    revalidate: 60, // Revalidar a cada 60 segundos
    tags: ['products'], // Para invalidação
  }
)

export async function GET() {
  const products = await getCachedProducts()
  return NextResponse.json(products)
}

// Invalidar cache quando criar/atualizar
export async function POST(request: NextRequest) {
  // ... criar produto
  
  revalidateTag('products') // Invalida o cache
  
  return NextResponse.json(product)
}
```

---

### Task 2.4: Reduzir Bundle Size
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 2 horas

**Analisar bundle:**
```bash
pnpm add -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

```bash
ANALYZE=true pnpm build
```

**Otimizações:**
1. Tree-shaking de bibliotecas grandes
2. Remover dependências não usadas
3. Substituir bibliotecas pesadas por alternativas

**Exemplo:**
```typescript
// ❌ Import completo
import _ from 'lodash'
import { format } from 'date-fns'

// ✅ Import específico
import groupBy from 'lodash/groupBy'
import { format } from 'date-fns/format'
```

---

## 📅 Sprint 3: Documentação e Testes (Semana 3)

### Task 3.1: Adicionar JSDoc em Componentes
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 4 horas

**Padrão:**
```typescript
/**
 * Componente de carrinho de compras
 * 
 * @example
 * ```tsx
 * <CartSection
 *   items={cartItems}
 *   onUpdateQuantity={handleUpdate}
 *   onRemove={handleRemove}
 * />
 * ```
 * 
 * @param items - Lista de itens no carrinho
 * @param onUpdateQuantity - Callback ao atualizar quantidade
 * @param onRemove - Callback ao remover item
 */
export function CartSection({
  items,
  onUpdateQuantity,
  onRemove
}: CartSectionProps) {
  // ...
}

/**
 * Hook para gerenciar estado do carrinho
 * 
 * @returns {Object} Estado e ações do carrinho
 * @returns {CartItem[]} items - Itens no carrinho
 * @returns {Function} addItem - Adicionar item
 * @returns {Function} removeItem - Remover item
 * @returns {Function} updateQuantity - Atualizar quantidade
 * @returns {Function} clearCart - Limpar carrinho
 * @returns {number} total - Valor total
 * 
 * @example
 * ```tsx
 * const cart = useCart()
 * cart.addItem(product, 2)
 * ```
 */
export function useCart() {
  // ...
}
```

---

### Task 3.2: Criar Testes Unitários
**Prioridade:** 🟡 BAIXA  
**Estimativa:** 8 horas

**Setup:**
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Testes prioritários:**
```typescript
// tests/lib/utils/formatters.test.ts
describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format BRL correctly', () => {
      expect(formatCurrency(10.5)).toBe('R$ 10,50')
    })
  })
})

// tests/lib/utils/calculations.test.ts
describe('calculations', () => {
  describe('calculateDiscount', () => {
    it('should calculate percentage discount', () => {
      expect(calculateDiscount(100, 'percentage', 10)).toBe(10)
    })
    
    it('should calculate fixed discount', () => {
      expect(calculateDiscount(100, 'fixed', 15)).toBe(15)
    })
  })
})

// tests/hooks/useCart.test.ts
describe('useCart', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct, 2)
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })
})
```

---

### Task 3.3: Documentação de APIs
**Prioridade:** 🟡 BAIXA  
**Estimativa:** 3 horas

**Criar documentação OpenAPI:**
```typescript
// docs/api-spec.yaml
openapi: 3.0.0
info:
  title: NitroBeer API
  version: 1.0.0
  description: API para sistema de gestão

paths:
  /api/products:
    get:
      summary: Listar produtos
      tags: [Products]
      parameters:
        - name: search
          in: query
          schema:
            type: string
      responses:
        200:
          description: Lista de produtos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
```

---

## 📋 Checklist Geral

### Estrutura
- [ ] Hooks movidos para `/hooks`
- [ ] Validações em `/lib/validations`
- [ ] Utilitários em `/lib/utils`
- [ ] Componentes grandes refatorados

### Performance
- [ ] Lazy loading implementado
- [ ] Queries otimizadas
- [ ] Índices adicionados
- [ ] Caching configurado
- [ ] Bundle analisado e otimizado

### Qualidade
- [ ] JSDoc em componentes principais
- [ ] Testes unitários criados
- [ ] Documentação de API
- [ ] README atualizado

---

**Próximo Documento:** `ROADMAP_FUNCIONALIDADES_NOVAS.md`
