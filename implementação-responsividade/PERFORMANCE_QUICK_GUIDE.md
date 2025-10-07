# 📋 Guia Rápido: Como Usar os Componentes de Performance

## 🚀 Quick Start

### 1. Debounce em Search Inputs

**Problema:** Search dispara request a cada tecla digitada  
**Solução:** `useDebounce`

```typescript
import { useDebounce } from '@/lib/useDebounce'

function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300) // 300ms delay
  
  // Use debouncedSearch ao invés de searchTerm para buscar
  const { data } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: () => fetchProducts(debouncedSearch),
  })
  
  return (
    <Input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  )
}
```

---

### 2. Virtual Scrolling para Listas Grandes

**Problema:** Lista com 100+ items trava ao scrollar  
**Solução:** `<VirtualList>`

```typescript
import { VirtualList } from '@/components/VirtualList'

function ProductList() {
  const { data: products = [] } = useProducts()
  
  // Regra: Use VirtualList se > 50 items
  if (products.length > 50) {
    return (
      <VirtualList
        items={products}
        itemHeight={120} // Altura FIXA de cada item em pixels
        renderItem={(product) => (
          <ProductCard product={product} />
        )}
        overscanCount={3} // Pré-renderiza 3 items extras
      />
    )
  }
  
  // Lista pequena: render normal
  return products.map(p => <ProductCard key={p.id} product={p} />)
}
```

**⚠️ IMPORTANTE:** 
- Items devem ter altura FIXA
- Se altura varia, use componente customizado com `VariableSizeList`

---

### 3. Infinite Scroll

**Problema:** Carregar 1000+ items de uma vez é lento  
**Solução:** `<InfiniteScrollList>` + React Query

```typescript
import { InfiniteScrollList } from '@/components/InfiniteScrollList'
import { useInfiniteQuery } from '@tanstack/react-query'

function SalesList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['sales'],
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
      emptyMessage="Nenhuma venda encontrada"
    />
  )
}
```

**API deve retornar:**
```json
{
  "sales": [...],
  "hasMore": true,
  "nextPage": 1
}
```

---

### 4. Lazy Loading de Seções Pesadas

**Problema:** Dashboard carrega charts pesados mesmo abaixo da dobra  
**Solução:** `<LazySection>`

```typescript
import { LazySection } from '@/components/LazySection'
import { Skeleton } from '@/components/ui/skeleton'

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Sempre visível: render normal */}
      <KPIsWidget />
      <SalesOverview />
      
      {/* Abaixo da dobra: lazy load */}
      <LazySection 
        fallback={<Skeleton className="h-96" />}
        rootMargin="100px" // Começa a carregar 100px antes
      >
        <ExpensiveChart data={data} />
      </LazySection>
      
      <LazySection fallback={<Skeleton className="h-96" />}>
        <DataTable data={largeDataset} />
      </LazySection>
    </div>
  )
}
```

---

### 5. Memoization de Componentes

**Problema:** ProductCard re-renderiza mesmo sem mudanças  
**Solução:** `memo` + `useMemo` + `useCallback`

```typescript
import { memo, useMemo, useCallback } from 'react'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
}

// ✅ Wrap com memo
export const ProductCard = memo(function ProductCard({ 
  product, 
  onEdit 
}: ProductCardProps) {
  
  // ✅ Cálculos pesados: useMemo
  const formattedPrice = useMemo(
    () => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(product.price),
    [product.price] // Só recalcula se price mudar
  )
  
  // ✅ Callbacks: useCallback
  const handleEdit = useCallback(
    () => onEdit(product),
    [onEdit, product]
  )
  
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>{formattedPrice}</p>
      <Button onClick={handleEdit}>Editar</Button>
    </Card>
  )
})

// Parent component
function ProductList() {
  const handleEdit = useCallback((product: Product) => {
    // handler memoizado
  }, [])
  
  return products.map(p => (
    <ProductCard 
      key={p.id} 
      product={p} 
      onEdit={handleEdit} // Callback estável
    />
  ))
}
```

---

### 6. Throttle em Scroll Events

**Problema:** Scroll handler executa 60x por segundo  
**Solução:** `useThrottle`

```typescript
import { useThrottle } from '@/lib/useThrottle'
import { useEffect, useState } from 'react'

function ScrollHeader() {
  const [scrollY, setScrollY] = useState(0)
  const throttledScrollY = useThrottle(scrollY, 100) // Max 1x a cada 100ms

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isScrolled = throttledScrollY > 50

  return (
    <header className={isScrolled ? 'scrolled' : ''}>
      {/* Header content */}
    </header>
  )
}
```

---

## 🎯 Quando Usar Cada Um

| Componente/Hook | Quando Usar | Não Usar Se |
|----------------|-------------|-------------|
| `useDebounce` | Search inputs, autocomplete | Ações imediatas |
| `useThrottle` | Scroll, resize, mousemove | Eventos raros |
| `<VirtualList>` | Lista > 50 items, altura fixa | Altura variável, < 30 items |
| `<InfiniteScrollList>` | Dataset grande, API paginada | Dataset pequeno (< 100) |
| `<LazySection>` | Conteúdo abaixo da dobra | Above the fold, crítico |
| `memo` + `useMemo` | Componentes renderizados muitas vezes | Componentes simples/leves |

---

## 🐛 Troubleshooting

### VirtualList: "Items têm altura diferente"

**Erro:** Items ficam sobrepostos ou com espaçamento errado

**Solução 1:** Garantir altura fixa
```typescript
// ❌ Errado: altura variável
<ProductCard product={product} />

// ✅ Correto: altura fixa via CSS
<div className="h-[120px]">
  <ProductCard product={product} />
</div>
```

**Solução 2:** Usar `VariableSizeList` (avançado)
```typescript
import { VariableSizeList } from 'react-window'

// Função que calcula altura de cada item
const getItemSize = (index: number) => {
  return items[index].expanded ? 200 : 100
}
```

### Debounce: "Ainda dispara múltiplos requests"

**Problema:** Múltiplos requests mesmo com debounce

**Causa:** Usando `searchTerm` ao invés de `debouncedSearch`

```typescript
// ❌ Errado
const { data } = useQuery({
  queryKey: ['products', searchTerm], // ❌ Sem debounce
  queryFn: () => fetchProducts(searchTerm),
})

// ✅ Correto
const { data } = useQuery({
  queryKey: ['products', debouncedSearch], // ✅ Com debounce
  queryFn: () => fetchProducts(debouncedSearch),
})
```

### Memo: "Componente ainda re-renderiza"

**Causa comum:** Callback inline ou objeto novo a cada render

```typescript
// ❌ Errado: callback inline
<ProductCard 
  product={product}
  onEdit={() => handleEdit(product)} // Nova função a cada render
/>

// ✅ Correto: callback memoizado
const handleEdit = useCallback(() => handleEdit(product), [product])
<ProductCard 
  product={product}
  onEdit={handleEdit} // Mesma função
/>
```

---

## ✅ Checklist de Performance

Antes de considerar otimização completa, verifique:

- [ ] Search inputs usam `useDebounce` (300ms)
- [ ] Listas grandes (> 50 items) usam `<VirtualList>`
- [ ] Componentes pesados usam `memo` + `useMemo`
- [ ] Handlers usam `useCallback`
- [ ] Scroll handlers usam `useThrottle`
- [ ] Conteúdo abaixo da dobra usa `<LazySection>`
- [ ] APIs retornam dados paginados
- [ ] Imports são específicos (não `import * as ...`)
- [ ] Lighthouse Performance > 85
- [ ] No console warnings de re-renders

---

## 📊 Como Medir Melhoria

### React DevTools Profiler
```bash
1. Instalar React DevTools
2. Aba "Profiler"
3. Click "Record"
4. Fazer interação (ex: filtrar produtos)
5. Stop recording
6. Analisar:
   - Quais componentes re-renderaram
   - Tempo de render de cada um
   - Flame graph
```

### Chrome DevTools Performance
```bash
1. DevTools > Performance
2. Record
3. Scrollar lista longa
4. Stop
5. Verificar:
   - FPS constante em ~60
   - Sem Long Tasks (> 50ms)
   - Heap memory não cresce
```

### Lighthouse
```bash
1. DevTools > Lighthouse
2. Mode: Mobile
3. Categories: Performance
4. Generate report
5. Meta: Score > 85
```

---

**Dúvidas?** Consulte [SPRINT_03_IMPLEMENTATION_SUMMARY.md](./SPRINT_03_IMPLEMENTATION_SUMMARY.md)
