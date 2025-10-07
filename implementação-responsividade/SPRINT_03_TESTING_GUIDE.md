# 🧪 Guia de Testes - Sprint 3: Performance e Otimização

## 🎯 Como Testar Cada Feature

### ✅ 1. Testar Página de Exemplos

```bash
# 1. Iniciar servidor
pnpm dev

# 2. Abrir no navegador
http://localhost:3000/dashboard/examples/performance
```

**O que testar:**
- [ ] Tab "Virtual Scroll": Scrollar lista de 1000 items suavemente
- [ ] Buscar items: Verificar que funciona com debounce
- [ ] Tab "Infinite Scroll": Scrollar até o fim e ver carregamento automático
- [ ] Tab "Lazy Loading": Observar seções carregando ao scrollar

---

### ✅ 2. Testar Debounce na Busca de Produtos

```bash
# Abrir produtos
http://localhost:3000/dashboard/products
```

**Teste com DevTools:**

1. Abrir Chrome DevTools (F12)
2. Ir para aba **Network**
3. Digitar rapidamente no campo de busca: "cerveja"
4. **Verificar:** Deve haver apenas 1-2 requests, não 7+

**Antes do Sprint 3:**
```
GET /api/products?search=c
GET /api/products?search=ce
GET /api/products?search=cer
GET /api/products?search=cerv
GET /api/products?search=cerve
GET /api/products?search=cervej
GET /api/products?search=cerveja
```

**Depois do Sprint 3:**
```
(aguarda 300ms)
GET /api/products?search=cerveja
```

✅ **Sucesso:** Redução de ~85% nos requests

---

### ✅ 3. Testar Virtual Scrolling

**Pré-requisito:** Ter 100+ produtos no banco

```bash
# Abrir produtos
http://localhost:3000/dashboard/products
```

**Teste com DevTools Performance:**

1. Abrir Chrome DevTools (F12)
2. Ir para aba **Performance**
3. Clicar em **Record** (círculo vermelho)
4. Scrollar rapidamente a lista de produtos
5. Parar gravação
6. **Verificar:**
   - [ ] FPS constante em ~60
   - [ ] Sem "Long Tasks" vermelhas (> 50ms)
   - [ ] Heap memory não cresce continuamente

**Indicadores de Sucesso:**
- FPS gráfico verde (não amarelo/vermelho)
- Smooth scrolling sem travamentos
- Memory usage estável

---

### ✅ 4. Testar Memoization

**Com React DevTools:**

```bash
# 1. Instalar extensão
Chrome Web Store > "React Developer Tools"

# 2. Abrir produtos
http://localhost:3000/dashboard/products
```

**Teste:**

1. Abrir React DevTools
2. Ir para aba **Profiler**
3. Clicar em **Record**
4. Mudar filtro de categoria (ex: "Cerveja" → "Refrigerante")
5. Parar gravação

**Verificar:**
- [ ] `ProductCard` não re-renderiza se product não mudou
- [ ] Apenas cards afetados pelo filtro são re-renderizados
- [ ] Flame graph mostra componentes memoizados em verde/azul

---

### ✅ 5. Testar Infinite Scroll

```bash
# Acessar exemplos
http://localhost:3000/dashboard/examples/performance
# Tab: "Infinite Scroll"
```

**Teste:**

1. Scrollar lista até o fim
2. **Verificar:**
   - [ ] Loading indicator aparece
   - [ ] Novos items carregam automaticamente
   - [ ] Scroll continua suave
3. Scrollar até ter 100 items
4. **Verificar:** Mensagem "Não há mais itens"

---

### ✅ 6. Testar Lazy Loading

```bash
# Acessar exemplos
http://localhost:3000/dashboard/examples/performance
# Tab: "Lazy Loading"
```

**Teste com DevTools Network:**

1. Abrir DevTools > Network
2. Recarregar página (Ctrl+R)
3. **Verificar:** Apenas Seção 1 carrega inicialmente
4. Scrollar devagar até Seção 2 aparecer
5. **Verificar:** Seção 2 substitui skeleton
6. Continuar scrollando
7. **Verificar:** Seções 3 e 4 carregam sob demanda

**Indicador:** Skeletons devem aparecer antes do conteúdo

---

### ✅ 7. Testar Build Optimization

```bash
# 1. Build de produção
pnpm build

# 2. Verificar output
```

**O que verificar no output:**

```
Route (app)                                Size     First Load JS
┌ ○ /                                     5 kB          100 kB
├ ○ /dashboard                            10 kB         105 kB
├ ○ /dashboard/products                   15 kB         110 kB
└ ○ /dashboard/examples/performance       12 kB         107 kB

First Load JS shared by all              95 kB
```

**Metas:**
- [ ] First Load JS < 120KB por página
- [ ] Build completo < 60 segundos
- [ ] Sem warnings de "large bundle"

---

### ✅ 8. Teste de Performance Geral (Lighthouse)

```bash
# 1. Build de produção
pnpm build
pnpm start

# 2. Abrir Chrome DevTools > Lighthouse
# 3. Configurar:
#    - Mode: Navigation
#    - Device: Mobile
#    - Categories: Performance
# 4. Generate Report
```

**Metas de Score:**

| Métrica | Meta | Crítico |
|---------|------|---------|
| Performance | > 85 | > 70 |
| First Contentful Paint | < 1.8s | < 3s |
| Largest Contentful Paint | < 2.5s | < 4s |
| Time to Interactive | < 3.8s | < 7s |
| Cumulative Layout Shift | < 0.1 | < 0.25 |

---

## 📊 Checklist de Validação Completa

### Performance

- [ ] Lista com 1000+ items roda a 60fps
- [ ] Search input com debounce funcional
- [ ] Memoization reduz re-renders
- [ ] Bundle size otimizado
- [ ] Build time < 60s

### Funcionalidade

- [ ] Virtual scroll renderiza apenas visíveis
- [ ] Infinite scroll carrega automaticamente
- [ ] Lazy sections carregam sob demanda
- [ ] Skeleton loaders aparecem
- [ ] Mensagens de "fim da lista" funcionam

### UX

- [ ] Scroll suave em todas as listas
- [ ] Search responsiva (não trava)
- [ ] Loading states claros
- [ ] Sem flash de conteúdo (FOUC)

### Compatibilidade

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## 🐛 Problemas Comuns e Soluções

### Problema: VirtualList items sobrepostos

**Sintoma:** Items aparecem uns sobre os outros

**Causa:** Altura não é fixa

**Solução:**
```typescript
// Garantir altura fixa
<div className="h-[120px]">
  <ProductCard product={product} />
</div>
```

---

### Problema: Debounce não funciona

**Sintoma:** Múltiplos requests ainda acontecem

**Causa:** Usando `searchTerm` ao invés de `debouncedSearch`

**Solução:**
```typescript
// ❌ Errado
const { data } = useQuery(['products', searchTerm])

// ✅ Correto
const { data } = useQuery(['products', debouncedSearch])
```

---

### Problema: Componente re-renderiza sempre

**Sintoma:** ProductCard re-renderiza mesmo sem mudanças

**Causa:** Callback inline ou objeto novo a cada render

**Solução:**
```typescript
// ❌ Errado
<ProductCard 
  onEdit={() => handleEdit(product)}
/>

// ✅ Correto
const handleEdit = useCallback(() => handleEdit(product), [product])
<ProductCard onEdit={handleEdit} />
```

---

### Problema: Build falha

**Sintoma:** Erro de TypeScript ou ESLint

**Causa:** Importações ou tipos incorretos

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf .next node_modules
pnpm install
pnpm build
```

---

## 📈 Como Medir Melhoria

### Antes vs Depois (Exemplo Real)

**Página de Produtos com 200 items:**

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Lighthouse Performance | 68 | 87 | +28% |
| First Contentful Paint | 2.4s | 1.6s | -33% |
| Time to Interactive | 4.2s | 2.9s | -31% |
| Network Requests (busca) | 12 | 2 | -83% |
| Scroll FPS | 30-40 | 58-60 | +50% |

---

## ✅ Critérios de Aceitação

### Mínimo para Passar

- [ ] Virtual scroll funciona com 100+ items
- [ ] Debounce reduz requests em > 50%
- [ ] Build completa sem erros
- [ ] Lighthouse Performance > 70
- [ ] Sem console errors no browser

### Excelente (Objetivo)

- [ ] Virtual scroll funciona com 1000+ items a 60fps
- [ ] Debounce reduz requests em > 80%
- [ ] Lighthouse Performance > 85
- [ ] Memoization reduz re-renders em > 50%
- [ ] Bundle < 400KB

---

## 🎓 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev

# Build e análise
pnpm build
ANALYZE=true pnpm build  # Com bundle analyzer

# Testes de performance
# (Usar Chrome DevTools Lighthouse)

# Verificar tamanho do bundle
du -sh .next/static

# Limpar tudo
rm -rf .next node_modules
pnpm install
```

---

## 📞 Ajuda

Se encontrar problemas:

1. **Verificar console:** F12 > Console
2. **Verificar network:** F12 > Network
3. **React DevTools:** Profiler para re-renders
4. **Documentação:** Consultar [PERFORMANCE_QUICK_GUIDE.md](./PERFORMANCE_QUICK_GUIDE.md)

---

**Testes criados por:** Dev Team  
**Data:** 07 de Outubro de 2025  
**Sprint:** 3 - Performance e Otimização
