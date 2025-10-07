# 👆 Sprint 2: Gestos e Interações Touch - Mobile UX

## 📋 Objetivo
Implementar gestos nativos mobile (swipe, pull-to-refresh, long-press) e substituir modals por bottom sheets para experiência mais natural.

**Duração:** 2-3 dias  
**Prioridade:** 🟡 ALTA  
**Impacto:** Alto - Melhora significativa na experiência mobile

---

## 📦 Dependências e Instalação

### Bibliotecas Necessárias

```bash
# Gestos touch avançados
pnpm add @use-gesture/react

# Bottom sheets (já instalado - vaul)
# Verificar se está no package.json

# Opcional: Animações suaves
pnpm add framer-motion
```

---

## ✅ Checklist de Implementação

### Fase 2.1: Pull-to-Refresh (2-3h)

#### 📍 Páginas Alvo:
1. Dashboard principal
2. Lista de produtos (PDV)
3. Estoque/Inventário
4. Pedidos/Encomendas
5. Clientes

#### ✅ Criar Hook Reutilizável

**Arquivo:** `lib/usePullToRefresh.ts`

```typescript
import { useEffect, useRef, useState } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number // Distância mínima para trigger
  resistance?: number // Resistência do pull
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    const element = document.documentElement

    const handleTouchStart = (e: TouchEvent) => {
      // Só ativa se estiver no topo da página
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        // Aplicar resistência
        const adjustedDistance = distance / resistance
        setPullDistance(adjustedDistance)

        // Prevenir scroll nativo se puxando pra baixo
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setIsPulling(false)
      setPullDistance(0)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, resistance, onRefresh])

  return {
    isPulling: isPulling && pullDistance > 0,
    isRefreshing,
    pullDistance,
    progress: Math.min(pullDistance / threshold, 1),
  }
}
```

#### ✅ Criar Componente Visual

**Arquivo:** `components/PullToRefreshIndicator.tsx`

```typescript
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshIndicatorProps {
  isPulling: boolean
  isRefreshing: boolean
  progress: number
  pullDistance: number
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  progress,
  pullDistance,
}: PullToRefreshIndicatorProps) {
  const isVisible = isPulling || isRefreshing

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center",
        "transition-all duration-200 ease-out",
        "bg-background/80 backdrop-blur-sm",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
      style={{
        height: isRefreshing ? '60px' : `${pullDistance}px`,
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {isRefreshing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Atualizando...</span>
          </>
        ) : (
          <>
            <div
              className={cn(
                "h-6 w-6 rounded-full border-2 border-primary/30 transition-all",
                progress >= 1 && "border-primary bg-primary/10"
              )}
              style={{
                transform: `rotate(${progress * 360}deg)`,
              }}
            >
              <div
                className="h-1 w-1 rounded-full bg-primary absolute top-1 left-1/2 -translate-x-1/2"
                style={{
                  opacity: progress,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {progress >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
```

#### ✅ Implementar em Páginas

**Exemplo:** `app/(app)/dashboard/products/page.tsx`

```typescript
'use client'

import { usePullToRefresh } from '@/lib/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator'
import { useProducts } from '@/lib/useProducts'

export default function ProductsPage() {
  const { refetch, isRefetching } = useProducts()

  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await refetch()
      // Feedback háptico
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    },
    threshold: 80,
  })

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing || isRefetching}
        progress={progress}
        pullDistance={pullDistance}
      />
      
      {/* Resto do conteúdo */}
    </>
  )
}
```

#### Validação:
- [ ] Pull-to-refresh funciona em todas as listas
- [ ] Visual claro do progresso
- [ ] Feedback háptico ao completar
- [ ] Não interfere com scroll normal

---

### Fase 2.2: Swipe Gestures (3-4h)

#### 📍 Casos de Uso:
1. **Swipe left** → Deletar item (lista de carrinho, produtos)
2. **Swipe right** → Ação secundária (editar, ver detalhes)
3. **Swipe down** → Fechar modal/bottom sheet

#### ✅ Criar Hook de Swipe

**Arquivo:** `lib/useSwipeGesture.ts`

```typescript
import { useGesture } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  enabled = true,
}: SwipeGestureOptions) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }))

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
        if (!enabled) return

        // Atualizar posição durante o drag
        api.start({ x: mx, immediate: true })

        // Detectar swipe (velocidade + distância)
        if (Math.abs(mx) > threshold || Math.abs(vx) > 0.5) {
          if (dx < 0 && onSwipeLeft) {
            // Swipe left
            api.start({ x: -300 })
            setTimeout(() => {
              onSwipeLeft()
              if (navigator.vibrate) navigator.vibrate(30)
            }, 200)
            cancel()
          } else if (dx > 0 && onSwipeRight) {
            // Swipe right
            api.start({ x: 300 })
            setTimeout(() => {
              onSwipeRight()
              if (navigator.vibrate) navigator.vibrate(30)
            }, 200)
            cancel()
          }
        }
      },
      onDragEnd: () => {
        // Reset posição se não passou do threshold
        api.start({ x: 0 })
      },
    },
    { drag: { axis: 'x' } }
  )

  return { bind, style: { x }, animated }
}
```

#### ✅ Componente Swipeable Item

**Arquivo:** `components/SwipeableItem.tsx`

```typescript
import { ReactNode } from 'react'
import { Trash2, Edit, Info } from 'lucide-react'
import { useSwipeGesture } from '@/lib/useSwipeGesture'
import { cn } from '@/lib/utils'

interface SwipeableItemProps {
  children: ReactNode
  onDelete?: () => void
  onEdit?: () => void
  className?: string
}

export function SwipeableItem({
  children,
  onDelete,
  onEdit,
  className,
}: SwipeableItemProps) {
  const { bind, style, animated: AnimatedDiv } = useSwipeGesture({
    onSwipeLeft: onDelete,
    onSwipeRight: onEdit,
    threshold: 80,
    enabled: !!(onDelete || onEdit),
  })

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Ação direita (swipe right) */}
        {onEdit && (
          <div className="flex items-center gap-2 text-blue-600">
            <Edit className="h-5 w-5" />
            <span className="text-sm font-medium">Editar</span>
          </div>
        )}
        
        <div className="flex-1" />
        
        {/* Ação esquerda (swipe left) */}
        {onDelete && (
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-sm font-medium">Deletar</span>
            <Trash2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Conteúdo swipeable */}
      <AnimatedDiv
        {...bind()}
        style={style}
        className="relative bg-background touch-pan-y"
      >
        {children}
      </AnimatedDiv>
    </div>
  )
}
```

#### ✅ Aplicar em Cart Items

**Arquivo:** `app/(app)/dashboard/sales/components/CartSection.tsx`

```typescript
import { SwipeableItem } from '@/components/SwipeableItem'

// Dentro do map de cart items:
<SwipeableItem
  key={item.productId}
  onDelete={() => onRemove(item.productId)}
  className="mb-2"
>
  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
    {/* Conteúdo existente do item */}
  </div>
</SwipeableItem>
```

#### Validação:
- [ ] Swipe left deleta item
- [ ] Swipe right abre edição
- [ ] Feedback visual claro
- [ ] Vibração ao completar ação

---

### Fase 2.3: Bottom Sheets (4-5h)

#### 📍 Modais para Converter:
1. Payment panel (finalizar venda)
2. Customer dialog
3. Add stock dialog
4. Product details
5. Cash session dialogs

#### ✅ Configurar Vaul (Bottom Sheet)

**Arquivo:** `components/ui/drawer.tsx`

```typescript
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24",
        "flex h-auto flex-col rounded-t-[20px] border-t bg-background",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        "data-[state=closed]:duration-300 data-[state=open]:duration-500",
        className
      )}
      {...props}
    >
      {/* Handle bar */}
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
```

#### ✅ Hook para Responsividade

**Arquivo:** `lib/useMediaQuery.ts`

```typescript
import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Helper hook específico
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}
```

#### ✅ Componente Responsivo

**Arquivo:** `components/ResponsiveDialog.tsx`

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/lib/useMediaQuery'

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

#### ✅ Converter Payment Panel

**Arquivo:** `app/(app)/dashboard/sales/components/PaymentPanel.tsx`

```typescript
import { ResponsiveDialog } from '@/components/ResponsiveDialog'

// Substituir Dialog por ResponsiveDialog:
<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Finalizar Venda"
  description="Selecione o método de pagamento"
>
  {/* Conteúdo existente */}
</ResponsiveDialog>
```

#### Validação:
- [ ] Desktop: Modal tradicional
- [ ] Mobile: Bottom sheet com swipe down
- [ ] Transições suaves
- [ ] Handle bar visível

---

### Fase 2.4: Long-Press Menus (2h)

#### ✅ Hook Long-Press

**Arquivo:** `lib/useLongPress.ts`

```typescript
import { useCallback, useRef } from 'react'

interface LongPressOptions {
  onLongPress: () => void
  delay?: number
  onClick?: () => void
}

export function useLongPress({
  onLongPress,
  delay = 500,
  onClick,
}: LongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout>()

  const start = useCallback(() => {
    // Feedback háptico ao iniciar
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    timerRef.current = setTimeout(() => {
      onLongPress()
      // Feedback háptico mais forte ao completar
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30])
      }
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
  }, [onClick])

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  }
}
```

#### ✅ Aplicar em Product Cards

**Exemplo:** Abrir menu contextual ao segurar card

```typescript
import { useLongPress } from '@/lib/useLongPress'

const longPressProps = useLongPress({
  onLongPress: () => {
    // Abrir menu de ações
    setContextMenuOpen(true)
  },
  onClick: () => {
    // Ação normal (adicionar ao carrinho)
    onAddToCart(product)
  },
  delay: 500,
})

<div {...longPressProps} className="...">
  {/* Card content */}
</div>
```

#### Validação:
- [ ] Long-press abre menu contextual
- [ ] Vibração ao iniciar e completar
- [ ] Não interfere com scroll
- [ ] Visual indica que está segurando

---

### Fase 2.5: Feedback Háptico Global (1h)

#### ✅ Criar Utility

**Arquivo:** `lib/haptics.ts`

```typescript
export const haptics = {
  // Feedback leve (botão, tap)
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  },

  // Feedback médio (ação importante)
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  },

  // Feedback forte (erro, sucesso)
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  },

  // Padrão de sucesso
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30])
    }
  },

  // Padrão de erro
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50, 100, 50])
    }
  },

  // Padrão de warning
  warning: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 100, 30])
    }
  },
}
```

#### ✅ Aplicar em Ações Críticas

```typescript
// Ao finalizar venda
haptics.success()

// Ao deletar item
haptics.warning()

// Ao adicionar ao carrinho
haptics.light()

// Ao ocorrer erro
haptics.error()
```

#### Validação:
- [ ] Vibrações apropriadas para cada ação
- [ ] Não invasivo
- [ ] Funciona em iOS e Android
- [ ] Configurável (opcional)

---

## 🧪 Testes de Validação

### Teste 1: Pull-to-Refresh
```bash
# Checklist:
- [ ] Funciona em todas as listas
- [ ] Visual claro
- [ ] Não ativa scroll acidental
- [ ] Feedback háptico
- [ ] Animação suave
```

### Teste 2: Swipe Gestures
```bash
# Checklist:
- [ ] Swipe left deleta
- [ ] Swipe right abre ações
- [ ] Visual claro das ações
- [ ] Animação suave
- [ ] Vibração ao completar
```

### Teste 3: Bottom Sheets
```bash
# Checklist:
- [ ] Swipe down fecha
- [ ] Handle bar visível
- [ ] Backdrop clicável
- [ ] Transição suave
- [ ] Desktop mantém modal
```

### Teste 4: Long-Press
```bash
# Checklist:
- [ ] Menu abre após 500ms
- [ ] Vibração ao iniciar
- [ ] Vibração ao completar
- [ ] Não interfere com scroll
```

---

## 📊 Métricas de Sucesso

### Antes:
- ❌ Sem gestos nativos
- ❌ Modals em tela inteira
- ❌ Sem feedback háptico
- ❌ Interação apenas por tap

### Depois (Meta):
- ✅ Pull-to-refresh em 5+ páginas
- ✅ Swipe em listas críticas
- ✅ Bottom sheets em mobile
- ✅ Feedback háptico em 100% ações
- ✅ Long-press em cards

---

## 📝 Próximos Passos

Após completar esta sprint:
1. ✅ Commit: "feat(mobile): implement touch gestures and bottom sheets"
2. ✅ Testar extensivamente em dispositivo real
3. ✅ Coletar feedback de usuários beta
4. ✅ Iniciar Sprint 3: Performance e Otimização

---

**Status:** 📋 Aguardando Sprint 1  
**Dependências:** Sprint 1 completa  
**Bloqueadores:** Nenhum  
**Próximo Sprint:** [SPRINT_03_PERFORMANCE.md](./SPRINT_03_PERFORMANCE.md)
