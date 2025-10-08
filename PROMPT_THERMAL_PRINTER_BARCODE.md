# 🖨️ PROMPT: Integração de Impressora Térmica e Leitor de Código de Barras no Sistema de Vendas

## 📋 CONTEXTO
Sistema de vendas Next.js/React com TypeScript, usando Prisma, TailwindCSS e shadcn/ui. A aplicação gerencia vendas, inventário, pontos de venda e sessões de caixa.

## 🎯 OBJETIVO
Implementar integração completa com:
1. **Leitor de Código de Barras** (entrada de produtos via scan)
2. **Impressora Térmica** (impressão de recibos automática)
3. **Redesign da UI de Vendas** para comportar essas novas funcionalidades de forma intuitiva

---

## 📦 PARTE 1: ESTRUTURA E DEPENDÊNCIAS

### 1.1 Instalar Dependências
```bash
pnpm add node-thermal-printer escpos serialport @serialport/parser-readline
pnpm add -D @types/node @types/serialport
```

### 1.2 Criar Estrutura de Arquivos
```
lib/
  hardware/
    barcodereader.ts          # Gestão do leitor de código de barras
    thermalPrinter.ts         # Gestão da impressora térmica
    printerTemplates.ts       # Templates de recibo
    useBarcodeScanner.ts      # Hook React para scanner
    useThermalPrinter.ts      # Hook React para impressora
    
app/api/
  hardware/
    printer/
      print/route.ts          # Endpoint para imprimir
      status/route.ts         # Status da impressora
    scanner/
      config/route.ts         # Configuração do scanner
      
components/
  hardware/
    BarcodeInput.tsx          # Input especializado para scanner
    PrinterStatus.tsx         # Status da impressora
    ReceiptPreview.tsx        # Preview do recibo
    HardwareSettings.tsx      # Configurações de hardware
```

---

## 🔧 PARTE 2: IMPLEMENTAÇÃO DO LEITOR DE CÓDIGO DE BARRAS

### 2.1 Hook de Barcode Scanner (`lib/hardware/useBarcodeScanner.ts`)

Criar hook que:
- Detecta automaticamente quando um código de barras é escaneado
- Diferencia entrada via scanner vs digitação manual (pela velocidade)
- Permite configurar prefixo/sufixo do scanner
- Procura produto automaticamente e adiciona ao carrinho
- Toca som de feedback (sucesso/erro)
- Mostra toast com info do produto adicionado

**Funcionalidades:**
```typescript
interface BarcodeScannerOptions {
  enabled: boolean
  autoAddToCart?: boolean
  minScanSpeed?: number // ms entre caracteres
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  prefix?: string // Ex: alguns scanners enviam "SCAN:"
  suffix?: string // Ex: Enter key
}

// Uso:
const { isScanning, lastScanned } = useBarcodeScanner({
  enabled: true,
  autoAddToCart: true,
  onScan: (barcode) => {
    // Buscar produto por código de barras
    // Adicionar ao carrinho
  }
})
```

### 2.2 Componente BarcodeInput (`components/hardware/BarcodeInput.tsx`)

Input visual que:
- Mostra estado "aguardando scan" com animação
- Destaca quando está recebendo scan
- Permite entrada manual também
- Tem botão de "limpar" e "buscar"
- Visual tipo "spotlight" quando ativo

**Features UI:**
- Ícone de scanner animado
- Campo com borda pulsante quando esperando scan
- Feedback visual instantâneo ao escanear
- Lista de últimos produtos escaneados (histórico rápido)
- Atalho Ctrl/Cmd + B para focar

---

## 🖨️ PARTE 3: IMPLEMENTAÇÃO DA IMPRESSORA TÉRMICA

### 3.1 Biblioteca de Impressão (`lib/hardware/thermalPrinter.ts`)

Criar classe/serviço que:
- Conecta via USB/Serial/Rede à impressora
- Envia comandos ESC/POS
- Gerencia fila de impressão
- Detecta erros (papel acabou, tampa aberta, etc)
- Mantém histórico de impressões

**Configurações:**
```typescript
interface PrinterConfig {
  type: 'USB' | 'Network' | 'Serial'
  connectionString: string // Ex: "COM3", "192.168.1.100:9100"
  characterSet: string
  width: 32 | 48 | 58 | 80 // caracteres por linha
  encoding: 'UTF-8' | 'GB18030'
}
```

### 3.2 Templates de Recibo (`lib/hardware/printerTemplates.ts`)

Criar templates para:
- **Recibo de Venda Completo**
  - Logo/Nome da empresa
  - Dados do ponto de venda
  - Número da venda e data/hora
  - Lista de produtos (nome, qtd, preço unit, subtotal)
  - Descontos (se houver)
  - Total
  - Método de pagamento
  - Troco (se cash)
  - QR Code (para nota fiscal/validação)
  - Mensagem de agradecimento
  - Rodapé com info fiscal

- **Recibo Comprovante de Sangria/Suprimento**
- **Recibo de Fechamento de Caixa**
- **Recibo de Abertura de Caixa**

**Exemplo de estrutura:**
```typescript
function generateSaleReceipt(sale: Sale, config: PrinterConfig) {
  return {
    commands: [
      { type: 'align', value: 'center' },
      { type: 'text', value: 'LOJA XYZ', size: 'large', bold: true },
      { type: 'text', value: 'CNPJ: 00.000.000/0001-00' },
      { type: 'feed', lines: 1 },
      { type: 'align', value: 'left' },
      { type: 'text', value: `Venda #${sale.id}` },
      { type: 'text', value: `Data: ${formatDate(sale.date)}` },
      { type: 'separator', char: '-' },
      // ... produtos
      { type: 'separator', char: '=' },
      { type: 'text', value: `TOTAL: R$ ${total}`, size: 'large', bold: true },
      { type: 'qrcode', data: sale.id },
      { type: 'cut' }
    ]
  }
}
```

### 3.3 API Endpoints

**POST `/api/hardware/printer/print`**
```typescript
// Body: { type: 'sale' | 'cash-transaction', data: {...} }
// Processa template e envia para impressora
// Retorna: { success: boolean, jobId: string }
```

**GET `/api/hardware/printer/status`**
```typescript
// Retorna status da impressora
// { connected: boolean, online: boolean, paperStatus: 'ok' | 'low' | 'out' }
```

### 3.4 Hook de Impressora (`lib/hardware/useThermalPrinter.ts`)

```typescript
interface UseThermalPrinter {
  status: PrinterStatus
  print: (data: any, type: ReceiptType) => Promise<void>
  isPrinting: boolean
  queue: PrintJob[]
  configure: (config: PrinterConfig) => void
}

// Uso:
const { print, isPrinting, status } = useThermalPrinter()

// Após finalizar venda:
await print(saleData, 'sale')
```

---

## 🎨 PARTE 4: REDESIGN DA TELA DE VENDAS

### 4.1 Layout Principal (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏪 PONTO DE VENDA          [Sessão #123]    👤 Operador    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────┐  ┌────────────────────────────┐│
│ │ 🔍 SCANNER DE PRODUTOS  │  │   🛒 CARRINHO (3 itens)   ││
│ │ ┌─────────────────────┐ │  │ ─────────────────────────  ││
│ │ │ [▓▓▓▓] Digite ou    │ │  │ Coca Cola 2L       R$ 8,50││
│ │ │       escaneie...   │ │  │ Qty: 2  [- 2 +]   R$ 17,00││
│ │ └─────────────────────┘ │  │                            ││
│ │                         │  │ Arroz 5kg          R$ 25,00││
│ │ Últimos scans:          │  │ Qty: 1  [- 1 +]   R$ 25,00││
│ │ • Coca Cola 2L          │  │                            ││
│ │ • Arroz 5kg             │  │ Feijão 1kg        R$ 7,50 ││
│ └─────────────────────────┘  │ Qty: 3  [- 3 +]   R$ 22,50││
│                              │                            ││
│ ┌─────────────────────────┐  │ ─────────────────────────  ││
│ │    GRID DE PRODUTOS     │  │ Subtotal:         R$ 64,50││
│ │ ┌────┐┌────┐┌────┐┌────┐│  │ Desconto:          R$ 0,00││
│ │ │Coca││Arr.││Feij││Açú.││  │ ═══════════════════════════││
│ │ │8,50││25,0││7,50││4,20││  │ 💰 TOTAL:        R$ 64,50││
│ │ └────┘└────┘└────┘└────┘│  │ ═══════════════════════════││
│ │ [mais produtos...]      │  │                            ││
│ │                         │  │ [💳 Débito] [💵 Dinheiro] ││
│ └─────────────────────────┘  │ [📱 Pix]    [🎫 Crédito]  ││
│                              │                            ││
│                              │ [🧾 FINALIZAR E IMPRIMIR] ││
│                              └────────────────────────────┘│
│                                                              │
│ [⚙️ Config] [🖨️ Reimprimir] [📊 Relatórios] [💰 Caixa]   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Melhorias de UX

#### A) Scanner Section (Nova!)
- **Position**: Topo esquerdo, destaque visual
- **Visual States**:
  - Idle: Borda cinza, ícone de scanner estático
  - Waiting: Borda azul pulsante, ícone animado
  - Scanning: Borda verde, efeito de "laser scan"
  - Success: Flash verde + som + toast
  - Error: Shake animation + som de erro

- **Features**:
  - Auto-focus quando página carrega
  - Histórico dos últimos 5 scans com botão "adicionar novamente"
  - Indicador de velocidade de scan (visual feedback)
  - Botão para alternar modo manual/automático

#### B) Carrinho Aprimorado
- **Header**: Contador de itens + total em destaque
- **Items**: 
  - Imagem miniatura do produto
  - Nome + código de barras (se disponível)
  - Botões +/- com feedback haptic
  - Botão de remover com confirmação
  - Indicador visual de "item recém-adicionado" (highlight temporário)

- **Footer**:
  - Subtotal
  - Desconto (com botão para aplicar cupom)
  - **Total em GRANDE destaque**
  - Métodos de pagamento como chips/cards visuais
  - Botão de finalizar ENORME e verde

#### C) Status da Impressora (Nova!)
- **Floating badge** no canto superior direito:
  - 🟢 Pronta (Online e papel OK)
  - 🟡 Alerta (Papel baixo)
  - 🔴 Erro (Sem papel/desconectada)
  - 🔵 Imprimindo... (com progresso)

- **Ao clicar**: Modal com:
  - Status detalhado
  - Últimas impressões
  - Botão "Reimprimir último"
  - Botão "Configurar impressora"
  - Teste de impressão

#### D) Fluxo de Finalização
1. Usuário clica "FINALIZAR E IMPRIMIR"
2. Se `customerPromptEnabled`: Modal para identificar cliente (opcional)
3. Confirma método de pagamento
4. Se dinheiro: Input de valor recebido + cálculo de troco
5. **Processamento**:
   - Salva venda no DB
   - **Automaticamente envia para impressora**
   - Mostra preview do recibo em modal
   - Se impressão OK: Som de sucesso + confete
   - Se erro na impressão: Opção de reimprimir ou salvar PDF
6. Limpa carrinho
7. Retorna para tela pronta para próxima venda

#### E) Atalhos de Teclado (Expandidos)
- `Ctrl/Cmd + B` - Foca no input do scanner
- `Ctrl/Cmd + F` - Busca produtos
- `Ctrl/Cmd + Enter` - Finalizar venda
- `Ctrl/Cmd + P` - Reimprimir última venda
- `Ctrl/Cmd + K` - Abrir caixa
- `F1` - Adicionar produto manualmente
- `F2` - Remover último item do carrinho
- `F9` - Sangria
- `F10` - Suprimento
- `Esc` - Cancelar venda atual (com confirmação)

### 4.3 Responsividade Mobile

**Layout Mobile:**
```
┌─────────────────────┐
│ 🔍 Scanner          │
│ ┌─────────────────┐ │
│ │ [Scan/Digite]   │ │
│ └─────────────────┘ │
├─────────────────────┤
│ 🛒 Carrinho (3)     │
│                     │
│ [Lista compacta]    │
│                     │
│ Total: R$ 64,50     │
│                     │
│ [💵] [💳] [📱]     │
│                     │
│ [FINALIZAR]         │
└─────────────────────┘
```

- Scanner sempre visível no topo
- Carrinho em accordion/drawer
- Bottom sheet para finalização
- Impressão via share API ou bluetooth

---

## 🎨 PARTE 5: COMPONENTES ESPECÍFICOS

### 5.1 BarcodeInput Component

**Props:**
```typescript
interface BarcodeInputProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  autoFocus?: boolean
  enabled?: boolean
  showHistory?: boolean
  className?: string
}
```

**Visual:**
- Input grande e claro
- Ícone de scanner animado à esquerda
- Badge "PRONTO" / "ESCANEANDO" à direita
- Histórico dropdown abaixo
- Botão de limpar (X)
- Botão de busca manual

### 5.2 PrinterStatus Component

**Features:**
- Badge flutuante ou inline
- Cor baseada em status
- Tooltip com info detalhada
- Click abre modal de configurações
- Auto-refresh de status a cada 10s

### 5.3 ReceiptPreview Component

**Modal que mostra:**
- Preview visual do recibo (como será impresso)
- Opções: Imprimir / Reimprimir / Salvar PDF / Enviar Email
- Status da impressão em tempo real
- Fila de impressão (se houver)

### 5.4 HardwareSettings Component

**Página/Modal de configuração:**

**Scanner:**
- Habilitar/Desabilitar
- Adicionar automaticamente ao carrinho
- Configurar prefixo/sufixo
- Testar scanner
- Som de feedback

**Impressora:**
- Tipo de conexão
- String de conexão
- Largura do papel
- Encoding
- Configurar logo
- Configurar rodapé
- Testar impressão
- Auto-imprimir após venda

---

## 📝 PARTE 6: MODIFICAÇÕES NO SCHEMA

### 6.1 Adicionar ao Prisma Schema

```prisma
model Product {
  // ... campos existentes
  barcode       String?  @unique // Código de barras
  barcodeType   String?  // EAN13, EAN8, CODE128, etc
}

model Sale {
  // ... campos existentes
  printedAt     DateTime?
  printJobId    String?
  printStatus   String?   // pending, success, failed
}

model PrintJob {
  id            String   @id @default(cuid())
  type          String   // sale, cash-transaction, report
  data          Json
  status        String   // pending, printing, completed, failed
  error         String?
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  retryCount    Int      @default(0)
}

model HardwareConfig {
  id            String   @id @default(cuid())
  pointOfSaleId String   @unique
  pointOfSale   PointOfSale @relation(fields: [pointOfSaleId], references: [id])
  
  // Scanner
  scannerEnabled Boolean @default(false)
  scannerAutoAdd Boolean @default(true)
  scannerPrefix  String?
  scannerSuffix  String?
  
  // Printer
  printerEnabled Boolean @default(false)
  printerType    String  // USB, Network, Serial
  printerConnection String?
  printerWidth   Int     @default(48)
  printerEncoding String @default("UTF-8")
  autoPrint      Boolean @default(true)
  
  // Logo e customização
  logoUrl        String?
  footerMessage  String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 🚀 PARTE 7: PLANO DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Dia 1-2)
1. ✅ Instalar dependências
2. ✅ Criar estrutura de pastas
3. ✅ Atualizar Prisma schema
4. ✅ Rodar migrations
5. ✅ Criar types e interfaces TypeScript

### Fase 2: Leitor de Código de Barras (Dia 3-4)
1. ✅ Implementar `useBarcodeScanner` hook
2. ✅ Criar `BarcodeInput` component
3. ✅ Integrar com busca de produtos
4. ✅ Adicionar sons de feedback
5. ✅ Testar com scanner físico
6. ✅ Fallback para entrada manual

### Fase 3: Impressora Térmica (Dia 5-7)
1. ✅ Implementar serviço de impressão
2. ✅ Criar templates de recibo
3. ✅ API endpoints para impressão
4. ✅ Hook `useThermalPrinter`
5. ✅ Sistema de fila
6. ✅ Tratamento de erros
7. ✅ Testes com impressora física

### Fase 4: Redesign UI (Dia 8-10)
1. ✅ Refatorar layout principal
2. ✅ Integrar BarcodeInput na tela de vendas
3. ✅ Adicionar PrinterStatus
4. ✅ Redesenhar carrinho
5. ✅ Modal de finalização com preview
6. ✅ Responsividade mobile
7. ✅ Atalhos de teclado

### Fase 5: Integrações e Polimento (Dia 11-12)
1. ✅ Conectar checkout com impressão automática
2. ✅ Página de configurações de hardware
3. ✅ Histórico de impressões
4. ✅ Reimprimir vendas antigas
5. ✅ Testes de integração
6. ✅ Documentação

### Fase 6: Testes e Deploy (Dia 13-14)
1. ✅ Testes em ambiente real
2. ✅ Ajustes de performance
3. ✅ Treinamento de usuários
4. ✅ Deploy gradual
5. ✅ Monitoramento

---

## 🎯 CONSIDERAÇÕES IMPORTANTES

### Segurança
- Validar códigos de barras antes de buscar no DB
- Sanitizar inputs do scanner
- Rate limiting nas APIs de impressão
- Logs de todas as operações de hardware

### Performance
- Debounce no scanner para evitar scans duplicados
- Cache de produtos buscados por barcode
- Fila assíncrona para impressões
- Retry automático em caso de falha

### UX
- **Feedback visual instantâneo** em toda operação
- Sons diferentes para sucesso/erro
- Animações suaves mas rápidas
- Loading states claros
- Mensagens de erro amigáveis

### Acessibilidade
- Foco keyboard-first
- Screen reader support
- Alto contraste para scanner
- Textos grandes e legíveis

### Compatibilidade
- Testar com múltiplos modelos de impressora
- Suporte a diferentes encodings
- Fallback para impressão via browser
- Web Bluetooth para mobile

---

## 📚 RECURSOS E REFERÊNCIAS

### Bibliotecas Recomendadas
- `node-thermal-printer` - Impressão térmica ESC/POS
- `qrcode` - Geração de QR codes para recibos
- `howler` - Sons de feedback
- `framer-motion` - Animações da UI

### Documentação
- [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/)
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

### Exemplos de Templates de Recibo
```
================================
     NOME DA LOJA
     CNPJ: XX.XXX.XXX/0001-XX
     Endereço da Loja
     Tel: (XX) XXXX-XXXX
================================

Venda #: 12345
Data: 08/10/2025 14:35
Caixa: João Silva
PDV: Caixa 01

--------------------------------
ITEM              QTD  VL.UNIT
--------------------------------
Coca Cola 2L        2    8,50
                         17,00

Arroz Tio João      1   25,00
5kg                      25,00

Feijão Camil 1kg    3    7,50
                         22,50

--------------------------------
SUBTOTAL:                64,50
DESCONTO:                 0,00
================================
TOTAL:              R$ 64,50
================================

Pagamento: DINHEIRO
Recebido:       R$ 100,00
Troco:          R$  35,50

================================
     ╔══════════════════╗
     ║ [QR CODE]        ║
     ║  Nota Fiscal     ║
     ╚══════════════════╝
================================
   Obrigado pela preferência!
      Volte sempre! 😊
================================
```

---

## ✅ CHECKLIST FINAL

### Funcionalidades Core
- [ ] Scanner detecta e processa códigos de barras
- [ ] Produtos são adicionados automaticamente ao carrinho
- [ ] Impressora conecta e imprime recibos
- [ ] Templates de recibo estão corretos
- [ ] Fila de impressão funciona
- [ ] Tratamento de erros robusto

### UI/UX
- [ ] Layout redesenhado está implementado
- [ ] Scanner input tem feedback visual
- [ ] Status da impressora é visível
- [ ] Carrinho tem melhorias visuais
- [ ] Modal de finalização com preview
- [ ] Responsivo em mobile
- [ ] Atalhos de teclado funcionam

### Configuração
- [ ] Página de settings para hardware
- [ ] Configuração salva por ponto de venda
- [ ] Teste de impressora disponível
- [ ] Teste de scanner disponível

### Qualidade
- [ ] Código TypeScript sem erros
- [ ] Componentes documentados
- [ ] Tratamento de edge cases
- [ ] Performance otimizada
- [ ] Logs adequados

---

## 🎉 RESULTADO ESPERADO

Ao final, você terá um sistema de vendas modernizado onde:

1. **Operador escaneia produtos** → Aparece imediatamente no carrinho
2. **Adiciona quantidades** → Interface intuitiva e rápida
3. **Finaliza venda** → Um clique
4. **Recibo imprime automaticamente** → Sem necessidade de ação manual
5. **Cliente recebe recibo** → Profissional e completo
6. **Próxima venda** → Sistema já pronto para escanear

**Tempo médio de uma venda**: < 30 segundos
**Experiência**: Fluída, moderna, profissional
**Confiabilidade**: Sistema robusto com fallbacks

---

## 💡 DICAS DE IMPLEMENTAÇÃO

1. **Comece pelo scanner** - É mais fácil e dá vitória rápida
2. **Teste com produtos reais** - Use códigos de barras de produtos que você tem
3. **Mock da impressora primeiro** - Teste o fluxo antes de conectar hardware
4. **UI incremental** - Vá adicionando elementos aos poucos
5. **Peça feedback** - Usuários finais são essenciais
6. **Documente configs** - Diferentes impressoras têm diferentes setups

---

## 🤝 SUPORTE E PRÓXIMOS PASSOS

Após implementação básica, considere:
- **NFC/RFID** para produtos sem código de barras
- **Integração com balanças** para produtos a granel
- **Segunda via via WhatsApp/Email**
- **Dashboard de performance de hardware**
- **Manutenção preditiva** (papel baixo, alertas, etc)
- **Multi-impressora** para diferentes tipos de recibo

---

**Boa sorte com a implementação! 🚀**
