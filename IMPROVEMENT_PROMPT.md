# 🎨 Prompt de Melhorias - NitroBeer POS

## 📋 Contexto do Projeto

Você está trabalhando no **NitroBeer POS**, um sistema completo de ponto de venda para cervejarias artesanais desenvolvido com:
- **Frontend:** Next.js 14, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Neon)
- **Autenticação:** NextAuth.js
- **Estado:** React Query (TanStack Query)

O sistema atual possui:
- ✅ PDV completo com carrinho e múltiplos pagamentos
- ✅ Controle de inventário multi-localização (câmara fria, casa, PDV)
- ✅ Gestão de clientes e bonificações
- ✅ Dashboard com analytics e KPIs
- ✅ Sessões de caixa
- ✅ Relatórios Z (fechamentos diários)
- ✅ Sistema de carrinhos pendentes
- ✅ PWA instalável

---

## 🎯 OBJETIVO DAS MELHORIAS

Melhorar a **usabilidade**, **design** e **funcionalidades** do sistema focando em:

1. **UI/UX aprimorada** - Interface mais intuitiva e moderna
2. **Inventário avançado** - Funcionalidades profissionais de gestão de estoque
3. **Sistema de Encomendas** - Para produtos especiais sob demanda (barris premium)
4. **Dashboard redesenhada** - Mais visual, informativa e customizável

---

## 📦 TAREFA 1: MELHORAR O INVENTÁRIO

### 🎯 Objetivo
Transformar a página de inventário em um sistema profissional de gestão de estoque com funcionalidades avançadas.

### 📍 Arquivo Principal
`app/(app)/dashboard/inventory/page.tsx`

### ✨ Funcionalidades a Implementar

#### 1. Bulk Operations (Operações em Massa)
```typescript
// Adicionar toolbar flutuante quando items selecionados
interface BulkToolbar {
  - Checkbox "Selecionar todos"
  - Contador de selecionados: "X produtos selecionados"
  - Ações:
    - Ajustar preços em massa (+X% ou -X%)
    - Mover entre localizações (bulk transfer)
    - Exportar selecionados
    - Ativar/Desativar em massa
    - Aplicar tags em massa
    - Deletar selecionados (com confirmação)
}
```

#### 2. Filtros Avançados
```typescript
// Expandir sistema de filtros atual
interface AdvancedFilters {
  // Já existentes:
  - category: string
  - alertLevel: 'all' | 'critical' | 'low' | 'healthy'
  - searchQuery: string
  
  // NOVOS:
  - supplier: string[]          // Multi-select de fornecedores
  - priceRange: [min, max]      // Slider de faixa de preço
  - stockRange: [min, max]      // Slider de quantidade em estoque
  - location: Location[]        // Quais locais têm estoque
  - tags: string[]              // Multi-select de tags
  - lastRestocked: DateRange    // Última reposição
  - turnoverRate: 'high' | 'medium' | 'low' | 'stagnant'
  - profitMargin: [min, max]    // Margem de lucro %
  - sku: string                 // Busca por SKU
  - brand: string[]             // Multi-select de marcas
}

// UI: Usar shadcn/ui Popover com form de filtros
// Mostrar badges dos filtros ativos
// Botão "Limpar filtros"
// Salvar combinações de filtros favoritas
```

#### 3. Histórico de Movimentações
```typescript
// Para cada produto, mostrar histórico detalhado
interface InventoryHistory {
  id: string
  productId: string
  type: 'RECEIPT' | 'TRANSFER' | 'SALE' | 'ADJUSTMENT' | 'LOSS' | 'RETURN'
  quantity: number
  fromLocation?: Location
  toLocation?: Location
  performedBy: User
  reason?: string
  notes?: string
  occurredAt: DateTime
  costImpact?: number  // Impacto financeiro
}

// UI: Dialog/Drawer lateral ao clicar em "Ver histórico"
// Timeline visual das movimentações
// Gráfico de variação de estoque ao longo do tempo
// Filtrar por tipo de movimentação
// Exportar histórico em Excel
```

#### 4. Análise ABC (Curva ABC)
```typescript
// Classificar produtos por importância financeira
interface ABCAnalysis {
  class: 'A' | 'B' | 'C'
  revenueContribution: number  // % da receita total
  cumulativePercentage: number
  
  // Classe A: 20% dos produtos = 80% da receita
  // Classe B: 30% dos produtos = 15% da receita  
  // Classe C: 50% dos produtos = 5% da receita
}

// UI: Tab nova "Análise ABC"
// Gráfico de Pareto
// Tabela com produtos classificados
// Sugestões de ação por classe:
//   - Classe A: Nunca faltar, monitorar de perto
//   - Classe B: Estoque moderado
//   - Classe C: Estoque mínimo, considerar descontinuar
```

#### 5. Previsão de Demanda
```typescript
// Usar dados históricos para prever necessidade
interface DemandForecast {
  productId: string
  averageDailyConsumption: number
  currentStock: number
  daysUntilStockout: number       // Quantos dias até acabar
  suggestedReorderPoint: number   // Quando pedir mais
  suggestedOrderQuantity: number  // Quanto pedir
  seasonalTrend?: 'up' | 'down' | 'stable'
  confidence: number              // 0-100% confiança
}

// UI: Card de "Previsões e Alertas"
// Lista de produtos que precisam reposição
// Gráfico de tendência (próximos 30 dias)
// Botão "Gerar pedido de compra" automático
```

#### 6. Alertas de Validade
```typescript
// Adicionar campo de validade e alertar
interface ExpirationAlert {
  productId: string
  productName: string
  location: Location
  quantity: number
  expiresAt: DateTime
  daysUntilExpiration: number
  urgency: 'critical' | 'warning' | 'info'
  
  // critical: < 7 dias
  // warning: 7-30 dias
  // info: 30-60 dias
}

// UI: Badge de alerta na listagem
// Card separado "Produtos próximos ao vencimento"
// Notificação push quando produto vencer em 7 dias
// Sugerir promoção/desconto para itens próximos do vencimento
```

#### 7. Gestão de Lotes (Batch Tracking)
```typescript
// Rastrear lotes de produção/compra
interface Batch {
  id: string
  productId: string
  batchNumber: string
  supplier?: string
  productionDate?: DateTime
  expirationDate?: DateTime
  receivedDate: DateTime
  quantity: number
  remainingQuantity: number
  cost: number
  location: Location
  notes?: string
  qrCode?: string  // Gerar QR Code do lote
}

// UI: Ao adicionar estoque, perguntar se quer criar lote
// Listagem de lotes ativos por produto
// FIFO automático (First In, First Out)
// Rastreabilidade completa de onde cada lote está
```

#### 8. Import/Export Aprimorado
```typescript
// Melhorar sistema de importação atual
interface ImportFeatures {
  // Formatos suportados:
  - CSV (atual)
  - XLSX (adicionar)
  - JSON (adicionar)
  - XML (para integrações)
  
  // Features:
  - Preview antes de importar
  - Mapeamento de colunas customizado
  - Validação de dados com erros destacados
  - Import parcial (skip linhas com erro)
  - Log de importação
  - Rollback de última importação
  - Templates para download
  
  // Export:
  - Filtros aplicados mantidos
  - Escolher colunas para exportar
  - Formatos: CSV, XLSX, PDF
  - Agendar exports automáticos
}

// UI: Dialog melhorado com wizard de 3 passos:
// 1. Upload/Preview
// 2. Mapeamento/Validação  
// 3. Confirmação/Resultado
```

#### 9. Dashboard de Inventário
```typescript
// Mini-dashboard no topo da página
interface InventoryDashboard {
  kpis: {
    totalValue: number           // Valor total do estoque
    totalItems: number           // Quantidade total de items
    lowStockCount: number        // Produtos em estoque baixo
    outOfStockCount: number      // Produtos esgotados
    expiringCount: number        // Produtos vencendo em 30 dias
    averageTurnover: number      // Giro médio de estoque (dias)
    deadStock: number            // Itens sem movimentação 90+ dias
    inventoryAccuracy: number    // % precisão (última auditoria)
  }
  
  charts: {
    stockByLocation: PieChart           // Distribuição por local
    stockByCategory: BarChart           // Valor por categoria
    turnoverRate: LineChart             // Taxa de giro mensal
    stockoutFrequency: BarChart         // Frequência de rupturas
  }
}

// UI: Grid de KPI cards no topo
// Mini-gráficos inline
// Click para drill-down em detalhes
// Comparação com período anterior
```

#### 10. Auditoria de Inventário
```typescript
// Sistema para contagem física periódica
interface InventoryAudit {
  id: string
  startedAt: DateTime
  completedAt?: DateTime
  status: 'in_progress' | 'completed' | 'cancelled'
  performedBy: User[]
  location?: Location  // Auditar local específico
  
  items: {
    productId: string
    expectedQuantity: number
    countedQuantity: number
    difference: number
    notes?: string
    photoUrl?: string  // Foto da contagem
  }[]
  
  summary: {
    totalItems: number
    itemsWithDifference: number
    accuracyRate: number
    totalValueDifference: number
  }
}

// UI: Wizard de auditoria:
// 1. Selecionar produtos/local para auditar
// 2. Modo de contagem (app mobile friendly)
// 3. Comparar sistema vs contagem
// 4. Ajustar diferenças
// 5. Gerar relatório de auditoria
```

### 🎨 Melhorias de UI/UX

#### Layout Otimizado
```typescript
// Estrutura da página melhorada:
<Page>
  <Header>
    <Title>Inventário</Title>
    <Actions>
      <Button>Adicionar Estoque</Button>
      <Button>Transferir</Button>
      <Button>Auditar</Button>
      <Button>Importar</Button>
      <ExportDropdown />
    </Actions>
  </Header>
  
  <DashboardGrid>
    {/* KPIs */}
  </DashboardGrid>
  
  <Toolbar>
    <SearchBar />
    <FilterPopover />
    <ViewToggle> {/* Table | Cards | Grid */}
    <SortDropdown />
  </Toolbar>
  
  <BulkToolbar> {/* Aparece se tem seleção */}
  
  <Tabs>
    <Tab value="overview">Visão Geral</Tab>
    <Tab value="by-location">Por Localização</Tab>
    <Tab value="abc-analysis">Análise ABC</Tab>
    <Tab value="forecasts">Previsões</Tab>
    <Tab value="batches">Lotes</Tab>
    <Tab value="audits">Auditorias</Tab>
  </Tabs>
  
  <Content>
    {/* Tabela/Cards com virtualization para performance */}
  </Content>
</Page>
```

#### Ações Rápidas Contextuais
```typescript
// Cada produto na lista deve ter:
<ProductRow>
  <QuickActions>
    <IconButton icon={Eye} tooltip="Ver detalhes" />
    <IconButton icon={Edit} tooltip="Editar" />
    <IconButton icon={ArrowUpDown} tooltip="Transferir" />
    <IconButton icon={Plus} tooltip="Adicionar estoque" />
    <IconButton icon={Minus} tooltip="Ajustar (perda/dano)" />
    <IconButton icon={History} tooltip="Ver histórico" />
    <IconButton icon={BarChart} tooltip="Ver analytics" />
  </QuickActions>
</ProductRow>
```

#### Status Visual Aprimorado
```typescript
// Indicadores visuais mais claros:
- Stock Level Bar (barra de progresso colorida)
- Location Pills (badges por localização com quantidade)
- Trending Icons (↑ ↓ → para indicar tendência)
- Health Score (score de 0-100 da saúde do produto)
- Alerts Badge (contador de alertas ativos)
```

---

## 📦 TAREFA 2: SISTEMA DE ENCOMENDAS

### 🎯 Objetivo
Criar um sistema completo para gerenciar produtos especiais vendidos sob encomenda (ex: barris premium de IPA, cervejas limitadas, kits especiais).

### 📍 Arquivos a Criar
```
app/(app)/dashboard/orders/
  ├── page.tsx                    # Lista de encomendas
  ├── new/page.tsx               # Nova encomenda
  ├── [id]/page.tsx              # Detalhes da encomenda
  └── components/
      ├── OrderForm.tsx
      ├── OrderCard.tsx
      ├── OrderTimeline.tsx
      └── OrderStatusBadge.tsx

app/api/orders/
  ├── route.ts                   # GET, POST
  ├── [id]/route.ts             # GET, PATCH, DELETE
  └── [id]/status/route.ts      # Atualizar status

lib/
  └── useOrders.ts              # React Query hooks
```

### 🗄️ Schema do Prisma

```prisma
enum OrderStatus {
  PENDING        // Aguardando confirmação
  CONFIRMED      // Confirmado pelo cliente
  PREPARING      // Em preparação/produção
  READY          // Pronto para retirada
  DELIVERED      // Entregue
  CANCELLED      // Cancelado
}

enum OrderPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique  // Ex: "ENC-2025-001"
  
  // Cliente
  customerId      String?
  customer        Customer?     @relation(fields: [customerId], references: [id])
  customerName    String
  customerPhone   String
  customerEmail   String?
  customerAddress String?
  
  // Status e prioridade
  status          OrderStatus   @default(PENDING)
  priority        OrderPriority @default(MEDIUM)
  
  // Datas importantes
  orderedAt       DateTime      @default(now())
  confirmedAt     DateTime?
  promisedAt      DateTime?     // Data prometida de entrega
  readyAt         DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  
  // Financeiro
  subtotal        Float
  discountValue   Float         @default(0)
  deliveryFee     Float         @default(0)
  total           Float
  depositPaid     Float         @default(0)
  balanceDue      Float
  paymentStatus   PaymentStatus @default(PENDING)
  
  // Itens
  items           OrderItem[]
  
  // Observações
  notes           String?       // Observações do cliente
  internalNotes   String?       // Notas internas (não visível para cliente)
  specialRequests String?       // Pedidos especiais
  
  // Rastreamento
  statusHistory   Json?         // Histórico de mudanças de status
  notifications   Json?         // Notificações enviadas
  
  // Metadados
  createdBy       String?       // Usuário que criou
  assignedTo      String?       // Usuário responsável
  source          String?       // web, telefone, whatsapp, presencial
  pointOfSaleId   String?
  pointOfSale     PointOfSale?  @relation(fields: [pointOfSaleId], references: [id])
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([customerId])
  @@index([status])
  @@index([promisedAt])
  @@index([orderNumber])
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  quantity    Int
  unitPrice   Float
  discount    Float    @default(0)
  subtotal    Float
  
  // Customizações
  customizations Json?  // Ex: { engraving: "Feliz Aniversário", color: "azul" }
  notes          String?
  
  // Status individual do item
  status      String   @default("pending")  // pending, in_production, ready
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([orderId])
  @@index([productId])
}

// Adicionar ao Product existente:
model Product {
  // ... campos existentes ...
  
  // NOVOS campos para produtos sob encomenda:
  isOrderOnly         Boolean  @default(false)  // Somente sob encomenda?
  leadTimeDays        Int?                      // Prazo de produção (dias)
  minOrderQuantity    Int?                      // Quantidade mínima
  maxOrderQuantity    Int?                      // Quantidade máxima
  requiresDeposit     Boolean  @default(false)  // Requer sinal?
  depositPercentage   Float?                    // % de sinal
  availableForOrder   Boolean  @default(true)   // Disponível para encomenda?
  orderInstructions   String?                   // Instruções especiais
  
  orderItems          OrderItem[]
}
```

### ✨ Funcionalidades do Sistema

#### 1. Cadastro de Produtos sob Encomenda
```typescript
// Adicionar seção em app/(app)/dashboard/products/page.tsx

interface OrderOnlyProduct {
  // Toggle "Somente sob encomenda"
  isOrderOnly: boolean
  
  // Se true, mostrar campos adicionais:
  leadTimeDays: number          // Ex: 7 dias para produzir
  minOrderQuantity: number      // Ex: mínimo 6 garrafas
  maxOrderQuantity: number      // Ex: máximo 50 garrafas
  requiresDeposit: boolean      // Requer sinal de 50%?
  depositPercentage: number     // % do sinal
  orderInstructions: string     // Instruções para o cliente
}

// UI: Card expandido ao marcar "Sob encomenda"
// Wizard para configurar produto especial
```

#### 2. Página de Listagem de Encomendas
```typescript
// app/(app)/dashboard/orders/page.tsx

interface OrdersPage {
  // Header
  header: {
    title: "Encomendas"
    stats: {
      pending: number
      inProgress: number
      ready: number
      total: number
    }
    actions: {
      - Nova Encomenda
      - Exportar
      - Filtros
    }
  }
  
  // Filtros
  filters: {
    status: OrderStatus[]
    priority: OrderPriority[]
    dateRange: [Date, Date]
    customer: string
    product: string
    source: string
  }
  
  // Views
  views: {
    - Kanban (por status)
    - Lista (tabela)
    - Calendário (por data prometida)
    - Timeline
  }
  
  // Cards de encomenda
  orderCards: {
    orderNumber: string
    customer: string
    items: { name, quantity }[]
    status: Badge
    priority: Badge
    promisedDate: Date
    daysRemaining: number
    progress: ProgressBar
    quickActions: [
      "Ver detalhes",
      "Atualizar status",
      "Notificar cliente",
      "Imprimir"
    ]
  }
}

// UI Design:
// - Kanban board estilo Trello (arrastável)
// - Cores por prioridade (vermelho=urgente)
// - Countdown timer para data prometida
// - Avatar do cliente
// - Preview dos itens (imagens pequenas)
```

#### 3. Formulário de Nova Encomenda
```typescript
// app/(app)/dashboard/orders/new/page.tsx

interface NewOrderForm {
  // Wizard de 4 passos:
  
  // Passo 1: Cliente
  step1: {
    // Buscar cliente existente ou criar novo
    customerSearch: Combobox
    // ou
    newCustomer: {
      name: string
      phone: string
      email?: string
      address?: string
    }
  }
  
  // Passo 2: Produtos
  step2: {
    // Buscar produtos "orderOnly" ou disponíveis
    productSearch: Combobox
    // Lista de items adicionados
    items: {
      product: Product
      quantity: number
      unitPrice: number
      customizations?: Record<string, any>
      notes?: string
      
      // Validações:
      - Quantidade mínima/máxima
      - Lead time do produto
    }[]
    
    // Summary sidebar:
    subtotal: number
    discount: number
    deliveryFee: number
    total: number
  }
  
  // Passo 3: Detalhes
  step3: {
    priority: OrderPriority
    promisedDate: DatePicker  // Calcular baseado em lead time
    deliveryMethod: 'pickup' | 'delivery'
    requiresDeposit: boolean
    depositAmount: number
    notes: string
    specialRequests: string
  }
  
  // Passo 4: Confirmação
  step4: {
    // Review de tudo
    // Imprimir comprovante
    // Enviar WhatsApp/Email automático
  }
}

// Validações:
- Cliente obrigatório
- Pelo menos 1 item
- Data prometida >= hoje + lead time
- Se requer depósito, valor > 0
```

#### 4. Página de Detalhes da Encomenda
```typescript
// app/(app)/dashboard/orders/[id]/page.tsx

interface OrderDetailPage {
  // Header
  header: {
    orderNumber: string
    status: Badge
    priority: Badge
    createdAt: Date
    actions: [
      "Editar",
      "Atualizar Status",
      "Imprimir",
      "Notificar Cliente",
      "Cancelar"
    ]
  }
  
  // Layout em 2 colunas
  leftColumn: {
    // Informações do cliente
    customerCard: {
      name: string
      phone: string (click to call)
      email: string (click to email)
      address?: string
      orderHistory: Order[] // Outras encomendas deste cliente
    }
    
    // Datas importantes
    timelineCard: {
      orderedAt: Date
      confirmedAt?: Date
      promisedAt: Date (destacar)
      readyAt?: Date
      deliveredAt?: Date
      
      // Visual timeline
      // Progress bar com marcos
    }
    
    // Financeiro
    paymentCard: {
      subtotal: number
      discount: number
      deliveryFee: number
      total: number
      depositPaid: number
      balanceDue: number (destacar)
      paymentStatus: Badge
      
      actions: [
        "Registrar Pagamento",
        "Aplicar Desconto",
        "Gerar Boleto"
      ]
    }
  }
  
  rightColumn: {
    // Items da encomenda
    itemsList: {
      // Cada item
      product: {
        image: string
        name: string
        quantity: number
        unitPrice: number
        subtotal: number
        customizations?: Json
        notes?: string
        status: Badge
      }
      
      // Checkbox para marcar item como "pronto"
    }
    
    // Observações
    notesCard: {
      customerNotes: string (somente leitura)
      internalNotes: Textarea (editável)
      specialRequests: string (somente leitura)
    }
    
    // Histórico de ações
    activityLog: {
      // Timeline de todas as ações
      {
        action: string
        performedBy: User
        timestamp: Date
        details?: string
      }[]
    }
  }
  
  // Footer com ações principais
  footer: {
    - Voltar
    - Salvar Alterações
    - Próximo Status
  }
}
```

#### 5. Fluxo de Status
```typescript
// Transições de status permitidas
const statusFlow = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'PREPARING'], // Pode voltar se necessário
  DELIVERED: [], // Estado final
  CANCELLED: [] // Estado final
}

// Ao mudar status:
interface StatusUpdate {
  // 1. Validar transição permitida
  // 2. Atualizar timestamp correspondente
  // 3. Adicionar ao histórico
  // 4. Notificar cliente (opcional)
  // 5. Trigger ações automáticas:
  
  PENDING → CONFIRMED:
    - Enviar confirmação por WhatsApp/Email
    - Calcular data prometida
    - Cobrar sinal se necessário
    
  CONFIRMED → PREPARING:
    - Separar produtos do estoque
    - Notificar equipe de produção
    - Criar tarefas
    
  PREPARING → READY:
    - Notificar cliente que está pronto
    - Lembrar de pagar saldo (se houver)
    
  READY → DELIVERED:
    - Registrar entrega
    - Solicitar feedback/avaliação
    - Atualizar histórico do cliente
}
```

#### 6. Notificações Automáticas
```typescript
interface OrderNotifications {
  // WhatsApp (via API - Twilio/Evolution API)
  whatsapp: {
    onConfirmed: "Sua encomenda #{orderNumber} foi confirmada! ✅"
    onReady: "Sua encomenda está pronta para retirada! 🎉"
    reminder3Days: "Lembrete: sua encomenda ficará pronta em 3 dias"
    reminder1Day: "Sua encomenda ficará pronta amanhã! 🍺"
    onDelayed: "Pedimos desculpas, mas sua encomenda atrasará..."
  }
  
  // Email (via SendGrid/Resend)
  email: {
    orderConfirmation: "Confirmação de Encomenda"
    orderReady: "Seu pedido está pronto!"
    invoice: "Nota Fiscal"
    receipt: "Comprovante de Entrega"
  }
  
  // SMS (opcional)
  sms: {
    readyForPickup: "NitroBeer: Sua encomenda está pronta!"
  }
}

// UI: Toggle no admin para habilitar/desabilitar cada tipo
// Log de notificações enviadas
```

#### 7. Dashboard de Encomendas
```typescript
// Widgets para o dashboard principal
interface OrdersDashboard {
  kpis: {
    totalOrders: number
    pendingOrders: number
    overdueOrders: number // Passou da data prometida
    avgLeadTime: number // Tempo médio de produção
    conversionRate: number // % pending → delivered
    totalRevenue: number
  }
  
  charts: {
    ordersByStatus: PieChart
    ordersTrend: LineChart // Últimos 30 dias
    topProducts: BarChart // Produtos mais encomendados
    onTimeDelivery: Gauge // % entregas no prazo
  }
  
  upcomingDeadlines: {
    // Lista de encomendas com deadline próximo
    // Ordenado por urgência
  }
}
```

#### 8. Relatórios de Encomendas
```typescript
interface OrderReports {
  // Gerar relatórios em PDF/Excel
  
  orderSummary: {
    period: DateRange
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    topCustomers: []
    topProducts: []
    statusBreakdown: {}
  }
  
  performanceReport: {
    onTimeDeliveryRate: number
    avgLeadTime: number
    cancellationRate: number
    customerSatisfaction: number
  }
  
  // Imprimir comprovante individual
  orderReceipt: {
    orderNumber: string
    customer: {}
    items: []
    total: number
    qrCode: string // Para rastreamento
  }
}
```

---

## 🎨 TAREFA 3: MELHORAR DASHBOARD & SIDEBAR

### 🎯 Objetivo
Redesenhar o dashboard principal e sidebar para serem mais visuais, informativos e customizáveis.

### 📍 Arquivos a Modificar
```
components/
  ├── SidebarLayout.tsx           # Melhorar sidebar
  └── dashboard/
      ├── DashboardHeader.tsx     # Melhorar header
      ├── DashboardKpiGrid.tsx    # Melhorar KPIs
      ├── DashboardCharts.tsx     # Novos gráficos
      └── NEW: DashboardWidgets.tsx

app/(app)/dashboard/
  └── page.tsx                    # Redesenhar dashboard
```

### ✨ Melhorias na Sidebar

#### Redesign Completo
```typescript
// components/SidebarLayout.tsx

interface ImprovedSidebar {
  // Header da sidebar
  header: {
    logo: Image | Icon
    brandName: string
    tagline: string
    collapseButton: IconButton
  }
  
  // Perfil do usuário (topo)
  userProfile: {
    avatar: Avatar (foto ou iniciais)
    name: string
    role: Badge
    pointOfSale?: string // PDV atual
    cashSession?: {
      isOpen: boolean
      balance: number
      duration: string
    }
    
    // Dropdown ao clicar
    menu: [
      "Meu Perfil",
      "Trocar PDV",
      "Abrir/Fechar Caixa",
      "Configurações",
      "Sair"
    ]
  }
  
  // Navegação principal
  navigation: {
    // Agrupar por seções
    sections: [
      {
        title: "Operacional"
        items: [
          { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }
          { icon: ShoppingCart, label: "PDV", href: "/dashboard/sales", badge: "Live" }
          { icon: Receipt, label: "Encomendas", href: "/dashboard/orders", badge: count }
          { icon: Users, label: "Clientes", href: "/dashboard/customers" }
        ]
      },
      {
        title: "Estoque"
        items: [
          { icon: Package, label: "Inventário", href: "/dashboard/inventory" }
          { icon: Store, label: "Por Ponto", href: "/dashboard/inventory-by-point" }
          { icon: Building2, label: "Produtos", href: "/dashboard/products" }
        ]
      },
      {
        title: "Relatórios"
        items: [
          { icon: FileText, label: "Relatórios Z", href: "/dashboard/reports/daily" }
          { icon: BookOpen, label: "Livro de Vendas", href: "/dashboard/sales/ledger" }
          { icon: TrendingUp, label: "Analytics", href: "/dashboard/analytics" }
        ]
      },
      {
        title: "Configurações"
        items: [
          { icon: Users2, label: "Pontos de Venda", href: "/dashboard/points" }
          { icon: Settings, label: "Preferências", href: "/dashboard/settings" }
        ]
      }
    ]
  }
  
  // Footer da sidebar
  footer: {
    // Status indicators
    indicators: {
      connection: Badge // Online/Offline
      syncStatus: Badge // Sincronizado/Pendente
      lastSync: TimeAgo
    }
    
    // Quick actions
    quickActions: {
      theme: ThemeToggle
      notifications: IconButton (com badge de count)
      help: IconButton
    }
    
    // Version info
    version: "v2.5.0"
  }
}

// Comportamento:
- Hover em item mostra tooltip (se collapsed)
- Active state bem visível (barra lateral + bg)
- Animações suaves de transição
- Atalhos de teclado (Cmd+K para busca)
- Breadcrumbs no topo do conteúdo
```

#### Sidebar Personalizável
```typescript
// Permitir usuário reordenar/esconder items
interface SidebarCustomization {
  // Drag & drop para reordenar
  // Toggle para mostrar/ocultar seções
  // Favoritos (star icon)
  // Atalhos personalizados
  
  // Salvar preferência no localStorage ou DB
}
```

### ✨ Dashboard Redesenhada

#### Layout Inteligente
```typescript
// app/(app)/dashboard/page.tsx

interface NewDashboard {
  // Header aprimorado
  header: {
    greeting: "Bom dia, [Nome]" | "Boa tarde" | "Boa noite"
    date: "Segunda, 1 de Outubro de 2025"
    weather?: {
      temp: number
      condition: Icon
      // Dica: tempo quente = mais vendas de cerveja 🍺
    }
    
    // Quick stats inline
    quickStats: {
      currentSession: "Aberto há 3h27min"
      todaySales: "R$ 2.847,50"
      alertsCount: 3
    }
    
    // Quick actions
    quickActions: [
      { icon: ShoppingCart, label: "Nova Venda", href: "/dashboard/sales" }
      { icon: Package, label: "Entrada Estoque", action: openModal }
      { icon: Receipt, label: "Nova Encomenda", href: "/dashboard/orders/new" }
    ]
  }
  
  // Grid de Widgets (customizável)
  widgetGrid: {
    // Drag & drop para reorganizar
    // Adicionar/remover widgets
    // Resize widgets
    
    widgets: [
      // Padrão inicial:
      KPIsWidget,
      SalesChartWidget,
      TopProductsWidget,
      StockAlertsWidget,
      RecentOrdersWidget,
      CashFlowWidget,
      CalendarWidget,
      QuickActionsWidget,
    ]
  }
}
```

#### Widgets Disponíveis
```typescript
// components/dashboard/widgets/

// 1. KPIs Widget (já existe, melhorar)
interface KPIsWidget {
  size: 'full' // Largura total
  metrics: [
    { label: "Vendas Hoje", value: "R$ 2.847", trend: "+12%", icon: DollarSign }
    { label: "Ticket Médio", value: "R$ 84", trend: "+5%", icon: Receipt }
    { label: "Estoque Baixo", value: "8", trend: "-2", icon: AlertTriangle }
    { label: "Encomendas", value: "12", trend: "+4", icon: Package }
  ]
  // Clicar em cada métrica abre drill-down
}

// 2. Sales Chart Widget
interface SalesChartWidget {
  size: 'large' // 2/3 da largura
  chart: {
    type: 'area' | 'bar' | 'line'
    data: HourlySalesData[]
    period: 'today' | 'week' | 'month'
  }
  // Toggle entre faturamento, quantidade, margem
}

// 3. Top Products Widget
interface TopProductsWidget {
  size: 'medium' // 1/3 da largura
  products: {
    name: string
    image: string
    sold: number
    revenue: number
    trend: Icon
  }[]
  // Top 5 produtos do período
}

// 4. Stock Alerts Widget
interface StockAlertsWidget {
  size: 'medium'
  alerts: {
    product: string
    level: 'critical' | 'low'
    quantity: number
    location: string
    action: Button
  }[]
  // Click para ir direto ao inventário
}

// 5. Recent Orders Widget
interface RecentOrdersWidget {
  size: 'medium'
  orders: {
    orderNumber: string
    customer: string
    status: Badge
    promisedDate: Date
    daysRemaining: number
  }[]
  // Click para abrir detalhes
}

// 6. Cash Flow Widget
interface CashFlowWidget {
  size: 'medium'
  currentSession: {
    openedAt: DateTime
    duration: string
    openingBalance: number
    currentBalance: number
    salesTotal: number
    supplies: number
    withdrawals: number
  }
  chart: MiniLineChart // Evolução do caixa no turno
}

// 7. Calendar Widget
interface CalendarWidget {
  size: 'medium'
  events: {
    date: Date
    type: 'order_deadline' | 'audit' | 'delivery' | 'meeting'
    title: string
    urgent: boolean
  }[]
  // Próximos 7 dias
  // Click para ver detalhes
}

// 8. Quick Insights Widget (IA)
interface QuickInsightsWidget {
  size: 'medium'
  insights: {
    icon: Icon
    title: string
    description: string
    action?: Button
  }[]
  
  // Examples:
  // - "IPA está vendendo 40% acima da média esta semana"
  // - "3 produtos estão próximos do vencimento"
  // - "Sexta-feira é seu dia de maior movimento"
  // - "Você tem 5 clientes sem comprar há 30+ dias"
}

// 9. Recent Activity Widget
interface RecentActivityWidget {
  size: 'small'
  activities: {
    icon: Icon
    text: string
    timestamp: TimeAgo
    user: User
  }[]
  
  // Examples:
  // - "João adicionou 24 unidades de American Lager"
  // - "Maria finalizou venda de R$ 156,00"
  // - "Pedro confirmou encomenda #ENC-123"
}

// 10. Team Performance Widget
interface TeamPerformanceWidget {
  size: 'medium'
  members: {
    name: string
    avatar: string
    salesCount: number
    revenue: number
    rank: number
  }[]
  period: 'today' | 'week' | 'month'
  // Gamificação suave
}
```

#### Widget Customization
```typescript
// Permitir customizar dashboard
interface DashboardCustomization {
  // Botão "Personalizar Dashboard"
  // Entra em modo de edição:
  
  editMode: {
    // Drag & drop widgets
    // Resize widgets
    // Adicionar novos widgets (biblioteca)
    // Remover widgets
    // Configurar widget individual (período, filtros, etc)
  }
  
  // Salvar layouts personalizados
  layouts: {
    default: WidgetLayout
    sales_focus: WidgetLayout
    inventory_focus: WidgetLayout
    manager_view: WidgetLayout
    custom: WidgetLayout[]
  }
  
  // Trocar layout rapidamente (dropdown)
}
```

### 🎨 Melhorias Visuais Gerais

#### Tema e Cores
```typescript
// Aprimorar o design system
interface ImprovedTheme {
  // Cores mais vibrantes e profissionais
  colors: {
    primary: '#F59E0B' // Amber 500 (atual)
    primaryDark: '#D97706' // Amber 600
    primaryLight: '#FCD34D' // Amber 300
    
    success: '#10B981' // Emerald 500
    warning: '#F59E0B' // Amber 500
    danger: '#EF4444' // Red 500
    info: '#3B82F6' // Blue 500
    
    // Gradientes
    gradients: {
      primary: 'from-amber-400 to-amber-600'
      success: 'from-emerald-400 to-emerald-600'
      danger: 'from-red-400 to-red-600'
    }
  }
  
  // Sombras mais sutis
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
  
  // Animações suaves
  animations: {
    fadeIn: 'fadeIn 0.2s ease-in'
    slideIn: 'slideInRight 0.3s ease-out'
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  }
}
```

#### Micro-interações
```typescript
// Adicionar feedback visual em ações
interface Microinteractions {
  // Buttons: ripple effect ao clicar
  // Cards: subtle lift on hover
  // Inputs: focus ring animado
  // Success: confetti ou checkmark animado
  // Delete: shake before confirm
  // Add to cart: bounce animation
  // Notification: slide in from top
  // Loading: skeleton screens (não spinners)
}
```

#### Responsividade Mobile
```typescript
// Otimizar para tablets (PDV)
interface MobileOptimizations {
  // Touch targets maiores (44px min)
  // Gestos: swipe, pinch-to-zoom
  // Bottom navigation em mobile
  // Drawer lateral ao invés de sidebar
  // Cards ao invés de tabelas
  // FAB (Floating Action Button) para ações principais
  // Modo paisagem otimizado
}
```

#### Dark Mode Aprimorado
```typescript
// Melhorar contraste no dark mode
interface ImprovedDarkMode {
  // Cores mais suaves (não branco puro)
  background: '#0F172A' // Slate 900
  surface: '#1E293B' // Slate 800
  text: '#E2E8F0' // Slate 200
  
  // Ajustar opacidades
  // Melhorar legibilidade de gráficos
  // Imagens com overlay suave
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Inventário Avançado
- [X] Bulk operations (checkbox + toolbar flutuante)
- [X] Filtros avançados (supplier, price range, tags, etc)
- [X] Histórico de movimentações por produto
- [X] Análise ABC com gráfico de Pareto
- [X] Previsão de demanda (usando dados históricos)
- [X] Alertas de validade
- [X] Gestão de lotes (batch tracking)
- [X] Import/Export melhorado (wizard, preview, validação)
- [X] Dashboard de inventário (KPIs + gráficos)
- [X] Sistema de auditoria (contagem física)
- [X] Layout otimizado (tabs, toolbar, views)
- [X] Ações rápidas contextuais por produto
- [X] Status visual aprimorado

### Sistema de Encomendas
- [ ] Schema Prisma (Order, OrderItem, modificar Product)
- [ ] API routes (CRUD completo)
- [ ] React Query hooks (useOrders)
- [ ] Página de listagem (Kanban + tabela + calendário)
- [ ] Formulário de nova encomenda (wizard 4 passos)
- [ ] Página de detalhes (layout 2 colunas)
- [ ] Fluxo de status com transições
- [ ] Notificações automáticas (WhatsApp, email, SMS)
- [ ] Dashboard de encomendas (KPIs + widgets)
- [ ] Relatórios de encomendas
- [ ] Integrar produtos "orderOnly" no cadastro
- [ ] Sistema de prioridade e urgência

### Dashboard & Sidebar
- [ ] Redesign completo da sidebar
- [ ] Perfil de usuário no topo da sidebar
- [ ] Navegação agrupada por seções
- [ ] Footer da sidebar com indicators
- [ ] Sidebar personalizável (reordenar/esconder)
- [ ] Dashboard header aprimorado (greeting, quick stats)
- [ ] Grid de widgets customizável (drag & drop)
- [ ] 10+ widgets disponíveis
- [ ] Widget customization (período, filtros)
- [ ] Layouts salvos (sales focus, inventory focus, etc)
- [ ] Tema aprimorado (cores, sombras, animações)
- [ ] Micro-interações em toda UI
- [ ] Otimizações mobile/tablet
- [ ] Dark mode melhorado

---

## 🎨 DIRETRIZES DE DESIGN

### Princípios
1. **Clareza sobre complexidade** - Não sobrecarregar com informação
2. **Ação sobre apresentação** - Botões claros, CTA destacados
3. **Feedback imediato** - Toda ação tem resposta visual
4. **Consistência** - Mesmos padrões em todo o sistema
5. **Acessibilidade** - Contraste adequado, navegação por teclado
6. **Performance** - Animações a 60fps, loading states

### Componentes
- Usar shadcn/ui como base
- Customizar para brand (amber/gold para cerveja)
- Ícones: Lucide React
- Gráficos: Recharts
- Tabelas: TanStack Table (para performance)
- Forms: React Hook Form + Zod
- Drag & Drop: dnd-kit
- Date Picker: react-day-picker

### Tipografia
- Headings: font-semibold, tracking-tight
- Body: font-normal, leading-relaxed
- Labels: text-sm, font-medium, text-muted-foreground
- Números: font-mono para valores monetários

### Espaçamento
- Usar escala consistente: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Breathing room generoso
- Max-width para leiturabilidade

---

## 🚀 ORDEM SUGERIDA DE IMPLEMENTAÇÃO

1. **Semana 1: Inventário - Parte 1**
   - Bulk operations
   - Filtros avançados
   - Histórico de movimentações
   - Layout otimizado

2. **Semana 2: Inventário - Parte 2**
   - Análise ABC
   - Previsão de demanda
   - Alertas de validade
   - Dashboard de inventário

3. **Semana 3: Inventário - Parte 3**
   - Gestão de lotes
   - Import/Export melhorado
   - Sistema de auditoria
   - Polimento geral

4. **Semana 4: Encomendas - Backend**
   - Schema Prisma + migrations
   - API routes completas
   - React Query hooks
   - Testes das APIs

5. **Semana 5: Encomendas - Frontend**
   - Página de listagem (views)
   - Formulário de nova encomenda
   - Página de detalhes
   - Fluxo de status

6. **Semana 6: Encomendas - Automações**
   - Notificações automáticas
   - Dashboard de encomendas
   - Relatórios
   - Integração com produtos

7. **Semana 7: Dashboard & Sidebar**
   - Redesign da sidebar
   - Dashboard header
   - 5 widgets principais
   - Layout básico customizável

8. **Semana 8: Widgets & Polish**
   - 5 widgets adicionais
   - Customização avançada
   - Micro-interações
   - Responsividade
   - Dark mode
   - Polimento final

---

## 📚 RECURSOS E REFERÊNCIAS

### Design Inspiration
- [Linear](https://linear.app) - Clean dashboard design
- [Notion](https://notion.so) - Customizable layouts
- [Stripe Dashboard](https://dashboard.stripe.com) - Data visualization
- [Shopify Admin](https://shopify.com) - E-commerce UX
- [Monday.com](https://monday.com) - Kanban views

### Bibliotecas Úteis
- `@tanstack/react-table` - Tabelas performáticas
- `@dnd-kit/core` - Drag & drop
- `date-fns` - Manipulação de datas (já tem)
- `recharts` - Gráficos (já tem)
- `react-hook-form` - Forms (já tem)
- `zod` - Validação (já tem)
- `sonner` - Toasts (já tem)
- `framer-motion` - Animações avançadas (opcional)
- `react-virtual` - Virtualização de listas (performance)

### Padrões de UI
- [shadcn/ui](https://ui.shadcn.com) - Base dos componentes
- [Tailwind UI](https://tailwindui.com) - Exemplos de layouts
- [Radix UI](https://radix-ui.com) - Primitivos acessíveis

---

## ✅ CRITÉRIOS DE SUCESSO

### Inventário
- [ ] Usuário consegue gerenciar 500+ produtos facilmente
- [ ] Filtros reduzem lista em < 1 segundo
- [ ] Bulk operations funcionam para 100+ items
- [ ] Import/Export sem erros
- [ ] Previsões são precisas (margem de erro < 20%)
- [ ] Auditoria completa em < 30 minutos

### Encomendas
- [ ] Nova encomenda criada em < 2 minutos
- [ ] Status atualizado com 1 clique
- [ ] Cliente notificado automaticamente
- [ ] 100% das encomendas rastreáveis
- [ ] Relatórios precisos e úteis
- [ ] 0 encomendas perdidas/esquecidas

### Dashboard
- [ ] Carrega em < 2 segundos
- [ ] Widgets customizáveis sem bugs
- [ ] Responsivo em tablets 7"+
- [ ] Dark mode perfeito
- [ ] Animações suaves (60fps)
- [ ] 100% das ações têm feedback visual

---

## 🤝 SUPORTE

Se tiver dúvidas durante a implementação:
1. Consulte a documentação do shadcn/ui
2. Verifique exemplos no Tailwind UI
3. Teste em múltiplos devices/browsers
4. Peça feedback de usuários reais
5. Itere baseado no uso

**Bora criar a melhor UI/UX para um sistema POS de cervejaria! 🍺🎨**
