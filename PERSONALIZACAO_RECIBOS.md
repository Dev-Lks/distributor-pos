# 🎨 Personalização de Recibos - Guia Completo

## 📍 Onde Configurar

O arquivo que controla a impressão dos recibos está em:
```
lib/hardware/printerTemplates.ts
```

Este arquivo contém as funções que geram os templates de impressão para:
- ✅ Recibos de venda
- ✅ Transações de caixa (abertura, suprimento, sangria)
- ✅ Fechamento de caixa

---

## 🎯 Estrutura Básica

Cada recibo é composto por **comandos** que a impressora executa:

```typescript
const commands: PrintCommand[] = [
  { type: 'align', value: 'center' },           // Alinhamento
  { type: 'text', value: 'Meu Texto', bold: true },  // Texto
  { type: 'feed', lines: 1 },                   // Linha em branco
  { type: 'separator', char: '=' },             // Linha separadora
  { type: 'qrcode', data: 'dados' },           // QR Code
  { type: 'cut' },                              // Cortar papel
]
```

### Tipos de Comandos Disponíveis

| Comando | Descrição | Opções |
|---------|-----------|--------|
| `align` | Alinhamento | `left`, `center`, `right` |
| `text` | Texto simples | `value`, `size`, `bold` |
| `feed` | Pular linhas | `lines` (número) |
| `separator` | Linha separadora | `char` (caractere) |
| `qrcode` | QR Code | `data` (string) |
| `barcode` | Código de barras | `data` (string) |
| `cut` | Cortar papel | - |

### Tamanhos de Texto

- `size: 'small'` - Texto pequeno
- `size: 'normal'` - Texto normal (padrão)
- `size: 'large'` - Texto grande (2x)

---

## 💡 Sugestões de Personalização

### 1. **Logo ASCII** (Texto Estilizado)
Adicione um logo em ASCII art no topo:

```typescript
commands.push({ type: 'align', value: 'center' })
commands.push({ type: 'text', value: '╔════════════════╗' })
commands.push({ type: 'text', value: '║  MINHA LOJA   ║', size: 'large', bold: true })
commands.push({ type: 'text', value: '║   Beer Shop    ║' })
commands.push({ type: 'text', value: '╚════════════════╝' })
commands.push({ type: 'feed', lines: 1 })
```

### 2. **Mensagens Personalizadas por Horário**

```typescript
function getGreetingMessage(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '☀️ Bom dia! Tenha um ótimo dia!'
  if (hour < 18) return '🌤️ Boa tarde! Aproveite!'
  return '🌙 Boa noite! Volte sempre!'
}

// No footer:
commands.push({ type: 'text', value: getGreetingMessage() })
```

### 3. **Mensagens de Promoção**

```typescript
// Após o total
commands.push({ type: 'feed', lines: 1 })
commands.push({ type: 'separator', char: '*' })
commands.push({ type: 'align', value: 'center' })
commands.push({ type: 'text', value: '🎉 PROMOÇÃO DA SEMANA! 🎉', bold: true })
commands.push({ type: 'text', value: 'Compre 3 cervejas e ganhe 10% OFF' })
commands.push({ type: 'text', value: 'Válido até 31/10/2025' })
commands.push({ type: 'separator', char: '*' })
commands.push({ type: 'feed', lines: 1 })
```

### 4. **Sistema de Pontos/Fidelidade**

```typescript
// Após o pagamento
if (sale.customerName) {
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'text', value: '⭐ PROGRAMA FIDELIDADE ⭐', bold: true })
  
  // Calcular pontos (exemplo: R$ 1 = 1 ponto)
  const points = Math.floor(sale.total)
  commands.push({ type: 'text', value: `Você ganhou: ${points} pontos! 🎁` })
  commands.push({ type: 'text', value: 'A cada 100 pontos = R$ 10 OFF' })
  commands.push({ type: 'separator', char: '-' })
}
```

### 5. **Informações de Consumo Responsável**

```typescript
// Para vendas de bebidas alcoólicas
const hasAlcohol = sale.items.some(item => 
  item.product.category?.toLowerCase().includes('cerveja') ||
  item.product.category?.toLowerCase().includes('vinho')
)

if (hasAlcohol) {
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: '⚠️ BEBA COM MODERAÇÃO ⚠️', bold: true })
  commands.push({ type: 'text', value: 'Se beber, não dirija!' })
  commands.push({ type: 'text', value: 'Venda proibida para menores de 18 anos' })
  commands.push({ type: 'separator', char: '=' })
}
```

### 6. **Redes Sociais**

```typescript
commands.push({ type: 'feed', lines: 1 })
commands.push({ type: 'separator', char: '~' })
commands.push({ type: 'align', value: 'center' })
commands.push({ type: 'text', value: '📱 SIGA-NOS NAS REDES!' })
commands.push({ type: 'text', value: 'Instagram: @minhaloja' })
commands.push({ type: 'text', value: 'Facebook: /MinhaLojaOficial' })
commands.push({ type: 'text', value: 'WhatsApp: (11) 98765-4321' })
commands.push({ type: 'separator', char: '~' })
```

### 7. **Estatísticas da Venda**

```typescript
// Mostrar economia se houver desconto
if (sale.discountValue > 0) {
  const percentSaved = (sale.discountValue / (sale.total + sale.discountValue)) * 100
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: `🎉 Você economizou ${percentSaved.toFixed(0)}%! 🎉`, bold: true })
  commands.push({ type: 'text', value: `Desconto: R$ ${sale.discountValue.toFixed(2)}` })
}
```

### 8. **Nota Fiscal Simplificada**

```typescript
// Após as informações da loja
commands.push({ type: 'separator', char: '=' })
commands.push({ type: 'align', value: 'center' })
commands.push({ type: 'text', value: 'CUPOM FISCAL ELETRÔNICO' })
commands.push({ type: 'text', value: 'SAT-CF-e' })
commands.push({ type: 'text', value: `Série: 001 - Nº ${sale.id.slice(-8)}` })
commands.push({ type: 'separator', char: '=' })
```

### 9. **Agradecimento Personalizado por Valor**

```typescript
function getThankYouMessage(total: number): string {
  if (total >= 500) return '🌟 MUITO OBRIGADO! Você é um cliente VIP! 🌟'
  if (total >= 200) return '💎 OBRIGADO! Sua compra é importante para nós!'
  if (total >= 100) return '😊 OBRIGADO pela preferência!'
  return '🙂 Volte sempre!'
}

commands.push({ type: 'text', value: getThankYouMessage(sale.total) })
```

### 10. **Dicas/Curiosidades Aleatórias**

```typescript
const tips = [
  '💡 Dica: Cerveja gelada fica perfeita entre 2-4°C',
  '🍺 Você sabia? O primeiro registro de cerveja é de 6000 a.C.',
  '🌡️ A temperatura ideal varia por estilo de cerveja',
  '🎯 Experimente nossas cervejas artesanais!',
  '📱 Peça pelo WhatsApp e ganhe 5% de desconto!',
]

const randomTip = tips[Math.floor(Math.random() * tips.length)]
commands.push({ type: 'text', value: randomTip })
```

---

## 🎨 Template Completo Personalizado (Exemplo)

Aqui está um exemplo completo de recibo personalizado:

```typescript
export function generateCustomSaleReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // ==================== HEADER ====================
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: '╔═══════════════════════╗' })
  commands.push({ type: 'text', value: `║  ${config.storeName.padEnd(21, ' ')}║`, size: 'large', bold: true })
  commands.push({ type: 'text', value: '║    Cervejas Premium   ║' })
  commands.push({ type: 'text', value: '╚═══════════════════════╝' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Informações da loja
  if (config.storeDocument) {
    commands.push({ type: 'text', value: `CNPJ: ${config.storeDocument}` })
  }
  if (config.storeAddress) {
    commands.push({ type: 'text', value: config.storeAddress })
  }
  if (config.storePhone) {
    commands.push({ type: 'text', value: `📞 ${config.storePhone}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  
  // ==================== DADOS DA VENDA ====================
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `🛒 Venda: #${sale.id.slice(-8).toUpperCase()}` })
  
  const date = new Date(sale.date)
  const dateStr = date.toLocaleDateString('pt-BR')
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  commands.push({ type: 'text', value: `📅 ${dateStr} às ${timeStr}` })
  
  if (sale.pointOfSale) {
    commands.push({ type: 'text', value: `📍 PDV: ${sale.pointOfSale.name}` })
  }
  
  if (sale.customerName) {
    commands.push({ type: 'text', value: `👤 Cliente: ${sale.customerName}` })
  }
  
  commands.push({ type: 'separator', char: '=' })
  
  // ==================== PRODUTOS ====================
  commands.push({ type: 'align', value: 'left' })
  const header = padString('ITEM', 22) + padString('QTD', 6) + padString('TOTAL', 20)
  commands.push({ type: 'text', value: header, bold: true })
  commands.push({ type: 'separator', char: '-' })
  
  for (const item of sale.items) {
    // Nome do produto
    const productName = truncateString(item.product.name, config.width - 2)
    commands.push({ type: 'text', value: productName })
    
    // Quantidade x Preço = Total
    const qtyLine = `  ${item.quantity}x R$ ${item.price.toFixed(2)}`
    const totalLine = `R$ ${(item.quantity * item.price).toFixed(2)}`
    const spacing = config.width - qtyLine.length - totalLine.length
    commands.push({ type: 'text', value: qtyLine + ' '.repeat(spacing) + totalLine })
    
    commands.push({ type: 'feed', lines: 1 })
  }
  
  commands.push({ type: 'separator', char: '-' })
  
  // ==================== TOTAIS ====================
  if (sale.subtotal && sale.subtotal !== sale.total) {
    commands.push({ 
      type: 'text', 
      value: padString('Subtotal:', config.width - 15) + padString(`R$ ${sale.subtotal.toFixed(2)}`, 15)
    })
  }
  
  if (sale.discountValue > 0) {
    commands.push({ 
      type: 'text', 
      value: padString('🎁 Desconto:', config.width - 15) + padString(`-R$ ${sale.discountValue.toFixed(2)}`, 15)
    })
  }
  
  commands.push({ type: 'separator', char: '=' })
  commands.push({ 
    type: 'text', 
    value: padString('💰 TOTAL:', config.width - 18) + padString(`R$ ${sale.total.toFixed(2)}`, 18),
    size: 'large',
    bold: true
  })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // ==================== PAGAMENTO ====================
  if (sale.paymentMethod) {
    const paymentIcons: Record<string, string> = {
      'cash': '💵 Dinheiro',
      'card': '💳 Cartão',
      'pix': '📱 PIX',
      'debit': '💳 Débito',
      'credit': '💳 Crédito',
    }
    const paymentDisplay = paymentIcons[sale.paymentMethod] || sale.paymentMethod
    commands.push({ type: 'text', value: `Forma de Pagamento: ${paymentDisplay}` })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  // ==================== ECONOMIA ====================
  if (sale.discountValue > 0) {
    const percentSaved = (sale.discountValue / (sale.total + sale.discountValue)) * 100
    commands.push({ type: 'separator', char: '*' })
    commands.push({ type: 'align', value: 'center' })
    commands.push({ type: 'text', value: `🎉 VOCÊ ECONOMIZOU ${percentSaved.toFixed(0)}%! 🎉`, bold: true })
    commands.push({ type: 'text', value: `Desconto: R$ ${sale.discountValue.toFixed(2)}` })
    commands.push({ type: 'separator', char: '*' })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  // ==================== FIDELIDADE ====================
  if (sale.customerName) {
    const points = Math.floor(sale.total)
    commands.push({ type: 'separator', char: '-' })
    commands.push({ type: 'align', value: 'center' })
    commands.push({ type: 'text', value: '⭐ PROGRAMA FIDELIDADE ⭐', bold: true })
    commands.push({ type: 'text', value: `Você ganhou: ${points} pontos! 🎁` })
    commands.push({ type: 'text', value: 'A cada 100 pontos = R$ 10 OFF' })
    commands.push({ type: 'separator', char: '-' })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  // ==================== QR CODE ====================
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: 'Escaneie para ver detalhes:' })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'qrcode', data: `${process.env.NEXT_PUBLIC_URL}/sales/${sale.id}` })
  commands.push({ type: 'feed', lines: 1 })
  
  // ==================== FOOTER ====================
  commands.push({ type: 'separator', char: '~' })
  commands.push({ type: 'text', value: '📱 SIGA-NOS!' })
  commands.push({ type: 'text', value: 'Instagram: @suacervejaria' })
  commands.push({ type: 'text', value: 'WhatsApp: (11) 98765-4321' })
  commands.push({ type: 'separator', char: '~' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Mensagem personalizada
  const hour = new Date().getHours()
  let greeting = '😊 Obrigado pela preferência!'
  if (hour < 12) greeting = '☀️ Bom dia! Volte sempre!'
  else if (hour < 18) greeting = '🌤️ Boa tarde! Até a próxima!'
  else greeting = '🌙 Boa noite! Dirija com segurança!'
  
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: greeting, bold: true })
  
  // Mensagem responsável
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'text', value: '⚠️ BEBA COM MODERAÇÃO ⚠️', bold: true })
  commands.push({ type: 'text', value: 'Proibido para menores de 18 anos' })
  commands.push({ type: 'separator', char: '=' })
  
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}
```

---

## 🚀 Como Aplicar as Personalizações

1. **Edite o arquivo**: `lib/hardware/printerTemplates.ts`

2. **Modifique a função desejada**:
   - `generateSaleReceipt()` - Recibo de venda
   - `generateCashTransactionReceipt()` - Transações de caixa
   - `generateCashClosingReceipt()` - Fechamento de caixa

3. **Teste a impressão**:
   - Faça uma venda de teste
   - Ou use o botão "Testar Impressão" nas configurações

4. **Ajuste conforme necessário**:
   - Largura do papel (config.width)
   - Tamanhos de fonte
   - Espaçamento entre linhas

---

## 📝 Dicas Importantes

### ✅ Boas Práticas
- Use `truncateString()` para evitar texto muito longo
- Use `padString()` para alinhar valores
- Teste em diferentes larguras de papel (32, 48, 58, 80)
- Mantenha o recibo conciso (papel térmico é limitado)

### ⚠️ Evite
- Linhas muito longas (respeite config.width)
- Muitas linhas em branco (desperdiça papel)
- Excesso de formatação (deixa lento)
- Caracteres especiais incompatíveis

### 🎨 Emojis Recomendados
- ✅ ❌ ⚠️ ℹ️ (funcionam na maioria das impressoras)
- 💰 💳 💵 📱 🎁 ⭐ 📍 📅 🛒 👤
- ☀️ 🌤️ 🌙 🍺 🎉

---

## 📖 Próximos Passos

1. Escolha um dos templates sugeridos acima
2. Copie e cole no seu `printerTemplates.ts`
3. Personalize com os dados da sua loja
4. Teste e ajuste conforme necessário

**Boa impressão! 🖨️✨**
