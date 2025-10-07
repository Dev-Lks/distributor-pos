# 🎨 Guia Rápido: Componentes de Polish & UX

**Sprint 4 - Referência Rápida**

---

## 📖 Índice

1. [Skeleton Loaders](#skeleton-loaders)
2. [Empty States](#empty-states)
3. [Animações](#animações)
4. [Loading States](#loading-states)
5. [Acessibilidade](#acessibilidade)

---

## Skeleton Loaders

### Importar

```typescript
// Skeletons básicos
import { Skeleton, ShimmerSkeleton, TextSkeleton, CardSkeleton } from '@/components/ui/skeleton'

// Skeletons específicos
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton'
import { OrderCardSkeleton } from '@/components/skeletons/OrderCardSkeleton'
import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
```

### Uso

```typescript
// Loading state simples
{loading ? <ProductCardSkeleton /> : <ProductCard product={product} />}

// Grid de skeletons
{loading && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
)}

// Skeleton com shimmer
<ShimmerSkeleton className="h-32 w-full rounded" />

// Text skeleton
<TextSkeleton lines={5} />

// Table skeleton
<TableSkeleton rows={5} cols={4} />
```

---

## Empty States

### Importar

```typescript
import { EmptyState } from '@/components/EmptyState'
import { Package, ShoppingCart, Receipt, WifiOff } from 'lucide-react'
```

### Uso

```typescript
// Empty state básico
{products.length === 0 && (
  <EmptyState
    icon={Package}
    title="Nenhum produto encontrado"
    description="Tente ajustar os filtros"
  />
)}

// Com ação (CTA)
{cart.length === 0 && (
  <EmptyState
    icon={ShoppingCart}
    title="Carrinho vazio"
    description="Adicione produtos para começar uma venda"
    action={{
      label: "Ver Produtos",
      onClick: () => router.push('/products')
    }}
  />
)}

// Erro de conexão
{isError && (
  <EmptyState
    icon={WifiOff}
    title="Erro de conexão"
    description="Não foi possível carregar os dados"
    action={{
      label: "Tentar Novamente",
      onClick: refetch
    }}
  />
)}
```

---

## Animações

### CountUp (Números Animados)

```typescript
import { CountUp } from '@/components/animations/CountUp'

// Uso básico
<CountUp end={1500} />

// Com formatação
<CountUp end={totalSales} prefix="R$ " duration={2000} />
<CountUp end={percentage} suffix="%" duration={1500} />

// Em cards de estatísticas
<Card>
  <CardContent>
    <div className="text-2xl font-bold">
      <CountUp end={totalSales} prefix="R$ " />
    </div>
    <p className="text-sm text-muted-foreground">Vendas do Mês</p>
  </CardContent>
</Card>
```

### Success Check

```typescript
import { SuccessCheck } from '@/components/animations/SuccessCheck'

// Mostrar após ação bem-sucedida
const [showSuccess, setShowSuccess] = useState(false)

const handleSubmit = async () => {
  await saveData()
  setShowSuccess(true)
  setTimeout(() => setShowSuccess(false), 2000)
}

{showSuccess && (
  <div className="animate-fade-in">
    <SuccessCheck />
  </div>
)}
```

### Ripple Button

```typescript
import { RippleButton } from '@/components/ui/ripple-button'
import { Plus, Trash2 } from 'lucide-react'

// Uso como botão normal
<RippleButton onClick={handleClick}>
  Clique aqui
</RippleButton>

// Com ícones
<RippleButton variant="default">
  <Plus className="h-4 w-4" />
  Adicionar
</RippleButton>

<RippleButton variant="destructive">
  <Trash2 className="h-4 w-4" />
  Excluir
</RippleButton>
```

---

## Loading States

### Progress Bar (Global)

```typescript
// Adicionar no layout root (app/layout.tsx)
import { ProgressBar } from '@/components/ProgressBar'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ProgressBar />
        {children}
      </body>
    </html>
  )
}
```

### Loader (Local)

```typescript
import { Loader } from '@/components/Loader'

// Tamanhos disponíveis
<Loader size="sm" />
<Loader size="md" />
<Loader size="lg" />

// Em loading states
{loading && (
  <div className="flex justify-center py-8">
    <Loader size="md" />
  </div>
)}

// Inline
<Button disabled={loading}>
  {loading ? <Loader size="sm" /> : 'Salvar'}
</Button>
```

---

## Acessibilidade

### useReducedMotion Hook

```typescript
import { useReducedMotion } from '@/lib/useReducedMotion'

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={prefersReducedMotion ? '' : 'animate-fade-in'}
    >
      Conteúdo
    </div>
  )
}
```

### Classes CSS com Reduced Motion

Todas as animações já respeitam automaticamente:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animações desabilitadas */
}
```

---

## 🎯 Patterns Comuns

### Lista com Loading

```typescript
function ProductList() {
  const { data: products, isLoading } = useQuery(['products'], fetchProducts)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhum produto"
        action={{ label: "Adicionar", onClick: () => {} }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Form com Feedback

```typescript
function CreateForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await createItem()
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center">
        <SuccessCheck />
        <p className="mt-4">Item criado com sucesso!</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* campos */}
      <RippleButton type="submit" disabled={loading}>
        {loading ? <Loader size="sm" /> : 'Criar'}
      </RippleButton>
    </form>
  )
}
```

### Dashboard Stats

```typescript
function DashboardStats() {
  const { data: stats, isLoading } = useQuery(['stats'], fetchStats)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">
            <CountUp end={stats.sales} prefix="R$ " />
          </div>
          <p className="text-sm text-muted-foreground">Vendas</p>
        </CardContent>
      </Card>
      {/* outros cards */}
    </div>
  )
}
```

---

## 🎨 CSS Classes Úteis

```css
/* Animações */
.animate-fade-in          /* Fade-in suave */
.animate-ripple           /* Ripple effect */
.animate-spin             /* Loader spin */

/* Delays */
.animation-delay-100      /* 100ms delay */
.animation-delay-200      /* 200ms delay */
.animation-delay-300      /* 300ms delay */

/* Hover effects */
.hover-lift               /* Elevação no hover */
```

---

## 📦 Componentes Disponíveis

### Skeletons
- `Skeleton` - Básico
- `ShimmerSkeleton` - Com shimmer
- `TextSkeleton` - Texto
- `CardSkeleton` - Card genérico
- `ProductCardSkeleton` - Produto
- `OrderCardSkeleton` - Pedido
- `StatCardSkeleton` - Estatística
- `TableSkeleton` - Tabela

### Empty States
- `EmptyState` - Reutilizável

### Animações
- `CountUp` - Números animados
- `SuccessCheck` - Checkmark de sucesso
- `RippleButton` - Botão com ripple

### Loading
- `ProgressBar` - Barra de progresso global
- `Loader` - Spinner

### Hooks
- `useReducedMotion` - Detecta preferência

---

## 🔗 Links Úteis

- **Página de Exemplos:** `/dashboard/examples/polish`
- **Documentação Completa:** `SPRINT_04_IMPLEMENTATION_SUMMARY.md`
- **Roadmap:** `MOBILE_UX_ROADMAP.md`

---

**Última Atualização:** 07/10/2025
