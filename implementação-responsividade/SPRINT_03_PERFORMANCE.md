# ⚡ Sprint 3: Performance e Otimização - Mobile UX

## 📋 Objetivo
Otimizar performance mobile através de virtual scrolling, lazy loading, debouncing e code splitting para garantir experiência fluida mesmo com dados grandes.

**Duração:** 3-5 dias  
**Prioridade:** 🟡 ALTA  
**Impacto:** Médio-Alto - Afeta performance em listas longas e carregamento

---

## 📦 Dependências e Instalação

### Bibliotecas Necessárias

```bash
# Virtual scrolling
pnpm add react-window react-window-infinite-loader

# Types
pnpm add -D @types/react-window

# Lazy loading de imagens (opcional)
pnpm add react-lazy-load-image-component
pnpm add -D @types/react-lazy-load-image-component
```

---

## ✅ Checklist de Implementação

### Fase 3.1: Virtual Scrolling (3-4h)

#### 📍 Listas para Otimizar:
1. **Product Grid (PDV)** - 100+ produtos
2. **Inventory List** - Estoque completo
3. **Sales Ledger** - Histórico de vendas
4. **Customer List** - Lista de clientes
5. **Order History** - Histórico de pedidos

#### ✅ Wrapper de Virtual List

**Arquivo:** `components/VirtualList.tsx`

```typescript
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscanCount?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  overscanCount = 3,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style} className="px-4">
      {renderItem(items[index], index)}
    </div>
  )

  return (
    <div className={cn("flex-1 min-h-0", className)}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            overscanCount={overscanCount}
            className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  )
}
```

#### ✅ Virtual Grid para Produtos

**Arquivo:** `components/VirtualGrid.tsx`

```typescript
import { VariableSizeGrid, GridChildComponentProps } from 'react-window'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualGridProps<T> {
  items: T[]
  columnCount: number
  rowHeight: number
  renderItem: (item: T) => React.ReactNode
  className?: string
}

export function VirtualGrid<T>({
  items,
  columnCount,
  rowHeight,
  renderItem,
  className,
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount)

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
      const index = rowIndex * columnCount + columnIndex
      if (index >= items.length) return null

      return (
        <div style={style} className="p-2">
          {renderItem(items[index])}
        </div>
      )
    },
    [items, columnCount, renderItem]
  )

  return (
    <div className={cn("flex-1 min-h-0", className)}>
      <VariableSizeGrid
        columnCount={columnCount}
        columnWidth={() => window.innerWidth / columnCount}
        height={window.innerHeight - 200} // Ajustar conforme layout
        rowCount={rowCount}
        rowHeight={() => rowHeight}
        width={window.innerWidth}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {Cell}
      </VariableSizeGrid>
    </div>
  )
}
```

#### ✅ Aplicar em Product Grid (PDV)

**Arquivo:** `app/(app)/dashboard/sales/components/ProductGrid.tsx`

```typescript
import { VirtualGrid } from '@/components/VirtualGrid'
import { useMediaQuery } from '@/lib/useMediaQuery'

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  
  const columnCount = isMobile ? 1 : isTablet ? 2 : 3
  const rowHeight = isMobile ? 140 : 120

  // Se lista pequena, renderizar normal
  if (products.length < 20) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    )
  }

  // Lista grande: virtual scroll
  return (
    <VirtualGrid
      items={products}
      columnCount={columnCount}
      rowHeight={rowHeight}
      renderItem={(product) => (
        <ProductCard
          product={product}
          onAddToCart={onAddToCart}
        />
      )}
    />
  )
}
```

#### Validação:
- [ ] Scroll suave com 100+ items
- [ ] Memória constante (não cresce com items)
- [ ] Renderiza apenas items visíveis
- [ ] Overscan funciona (pré-renderiza próximos)

---

### Fase 3.2: Infinite Scroll (2-3h)

#### ✅ Hook para Infinite Loading

**Arquivo:** `lib/useInfiniteScroll.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react'

interface InfiniteScrollOptions {
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  threshold?: number // pixels do fim para começar carregar
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
}: InfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [hasMore, isLoading, onLoadMore]
  )

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0,
      rootMargin: `${threshold}px`,
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [handleObserver, threshold])

  return { observerTarget }
}
```

#### ✅ Componente Infinite List

**Arquivo:** `components/InfiniteScrollList.tsx`

```typescript
import { useInfiniteScroll } from '@/lib/useInfiniteScroll'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  className?: string
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  onLoadMore,
  hasMore,
  isLoading,
  className,
}: InfiniteScrollListProps<T>) {
  const { observerTarget } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold: 200,
  })

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* End message */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Não há mais itens para carregar
        </div>
      )}
    </div>
  )
}
```

#### ✅ Integrar com React Query

**Exemplo:** Sales Ledger com infinite scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { InfiniteScrollList } from '@/components/InfiniteScrollList'

export function SalesLedger() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['sales', 'ledger'],
    queryFn: ({ pageParam = 0 }) => 
      fetch(`/api/sales?page=${pageParam}&limit=20`).then(r => r.json()),
    getNextPageParam: (lastPage, pages) => 
      lastPage.hasMore ? pages.length : undefined,
    initialPageParam: 0,
  })

  const sales = data?.pages.flatMap(page => page.sales) ?? []

  return (
    <InfiniteScrollList
      items={sales}
      renderItem={(sale) => <SaleCard sale={sale} />}
      onLoadMore={fetchNextPage}
      hasMore={!!hasNextPage}
      isLoading={isFetchingNextPage}
    />
  )
}
```

#### Validação:
- [ ] Carrega próxima página automaticamente
- [ ] Indicador de loading visível
- [ ] Não carrega duplicatas
- [ ] Performance não degrada

---

### Fase 3.3: Debouncing e Throttling (1-2h)

#### ✅ Hooks de Debounce/Throttle

**Arquivo:** `lib/useDebounce.ts`

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

**Arquivo:** `lib/useThrottle.ts`

```typescript
import { useEffect, useRef, useState } from 'react'

export function useThrottle<T>(value: T, limit: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => clearTimeout(handler)
  }, [value, limit])

  return throttledValue
}
```

#### ✅ Aplicar em Search Inputs

**Arquivo:** `app/(app)/dashboard/products/page.tsx`

```typescript
import { useDebounce } from '@/lib/useDebounce'

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Busca só executa após 300ms de pausa
  const { data: products } = useProducts({
    search: debouncedSearch,
  })

  return (
    <Input
      placeholder="Buscar produtos..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  )
}
```

#### ✅ Throttle em Scroll Events

**Exemplo:** Header que muda ao scrollar

```typescript
import { useThrottle } from '@/lib/useThrottle'
import { useEffect, useState } from 'react'

export function ScrollHeader() {
  const [scrollY, setScrollY] = useState(0)
  const throttledScrollY = useThrottle(scrollY, 100)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isScrolled = throttledScrollY > 50

  return (
    <header className={cn(
      "transition-all duration-200",
      isScrolled && "shadow-md bg-background/95 backdrop-blur"
    )}>
      {/* Header content */}
    </header>
  )
}
```

#### Validação:
- [ ] Search não dispara a cada tecla
- [ ] Scroll handlers não travam
- [ ] UI responsiva e rápida
- [ ] Menos re-renders

---

### Fase 3.4: Lazy Loading de Componentes (2h)

#### ✅ Code Splitting com Next.js Dynamic

**Arquivo:** Páginas pesadas

```typescript
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load componentes pesados
const SalesChart = dynamic(
  () => import('@/components/dashboard/SalesChartWidget').then(m => m.SalesChartWidget),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false, // Não renderizar no servidor se não for crítico
  }
)

const InventoryDashboard = dynamic(
  () => import('@/components/inventory/InventoryDashboard'),
  {
    loading: () => <div className="animate-pulse">Carregando...</div>,
  }
)

export default function DashboardPage() {
  return (
    <>
      {/* Componentes críticos: render normal */}
      <DashboardHeader />
      <KPIsWidget />
      
      {/* Componentes pesados: lazy load */}
      <SalesChart />
      <InventoryDashboard />
    </>
  )
}
```

#### ✅ Lazy Load de Imagens

**Arquivo:** Componente de produto com imagem

```typescript
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="...">
      <LazyLoadImage
        src={product.imageUrl}
        alt={product.name}
        effect="blur"
        placeholderSrc="/placeholder.jpg"
        className="w-full h-48 object-cover rounded"
        threshold={100} // Carrega 100px antes de aparecer
      />
      {/* Resto do card */}
    </div>
  )
}
```

#### ✅ Intersection Observer para Lazy Content

**Arquivo:** `components/LazySection.tsx`

```typescript
import { useEffect, useRef, useState } from 'react'

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
}

export function LazySection({
  children,
  fallback = <div>Carregando...</div>,
  rootMargin = '100px',
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}
```

#### Aplicar em Dashboard:
```typescript
<LazySection fallback={<Skeleton className="h-96" />}>
  <HeavyChart data={salesData} />
</LazySection>
```

#### Validação:
- [ ] Initial bundle menor
- [ ] Componentes carregam sob demanda
- [ ] Skeleton loaders apropriados
- [ ] Não há FOUC (Flash of Unstyled Content)

---

### Fase 3.5: Memoization e Otimização de Renders (2-3h)

#### ✅ Otimizar Componentes Pesados

**Exemplo:** ProductCard

```typescript
import { memo, useMemo } from 'react'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

// Memo evita re-render se props não mudaram
export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  // useMemo para cálculos pesados
  const stockStatus = useMemo(() => {
    const total = product.inventory?.totalQuantity ?? 0
    if (total === 0) return 'out-of-stock'
    if (total <= 10) return 'low-stock'
    return 'in-stock'
  }, [product.inventory?.totalQuantity])

  const formattedPrice = useMemo(
    () => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(product.salePrice),
    [product.salePrice]
  )

  return (
    <div className="...">
      <h3>{product.name}</h3>
      <p>{formattedPrice}</p>
      <Badge variant={stockStatus === 'out-of-stock' ? 'destructive' : 'default'}>
        {stockStatus}
      </Badge>
      <Button onClick={() => onAddToCart(product)}>
        Adicionar
      </Button>
    </div>
  )
})
```

#### ✅ useCallback para Callbacks

**Exemplo:** Parent component

```typescript
import { useCallback } from 'react'

export function ProductGrid() {
  const { addToCart } = useCart()

  // useCallback evita criar nova função a cada render
  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart(product)
      toast.success(`${product.name} adicionado`)
    },
    [addToCart]
  )

  return (
    <div className="grid gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  )
}
```

#### ✅ Otimizar Context Providers

**Exemplo:** Cart Context

```typescript
import { createContext, useMemo, useCallback, useReducer } from 'react'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Callbacks memoizados
  const addToCart = useCallback((product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId })
  }, [])

  // Valores derivados memoizados
  const total = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  )

  // Memoizar o value do context
  const value = useMemo(
    () => ({
      items: state.items,
      total,
      addToCart,
      removeFromCart,
    }),
    [state.items, total, addToCart, removeFromCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
```

#### Validação:
- [ ] Componentes não re-renderizam desnecessariamente
- [ ] React DevTools Profiler mostra melhorias
- [ ] Cálculos pesados executam apenas quando necessário
- [ ] Contexts não causam re-renders em cascata

---

### Fase 3.6: Bundle Optimization (1-2h)

#### ✅ Analisar Bundle Size

```bash
# Instalar analyzer
pnpm add -D @next/bundle-analyzer

# Criar next.config.js wrapper
# arquivo: next.config.analyzer.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // sua config existente
})
```

```bash
# Analisar bundle
ANALYZE=true pnpm build
```

#### ✅ Otimizações no next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Já existente
  reactStrictMode: true,
  
  // Adicionar:
  swcMinify: true, // Minifier mais rápido
  
  compiler: {
    // Remove console.logs em produção
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Otimizar imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96],
  },
  
  // Experimental: otimizações
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },
}

module.exports = nextConfig
```

#### ✅ Tree Shaking de Bibliotecas

**Exemplo:** Importar apenas o necessário

```typescript
// ❌ Importa TUDO do date-fns
import * as dateFns from 'date-fns'

// ✅ Importa apenas o necessário
import { format, addDays, startOfWeek } from 'date-fns'

// ❌ Importa todos os ícones
import * as Icons from 'lucide-react'

// ✅ Importa apenas o necessário
import { ShoppingCart, Package, User } from 'lucide-react'
```

#### Validação:
- [ ] Bundle size reduzido em 20%+
- [ ] First Load JS < 200KB
- [ ] Lighthouse Performance > 90
- [ ] No unused code warnings

---

## 🧪 Testes de Validação

### Teste 1: Performance em Lista Grande
```bash
# Checklist (1000+ items):
- [ ] Scroll a 60fps
- [ ] Memória constante
- [ ] Tempo de render < 100ms
- [ ] Lighthouse Performance > 90
```

### Teste 2: Network Throttling
```bash
# Chrome DevTools > Network > Fast 3G
# Checklist:
- [ ] Lazy loading funciona
- [ ] Skeleton loaders aparecem
- [ ] Não há layout shift
- [ ] Imagens carregam progressivamente
```

### Teste 3: CPU Throttling
```bash
# Chrome DevTools > Performance > 4x slowdown
# Checklist:
- [ ] UI permanece responsiva
- [ ] Debounce funciona
- [ ] Memoization efetiva
- [ ] Não há janks/travamentos
```

### Teste 4: Bundle Analysis
```bash
ANALYZE=true pnpm build

# Checklist:
- [ ] Maior chunk < 500KB
- [ ] Vendor chunks separados
- [ ] Dynamic imports funcionando
- [ ] Tree shaking efetivo
```

---

## 📊 Métricas de Sucesso

### Antes:
- ❌ Lista com 100+ items: lag visível
- ❌ Search dispara a cada tecla
- ❌ Bundle size: ~500KB
- ❌ FCP: ~2.5s

### Depois (Meta):
- ✅ Lista com 1000+ items: smooth scroll
- ✅ Search debounced (300ms)
- ✅ Bundle size: ~300KB
- ✅ FCP: < 1.5s
- ✅ TTI: < 3s
- ✅ Lighthouse: > 90

---

## 📝 Próximos Passos

Após completar esta sprint:
1. ✅ Commit: "perf(mobile): implement virtual scrolling and optimizations"
2. ✅ Rodar Lighthouse audit
3. ✅ Testar em dispositivos low-end
4. ✅ Iniciar Sprint 4: Polish e UX Avançado

---

**Status:** 📋 Aguardando Sprint 2  
**Dependências:** Sprint 1 e 2 completas  
**Bloqueadores:** Nenhum  
**Próximo Sprint:** [SPRINT_04_POLISH.md](./SPRINT_04_POLISH.md)
