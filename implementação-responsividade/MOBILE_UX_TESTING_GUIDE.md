# 🔍 Guia de Testes Mobile UX - NitroBeer

## 📋 Objetivo
Este documento serve como guia completo para testar todas as melhorias mobile implementadas, garantindo qualidade e experiência seamless.

---

## 🧪 Tipos de Teste

### 1. Testes Manuais (Dispositivos Reais)
### 2. Testes Automatizados (Lighthouse, axe)
### 3. Testes de Performance
### 4. Testes de Acessibilidade
### 5. Testes de Usabilidade

---

## 📱 Dispositivos para Teste

### Mínimo Requerido:
- [ ] **iPhone** (iOS 15+, Safari)
- [ ] **Android** (Android 10+, Chrome)

### Recomendado:
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch/dynamic island)
- [ ] iPad (tablet)
- [ ] Samsung Galaxy S21 (Android high-end)
- [ ] Xiaomi/Motorola (Android mid-range)

### Emuladores (Desenvolvimento):
- [ ] Chrome DevTools Mobile Emulator
- [ ] Firefox Responsive Design Mode
- [ ] Xcode Simulator (iOS)
- [ ] Android Studio Emulator

---

## ✅ Sprint 1: Testes de Correções Críticas

### Teste 1.1: Viewport e Zoom
**Dispositivo:** Todos

#### Checklist:
- [ ] Usuário consegue dar zoom (pinch-to-zoom)
- [ ] Zoom de 200% não quebra layout
- [ ] Zoom de 300% mantém funcionalidade
- [ ] Double-tap zoom funciona
- [ ] Zoom em input fields funciona (iOS)
- [ ] Fontes escalam com configurações do sistema

#### Como Testar:
```bash
1. Abrir qualquer página no mobile
2. Fazer pinch-to-zoom
3. Verificar se layout permanece funcional
4. Ir em Configurações > Display > Font Size
5. Aumentar tamanho da fonte
6. Voltar ao app e verificar escala
```

#### Critérios de Sucesso:
- ✅ Zoom funciona sem travar
- ✅ Layout não quebra em zoom
- ✅ Textos escalam com sistema

---

### Teste 1.2: Touch Targets (Tamanhos)
**Dispositivo:** iPhone SE (tela menor)

#### Checklist:
- [ ] Todos os botões ≥ 44x44px
- [ ] Inputs ≥ 44px de altura
- [ ] Checkboxes ≥ 24x24px
- [ ] Switches ≥ 28x48px
- [ ] Tabs ≥ 44px de altura
- [ ] Links na bottom nav ≥ 56px
- [ ] FAB ≥ 56x56px
- [ ] Cards clicáveis com padding suficiente

#### Como Testar:
```bash
1. Abrir Chrome DevTools
2. Device: iPhone SE
3. Medir elementos com ruler
4. Verificar CSS (min-h-[44px])
5. Testar toque sem erro
```

#### Ferramenta:
```javascript
// Executar no console para highlight small targets
document.querySelectorAll('button, a, input, [role="button"]').forEach(el => {
  const rect = el.getBoundingClientRect()
  if (rect.width < 44 || rect.height < 44) {
    el.style.outline = '3px solid red'
    console.warn('Small touch target:', el, `${rect.width}x${rect.height}`)
  }
})
```

#### Critérios de Sucesso:
- ✅ Nenhum elemento interativo < 44px
- ✅ Fácil de tocar sem erro
- ✅ Espaçamento adequado entre elementos

---

### Teste 1.3: Active States (Feedback Visual)
**Dispositivo:** Todos

#### Checklist:
- [ ] Botões "pressionam" ao tocar (scale-down)
- [ ] Cards clicáveis têm feedback
- [ ] Links da bottom nav mudam ao tocar
- [ ] FAB e suas ações têm feedback
- [ ] Tabs têm feedback
- [ ] Inputs têm feedback (sutil)
- [ ] Checkboxes/switches animam

#### Como Testar:
```bash
1. Tocar cada elemento interativo
2. Observar feedback visual
3. Verificar delay (<100ms ideal)
4. Testar em slow motion (se possível)
```

#### Critérios de Sucesso:
- ✅ Feedback instantâneo (<100ms)
- ✅ Animação suave (não abrupta)
- ✅ Visual claro de "pressed"
- ✅ Transição suave de volta

---

### Teste 1.4: Touch-Action (Prevenção de Zoom)
**Dispositivo:** iPhone (Safari)

#### Checklist:
- [ ] Botões: sem double-tap zoom
- [ ] Cards: sem double-tap zoom
- [ ] Links: sem double-tap zoom
- [ ] Sem flash azul ao tocar (iOS)
- [ ] Sem highlight laranja (Android)

#### Como Testar:
```bash
1. Dar double-tap rápido em botão
2. Verificar se zoom NÃO acontece
3. Verificar ausência de highlight
4. Testar em vários elementos
```

#### Critérios de Sucesso:
- ✅ Double-tap zoom desabilitado em interativos
- ✅ Sem highlight colors
- ✅ Scroll funciona normalmente

---

## 👆 Sprint 2: Testes de Gestos

### Teste 2.1: Pull-to-Refresh
**Páginas:** Dashboard, Products, Inventory, Orders, Customers

#### Checklist:
- [ ] Ativa apenas quando scroll no topo
- [ ] Visual claro do progresso (spinner/icon)
- [ ] Feedback háptico ao completar (vibração)
- [ ] Dados realmente atualizam
- [ ] Animação suave
- [ ] Não interfere com scroll normal
- [ ] Não ativa acidentalmente

#### Como Testar:
```bash
1. Scroll até o topo da página
2. Puxar para baixo (swipe down)
3. Observar indicador visual
4. Sentir vibração ao completar
5. Verificar se dados atualizaram
6. Tentar ativar no meio da página (não deve)
```

#### Critérios de Sucesso:
- ✅ Funciona em todas as listas
- ✅ Visual claro e informativo
- ✅ Vibração apropriada
- ✅ Dados realmente atualizam

---

### Teste 2.2: Swipe Gestures
**Páginas:** Cart, Orders

#### Checklist:
- [ ] Swipe left deleta item (carrinho)
- [ ] Swipe right abre ações (opcional)
- [ ] Visual das ações claro
- [ ] Threshold apropriado (~80px)
- [ ] Feedback háptico ao completar
- [ ] Animação suave
- [ ] Não interfere com scroll vertical
- [ ] Pode cancelar swipe (voltar)

#### Como Testar:
```bash
1. Abrir carrinho com itens
2. Swipe left em um item
3. Verificar se ícone/texto aparece
4. Completar swipe (>threshold)
5. Verificar se item foi deletado
6. Sentir vibração
7. Testar cancelamento (swipe de volta)
```

#### Critérios de Sucesso:
- ✅ Swipe natural e responsivo
- ✅ Visual claro do que vai acontecer
- ✅ Confirmação (ou undo) disponível
- ✅ Não conflita com scroll

---

### Teste 2.3: Bottom Sheets (vs Modals)
**Componentes:** Payment, Customer Dialog, Add Stock

#### Checklist Desktop (≥768px):
- [ ] Abre como modal tradicional
- [ ] Overlay clicável
- [ ] ESC fecha modal
- [ ] Animação fade-in

#### Checklist Mobile (<768px):
- [ ] Abre como bottom sheet
- [ ] Swipe down para fechar
- [ ] Handle bar visível
- [ ] Animação slide-up
- [ ] Backdrop clicável
- [ ] Scroll interno funciona
- [ ] Não abre keyboard pushando conteúdo

#### Como Testar:
```bash
# Mobile:
1. Abrir qualquer dialog
2. Verificar se é bottom sheet
3. Tentar swipe down para fechar
4. Verificar handle bar
5. Scroll interno
6. Tocar backdrop

# Desktop:
1. Abrir em desktop view
2. Verificar se é modal central
3. ESC fecha
4. Click fora fecha
```

#### Critérios de Sucesso:
- ✅ Desktop: modal tradicional
- ✅ Mobile: bottom sheet
- ✅ Swipe down funciona
- ✅ Transições suaves

---

### Teste 2.4: Long-Press (Menus Contextuais)
**Componentes:** Product Cards, Order Cards

#### Checklist:
- [ ] Vibração ao iniciar (feedback)
- [ ] Vibração ao completar
- [ ] Menu aparece após ~500ms
- [ ] Não interfere com scroll
- [ ] Visual indica "holding"
- [ ] Click normal ainda funciona
- [ ] Menu tem ações relevantes

#### Como Testar:
```bash
1. Segurar (long-press) um card
2. Sentir vibração inicial
3. Aguardar ~500ms
4. Menu contextual aparece
5. Sentir vibração de completar
6. Testar também tap rápido (ação normal)
```

#### Critérios de Sucesso:
- ✅ Delay apropriado (500ms)
- ✅ Vibrações distintas
- ✅ Menu útil e contextual
- ✅ Não conflita com outras ações

---

### Teste 2.5: Feedback Háptico
**Todas as ações críticas**

#### Checklist:
- [ ] Adicionar ao carrinho: vibração leve
- [ ] Finalizar venda: padrão de sucesso
- [ ] Deletar item: vibração warning
- [ ] Erro: padrão de erro
- [ ] Swipe completado: vibração média
- [ ] Long-press: vibrações de início/fim
- [ ] Pull-to-refresh: vibração ao completar

#### Intensidades:
- Light: 10ms
- Medium: 30ms
- Heavy: 50ms
- Success: [30, 50, 30]
- Error: [50, 100, 50, 100, 50]

#### Como Testar:
```bash
1. Executar cada ação
2. Sentir vibração
3. Verificar se intensidade apropriada
4. Verificar se não é invasivo
```

#### Critérios de Sucesso:
- ✅ Vibrações distintas por tipo
- ✅ Não invasivas
- ✅ Funcionam em iOS e Android
- ✅ Opcional (pode desabilitar)

---

## ⚡ Sprint 3: Testes de Performance

### Teste 3.1: Virtual Scrolling
**Páginas:** Products (100+ items), Inventory, Sales Ledger

#### Checklist:
- [ ] Scroll suave a 60fps
- [ ] Memória constante (não cresce)
- [ ] Renderiza apenas items visíveis
- [ ] Overscan funciona (pré-carrega próximos)
- [ ] Sem items "piscando"
- [ ] Funciona com pesquisa/filtros
- [ ] Funciona em diferentes screen sizes

#### Como Testar:
```bash
# Performance Monitor:
1. Chrome DevTools > Performance
2. Start recording
3. Scroll rapidamente pela lista (1000+ items)
4. Stop recording
5. Verificar FPS (deve ser ~60)
6. Verificar memória (heap não deve crescer)

# Memory:
1. DevTools > Memory
2. Take heap snapshot
3. Scroll pela lista completa
4. Take outro snapshot
5. Comparar (crescimento deve ser mínimo)
```

#### Critérios de Sucesso:
- ✅ Scroll a 60fps constante
- ✅ Memória < 100MB
- ✅ Sem janks ou stutters
- ✅ Funciona com 1000+ items

---

### Teste 3.2: Infinite Scroll
**Páginas:** Sales Ledger, Order History

#### Checklist:
- [ ] Carrega próxima página automaticamente
- [ ] Loading indicator visível
- [ ] Não carrega duplicatas
- [ ] Pára quando não há mais dados
- [ ] Mensagem de "fim" clara
- [ ] Não afeta performance
- [ ] Funciona com pull-to-refresh

#### Como Testar:
```bash
1. Abrir página com infinite scroll
2. Scroll até o fim
3. Verificar loading indicator
4. Nova página carrega automaticamente
5. Continuar até fim dos dados
6. Verificar mensagem de fim
7. Pull-to-refresh e testar novamente
```

#### Critérios de Sucesso:
- ✅ Carregamento suave
- ✅ Sem duplicatas
- ✅ Estados claros (loading, end)
- ✅ Performance mantida

---

### Teste 3.3: Debounce em Search
**Páginas:** Products, Customers, Orders

#### Checklist:
- [ ] Busca NÃO dispara a cada tecla
- [ ] Delay de ~300ms após parar de digitar
- [ ] Loading state durante busca
- [ ] Resultados corretos
- [ ] Cancela busca anterior se nova digitação
- [ ] Indicador de "pesquisando..."

#### Como Testar:
```bash
1. Abrir campo de busca
2. Digitar rápido "cerveja gelada"
3. Observar network tab
4. Deve fazer apenas 1 request (após 300ms de pausa)
5. Testar cancelamento (digitar antes de 300ms)
```

#### Ferramenta:
```javascript
// No console, monitorar requests:
let requestCount = 0
const originalFetch = window.fetch
window.fetch = (...args) => {
  console.log('Fetch #', ++requestCount, args[0])
  return originalFetch(...args)
}
```

#### Critérios de Sucesso:
- ✅ Máximo 1 request por termo
- ✅ Delay apropriado (300ms)
- ✅ UI responsiva
- ✅ Menos carga no servidor

---

### Teste 3.4: Bundle Size
**Ferramenta:** Lighthouse, Webpack Bundle Analyzer

#### Checklist:
- [ ] First Load JS < 200KB
- [ ] Total Bundle < 500KB
- [ ] Lazy load de componentes pesados
- [ ] Tree shaking funcionando
- [ ] Vendor chunks separados
- [ ] Dynamic imports corretos

#### Como Testar:
```bash
# Build de produção:
pnpm build

# Analisar:
ANALYZE=true pnpm build

# Lighthouse:
1. Chrome DevTools > Lighthouse
2. Mode: Navigation
3. Device: Mobile
4. Run audit
5. Verificar "Performance" score
```

#### Métricas Alvo:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.0s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1

#### Critérios de Sucesso:
- ✅ Lighthouse Performance > 90
- ✅ Bundle < 300KB
- ✅ All metrics green

---

### Teste 3.5: Network Throttling
**Conexão:** Fast 3G, Slow 3G

#### Checklist:
- [ ] Skeleton loaders aparecem
- [ ] App permanece usável
- [ ] Lazy loading funciona
- [ ] Imagens carregam progressivamente
- [ ] Não há layout shift
- [ ] Loading states informativos
- [ ] Retry em caso de falha

#### Como Testar:
```bash
1. Chrome DevTools > Network
2. Throttling: Fast 3G
3. Recarregar página
4. Observar comportamento
5. Testar ações (adicionar ao carrinho, etc)
6. Repetir com Slow 3G
```

#### Critérios de Sucesso:
- ✅ App usável mesmo em slow 3G
- ✅ Feedback claro de loading
- ✅ Sem erros de timeout
- ✅ Graceful degradation

---

## ✨ Sprint 4: Testes de Polish

### Teste 4.1: Skeleton Loaders
**Todas as páginas com loading**

#### Checklist:
- [ ] Skeletons refletem layout real
- [ ] Shimmer effect suave
- [ ] Duração apropriada (mín. 300ms)
- [ ] Sem layout shift ao carregar
- [ ] Cores adequadas (light/dark mode)
- [ ] Skeletons específicos (não genéricos)

#### Como Testar:
```bash
1. Limpar cache
2. Throttle: Fast 3G
3. Carregar cada página
4. Verificar skeletons
5. Comparar com layout final
6. Verificar se há shift
```

#### Critérios de Sucesso:
- ✅ Layout mantém-se estável
- ✅ Visual agradável
- ✅ Indica tipo de conteúdo
- ✅ Sem CLS (Cumulative Layout Shift)

---

### Teste 4.2: Empty States
**Listas vazias, erros, sem resultados**

#### Checklist:
- [ ] Ícone apropriado ao contexto
- [ ] Mensagem clara e útil
- [ ] CTA quando aplicável
- [ ] Animação sutil
- [ ] Cores adequadas
- [ ] Não parece "erro"

#### Cenários para Testar:
```bash
1. Carrinho vazio
2. Busca sem resultados
3. Lista de pedidos vazia
4. Erro de conexão
5. Permissão negada
6. Dados não encontrados
```

#### Critérios de Sucesso:
- ✅ Informativo, não assusta
- ✅ Oferece próximo passo
- ✅ Visual clean
- ✅ Consistente em todo app

---

### Teste 4.3: Animações (60fps)
**Todas as micro-interactions**

#### Checklist:
- [ ] Todas rodam a 60fps
- [ ] Não causam jank
- [ ] Desabilitadas com `prefers-reduced-motion`
- [ ] Não atrasam interação
- [ ] Duração apropriada (150-300ms)
- [ ] Easing natural

#### Como Testar:
```bash
# Performance:
1. DevTools > Performance
2. Record
3. Executar animações
4. Verificar FPS (deve ser 60)
5. Verificar se há frame drops

# Reduced Motion:
1. Sistema > Acessibilidade > Reduzir Movimento
2. Habilitar
3. Recarregar app
4. Verificar se animações desabilitadas
```

#### Critérios de Sucesso:
- ✅ 60fps constante
- ✅ Sem janks
- ✅ Respeita preferências do usuário
- ✅ Melhora UX, não distrai

---

### Teste 4.4: Acessibilidade
**WCAG 2.1 Level AA**

#### Checklist:
- [ ] Contraste ≥ 4.5:1 (texto normal)
- [ ] Contraste ≥ 3:1 (texto grande)
- [ ] Todos interativos teclado-navegáveis
- [ ] Focus visível e claro
- [ ] ARIA labels presentes
- [ ] Screen reader funciona
- [ ] Zoom até 200% funciona
- [ ] Respeita `prefers-reduced-motion`
- [ ] Respeita `prefers-color-scheme`

#### Ferramentas:
```bash
# Lighthouse:
- Run Accessibility audit

# axe DevTools:
- Install extension
- Run scan
- Fix all issues

# Keyboard:
- Tab through entire app
- Verify focus order
- Test shortcuts
```

#### Critérios de Sucesso:
- ✅ Lighthouse Accessibility: 100
- ✅ axe: Zero issues
- ✅ Keyboard navigation completa
- ✅ Screen reader friendly

---

## 📊 Relatório de Testes

### Template de Relatório

```markdown
# Relatório de Testes Mobile UX - [Data]

## Dispositivos Testados
- [ ] iPhone [modelo] - iOS [versão]
- [ ] Android [modelo] - Android [versão]
- [ ] iPad [modelo]

## Sprint 1: Correções Críticas
- Viewport: ✅ / ⚠️ / ❌
- Touch Targets: ✅ / ⚠️ / ❌
- Active States: ✅ / ⚠️ / ❌
- Touch Action: ✅ / ⚠️ / ❌

**Problemas Encontrados:**
1. [Descrição do problema]
2. [Descrição do problema]

## Sprint 2: Gestos
- Pull-to-Refresh: ✅ / ⚠️ / ❌
- Swipe Gestures: ✅ / ⚠️ / ❌
- Bottom Sheets: ✅ / ⚠️ / ❌
- Long-Press: ✅ / ⚠️ / ❌
- Haptic Feedback: ✅ / ⚠️ / ❌

**Problemas Encontrados:**
1. [Descrição do problema]

## Sprint 3: Performance
- Virtual Scrolling: ✅ / ⚠️ / ❌
- Infinite Scroll: ✅ / ⚠️ / ❌
- Debounce: ✅ / ⚠️ / ❌
- Bundle Size: ✅ / ⚠️ / ❌

**Métricas:**
- Lighthouse Performance: [score]
- FCP: [tempo]s
- TTI: [tempo]s
- Bundle Size: [tamanho]KB

## Sprint 4: Polish
- Skeleton Loaders: ✅ / ⚠️ / ❌
- Empty States: ✅ / ⚠️ / ❌
- Animations: ✅ / ⚠️ / ❌
- Accessibility: ✅ / ⚠️ / ❌

**Métricas:**
- Lighthouse Accessibility: [score]
- axe Issues: [número]

## Resumo
**Status Geral:** ✅ Aprovado / ⚠️ Aprovado com ressalvas / ❌ Reprovado

**Principais Issues:**
1. [Issue crítico]
2. [Issue médio]
3. [Issue menor]

**Recomendações:**
1. [Recomendação]
2. [Recomendação]
```

---

## 🎯 Critérios de Aprovação

### Mínimo para Produção:
- ✅ Lighthouse Performance: > 80
- ✅ Lighthouse Accessibility: > 95
- ✅ Todos touch targets ≥ 44px
- ✅ Active states em 100% dos interativos
- ✅ Zero issues críticos de acessibilidade
- ✅ App funcional em slow 3G
- ✅ Testado em iPhone e Android

### Ideal:
- ✅ Lighthouse Performance: > 90
- ✅ Lighthouse Accessibility: 100
- ✅ Gestos nativos implementados
- ✅ Performance a 60fps constante
- ✅ Bundle < 300KB
- ✅ Zero issues de acessibilidade

---

**Mantenha este guia atualizado conforme novas funcionalidades são adicionadas!**
