# ✨ Sprint 4: Polish e UX Avançado - Mobile UX

## 📋 Objetivo
Refinamentos finais, animações fluidas, skeleton loaders, empty states e micro-interactions para uma experiência mobile premium e polida.

**Duração:** 2-3 dias  
**Prioridade:** 🟢 MÉDIA  
**Impacto:** Médio - Diferencial de qualidade e percepção de valor

---

## 📦 Dependências Opcionais

### Bibliotecas de Animação

```bash
# Framer Motion (opcional - mais poderoso)
pnpm add framer-motion

# Ou usar apenas CSS + Tailwind animations
# (já tem tw-animate-css instalado)
```

---

## ✅ Checklist de Implementação

### Fase 4.1: Sistema de Skeleton Loaders (2-3h)

#### 📍 Objetivo
Criar skeletons personalizados para cada tipo de conteúdo, eliminando estados de carregamento genéricos.

#### ✅ Skeleton Base Components

**Arquivo:** `components/ui/skeleton.tsx` (já existe, melhorar)

```typescript
import { cn } from "@/lib/utils"

// Skeleton básico (já existe)
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

// Skeleton com shimmer effect
function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

// Skeleton de texto com linhas
function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && "w-3/4" // Última linha menor
          )}
        />
      ))}
    </div>
  )
}

// Skeleton de Card
function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export { Skeleton, ShimmerSkeleton, TextSkeleton, CardSkeleton }
```

#### ✅ Skeleton Específicos

**1. Product Card Skeleton**
```typescript
// components/skeletons/ProductCardSkeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Image */}
      <ShimmerSkeleton className="h-32 w-full rounded" />
      
      {/* Title and price */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Stock bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}
```

**2. Order Card Skeleton**
```typescript
// components/skeletons/OrderCardSkeleton.tsx
export function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      <div className="flex gap-2 pt-2 border-t">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  )
}
```

**3. Dashboard Stats Skeleton**
```typescript
// components/skeletons/StatCardSkeleton.tsx
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}
```

#### ✅ Aplicar Skeletons

**Exemplo:** Product Grid Loading State

```typescript
// app/(app)/dashboard/sales/components/ProductGrid.tsx
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton'

export function ProductGrid({ loading, products }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

#### ✅ CSS para Shimmer Effect

**Arquivo:** `app/globals.css`

```css
@layer utilities {
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
}
```

#### Validação:
- [ ] Skeletons refletem layout real
- [ ] Shimmer effect suave
- [ ] Sem layout shift ao carregar
- [ ] Tempo de skeleton apropriado (não muito rápido)

---

### Fase 4.2: Empty States e Fallbacks (2h)

#### 📍 Criar Componentes Reutilizáveis

**Arquivo:** `components/EmptyState.tsx`

```typescript
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Icon com animação */}
      <div className="mb-4 rounded-full bg-muted p-6 animate-fade-in">
        <Icon className="h-12 w-12 text-muted-foreground opacity-50" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 animate-fade-in animation-delay-100">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 animate-fade-in animation-delay-200">
          {description}
        </p>
      )}
      
      {/* Action button */}
      {action && (
        <Button
          onClick={action.onClick}
          className="animate-fade-in animation-delay-300"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

#### ✅ Empty States Específicos

**1. Empty Cart**
```typescript
// app/(app)/dashboard/sales/components/CartSection.tsx
import { ShoppingCart } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

{cart.length === 0 && (
  <EmptyState
    icon={ShoppingCart}
    title="Carrinho vazio"
    description="Adicione produtos para começar uma venda"
  />
)}
```

**2. No Products**
```typescript
import { Package } from 'lucide-react'

{filteredProducts.length === 0 && (
  <EmptyState
    icon={Package}
    title="Nenhum produto encontrado"
    description="Tente ajustar os filtros ou adicione novos produtos"
    action={{
      label: "Adicionar Produto",
      onClick: () => setCreateDialogOpen(true)
    }}
  />
)}
```

**3. No Orders**
```typescript
import { Receipt } from 'lucide-react'

{orders.length === 0 && (
  <EmptyState
    icon={Receipt}
    title="Sem encomendas"
    description="Você ainda não recebeu nenhuma encomenda"
    action={{
      label: "Nova Encomenda",
      onClick: () => router.push('/dashboard/orders/new')
    }}
  />
)}
```

**4. Connection Error**
```typescript
import { WifiOff } from 'lucide-react'

{isError && (
  <EmptyState
    icon={WifiOff}
    title="Erro de conexão"
    description="Não foi possível carregar os dados. Verifique sua conexão."
    action={{
      label: "Tentar Novamente",
      onClick: refetch
    }}
  />
)}
```

#### ✅ CSS para Animation Delays

**Arquivo:** `app/globals.css`

```css
@layer utilities {
  .animation-delay-100 {
    animation-delay: 100ms;
  }
  .animation-delay-200 {
    animation-delay: 200ms;
  }
  .animation-delay-300 {
    animation-delay: 300ms;
  }
}
```

#### Validação:
- [ ] Empty states claros e informativos
- [ ] Ícones apropriados para contexto
- [ ] CTAs quando aplicável
- [ ] Animações suaves

---

### Fase 4.3: Micro-Interactions (3-4h)

#### 📍 Animações de Feedback

**1. Success Checkmark Animation**
```typescript
// components/animations/SuccessCheck.tsx
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

export function SuccessCheck() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500"
    >
      <Check className="h-8 w-8 text-white" strokeWidth={3} />
    </motion.div>
  )
}
```

**2. Add to Cart Animation**
```typescript
// Quando adicionar produto ao carrinho
const animateAddToCart = (productElement: HTMLElement) => {
  // Criar elemento clone
  const clone = productElement.cloneNode(true) as HTMLElement
  clone.style.position = 'fixed'
  clone.style.zIndex = '9999'
  
  const rect = productElement.getBoundingClientRect()
  clone.style.top = `${rect.top}px`
  clone.style.left = `${rect.left}px`
  clone.style.width = `${rect.width}px`
  clone.style.height = `${rect.height}px`
  
  document.body.appendChild(clone)
  
  // Animar até o carrinho
  const cartElement = document.querySelector('[data-cart-icon]')
  const cartRect = cartElement?.getBoundingClientRect()
  
  clone.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { 
      transform: `translate(${(cartRect?.left || 0) - rect.left}px, ${(cartRect?.top || 0) - rect.top}px) scale(0.2)`,
      opacity: 0.5
    }
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }).onfinish = () => {
    clone.remove()
    // Vibração e bounce no ícone do carrinho
    cartElement?.classList.add('animate-bounce')
    setTimeout(() => cartElement?.classList.remove('animate-bounce'), 500)
  }
}
```

**3. Number Counter Animation**
```typescript
// components/animations/CountUp.tsx
import { useEffect, useState } from 'react'

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}

export function CountUp({ end, duration = 1000, prefix = '', suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return <span>{prefix}{count.toLocaleString('pt-BR')}{suffix}</span>
}
```

**Usar em KPIs:**
```typescript
<CountUp end={totalSales} prefix="R$ " duration={1500} />
```

**4. Ripple Effect em Botões**
```typescript
// components/ui/ripple-button.tsx
import { useState } from 'react'
import { Button, ButtonProps } from './button'

export function RippleButton({ children, onClick, ...props }: ButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple = { x, y, id: Date.now() }
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
    
    onClick?.(e)
  }

  return (
    <Button {...props} onClick={handleClick} className="relative overflow-hidden">
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}
      {children}
    </Button>
  )
}
```

**CSS:**
```css
@keyframes ripple {
  to {
    width: 600px;
    height: 600px;
    margin-left: -300px;
    margin-top: -300px;
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out;
}
```

**5. Slide-in Cards**
```typescript
// Componente de lista com stagger
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" animate="show">
  {products.map(product => (
    <motion.div key={product.id} variants={item}>
      <ProductCard product={product} />
    </motion.div>
  ))}
</motion.div>
```

#### Validação:
- [ ] Animações suaves (60fps)
- [ ] Não causam reflow/repaint excessivo
- [ ] Reduzidas em `prefers-reduced-motion`
- [ ] Melhoram feedback, não distraem

---

### Fase 4.4: Page Transitions (2h)

#### ✅ Implementar com Framer Motion

**Arquivo:** `components/PageTransition.tsx`

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**Aplicar no Layout:**
```typescript
// app/(app)/dashboard/layout.tsx
import { PageTransition } from '@/components/PageTransition'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <PageTransition>
        {children}
      </PageTransition>
    </div>
  )
}
```

#### ✅ Modal/Dialog Transitions

```typescript
// Melhorar Dialog component
import { motion } from 'framer-motion'

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  }
}

// Aplicar no DialogContent
<motion.div
  variants={contentVariants}
  initial="hidden"
  animate="visible"
  exit="hidden"
>
  {/* Dialog content */}
</motion.div>
```

#### Validação:
- [ ] Transições naturais entre páginas
- [ ] Não há flash durante navegação
- [ ] Performance mantida (60fps)
- [ ] Reduzidas em `prefers-reduced-motion`

---

### Fase 4.5: Acessibilidade e Reduced Motion (1h)

#### ✅ Respeitar Preferências do Usuário

**Arquivo:** `lib/useReducedMotion.ts`

```typescript
import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
```

#### ✅ Aplicar Condicionalmente

```typescript
import { useReducedMotion } from '@/lib/useReducedMotion'

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion()

  const variants = prefersReducedMotion
    ? { initial: {}, animate: {} } // Sem animação
    : { initial: { opacity: 0 }, animate: { opacity: 1 } } // Com animação

  return <motion.div variants={variants}>...</motion.div>
}
```

#### ✅ CSS Fallback

**Arquivo:** `app/globals.css`

```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

#### Validação:
- [ ] Animações desabilitadas com `prefers-reduced-motion`
- [ ] App funcional sem animações
- [ ] ARIA labels em elementos interativos
- [ ] Keyboard navigation funciona

---

### Fase 4.6: Loading States Avançados (1-2h)

#### ✅ Progress Bar Global

**Arquivo:** `components/ProgressBar.tsx`

```typescript
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export function ProgressBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timeout = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [pathname])

  if (!isLoading) return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-[9999] origin-left"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  )
}
```

**Adicionar no layout principal:**
```typescript
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

#### ✅ Spinning Loader Customizado

```typescript
// components/Loader.tsx
import { motion } from 'framer-motion'

export function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${sizes[size]} border-2 border-primary border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}
```

#### Validação:
- [ ] Progress bar em navegação
- [ ] Loaders apropriados para contexto
- [ ] Não há flicker (mínimo 300ms)
- [ ] Estados de loading informativos

---

## 🧪 Testes de Validação

### Teste 1: Animações
```bash
# Checklist:
- [ ] Todas rodam a 60fps
- [ ] Não causam jank
- [ ] Desabilitadas com prefers-reduced-motion
- [ ] Melhoram UX, não distraem
```

### Teste 2: Empty States
```bash
# Checklist:
- [ ] Presentes em todas as listas/grids vazias
- [ ] Informativos e úteis
- [ ] CTAs apropriados
- [ ] Ícones adequados ao contexto
```

### Teste 3: Skeleton Loaders
```bash
# Checklist:
- [ ] Refletem layout real
- [ ] Sem layout shift
- [ ] Duração apropriada
- [ ] Shimmer effect suave
```

### Teste 4: Micro-interactions
```bash
# Checklist:
- [ ] Feedback instantâneo (<100ms)
- [ ] Vibrações apropriadas
- [ ] Não invasivas
- [ ] Consistentes em todo app
```

---

## 📊 Métricas de Sucesso

### Antes:
- ❌ Loading states genéricos
- ❌ Sem empty states
- ❌ Transições bruscas
- ❌ Feedback visual inconsistente

### Depois (Meta):
- ✅ Skeletons personalizados em 100% dos componentes
- ✅ Empty states em todas as listas
- ✅ Animações fluidas (60fps)
- ✅ Micro-interactions em ações críticas
- ✅ Acessibilidade (WCAG AA)
- ✅ Percepção de qualidade premium

---

## 📝 Checklist Final de Qualidade

### Visual
- [ ] Todas as animações suaves (60fps)
- [ ] Skeleton loaders em loading states
- [ ] Empty states informativos
- [ ] Transições entre páginas
- [ ] Micro-interactions em ações

### Performance
- [ ] Animações não degradam performance
- [ ] Sem janks ou stutters
- [ ] Lighthouse Performance > 90
- [ ] Frame drops < 1%

### Acessibilidade
- [ ] Respeita `prefers-reduced-motion`
- [ ] ARIA labels presentes
- [ ] Keyboard navigation funciona
- [ ] Contraste adequado (WCAG AA)

### Mobile
- [ ] Gestos naturais
- [ ] Feedback háptico apropriado
- [ ] Touch targets ≥ 44px
- [ ] Responsivo em todos os devices

---

## 🎉 Conclusão do Roadmap

Após completar esta sprint:
1. ✅ Commit final: "feat(mobile): complete UX polish and animations"
2. ✅ Rodar testes completos (Lighthouse, axe, manual)
3. ✅ Documentar melhorias no CHANGELOG
4. ✅ Deploy para staging
5. ✅ Testes de usuário beta
6. ✅ Coletar feedback
7. ✅ Deploy para produção 🚀

---

**Status:** 📋 Aguardando Sprint 3  
**Dependências:** Sprints 1, 2 e 3 completas  
**Bloqueadores:** Nenhum  
**Próximo:** Deploy e Testes Beta!
