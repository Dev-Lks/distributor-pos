# 🚀 PROMPT DE IMPLEMENTAÇÃO - MELHORIAS COMPLETAS DO SISTEMA

## 📋 CONTEXTO
Você é um desenvolvedor sênior trabalhando em um sistema de gerenciamento para cervejaria (NitroBeer) construído com Next.js 14, TypeScript, Prisma, e React Query. O sistema possui um dashboard com widgets que atualmente têm vários problemas de performance, UX e dados mockados.

## 🎯 OBJETIVO
Implementar TODAS as melhorias identificadas na análise, priorizando da seguinte forma:

### FASE 1: CORREÇÕES CRÍTICAS (Implementar AGORA)
1. **Conectar widgets mockados aos dados reais da API**
2. **Corrigir bugs de código (função getInitials, keys duplicadas)**
3. **Adicionar tratamento de erros em todos os widgets**
4. **Otimizar intervalos de refetch do React Query**

### FASE 2: MELHORIAS DE UX (Implementar em seguida)
5. **Criar WidgetWrapper para eliminar código duplicado**
6. **Melhorar empty states com ilustrações e CTAs**
7. **Adicionar loading states consistentes**
8. **Melhorar responsividade mobile dos widgets**

### FASE 3: OTIMIZAÇÕES DE PERFORMANCE
9. **Otimizar queries do Prisma (select específicos, limites)**
10. **Adicionar índices no schema.prisma**
11. **Configurar cache do React Query com tempos apropriados**
12. **Lazy load do mapa e QR Code na home page**

## 📝 INSTRUÇÕES DETALHADAS

### 1️⃣ FASE 1: CORREÇÕES CRÍTICAS

#### 1.1 Conectar SalesChartWidget aos dados reais
**Arquivo:** SalesChartWidget.tsx

**Ações:**
- Importar `useSalesMetrics` de `@/lib/useSales`
- Remover dados mockados
- Transformar `metrics.dailyMetrics` em formato do gráfico
- Adicionar loading e empty states
- Adicionar tratamento de erro

**Implementação esperada:**
```typescript
const { data: metrics, isLoading, error } = useSalesMetrics(period)

// Transformar dados
const chartData = metrics?.dailyMetrics?.map(day => ({
  hour: format(new Date(day.date), 'HH:mm'),
  revenue: day.revenue,
  quantity: day.itemsSold,
  margin: day.margin
})) || []
```

#### 1.2 Gerar insights dinâmicos no QuickInsightsWidget
**Arquivo:** QuickInsightsWidget.tsx

**Ações:**
- Importar hooks: `useStockAlerts`, `useTopProducts`, `useOrders`
- Gerar insights baseados em dados reais:
  - Produtos em estoque crítico
  - Top produto do dia
  - Encomendas próximas do deadline
  - Análise de tendências de vendas
- Remover dados mockados
- Adicionar loading states

#### 1.3 Conectar RecentActivityWidget aos dados reais
**Arquivo:** RecentActivityWidget.tsx

**Ações:**
- Usar `useRecentActivity(10)` já implementado
- Remover dados mockados
- Adicionar loading skeleton
- Adicionar empty state

#### 1.4 Conectar CashFlowWidget gráfico aos dados reais
**Arquivo:** CashFlowWidget.tsx

**Ações:**
- Usar `useSalesMetrics('today')` para obter vendas por hora
- Transformar em dados do gráfico de linha
- Remover chartData mockado
- Manter estrutura de session atual

#### 1.5 Conectar CalendarWidget aos dados reais
**Arquivo:** CalendarWidget.tsx

**Ações:**
- Usar `useUpcomingEvents(7)` já implementado
- Remover eventos mockados
- Adicionar loading states
- Adicionar empty state

#### 1.6 Corrigir função getInitials ausente
**Arquivo:** route.ts

**Ações:**
- Adicionar função helper `getInitials` no topo do arquivo
- Implementar lógica para extrair iniciais do nome/email

```typescript
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
```

#### 1.7 Corrigir key duplicada no TeamPerformanceWidget
**Arquivo:** `components/dashboard/widgets/TeamPerformanceWidget.tsx:113`

**Ações:**
- Mudar `key={member.name}` para `key={member.id}`

#### 1.8 Remover uso de 'any' type
**Arquivo:** `components/dashboard/widgets/TeamPerformanceWidget.tsx:72`

**Ações:**
- Mudar `(v as any)` para `(v as "today" | "week" | "month")`

#### 1.9 Adicionar tratamento de erro em TODOS os widgets
**Arquivos:** Todos os widgets em widgets

**Ações:**
- Para cada hook useQuery, capturar `error`
- Adicionar conditional rendering para estado de erro
- Mostrar mensagem amigável e botão "Tentar novamente"

**Template:**
```tsx
if (error) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
          <p className="text-sm font-medium">Erro ao carregar dados</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {error.message || 'Tente novamente mais tarde'}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 1.10 Otimizar intervalos de refetch
**Arquivos:** Todos os hooks em `lib/use*.ts`

**Ações:**
- Definir constantes de cache no topo de cada arquivo:
```typescript
const CACHE_TIMES = {
  REALTIME: 1000 * 30,      // 30s - Cash session, recent activity
  FREQUENT: 1000 * 60 * 2,  // 2min - Sales, stock alerts  
  MODERATE: 1000 * 60 * 5,  // 5min - Products, team performance
  STABLE: 1000 * 60 * 10,   // 10min - Calendar events
}
```

- Atualizar cada hook:
  - `useRecentActivity`: `refetchInterval: CACHE_TIMES.REALTIME, staleTime: CACHE_TIMES.REALTIME`
  - `useCashSession`: `refetchInterval: CACHE_TIMES.REALTIME, staleTime: CACHE_TIMES.REALTIME`
  - `useStockAlerts`: `staleTime: CACHE_TIMES.FREQUENT`
  - `useTopProducts`: `staleTime: CACHE_TIMES.MODERATE`
  - `useTeamPerformance`: `staleTime: CACHE_TIMES.MODERATE`
  - `useUpcomingEvents`: `staleTime: CACHE_TIMES.STABLE`

### 2️⃣ FASE 2: MELHORIAS DE UX

#### 2.1 Criar WidgetWrapper genérico
**Arquivo:** `components/dashboard/widgets/WidgetWrapper.tsx` (CRIAR NOVO)

**Ações:**
- Criar componente wrapper que aceita props:
  - title, icon, isLoading, error, isEmpty, emptyMessage, children, actions, refetch
- Implementar lógica de rendering condicional
- Incluir componentes Skeleton, Error e Empty

#### 2.2 Melhorar Empty States
**Ações:**
- Criar componente `WidgetEmpty.tsx` com:
  - Ícone grande e colorido
  - Título descritivo
  - Descrição explicativa
  - Call-to-action quando aplicável

**Exemplo:**
```tsx
<WidgetEmpty
  icon={<ShoppingCart className="h-16 w-16" />}
  title="Nenhuma venda hoje"
  description="As vendas do dia aparecerão aqui conforme forem registradas"
  action={
    <Button asChild>
      <Link href="/dashboard/sales">Registrar Venda</Link>
    </Button>
  }
/>
```

#### 2.3 Melhorar responsividade mobile

**Arquivos a modificar:**
- TeamPerformanceWidget.tsx: Adicionar `max-h-[500px] overflow-y-auto` no CardContent
- TopProductsWidget.tsx: Ajustar tamanhos de fonte e espaçamentos para mobile
- StockAlertsWidget.tsx: Compactar informações em telas pequenas
- DashboardWidgetGrid.tsx: Melhorar grid responsivo

**Grid melhorado:**
```tsx
<div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

#### 2.4 Adicionar scroll visual em tabelas

**Ações:**
- Adicionar classes de scroll customizadas no globals.css
- Adicionar indicador visual de scroll horizontal
- Aplicar em todas as tabelas do sistema

### 3️⃣ FASE 3: OTIMIZAÇÕES DE PERFORMANCE

#### 3.1 Otimizar queries do Prisma

**Arquivos:** Todas as rotas de API em analytics

**Ações:**
- Adicionar `select` específico em vez de buscar todos os campos
- Adicionar `take` para limitar resultados quando apropriado
- Usar `findFirst` em vez de `findMany` quando buscar apenas um

**Exemplo:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
  take: 20,
  where: { isActive: true },
})
```

#### 3.2 Adicionar índices no schema.prisma

**Arquivo:** schema.prisma

**Ações:**
- Adicionar índices compostos nas queries mais frequentes:

```prisma
model Sale {
  // ... campos existentes
  @@index([status, date])
  @@index([cashSessionId, date])
  @@index([customerId])
}

model SaleItem {
  @@index([productId, saleId])
}

model Inventory {
  @@index([productId])
}

model Order {
  @@index([status, promisedAt])
  @@index([customerId])
}
```

#### 3.3 Lazy load na home page

**Arquivo:** page.tsx

**Ações:**
- Fazer lazy load do iframe do Google Maps
- Usar Suspense para QR Code
- Reduzir número de animações simultâneas

```tsx
const [showMap, setShowMap] = useState(false)
useEffect(() => {
  const timer = setTimeout(() => setShowMap(true), 1500)
  return () => clearTimeout(timer)
}, [])

<Suspense fallback={<Skeleton className="h-32 w-32 mx-auto" />}>
  <QRCodeComponent url={currentUrl} />
</Suspense>
```

#### 3.4 Calcular trends reais no KPIsWidget

**Arquivo:** KPIsWidget.tsx

**Ações:**
- Aceitar props com dados do período anterior
- Calcular diferença percentual real
- Determinar direção do trend dinamicamente

```typescript
interface KPIsWidgetProps {
  current: Metrics
  previous: Metrics
}

const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return { value: 'N/A', direction: 'neutral' }
  const diff = ((current - previous) / previous) * 100
  return {
    value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  }
}
```

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Crítico
- [ ] SalesChartWidget conectado a dados reais
- [ ] QuickInsightsWidget com insights dinâmicos
- [ ] RecentActivityWidget conectado
- [ ] CashFlowWidget gráfico real
- [ ] CalendarWidget conectado
- [ ] Função getInitials implementada
- [ ] Keys duplicadas corrigidas
- [ ] Tipos 'any' removidos
- [ ] Tratamento de erro em todos os widgets (10 widgets)
- [ ] Intervalos de refetch otimizados

### Fase 2 - UX
- [ ] WidgetWrapper criado
- [ ] Empty states melhorados
- [ ] Responsividade mobile melhorada
- [ ] Scroll visual em tabelas

### Fase 3 - Performance
- [ ] Queries Prisma otimizadas (6 rotas de API)
- [ ] Índices adicionados no schema
- [ ] Lazy load na home page
- [ ] Trends reais calculados

## 🚀 COMO IMPLEMENTAR

1. **Use multi_replace_string_in_file sempre que possível** para múltiplas edições
2. **Teste cada fase antes de continuar** - rode o servidor e verifique no browser
3. **Mantenha formatação e estilo** do código existente
4. **Adicione comentários** explicativos quando necessário
5. **Preserve imports e exports** existentes
6. **Use tipos TypeScript estritos** - evite any

## 📊 RESULTADO ESPERADO

Após implementação completa:
- ✅ 0 dados mockados - 100% dados reais
- ✅ 0 erros TypeScript
- ✅ Performance otimizada (cache configurado)
- ✅ UX consistente (loading, error, empty states)
- ✅ Mobile responsivo
- ✅ Código limpo e mantível

---

**AGORA IMPLEMENTE TODAS ESSAS MELHORIAS SEGUINDO O PLANO ACIMA, COMEÇANDO PELA FASE 1.**