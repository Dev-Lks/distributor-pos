# 📋 Checklist de Implementação - Mobile UX Roadmap

## 🎯 Visão Geral

Este checklist serve como guia rápido para implementar todas as melhorias mobile UX do projeto NitroBeer. Marque cada item conforme completo.

**Status Geral:** 🔴 Não Iniciado

---

## 📱 Sprint 1: Correções Críticas (1-2 dias)

### Fase 1.1: Viewport e Meta Tags
- [ ] Remover `maximumScale: 1` do viewport
- [ ] Remover `userScalable: false` do viewport
- [ ] Adicionar `minimumScale: 1`
- [ ] Adicionar `viewportFit: "cover"` para iOS
- [ ] Testar zoom em dispositivos reais

### Fase 1.2: Touch-Action Global
- [ ] Adicionar `-webkit-tap-highlight-color: transparent` globalmente
- [ ] Adicionar `touch-action: manipulation` globalmente
- [ ] Configurar `scroll-behavior: smooth`
- [ ] Adicionar `-webkit-overflow-scrolling: touch`
- [ ] Testar prevenção de double-tap zoom

### Fase 1.3: Componente Button
- [ ] Atualizar `default` para `min-h-[44px] md:h-10`
- [ ] Atualizar `sm` para `min-h-[44px] md:h-9`
- [ ] Atualizar `lg` para `min-h-[48px] md:h-11`
- [ ] Atualizar `icon` para `min-h-[44px] min-w-[44px] md:size-10`
- [ ] Adicionar `active:scale-[0.97]` na classe base
- [ ] Adicionar `transition-transform duration-100`
- [ ] Testar em todos os usos

### Fase 1.4: Componente Input
- [ ] Adicionar `min-h-[44px] md:h-10`
- [ ] Aumentar padding interno
- [ ] Adicionar `active:scale-[0.99]`
- [ ] Configurar `inputMode` apropriado (email, tel, numeric)
- [ ] Testar com teclado mobile

### Fase 1.5: Checkboxes e Switches
- [ ] Checkbox: `min-h-[24px] min-w-[24px]`
- [ ] Checkbox: adicionar `active:scale-95`
- [ ] Switch: `min-h-[28px] min-w-[48px]`
- [ ] Switch: adicionar `active:scale-95`
- [ ] Testar facilidade de toque

### Fase 1.6: Tabs
- [ ] Adicionar `min-h-[44px] min-w-[80px]`
- [ ] Adicionar `active:scale-95`
- [ ] Configurar scroll horizontal se necessário
- [ ] Testar alternância entre tabs

### Fase 1.7: Active States Globais
- [ ] ProductCard: adicionar `active:scale-[0.98]`
- [ ] OrderCard: adicionar `active:scale-[0.98]`
- [ ] MobileBottomNav links: `min-h-[56px]` e `active:scale-95`
- [ ] FAB actions: ajustar para `active:scale-90`
- [ ] Product Grid (PDV): adicionar `active:scale-[0.97]`
- [ ] Cart items buttons: adicionar `active:scale-90`
- [ ] Testar feedback visual em todos os componentes

### Testes Sprint 1
- [ ] Todos os botões ≥ 44x44px em mobile
- [ ] Active states visíveis em <100ms
- [ ] Zoom funciona (200% sem quebrar)
- [ ] Zero problemas de acessibilidade (Lighthouse)
- [ ] Testar em iPhone e Android

**Status Sprint 1:** ⬜ Não Iniciado

---

## 👆 Sprint 2: Gestos e Interações (2-3 dias)

### Dependências
- [ ] Instalar `@use-gesture/react`
- [ ] Verificar `vaul` (bottom sheets)
- [ ] Opcional: instalar `framer-motion`

### Fase 2.1: Pull-to-Refresh
- [ ] Criar hook `usePullToRefresh.ts`
- [ ] Criar componente `PullToRefreshIndicator.tsx`
- [ ] Implementar em Dashboard
- [ ] Implementar em Product Grid (PDV)
- [ ] Implementar em Inventory
- [ ] Implementar em Orders
- [ ] Implementar em Customers
- [ ] Adicionar feedback háptico
- [ ] Testar em dispositivos reais

### Fase 2.2: Swipe Gestures
- [ ] Criar hook `useSwipeGesture.ts`
- [ ] Criar componente `SwipeableItem.tsx`
- [ ] Aplicar em Cart items (swipe left = deletar)
- [ ] Aplicar em Order list (swipe = ações)
- [ ] Adicionar feedback visual
- [ ] Adicionar vibração
- [ ] Testar sensibilidade do swipe

### Fase 2.3: Bottom Sheets
- [ ] Criar `components/ui/drawer.tsx` (vaul)
- [ ] Criar hook `useMediaQuery.ts`
- [ ] Criar `useIsMobile.ts`
- [ ] Criar componente `ResponsiveDialog.tsx`
- [ ] Converter Payment Panel para bottom sheet
- [ ] Converter Customer Dialog para bottom sheet
- [ ] Converter Add Stock Dialog para bottom sheet
- [ ] Converter Product Details para bottom sheet
- [ ] Converter Cash Session Dialogs para bottom sheet
- [ ] Testar swipe down para fechar

### Fase 2.4: Long-Press Menus
- [ ] Criar hook `useLongPress.ts`
- [ ] Aplicar em Product Cards (menu contextual)
- [ ] Aplicar em Order Cards
- [ ] Adicionar feedback háptico (início e fim)
- [ ] Testar delay (500ms ideal)

### Fase 2.5: Feedback Háptico Global
- [ ] Criar utility `lib/haptics.ts`
- [ ] Adicionar `haptics.light()` em tap comum
- [ ] Adicionar `haptics.success()` ao finalizar venda
- [ ] Adicionar `haptics.warning()` ao deletar item
- [ ] Adicionar `haptics.error()` em erros
- [ ] Testar em iOS e Android
- [ ] Adicionar configuração opcional

### Testes Sprint 2
- [ ] Pull-to-refresh em 5+ páginas
- [ ] Swipe gestures funcionais
- [ ] Bottom sheets em mobile, modals em desktop
- [ ] Long-press abre menus
- [ ] Feedback háptico apropriado
- [ ] Gestos não interferem com scroll

**Status Sprint 2:** ⬜ Aguardando Sprint 1

---

## ⚡ Sprint 3: Performance (3-5 dias)

### Dependências
- [ ] Instalar `react-window`
- [ ] Instalar `react-window-infinite-loader`
- [ ] Instalar `@types/react-window`
- [ ] Opcional: `react-lazy-load-image-component`

### Fase 3.1: Virtual Scrolling
- [ ] Criar componente `VirtualList.tsx`
- [ ] Criar componente `VirtualGrid.tsx`
- [ ] Aplicar em Product Grid (PDV) para 100+ produtos
- [ ] Aplicar em Inventory List
- [ ] Aplicar em Sales Ledger
- [ ] Aplicar em Customer List
- [ ] Aplicar em Order History
- [ ] Testar scroll performance

### Fase 3.2: Infinite Scroll
- [ ] Criar hook `useInfiniteScroll.ts`
- [ ] Criar componente `InfiniteScrollList.tsx`
- [ ] Integrar com React Query (useInfiniteQuery)
- [ ] Aplicar em Sales Ledger
- [ ] Aplicar em Order History
- [ ] Testar carregamento automático

### Fase 3.3: Debouncing e Throttling
- [ ] Criar hook `useDebounce.ts`
- [ ] Criar hook `useThrottle.ts`
- [ ] Aplicar debounce em search inputs (300ms)
- [ ] Aplicar throttle em scroll handlers (100ms)
- [ ] Testar responsividade da UI

### Fase 3.4: Lazy Loading
- [ ] Lazy load SalesChart com `next/dynamic`
- [ ] Lazy load InventoryDashboard
- [ ] Lazy load componentes pesados
- [ ] Criar componente `LazySection.tsx`
- [ ] Implementar lazy loading de imagens
- [ ] Testar bundle sizes

### Fase 3.5: Memoization
- [ ] Adicionar `memo()` em ProductCard
- [ ] Adicionar `memo()` em OrderCard
- [ ] Adicionar `useMemo()` em cálculos pesados
- [ ] Adicionar `useCallback()` em callbacks
- [ ] Otimizar Context Providers
- [ ] Testar com React DevTools Profiler

### Fase 3.6: Bundle Optimization
- [ ] Instalar `@next/bundle-analyzer`
- [ ] Analisar bundle size
- [ ] Configurar `swcMinify: true`
- [ ] Configurar `removeConsole` em produção
- [ ] Otimizar imports (tree shaking)
- [ ] Configurar `optimizePackageImports`
- [ ] Verificar bundle < 300KB

### Testes Sprint 3
- [ ] Scroll suave com 1000+ items
- [ ] FCP < 1.5s
- [ ] TTI < 3s
- [ ] Lighthouse Performance > 90
- [ ] Bundle size reduzido 20%+
- [ ] Memória constante (não cresce)

**Status Sprint 3:** ⬜ Aguardando Sprint 2

---

## ✨ Sprint 4: Polish e UX Avançado (2-3 dias)

### Dependências Opcionais
- [ ] Opcional: instalar `framer-motion`

### Fase 4.1: Skeleton Loaders
- [ ] Melhorar componente base `Skeleton.tsx`
- [ ] Criar `ShimmerSkeleton.tsx`
- [ ] Criar `TextSkeleton.tsx`
- [ ] Criar `CardSkeleton.tsx`
- [ ] Criar `ProductCardSkeleton.tsx`
- [ ] Criar `OrderCardSkeleton.tsx`
- [ ] Criar `StatCardSkeleton.tsx`
- [ ] Aplicar em todos os loading states
- [ ] Adicionar animação shimmer no CSS

### Fase 4.2: Empty States
- [ ] Criar componente `EmptyState.tsx`
- [ ] Implementar empty cart
- [ ] Implementar no products list
- [ ] Implementar no orders list
- [ ] Implementar no customers list
- [ ] Implementar error states
- [ ] Adicionar CTAs apropriados
- [ ] Testar todos os cenários

### Fase 4.3: Micro-Interactions
- [ ] Criar `SuccessCheck.tsx` (checkmark animado)
- [ ] Implementar animação "add to cart"
- [ ] Criar `CountUp.tsx` (números animados)
- [ ] Criar `RippleButton.tsx` (ripple effect)
- [ ] Implementar slide-in cards (stagger)
- [ ] Aplicar em KPIs do dashboard
- [ ] Testar performance (60fps)

### Fase 4.4: Page Transitions
- [ ] Criar componente `PageTransition.tsx`
- [ ] Aplicar no DashboardLayout
- [ ] Melhorar transições de Dialog/Modal
- [ ] Implementar fade/slide animations
- [ ] Testar navegação entre páginas

### Fase 4.5: Acessibilidade
- [ ] Criar hook `useReducedMotion.ts`
- [ ] Aplicar condicionalmente em animações
- [ ] Adicionar CSS para `prefers-reduced-motion`
- [ ] Verificar ARIA labels
- [ ] Testar keyboard navigation
- [ ] Rodar axe DevTools

### Fase 4.6: Loading States Avançados
- [ ] Criar `ProgressBar.tsx` global
- [ ] Adicionar no RootLayout
- [ ] Criar `Loader.tsx` customizado
- [ ] Aplicar em loading states críticos
- [ ] Evitar flicker (<300ms)

### Testes Sprint 4
- [ ] Todas animações a 60fps
- [ ] Skeletons em 100% dos loading states
- [ ] Empty states informativos
- [ ] Respeita `prefers-reduced-motion`
- [ ] Lighthouse Accessibility 100
- [ ] WCAG AA compliance

**Status Sprint 4:** ⬜ Aguardando Sprint 3

---

## 🚀 Validação Final e Deploy

### Testes Finais
- [ ] Lighthouse Mobile: Performance > 90
- [ ] Lighthouse Mobile: Accessibility 100
- [ ] Lighthouse Mobile: Best Practices > 90
- [ ] Lighthouse Mobile: SEO > 90
- [ ] Testar em iPhone (Safari)
- [ ] Testar em Android (Chrome)
- [ ] Testar em tablet
- [ ] Testar com slow 3G
- [ ] Testar com CPU throttling

### Performance Metrics
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 200ms

### UX Metrics
- [ ] Todos os touch targets ≥ 44px
- [ ] Active states em 100% dos interativos
- [ ] Pull-to-refresh em todas as listas
- [ ] Swipe gestures funcionais
- [ ] Bottom sheets em mobile
- [ ] Feedback háptico apropriado

### Documentação
- [ ] Atualizar CHANGELOG.md
- [ ] Documentar breaking changes
- [ ] Criar guia de uso mobile
- [ ] Documentar novos componentes
- [ ] Atualizar README.md

### Deploy
- [ ] Criar branch `feat/mobile-ux-improvements`
- [ ] Commits organizados por sprint
- [ ] Pull Request com descrição completa
- [ ] Code review
- [ ] Deploy para staging
- [ ] Testes de usuário beta
- [ ] Coletar feedback
- [ ] Ajustes finais
- [ ] Merge para main
- [ ] Deploy para produção 🎉

---

## 📊 Resumo de Progresso

### Sprint 1: Correções Críticas
**Status:** ⬜ 0% completo (0/7 fases)

### Sprint 2: Gestos e Interações
**Status:** ⬜ 0% completo (0/5 fases)

### Sprint 3: Performance
**Status:** ⬜ 0% completo (0/6 fases)

### Sprint 4: Polish e UX Avançado
**Status:** ⬜ 0% completo (0/6 fases)

### **Progresso Total:** 0% (0/24 fases)

---

## 🎯 Quick Start

Para começar a implementação:

1. **Leia o Roadmap Principal:** `MOBILE_UX_ROADMAP.md`
2. **Inicie pela Sprint 1:** `SPRINT_01_CRITICAL_FIXES.md`
3. **Marque os checkboxes** neste arquivo conforme avança
4. **Teste continuamente** em dispositivos reais
5. **Documente problemas** encontrados
6. **Peça feedback** de usuários

---

**Última Atualização:** 06 de Outubro de 2025  
**Responsável:** Dev Team  
**Objetivo:** Mobile UX Seamless e Profissional 🚀
