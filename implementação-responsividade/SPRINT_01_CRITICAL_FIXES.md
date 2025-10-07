# 🚨 Sprint 1: Correções Críticas - Mobile UX

## 📋 Objetivo
Corrigir problemas críticos de acessibilidade e implementar tamanhos touch-friendly em todos os componentes interativos.

**Duração:** 1-2 dias  
**Prioridade:** 🔴 CRÍTICA  
**Impacto:** Alto - Afeta 100% dos usuários mobile

---

## ✅ Checklist de Implementação

### Fase 1.1: Viewport e Meta Tags (30min)
**Arquivo:** `app/layout.tsx`

#### Problemas Atuais:
```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,        // ❌ REMOVE acessibilidade
  userScalable: false,    // ❌ IMPEDE zoom
  themeColor: "#fbbf24",
}
```

#### ✅ Ações:
- [ ] Remover `maximumScale: 1`
- [ ] Remover `userScalable: false`
- [ ] Adicionar `minimum-scale: 1`
- [ ] Manter `initial-scale: 1`
- [ ] Testar zoom em iOS e Android

#### Código Correto:
```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#fbbf24",
  viewportFit: "cover", // Para safe areas iOS
}
```

#### Validação:
- [ ] Usuários podem dar zoom (pinch-to-zoom)
- [ ] Layout não quebra com zoom
- [ ] Fontes escalam com configurações do sistema

---

### Fase 1.2: Touch-Action Global (15min)
**Arquivo:** `app/globals.css`

#### Problema:
- Falta configuração global de `touch-action`
- Double-tap zoom ainda ativo em alguns elementos
- `-webkit-tap-highlight-color` não está global

#### ✅ Ações:
- [ ] Adicionar rules globais no início do CSS
- [ ] Configurar touch-action: manipulation
- [ ] Remover tap highlight
- [ ] Adicionar smooth scrolling

#### Código a Adicionar (após `@tailwind base;`):
```css
@layer base {
  /* ========================================
     MOBILE TOUCH OPTIMIZATIONS
     ======================================== */
  
  * {
    /* Remove destaque azul no tap (iOS/Android) */
    -webkit-tap-highlight-color: transparent;
    
    /* Previne double-tap zoom em botões */
    touch-action: manipulation;
  }
  
  html {
    /* Smooth scrolling nativo */
    scroll-behavior: smooth;
    
    /* Otimiza scrolling em iOS */
    -webkit-overflow-scrolling: touch;
  }
  
  body {
    /* Previne bounce scroll em iOS */
    overscroll-behavior-y: none;
    
    /* Otimiza rendering de fontes */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Áreas scrolláveis com momentum */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}
```

#### Validação:
- [ ] Sem flash azul ao tocar botões
- [ ] Sem double-tap zoom acidental
- [ ] Scroll suave e nativo

---

### Fase 1.3: Componente Button (45min)
**Arquivo:** `components/ui/button.tsx`

#### Problemas Atuais:
```typescript
size: {
  default: "h-9 px-4 py-2",   // 36px - ABAIXO de 44px ❌
  sm: "h-8 rounded-md",        // 32px - MUITO PEQUENO ❌
  lg: "h-10 rounded-md",       // 40px - AINDA ABAIXO ❌
  icon: "size-9",              // 36px - ABAIXO ❌
}
```

#### ✅ Ações:
- [ ] Aumentar todos os tamanhos em mobile
- [ ] Manter proporções em desktop
- [ ] Adicionar active states consistentes
- [ ] Melhorar transitions

#### Código Correto:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.97] active:transition-transform active:duration-100",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Mobile-first: min 44px
        default: "min-h-[44px] px-4 py-2 md:h-10 has-[>svg]:px-3",
        sm: "min-h-[44px] rounded-md gap-1.5 px-3 md:h-9 has-[>svg]:px-2.5",
        lg: "min-h-[48px] rounded-md px-6 md:h-11 has-[>svg]:px-4",
        icon: "min-h-[44px] min-w-[44px] md:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

#### Validação:
- [ ] Todos os botões têm min 44x44px em mobile
- [ ] Active state visível e rápido
- [ ] Sem quebra de layout
- [ ] Ícones centralizados

---

### Fase 1.4: Componente Input (30min)
**Arquivo:** `components/ui/input.tsx`

#### Problema:
- Inputs sem altura mínima definida
- Inconsistência com botões
- Difícil de tocar em mobile

#### ✅ Ações:
- [ ] Definir altura mínima 44px
- [ ] Aumentar padding interno
- [ ] Melhorar focus states
- [ ] Otimizar para teclado mobile

#### Código a Implementar:
```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base",
          // Mobile-first: min 44px height
          "min-h-[44px] md:h-10",
          // Ring and focus
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Smooth transitions
          "transition-all duration-150",
          // Active state
          "active:scale-[0.99]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### Validação:
- [ ] Fácil de tocar em mobile
- [ ] Teclado apropriado abre (email, tel, number)
- [ ] Focus visível e claro
- [ ] Placeholder legível

---

### Fase 1.5: Checkboxes e Switches (30min)
**Arquivos:** 
- `components/ui/checkbox.tsx`
- `components/ui/switch.tsx`

#### Problema:
- Checkboxes muito pequenos (16x16px típico)
- Switches difíceis de acionar
- Área de toque insuficiente

#### ✅ Ações - Checkbox:
```typescript
<CheckboxPrimitive.Root
  className={cn(
    // Aumentar tamanho mínimo
    "peer min-h-[24px] min-w-[24px] shrink-0 rounded-sm border border-primary shadow",
    // Touch area maior que visual
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Active feedback
    "active:scale-95 transition-transform duration-100",
    // Cores
    "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    className
  )}
>
```

#### ✅ Ações - Switch:
```typescript
<SwitchPrimitives.Root
  className={cn(
    // Aumentar tamanho
    "peer inline-flex min-h-[28px] min-w-[48px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Active feedback
    "active:scale-95 transition-all duration-150",
    "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
    className
  )}
>
```

#### Validação:
- [ ] Fácil de tocar sem erro
- [ ] Visual claro de estado
- [ ] Animação suave
- [ ] Label clicável aumenta área

---

### Fase 1.6: Tabs (30min)
**Arquivo:** `components/ui/tabs.tsx` ou onde usar Tabs

#### Problema:
- Tabs muito próximas
- Área de toque pequena
- Difícil alternar em mobile

#### ✅ Ações:
```typescript
<TabsPrimitive.Trigger
  className={cn(
    // Altura mínima touch-friendly
    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2",
    "min-h-[44px] min-w-[80px]", // Touch-friendly
    "text-sm font-medium ring-offset-background transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    // States
    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
    // Active feedback
    "active:scale-95 transition-transform duration-100",
    className
  )}
>
```

#### Validação:
- [ ] Fácil alternar entre tabs
- [ ] Visual claro da tab ativa
- [ ] Scroll horizontal se necessário
- [ ] Sem toques acidentais

---

### Fase 1.7: Active States Globais (1h)
**Objetivo:** Garantir feedback visual em TODOS os elementos interativos

#### ✅ Componentes a Atualizar:

##### 1. Cards Clicáveis
**Arquivos:**
- `components/inventory/ProductCard.tsx`
- `components/orders/OrderCard.tsx`
- `app/(app)/dashboard/sales/components/ProductGrid.tsx`

**Adicionar:**
```typescript
className={cn(
  "transition-all duration-150 hover:shadow-md",
  "active:scale-[0.98] active:shadow-sm",
  // ... resto
)}
```

##### 2. Bottom Navigation
**Arquivo:** `components/MobileBottomNav.tsx`

**Atualizar links:**
```typescript
<Link
  className={cn(
    "relative flex flex-col items-center justify-center flex-1",
    "min-h-[56px]", // Aumentar altura
    "gap-1 transition-all duration-150",
    "hover:bg-accent/50",
    "active:scale-95 active:bg-accent", // Feedback forte
    // ...
  )}
>
```

##### 3. FAB Actions
**Arquivo:** `components/FloatingActionButton.tsx`

**Já tem active state, mas melhorar:**
```typescript
className={cn(
  "transition-all duration-200",
  "active:scale-90", // Mais agressivo para feedback claro
  "hover:scale-105",
  // ...
)}
```

##### 4. Product Grid (PDV)
**Arquivo:** `app/(app)/dashboard/sales/components/ProductGrid.tsx`

**Cards de produtos:**
```typescript
<div
  data-product-id={product.id}
  onClick={() => onAddToCart(product)}
  className={cn(
    "group cursor-pointer rounded-lg border bg-card p-3 shadow-sm",
    "transition-all duration-150",
    "hover:shadow-md hover:border-primary/50",
    "active:scale-[0.97] active:shadow-sm", // Feedback ao tocar
    // ...
  )}
>
```

##### 5. Cart Items
**Arquivo:** `app/(app)/dashboard/sales/components/CartSection.tsx`

**Botões de quantidade:**
```typescript
<Button
  variant="outline"
  size="icon"
  className={cn(
    "min-h-[36px] min-w-[36px]", // Menor mas ainda ok em contexto
    "active:scale-90", // Feedback forte
  )}
  onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
>
```

#### Validação Final:
- [ ] Todos os botões têm active state
- [ ] Todos os cards clicáveis têm feedback
- [ ] Links de navegação têm feedback
- [ ] Controles de quantidade têm feedback
- [ ] Tabs e switches têm feedback

---

## 🧪 Testes de Validação

### Teste 1: Tamanhos Touch
**Ferramenta:** Chrome DevTools Mobile Emulator

```bash
# Checklist:
- [ ] Todos os botões ≥ 44x44px em mobile view
- [ ] Inputs ≥ 44px de altura
- [ ] Checkboxes/switches ≥ 24px
- [ ] Tabs ≥ 44px de altura
- [ ] Spacing entre interativos ≥ 12px
```

### Teste 2: Active States
**Teste Manual:** Tocar todos os elementos interativos

```bash
# Checklist:
- [ ] Botões "pressionam" visualmente
- [ ] Cards clicáveis têm feedback
- [ ] Links mudam ao tocar
- [ ] Sem delay no feedback (100ms max)
```

### Teste 3: Acessibilidade
**Ferramentas:** Lighthouse, axe DevTools

```bash
# Checklist:
- [ ] Zoom funciona (200% sem quebrar)
- [ ] Contraste ≥ 4.5:1 (WCAG AA)
- [ ] Todos os interativos teclado-navegáveis
- [ ] Screen reader consegue navegar
```

### Teste 4: Dispositivos Reais
**Testar em:**
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (ambos)

```bash
# Usar servidor local para testar:
pnpm dev
# Acessar via IP local no dispositivo
```

---

## 📊 Métricas de Sucesso

### Antes:
- ❌ Botões: 36px (abaixo do mínimo)
- ❌ Viewport: Zoom bloqueado
- ❌ Active states: ~30% dos componentes
- ❌ Touch-action: Não configurado

### Depois (Meta):
- ✅ Botões: 44px+ (100% conformidade)
- ✅ Viewport: Zoom permitido
- ✅ Active states: 100% dos componentes
- ✅ Touch-action: Configurado globalmente
- ✅ Zero problemas de acessibilidade

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Layout quebra com min-h-[44px]
**Solução:** Usar `min-h-[44px] md:h-10` para desktop menor

### Problema 2: Active state não aparece
**Solução:** Verificar se tem `transition-transform` e `duration-100`

### Problema 3: Botões muito grandes em desktop
**Solução:** Usar breakpoints: `min-h-[44px] md:h-9`

### Problema 4: Inputs não abrem teclado correto
**Solução:** 
```tsx
<Input type="email" inputMode="email" />
<Input type="tel" inputMode="tel" />
<Input type="number" inputMode="numeric" />
```

---

## 📝 Próximos Passos

Após completar esta sprint:
1. ✅ Commit com mensagem: "feat(mobile): implement critical touch-friendly fixes"
2. ✅ Testar em dispositivo real
3. ✅ Documentar problemas encontrados
4. ✅ Iniciar Sprint 2: Gestos e Interações

---

**Status:** 📋 Pronto para Implementar  
**Dependências:** Nenhuma  
**Bloqueadores:** Nenhum  
**Próximo Sprint:** [SPRINT_02_GESTURES.md](./SPRINT_02_GESTURES.md)
