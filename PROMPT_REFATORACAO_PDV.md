# Prompt de Refatoração: Sistema PDV e Gestão de Vendas

## Contexto do Projeto
Sistema de gestão comercial (NitroBeer) com foco em PDV (Ponto de Venda), controle de estoque, gestão de caixa e relatórios. Atualmente com ~2000 linhas no PDV principal e estrutura que precisa de otimização.

---

## 🎯 OBJETIVOS DA REFATORAÇÃO

### 1. **Tela de Vendas (PDV) - `app/(app)/dashboard/sales/page.tsx`**

#### Problemas Atuais:
- ❌ Arquivo com quase 2000 linhas - difícil manutenção
- ❌ Muita lógica misturada (carrinho, pagamento, cliente, caixa)
- ❌ Diálogos complexos aninhados (cliente, abertura/fechamento caixa, transações)
- ❌ Estado local excessivo (27+ useState)
- ❌ Callbacks interdependentes difíceis de rastrear

#### Ações Necessárias:

**A. Modularização de Componentes**
Extrair para componentes separados:

1. **`CartSection.tsx`** - Gestão do carrinho
   - Lista de itens
   - Cálculo de totais
   - Botões de adicionar/remover
   - Integração com estoque por ponto de venda

2. **`ProductGrid.tsx`** - Grade de produtos
   - Filtros (busca, tamanho, categoria)
   - Modo rápido vs. detalhado
   - Cards de produto
   - Stock alerts

3. **`PaymentPanel.tsx`** - Painel de pagamento
   - Seleção de método (cash/card/pix)
   - Input de valor recebido + cálculo de troco
   - Botão finalizar venda

4. **`CustomerDialog.tsx`** - Gerenciamento de cliente
   - Prompt: "Quer cadastrar?"
   - Formulário de cadastro
   - Toggle de ativar/desativar prompt

5. **`CashSessionPanel.tsx`** - Controle de caixa
   - Status da sessão
   - Botões: Abrir/Suprimento/Sangria/Fechar
   - Totais por método
   - Transações recentes
   - **Remover**: Exportação de relatórios Z (mover para relatórios)

6. **`CashDialogs.tsx`** - Diálogos de caixa
   - Abertura de caixa
   - Registro de transação (suprimento/sangria/ajuste)
   - Fechamento de caixa

**B. Hooks Customizados**
Criar hooks para lógica reutilizável:

1. **`useCart.ts`**
   ```typescript
   // Gerencia: cart state, addToCart, updateQuantity, removeFromCart, clearCart
   // Sincroniza com estoque disponível
   ```

2. **`useCheckout.ts`**
   ```typescript
   // Gerencia: finalizeSale, validação, integração com createSale API
   // Controla estados de loading e erros
   ```

3. **`useCashSessionControls.ts`**
   ```typescript
   // Wrapper para useCashSession com lógica de UI
   // handleOpenSession, handleTransaction, handleCloseSession
   ```

**C. Reorganização de Lógica**
- Mover formatters e utils para `lib/formatters.ts`
- Consolidar validações em `lib/validations/sales.ts`
- Keyboard shortcuts em hook separado `useKeyboardShortcuts.ts`

**D. Simplificação de Estado**
- Agrupar estados relacionados em objetos
- Usar `useReducer` para lógica complexa do carrinho
- Context para dados compartilhados (ponto de venda ativo)

---

### 2. **"Livro de Vendas" → Renomear para "Registro de Vendas"**

#### Mudanças no `app/(app)/dashboard/sales/ledger/page.tsx`:

**A. Renomeação e Reorganização na Sidebar**
```tsx
// components/SidebarLayout.tsx
{
  heading: "Vendas",  // Nova seção dedicada
  items: [
    {
      label: "PDV",
      description: "Ponto de venda rápido",
      href: "/dashboard/sales",
      icon: ShoppingCart,
      tag: "Live"
    },
    {
      label: "Registro de Vendas", // NOVO NOME
      description: "Histórico e auditoria",
      href: "/dashboard/sales/ledger",
      icon: FileText, // ou BookOpen
    }
  ]
}
```

**B. Melhorias de UI**
1. **Header mais clean**:
   - Remover badge "Painel avançado"
   - Título: "Registro de Vendas"
   - Subtitle: "Consulte, edite e audite todas as transações"

2. **Filtros mais acessíveis**:
   - Transformar filtros em barra lateral collapsível (mobile-friendly)
   - Adicionar filtro por ponto de venda
   - Filtro por vendedor/operador
   - Range de valores (min/max)

3. **Tabela otimizada**:
   - Virtual scrolling para performance
   - Colunas customizáveis (mostrar/ocultar)
   - Exportação CSV/Excel
   - Impressão de comprovantes individuais

4. **Ações em massa**:
   - Seleção múltipla
   - Marcar como revisado
   - Exportar seleção

**C. Integração com Caixa**
- Badge mostrando vendas da sessão atual
- Botão "Fechar caixa" com resumo rápido
- Link direto para relatório Z do dia

---

### 3. **Relatórios Z - Remover do PDV, Consolidar em Relatórios**

#### Mudanças:

**A. Remover de `sales/page.tsx`**
- ❌ Remover funções: `exportSessionCsv`, `exportSessionPdf`, `exportSessionReports`
- ❌ Remover lógica de geração de PDFs do fechamento
- ✅ Manter apenas o fechamento básico com snapshot de dados

**B. Consolidar em `dashboard/reports/daily`**
- Melhorar UI do `DailyReportsClient.tsx`
- Adicionar geração sob demanda
- Permitir regeneração de relatórios
- Envio de email diretamente da interface
- Visualização prévia antes de download

**C. Fluxo Proposto**
```
Fechamento de Caixa (PDV) 
  ↓
Salva snapshot no banco
  ↓
Navega para "Relatórios Diários"
  ↓
Gera Relatório Z automaticamente
  ↓
Opção de baixar/enviar por email
```

---

### 4. **Tela de Produtos - `app/(app)/dashboard/products/page.tsx`**

#### Problemas Atuais:
- UI funcional mas pode ser mais intuitiva
- Formulário em tabs está OK, mas pode ter melhor feedback visual
- Falta busca por código de barras/SKU destacado
- Preview de imagem não está implementado

#### Melhorias Propostas:

**A. UI/UX**
1. **Cards visuais em vez de tabela** (toggle entre modos):
   ```tsx
   // Modo Card: ideal para visualização rápida
   <ProductCard 
     product={product}
     onEdit={handleEdit}
     onDelete={handleDelete}
     showStock={true}
     showMargin={true}
   />
   
   // Modo Tabela: ideal para edição em massa
   <ProductTable ... />
   ```

2. **Importação em massa**:
   - Upload de CSV/Excel
   - Template para download
   - Preview antes de importar
   - Validação em tempo real

3. **Busca avançada**:
   - Filtro por fornecedor
   - Filtro por margem de lucro
   - Produtos com/sem estoque
   - Produtos bonificados
   - Input destacado para scan de código de barras

4. **Formulário melhorado**:
   - Preview de imagem (upload futuro)
   - Calculadora de margem mais visual
   - Sugestões de preço baseadas em produtos similares
   - Validação de SKU duplicado em tempo real

**B. Funcionalidades Novas**
1. **Duplicar produto**:
   - Botão para criar variação rápida
   - Útil para diferentes tamanhos/sabores

2. **Histórico de preços**:
   - Ver alterações de custo/venda ao longo do tempo
   - Útil para análise de rentabilidade

3. **Etiquetas/Tags inteligentes**:
   - Auto-sugestão baseada em categoria
   - Filtros rápidos por tag

4. **Status do produto**:
   - Ativo/Inativo
   - Em promoção
   - Descontinuado

**C. Performance**
- Virtualização da lista (react-window ou react-virtual)
- Lazy loading de imagens
- Debounce na busca

---

## 🏗️ ESTRUTURA DE ARQUIVOS PROPOSTA

```
app/(app)/dashboard/sales/
├── page.tsx                          # Entry point (200-300 linhas)
├── components/
│   ├── CartSection.tsx              # Carrinho
│   ├── ProductGrid.tsx              # Grade de produtos
│   ├── PaymentPanel.tsx             # Painel de pagamento
│   ├── CustomerDialog.tsx           # Diálogo de cliente
│   ├── CashSessionPanel.tsx         # Painel de caixa
│   ├── CashDialogs/
│   │   ├── OpenSessionDialog.tsx
│   │   ├── TransactionDialog.tsx
│   │   └── CloseSessionDialog.tsx
│   └── QuickActionsBar.tsx          # Ações rápidas
├── hooks/
│   ├── useCart.ts
│   ├── useCheckout.ts
│   ├── useCashSessionControls.ts
│   └── useKeyboardShortcuts.ts
└── ledger/
    ├── page.tsx                     # Registro de Vendas
    └── components/
        ├── SalesTable.tsx
        ├── SalesFilters.tsx
        └── SaleEditor.tsx

app/(app)/dashboard/products/
├── page.tsx                         # Entry point
├── components/
│   ├── ProductCard.tsx              # Card visual
│   ├── ProductTable.tsx             # Tabela
│   ├── ProductForm/
│   │   ├── BasicTab.tsx
│   │   ├── PricingTab.tsx
│   │   └── IdentityTab.tsx
│   ├── ImportDialog.tsx             # Import CSV
│   └── ProductFilters.tsx
└── hooks/
    └── useProductForm.ts

app/(app)/dashboard/reports/
├── daily/
│   ├── page.tsx
│   ├── DailyReportsClient.tsx       # Melhorado
│   └── components/
│       ├── ReportCard.tsx
│       ├── ReportGenerator.tsx      # Nova geração
│       └── ReportPreview.tsx
└── sales/                            # NOVO
    └── page.tsx                     # Relatórios de vendas

lib/
├── formatters.ts                    # Formatters reutilizáveis
├── validations/
│   ├── sales.ts
│   └── products.ts
└── dailyReports.ts                  # Limpar funções não usadas
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: PDV (Prioridade ALTA)
- [ ] Criar hooks: useCart, useCheckout, useCashSessionControls
- [ ] Extrair CartSection component
- [ ] Extrair ProductGrid component
- [ ] Extrair PaymentPanel component
- [ ] Extrair CustomerDialog component
- [ ] Extrair CashSessionPanel component
- [ ] Criar CashDialogs separados
- [ ] Remover lógica de Relatório Z do PDV
- [ ] Testar fluxo completo de venda
- [ ] Verificar performance (hot reloads, renders)

### Fase 2: Registro de Vendas (Prioridade MÉDIA)
- [ ] Renomear para "Registro de Vendas" em toda aplicação
- [ ] Reorganizar na sidebar (nova seção "Vendas")
- [ ] Melhorar UI do header
- [ ] Implementar filtros laterais
- [ ] Adicionar virtual scrolling
- [ ] Implementar seleção múltipla
- [ ] Adicionar exportação CSV/Excel
- [ ] Integrar com sessão de caixa ativa

### Fase 3: Relatórios Z (Prioridade MÉDIA)
- [ ] Consolidar toda lógica em `/reports/daily`
- [ ] Melhorar DailyReportsClient
- [ ] Adicionar geração sob demanda
- [ ] Implementar preview de relatório
- [ ] Integrar envio de email na UI
- [ ] Criar fluxo automático: fechamento → relatório

### Fase 4: Produtos (Prioridade BAIXA)
- [x] Criar toggle Card/Tabela view
- [x] Implementar ProductCard visual
- [x] Adicionar busca de código de barras destacada
- [x] Criar ImportDialog para CSV (UI completa, backend pendente)
- [x] Implementar duplicação de produto
- [ ] Adicionar status do produto (ativo/inativo) - Opcional
- [ ] Implementar virtualização da lista - Opcional
- [x] Melhorar preview de margem

**Status Fase 4**: ✅ CONCLUÍDA (02/10/2025)
- Arquivo principal reduzido de 1153 para ~600 linhas (48% de redução)
- Componentes modulares criados (ProductCard, ProductTable, ProductFilters, Form Tabs)
- Hook customizado useProductForm implementado
- Design mobile-first aplicado
- Busca avançada funcional (nome + SKU + tags)
- Ver README em `app/(app)/dashboard/products/README.md` para detalhes

---

## 🎨 SUGESTÕES ADICIONAIS

### 1. **Design System**
- Padronizar espaçamentos (usar tokens do Tailwind)
- Criar componentes de feedback consistentes (loading, error, success)
- Unificar nomenclatura de botões (sempre "Salvar" ou sempre "Confirmar")

### 2. **Performance**
- Implementar React Query para cache otimizado
- Lazy load de rotas pesadas
- Otimizar re-renders com React.memo e useMemo
- Considerar Server Components onde aplicável

### 3. **Acessibilidade**
- Adicionar labels ARIA
- Garantir navegação por teclado
- Testar com screen readers
- Melhorar contraste de cores

### 4. **DX (Developer Experience)**
- Adicionar comentários JSDoc em hooks
- Criar Storybook para componentes reutilizáveis
- Documentar props e types complexos
- Adicionar testes unitários para hooks críticos

### 5. **Nomenclatura Consistente**
```typescript
// Antes
"Livro de Vendas" / "Sales Ledger" / "Tabela de vendas"

// Depois (padronizar)
"Registro de Vendas" em PT-BR
"Sales Ledger" em código
```

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Não quebrar fluxo existente**: Manter compatibilidade com sessões de caixa ativas
2. **Testar cálculo de troco**: Lógica crítica para dinheiro
3. **Validar estoque**: Sincronização entre pontos de venda
4. **Keyboard shortcuts**: Manter atalhos (F1, F2, Enter, Esc)
5. **Mobile responsiveness**: PDV usado em tablets
6. **Offline-first**: Considerar PWA para funcionamento sem internet
7. **Auditoria**: Manter logs de todas alterações em vendas

---

## 🚀 RESULTADO ESPERADO

### PDV (Vendas)
- ✅ Arquivo principal com <500 linhas
- ✅ Componentes reutilizáveis e testáveis
- ✅ Performance otimizada (menos re-renders)
- ✅ Manutenção facilitada
- ✅ Onboarding de novos devs mais rápido

### Registro de Vendas
- ✅ Nome intuitivo e profissional
- ✅ UI moderna e responsiva
- ✅ Filtros poderosos e rápidos
- ✅ Integração com caixa e relatórios

### Produtos
- ✅ Experiência visual melhorada
- ✅ Busca e filtros avançados
- ✅ Importação em massa funcional
- ✅ Performance com muitos produtos

### Relatórios
- ✅ Consolidado em um único lugar
- ✅ Geração automatizada
- ✅ Fácil acesso e compartilhamento

---

## ✅ DECISÕES CONFIRMADAS

1. ✅ **Relatórios Z**: Remover do PDV e consolidar em `/reports/daily`
2. ✅ **Nome aprovado**: "Registro de Vendas" 
3. ✅ **Ordem das fases**: PDV → Registro → Relatórios → Produtos
4. ✅ **Produtos**: Implementar toggle Card/Tabela
5. 🔥 **CRÍTICO**: Foco adicional em **responsividade mobile** (tablets e celulares)

---

## 📱 REQUISITOS MOBILE (ADICIONADO)

### Prioridade Mobile-First
O sistema é usado principalmente em **tablets no PDV**. Todas as telas devem ser:

#### **PDV (Sales)**
- ✅ Touch-friendly: Botões grandes (min 44x44px)
- ✅ Carrinho fixo/sticky em telas pequenas
- ✅ Grid de produtos responsivo (1 col mobile, 2-3 tablet, 4+ desktop)
- ✅ Teclado numérico otimizado para mobile
- ✅ Swipe gestures para remover do carrinho
- ✅ Bottom sheet para ações (melhor que modal em mobile)
- ✅ Modo paisagem otimizado para tablets

#### **Registro de Vendas**
- ✅ Filtros em drawer lateral (não ocupar tela toda)
- ✅ Tabela responsiva (cards em mobile, tabela em tablet+)
- ✅ Actions menu em cada linha (três pontinhos)
- ✅ Scroll horizontal suave em tabelas

#### **Produtos**
- ✅ Cards sempre em mobile (tabela só tablet+)
- ✅ Formulário em steps no mobile (não tabs)
- ✅ FAB (Floating Action Button) para adicionar produto
- ✅ Pull-to-refresh para atualizar lista

#### **Componentes Globais**
- ✅ Sidebar colapsável com gesture de swipe
- ✅ Bottom navigation em mobile (alternativa à sidebar)
- ✅ Toast notifications posicionadas corretamente
- ✅ Loading states adaptados ao tamanho da tela

#### **Breakpoints Padrão**
```typescript
// tailwind.config.js
{
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
}
```

#### **Testes Mobile**
- [ ] Testar em Chrome DevTools (iPhone SE, iPad, Galaxy)
- [ ] Testar touch gestures reais
- [ ] Verificar performance em dispositivos médios
- [ ] Validar orientação landscape/portrait

---

## 🎯 MÉTRICAS DE SUCESSO

### Performance
- ⚡ First Contentful Paint < 1.5s
- ⚡ Time to Interactive < 3s
- ⚡ Lighthouse Score > 90 (mobile)

### UX Mobile
- 📱 Todos os botões > 44x44px
- 📱 Texto legível sem zoom (min 16px)
- 📱 Formulários com keyboard apropriado
- 📱 Sem scroll horizontal não intencional

### Código
- 🧹 PDV < 500 linhas
- 🧹 Componentes < 200 linhas cada
- 🧹 Hooks reutilizáveis e testáveis
- 🧹 Zero warnings no console

---

**Status**: ✅ APROVADO - Pronto para implementação!

**Início**: Fase 1 - Refatoração do PDV com foco mobile-first 🚀
