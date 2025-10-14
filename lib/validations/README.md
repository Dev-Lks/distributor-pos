# 🚀 Sistema de Validações Zod

Sistema centralizado de validações para garantir consistência e segurança em todo o projeto.

## 📦 Instalação

As validações já estão configuradas. Para usar, basta importar:

```typescript
import { createProductSchema, moneySchema } from '@/lib/validations'
```

## 🎯 Uso Rápido

### Validar dados (lança exceção se inválido)

```typescript
import { createProductSchema } from '@/lib/validations'

try {
  const validatedData = createProductSchema.parse(body)
  // Dados são válidos e type-safe
} catch (error) {
  if (error instanceof z.ZodError) {
    // Tratar erro de validação
    console.log(error.errors)
  }
}
```

### Validar dados (sem exceção)

```typescript
const result = createProductSchema.safeParse(body)

if (!result.success) {
  console.log(result.error.errors)
} else {
  console.log(result.data) // Dados válidos
}
```

## 📚 Validações Disponíveis

### Comuns (`common.ts`)

- `emailSchema` - Email válido e normalizado
- `phoneSchema` - Telefone brasileiro formatado
- `cpfSchema` - CPF com validação de dígito
- `cnpjSchema` - CNPJ com validação de dígito
- `moneySchema` - Valores monetários (0 a R$ 9.999.999,99)
- `quantitySchema` - Quantidades (0 a 999.999)
- `percentageSchema` - Percentuais (0% a 100%)
- `nameSchema` - Nomes (2 a 200 caracteres)
- `skuSchema` - SKU/códigos alfanuméricos
- `paginationSchema` - Paginação padronizada

### Produtos (`products.ts`)

- `createProductSchema` - Criar produto completo
- `updateProductSchema` - Atualizar produto (campos parciais)
- `searchProductsSchema` - Buscar com filtros
- `bulkPriceUpdateSchema` - Atualização de preços em massa
- `importProductSchema` - Importação de produtos

### Vendas (`sales.ts`)

- `createSaleSchema` - Criar venda com validações:
  - Subtotal = soma dos itens
  - Total = subtotal - desconto + taxa
  - Total pago = total da venda
- `searchSalesSchema` - Buscar vendas
- `cancelSaleSchema` - Cancelar/reembolsar
- `salesReportSchema` - Relatórios

### Inventário (`inventory.ts`)

- `inventoryUpdateSchema` - Adicionar/remover estoque
- `inventoryTransferSchema` - Transferir entre locais
- `inventoryAdjustmentSchema` - Ajuste manual
- `bulkInventoryUpdateSchema` - Atualização em massa
- `searchInventorySchema` - Buscar inventário

### Clientes (`customers.ts`)

- `createCustomerSchema` - Criar cliente com validações:
  - CPF obrigatório para pessoa física
  - CNPJ obrigatório para pessoa jurídica
  - Idade mínima 16 anos
- `updateCustomerSchema` - Atualizar cliente
- `searchCustomersSchema` - Buscar clientes
- `creditLimitAdjustmentSchema` - Ajustar limite
- `customerBonificationSchema` - Bonificações

## 💡 Exemplos de Uso

Ver arquivo `examples.ts` para exemplos completos de implementação.

### Exemplo 1: Criar Produto

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)
    
    const product = await prisma.product.create({
      data: validatedData
    })
    
    return NextResponse.json(product, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
```

### Exemplo 2: Buscar com Filtros

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const filters = searchProductsSchema.parse({
    search: searchParams.get('search'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  })
  
  const products = await prisma.product.findMany({
    where: filters.search ? {
      name: { contains: filters.search }
    } : {},
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  })
  
  return NextResponse.json(products)
}
```

## 🔒 Validações Complexas

Alguns schemas incluem validações de relacionamentos:

```typescript
// Produto: preço deve ser >= custo
createProductSchema // Valida automaticamente

// Venda: total deve bater com itens
createSaleSchema // Valida todos os cálculos

// Cliente: CPF/CNPJ de acordo com tipo
createCustomerSchema // Valida regras de negócio
```

## 🎨 Customizar Validações

### Adicionar nova validação comum

Edite `lib/validations/common.ts`:

```typescript
export const cepSchema = z.string()
  .regex(/^\d{5}-\d{3}$/, 'CEP inválido')
```

### Criar nova validação específica

Crie arquivo em `lib/validations/`:

```typescript
// lib/validations/orders.ts
import { z } from 'zod'
import { cuidSchema, moneySchema } from './common'

export const createOrderSchema = z.object({
  customerId: cuidSchema,
  total: moneySchema,
  // ...
})
```

Adicione ao `index.ts`:

```typescript
export * from './orders'
```

## 📖 Recursos

- [Documentação Zod](https://zod.dev)
- [Exemplos de Uso](./examples.ts)
- [Melhorias Implementadas](/docs/MELHORIAS_IMPLEMENTADAS.md)

## ✅ Checklist de Uso

- [ ] Importar schema correto
- [ ] Usar `.parse()` ou `.safeParse()`
- [ ] Tratar erros de validação (z.ZodError)
- [ ] Retornar mensagens claras em português
- [ ] Logar erros internos
- [ ] Usar dados validados (type-safe)

## 🚨 Importante

- ✅ SEMPRE validar no backend
- ✅ Nunca confiar apenas no frontend
- ✅ Validações são rápidas (~0.1ms)
- ✅ TypeScript infere tipos automaticamente
- ✅ Schemas são reutilizáveis
