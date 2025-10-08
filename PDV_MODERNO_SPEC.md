# 🎯 PDV Moderno - Visão e Especificação Completa

**Data**: 8 de outubro de 2025  
**Status**: 📋 **EM PLANEJAMENTO**

---

## 🌟 Visão Geral

Reimaginação completa da tela do PDV (Ponto de Venda) integrando nativamente **leitor de código de barras** e **impressora térmica**, com foco em velocidade, simplicidade e eficiência operacional.

---

## 🎯 Objetivos

### Velocidade ⚡
- Vendas em **<10 segundos** (vs. ~30-45s atuais)
- Scanner como input principal
- Teclas de atalho para todas as ações

### Simplicidade 🎨
- Interface limpa, sem distrações
- Foco no carrinho e no scanner
- Produtos em painel colapsável

### Hardware-First 🔌
- Scanner USB/Bluetooth como prioridade #1
- Auto-impressão de recibos
- Feedback sonoro em cada operação

---

## 📐 Layout Proposto

```
┌────────────────────────────────────────────────────────────────────┐
│ [HEADER]                                                            │
│ Ponto de Venda | Caixa: ● Aberto | Scanner: ● Ativo | 🖨️ OK      │
└────────────────────────────────────────────────────────────────────┘
┌────────────────────┬───────────────────────────────────────────────┐
│                    │                                               │
│ [PRODUTOS]         │ [CARRINHO + PAGAMENTO]                        │
│ (Colapsável F3)    │                                               │
│                    │  ┌──────────────────────────────────────────┐ │
│ 🔍 Buscar...       │  │ [🏷️ SCANNER - SEMPRE ATIVO]             │ │
│                    │  │ Digite ou escaneie código de barras...    │ │
│ ┌────┬────┬────┐   │  └──────────────────────────────────────────┘ │
│ │Prod│Prod│Prod│   │                                               │
│ └────┴────┴────┘   │  ┌─ CARRINHO ──────────────────────────────┐ │
│ ┌────┬────┬────┐   │  │ 1x Heineken 330ml    [+][-][×]  R$ 6,00 │ │
│ │Prod│Prod│Prod│   │  │ 2x Budweiser 600ml   [+][-][×] R$ 20,00 │ │
│ └────┴────┴────┘   │  │ 🏷️ (Scanned)                             │ │
│                    │  └──────────────────────────────────────────┘ │
│                    │                                               │
│                    │  ┌─ PAGAMENTO ──────────────────────────────┐ │
│                    │  │ TOTAL: R$ 26,00              3 itens      │ │
│                    │  │                                            │ │
│                    │  │ [💵 Dinheiro] [💳 Cartão] [📱 PIX]       │ │
│                    │  │                                            │ │
│                    │  │ Valor Recebido: [___50,00___]             │ │
│                    │  │ Troco: R$ 24,00                            │ │
│                    │  │                                            │ │
│                    │  │ [✓ FINALIZAR VENDA (F12)]                │ │
│                    │  │ [🖨️ Reimprimir Última]                    │ │
│                    │  └──────────────────────────────────────────┘ │
│                    │                                               │
└────────────────────┴───────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│ [RODAPÉ - CONTROLE DE CAIXA]                                       │
│ ● Caixa Aberto | Abertura: R$ 100,00                               │
│ [💰 Movimentação] [🔒 Fechar Caixa]                                │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔥 Fluxo Principal (Happy Path)

### 1. Venda Rápida com Scanner
```
1. Operador escaneia produto → BEEP ✓
2. Produto aparece no carrinho automaticamente
3. Repete para cada item
4. Pressiona F12 ou clica "Finalizar Venda"
5. Recibo impresso automaticamente
6. Carrinho limpo, pronto para próxima venda
```

**Tempo total**: ~5-10 segundos

### 2. Venda Manual (Sem Scanner)
```
1. Operador clica em produto na grade
2. Produto adicionado ao carrinho
3. Ajusta quantidade se necessário (+/-)
4. Finaliza venda (F12)
5. Recibo impresso
```

**Tempo total**: ~15-20 segundos

---

## ✨ Recursos Principais

### 1. Scanner Integrado 🏷️

**Posição**: Sempre visível no topo do painel direito  
**Comportamento**:
- Auto-focus contínuo
- Detecta scan automático (velocidade de digitação)
- Feedback sonoro (BEEP sucesso, ERRO falha)
- Badge visual mostrando origem (🏷️ Scanner vs 📦 Manual)

**API**:
```typescript
const { isScanning, lastScanned, scanHistory } = useBarcodeScanner({
  enabled: true,
  onScan: async (barcode) => {
    const product = await fetchProductByBarcode(barcode)
    addToCart(product, 'barcode')
    playBeep()
  }
})
```

### 2. Impressora Térmica 🖨️

**Auto-Impressão**: Após cada venda finalizada  
**Formatos**:
- Recibo de venda (com itens, total, forma de pagamento)
- Comprovante de movimentação de caixa
- Relatório de fechamento

**Status Visual**: Badge no header mostrando status da impressora

**API**:
```typescript
const { status, print, testPrint } = useThermalPrinter()

await print({
  saleId,
  items: cart,
  total,
  paymentMethod,
  customer,
}, 'sale')
```

### 3. Carrinho Inteligente 🛒

**Features**:
- Badge indicando origem (Scanner/Manual)
- Controles de quantidade inline (+/-)
- Alerta de estoque baixo
- Remoção rápida (X)
- Limpar tudo (Shift+F4)

**Cálculos em Tempo Real**:
- Total
- Quantidade de itens
- Troco (para dinheiro)

### 4. Pagamento Simplificado 💰

**3 Métodos**:
- 💵 Dinheiro (com cálculo de troco)
- 💳 Cartão
- 📱 PIX

**Atalhos Rápidos**:
- Valores pré-definidos (R$20, R$50, R$100, R$200)
- F12 para finalizar

### 5. Gestão de Caixa 💼

**Estados**:
- 🔒 Fechado (não permite vendas)
- 🔓 Aberto (permite vendas)

**Operações**:
- Abertura (com valor inicial)
- Movimentações (sangria/reforço)
- Fechamento (com relatório impresso)

**Integração**: Rodapé fixo com status e ações rápidas

---

## ⌨️ Atalhos do Teclado

| Tecla | Ação |
|-------|------|
| `F2` | Focar no campo do scanner |
| `F3` | Mostrar/Ocultar painel de produtos |
| `F4` + `Shift` | Limpar carrinho (com confirmação) |
| `F9` | Adicionar/Editar cliente |
| `F12` | Finalizar venda |
| `Esc` | Cancelar dialogs |

---

## 🎨 Design System

### Cores Funcionais
- ✅ Verde: Scanner ativo, venda finalizada
- 🔴 Vermelho: Erros, estoque zerado, caixa fechado
- 🟡 Amarelo: Alertas, estoque baixo
- 🔵 Azul: Ações primárias, informações
- ⚪ Cinza: Neutro, desabilitado

### Feedback Visual
- **Badges**: Origem do item (Scanner/Manual)
- **Animações**: Pulse ao adicionar item
- **Status Dots**: Scanner ativo (verde pulsante)
- **Toasts**: Confirmações e erros

### Feedback Sonoro
- ✅ BEEP: Produto escaneado com sucesso
- ❌ ERRO: Produto não encontrado
- 🎉 SUCESSO: Venda finalizada

---

## 📱 Responsividade

### Desktop (1920x1080)
- Layout 30/70 (produtos/carrinho)
- Painel de produtos com 3-4 colunas

### Tablet (1024x768)
- Layout 40/60
- Painel de produtos com 2 colunas

### Mobile (≤768px)
- Painel de produtos colapsado por padrão
- Carrinho ocupa tela inteira
- Scanner sempre visível no topo

---

## 🔌 Integrações de Hardware

### Scanners Suportados
- ✅ USB (HID - plug and play)
- ✅ Bluetooth pareados
- ✅ Apps mobile (via PWA camera)

### Impressoras Suportadas
- ✅ Térmicas USB (ESC/POS)
- ✅ Térmicas via rede (IP)
- ⚠️ Bluetooth (experimental)

### Setup Recomendado
```
1. Scanner USB → Conecta e funciona
2. Impressora térmica USB → Configurar porta em Settings
3. Testar impressão (botão de teste)
4. Pronto para usar!
```

---

## 🚀 Fluxos Avançados

### 1. Adicionar Cliente (F9)
```
1. F9 abre dialog
2. Digite nome (obrigatório)
3. Opcionais: CPF, telefone
4. Cliente aparece no carrinho
5. Informações impressas no recibo
```

### 2. Ajustar Quantidade
```
- Clique [+] ou [-] no item
- Ou digite quantidade diretamente
- Limite: estoque disponível
- Alerta se tentar exceder
```

### 3. Reimprimir Última Venda
```
1. Clique "Reimprimir Última"
2. Sistema busca última venda da sessão
3. Envia para impressora
4. Recibo idêntico ao original
```

### 4. Venda Sem Scanner
```
1. F3 para mostrar produtos
2. Busca por nome/marca
3. Clique nos produtos
4. Ajusta quantidades
5. Finaliza normalmente
```

---

## 📊 Métricas de Sucesso

### Performance
- ⏱️ Tempo médio de venda: **<10s** (vs. 30-45s)
- 🎯 Erro de digitação: **-95%** (scanner automático)
- 🖨️ Impressões com falha: **<2%**

### UX
- 😊 Satisfação do operador: **>90%**
- 📉 Tempo de treinamento: **<15 minutos**
- ⌨️ Uso de atalhos: **>70%** dos operadores

### Negócio
- 📈 Vendas/hora: **+40%**
- 💰 Erro de caixa: **-80%**
- 🎯 Produtos corretos: **99,5%+**

---

## 🔧 Stack Técnico

### Frontend
```typescript
- Next.js 15 (App Router)
- React 19 (Server + Client Components)
- TailwindCSS + shadcn/ui
- Framer Motion (animações)
```

### Hardware Hooks
```typescript
- useBarcodeScanner() // Detecção automática
- useThermalPrinter() // Controle de impressora
- useCashSession() // Gestão de caixa
```

### APIs
```
GET  /api/products/barcode/[barcode] // Busca por código
POST /api/sales // Criar venda
POST /api/hardware/printer/print // Imprimir
GET  /api/hardware/printer/status // Status impressora
```

---

## 📦 Componentes Criados

### v2/ (Nova Arquitetura)
```
components/v2/
├── POSHeader.tsx          # Cabeçalho com status
├── POSCart.tsx            # Carrinho de compras
├── POSProducts.tsx        # Grade de produtos
├── POSPayment.tsx         # Painel de pagamento
├── POSSessionControl.tsx  # Controle de caixa
├── POSCustomerDialog.tsx  # Dialog de cliente
└── POSQuickActions.tsx    # Ações rápidas
```

---

## 🎯 Próximos Passos

### Fase 1: Arquitetura Base ✅
- [x] Criar estrutura de componentes v2
- [x] Documentar especificação completa
- [x] Definir interfaces e tipos

### Fase 2: Implementação Core (NEXT)
- [ ] Implementar POSHeader com status real
- [ ] Implementar POSCart com gerenciamento
- [ ] Implementar POSProducts com busca
- [ ] Implementar POSPayment com cálculos

### Fase 3: Integração Hardware
- [ ] Conectar useBarcodeScanner()
- [ ] Conectar useThermalPrinter()
- [ ] Implementar feedback sonoro
- [ ] Testes com hardware real

### Fase 4: Polimento
- [ ] Animações e transições
- [ ] Keyboard shortcuts
- [ ] Responsive design
- [ ] Testes de performance

### Fase 5: Deploy
- [ ] Testes com usuários reais
- [ ] Ajustes baseados em feedback
- [ ] Documentação de uso
- [ ] Rollout gradual

---

## 💡 Decisões de Design

### Por que Scanner no Topo?
- ✅ Sempre visível
- ✅ Auto-focus facilitado
- ✅ Feedback imediato

### Por que Produtos Colapsáveis?
- ✅ Foco no que importa (carrinho)
- ✅ Mais espaço para items
- ✅ Operação mais rápida com scanner

### Por que Auto-Impressão?
- ✅ Menos cliques
- ✅ Mais rápido
- ✅ Menos erros (esquecer de imprimir)

### Por que Atalhos de Teclado?
- ✅ Operadores experientes >3x mais rápidos
- ✅ Não precisa tirar mão do teclado
- ✅ Padrão de mercado

---

## 🎉 Resultado Esperado

### Antes (PDV Atual)
```
⏱️ Tempo médio: 30-45 segundos por venda
👆 Muitos cliques e navegação
📝 Digitação manual propensa a erros
🖨️ Impressão manual (esquecida às vezes)
```

### Depois (PDV Moderno)
```
⚡ Tempo médio: 5-10 segundos por venda
🏷️ Scanner automático (zero digitação)
✅ 99,5%+ de precisão
🖨️ Impressão automática (100% das vendas)
```

---

**Status Atual**: 📋 Especificação completa  
**Próximo Passo**: Implementação iterativa dos componentes  
**Responsável**: Dev Team  
**Prazo Sugerido**: 2-3 dias de desenvolvimento
