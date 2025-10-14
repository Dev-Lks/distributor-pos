# 🔄 Guia de Migração - Aplicar Melhorias em Rotas Existentes

Este guia mostra como migrar suas rotas de API existentes para usar as novas validações e funcionalidades.

---

## 📋 Checklist de Migração

Para cada rota de API:

- [ ] Importar validações Zod apropriadas
- [ ] Substituir validações manuais por schemas
- [ ] Adicionar rate limiting (se necessário)
- [ ] Usar logger ao invés de console
- [ ] Adicionar audit log para ações críticas
- [ ] Retornar erros em português
- [ ] Testar com dados inválidos

---

## 🔄 Exemplo 1: Rota de Produtos

### ❌ ANTES (Validação Manual)

```typescript
// app/api/products/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação manual
    if (!body.name || body.name.length < 2) {
      return NextResponse.json(
        { error: 'Nome inválido' },
        { status: 400 }
      )
    }
    
    if (!body.price || body.price < 0) {
      return NextResponse.json(
        { error: 'Preço inválido' },
        { status: 400 }
      )
    }
    
    if (body.price > 9999999) {
      return NextResponse.json(
        { error: 'Preço muito alto' },
        { status: 400 }
      )
    }
    
    const product = await prisma.product.create({
      data: body
    })
    
    console.log('Product created:', product.id)
    
    return NextResponse.json(product, { status: 201 })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### ✅ DEPOIS (Com Validações Zod)

```typescript
// app/api/products/route.ts
import { createProductSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar com Zod (todas as regras em um lugar)
    const validatedData = createProductSchema.parse(body)
    
    const product = await prisma.product.create({
      data: validatedData
    })
    
    // Audit log ao invés de console.log
    logger.audit('CREATE_PRODUCT', session.user.id, {
      productId: product.id,
      productName: product.name,
    })
    
    return NextResponse.json(product, { status: 201 })
    
  } catch (error) {
    // Tratar erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Logger ao invés de console.error
    logger.error('Failed to create product', { error })
    
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
```

**Benefícios:**
- ✅ Menos código
- ✅ Validações consistentes
- ✅ Type-safe automático
- ✅ Mensagens claras
- ✅ Logs persistentes
- ✅ Auditoria

---

## 🔄 Exemplo 2: Rota de Busca

### ❌ ANTES

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  // Sem validação de ranges
  const products = await prisma.product.findMany({
    where: search ? {
      name: { contains: search }
    } : {},
    skip: (page - 1) * limit,
    take: limit,
  })
  
  return NextResponse.json(products)
}
```

### ✅ DEPOIS

```typescript
import { searchProductsSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar query params
    const filters = searchProductsSchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      orderBy: searchParams.get('orderBy'),
      order: searchParams.get('order'),
    })
    
    const products = await prisma.product.findMany({
      where: {
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
          ]
        }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { price: { gte: filters.minPrice } }),
        ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { [filters.orderBy]: filters.order },
    })
    
    return NextResponse.json(products)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Filtros inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Failed to search products', { error })
    return NextResponse.json(
      { error: 'Erro na busca' },
      { status: 500 }
    )
  }
}
```

---

## 🔄 Exemplo 3: Adicionar Rate Limiting

### Para rotas sensíveis (login, pagamentos, etc):

```typescript
import { strictLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // Adicionar rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  
  try {
    await strictLimiter.check(5, ip) // 5 req/min
  } catch {
    logger.warn('Rate limit exceeded', { ip, path: request.url })
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }
  
  // Resto da lógica...
}
```

---

## 🔄 Exemplo 4: Substituir console por logger

### ❌ ANTES

```typescript
console.log('User logged in:', userId)
console.error('Database error:', error)
console.warn('Low stock:', productId)
console.debug('Query params:', params)
```

### ✅ DEPOIS

```typescript
import { logger } from '@/lib/logger'

logger.info('User logged in', { userId })
logger.error('Database error', { error })
logger.warn('Low stock', { productId })
logger.debug('Query params', { params })

// Para ações críticas, usar audit:
logger.audit('USER_LOGIN', userId, {
  timestamp: new Date(),
  ip: request.headers.get('x-forwarded-for')
})
```

---

## 🔄 Exemplo 5: Performance Logging

### Para operações demoradas:

```typescript
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Operação demorada
  const data = await heavyDatabaseQuery()
  
  // Log de performance
  logger.performance('Heavy database query', startTime)
  // Output: ⏱️  Heavy database query: 1234ms
  
  return NextResponse.json(data)
}
```

---

## 📝 Template de Migração

Use este template para migrar suas rotas:

```typescript
// app/api/[module]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { [SCHEMA_NAME] } from '@/lib/validations'
import { strictLimiter } from '@/lib/rate-limit' // Se necessário
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (se necessário)
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
    try {
      await strictLimiter.check(10, ip)
    } catch {
      return NextResponse.json(
        { error: 'Muitas tentativas' },
        { status: 429 }
      )
    }
    
    // 2. Parse body
    const body = await request.json()
    
    // 3. Validar com Zod
    const validatedData = [SCHEMA_NAME].parse(body)
    
    // 4. Executar lógica de negócio
    const result = await prisma.[MODEL].create({
      data: validatedData
    })
    
    // 5. Audit log (para ações críticas)
    logger.audit('ACTION_NAME', session.user.id, {
      [CONTEXT_KEY]: result.id
    })
    
    // 6. Retornar resultado
    return NextResponse.json(result, { status: 201 })
    
  } catch (error) {
    // 7. Tratar erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    // 8. Log de erros
    logger.error('Operation failed', { error })
    
    // 9. Retornar erro genérico
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar query params
    const filters = [SEARCH_SCHEMA].parse(
      Object.fromEntries(searchParams)
    )
    
    // Buscar dados
    const results = await prisma.[MODEL].findMany({
      where: {
        // Aplicar filtros validados
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    })
    
    return NextResponse.json(results)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Filtros inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error('Search failed', { error })
    return NextResponse.json(
      { error: 'Erro na busca' },
      { status: 500 }
    )
  }
}
```

---

## 🎯 Ordem de Migração Recomendada

1. **Rotas críticas primeiro:**
   - `/api/auth/*` - Login, logout
   - `/api/sales/*` - Vendas
   - `/api/users/*` - Usuários

2. **Rotas de alta frequência:**
   - `/api/products/*` - Produtos
   - `/api/inventory/*` - Inventário
   - `/api/customers/*` - Clientes

3. **Rotas menos críticas:**
   - `/api/reports/*` - Relatórios
   - `/api/settings/*` - Configurações

---

## ✅ Checklist por Rota

Ao migrar cada rota:

- [ ] Importar schema Zod correto
- [ ] Substituir validações manuais
- [ ] Adicionar rate limiting (se necessário)
- [ ] Substituir console.* por logger.*
- [ ] Adicionar audit log (se ação crítica)
- [ ] Traduzir erros para português
- [ ] Testar com dados válidos
- [ ] Testar com dados inválidos
- [ ] Testar rate limiting (se aplicável)
- [ ] Verificar logs em produção

---

## 🚀 Scripts Úteis

### Buscar console.log no código:

```bash
grep -r "console\." app/api --include="*.ts" --include="*.tsx"
```

### Buscar validações manuais:

```bash
grep -r "if (!.*||" app/api --include="*.ts"
```

---

## 📖 Recursos

- [Validações Disponíveis](/lib/validations/README.md)
- [Exemplos de Uso](/lib/validations/examples.ts)
- [Documentação Completa](/docs/MELHORIAS_IMPLEMENTADAS.md)

---

**Boa migração! 🚀**
