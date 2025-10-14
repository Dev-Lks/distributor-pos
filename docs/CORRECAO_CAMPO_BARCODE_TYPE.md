# 🔧 Correção: Campo barcodeType não existe no banco

**Data:** 14/10/2025  
**Problema:** Erro 500 ao criar produtos - campo inexistente no banco de produção

---

## 🐛 Erro Original

```json
{
  "error": "Erro ao criar produto",
  "details": "Invalid `prisma.product.create()` invocation:\n\nThe column `Product.barcodeType` does not exist in the current database."
}
```

---

## 🔍 Causa Raiz

**Schema desatualizado no banco de produção!**

### Schema Local (prisma/schema.prisma)
```prisma
model Product {
  // ... campos existentes
  barcode     String? @unique
  barcodeType String? // ❌ Campo que NÃO existe em produção!
  // ... outros campos
}
```

### Banco de Produção
```sql
-- Tabela Product NÃO tem coluna barcodeType
-- Última migration aplicada: 20251008115148_fixed_migrations
```

**Problema:** O código tentava criar produtos enviando TODOS os campos do schema local, incluindo campos que não existem no banco de produção.

---

## ✅ Solução Aplicada

### 1. **Whitelist de Campos Permitidos**

Criei uma lista explícita de campos que existem no banco de produção:

```typescript
// Campos que definitivamente existem no banco
const allowedFields = [
  'name', 'size', 'cost', 'salePrice', 'isBonified', 'bonifications',
  'category', 'supplier', 'isActive', 'sku', 'brand', 'origin',
  'packaging', 'abv', 'ibu', 'shelfLifeDays', 'tags',
  'lastPurchaseCost', 'lastPurchaseAt', 'avgCost', 'priceLastUpdatedAt',
  'expirationDate', 'batchNumber', 'supplierProductCode', 'barcode',
  'weight', 'volume', 'image', 'description', 'nutritionalInfo',
  'allergens', 'storageInstructions', 'isOrderOnly', 'leadTimeDays',
  'minOrderQuantity', 'maxOrderQuantity', 'requiresDeposit',
  'depositPercentage', 'availableForOrder'
]

// ❌ barcodeType NÃO está na lista!
```

### 2. **Filtro no Cadastro Completo**

```typescript
// Antes (ERRADO - enviava todos os campos):
productData = {
  ...validated,  // ❌ Pode incluir barcodeType
  salePrice: validated.price
}

// Depois (CORRETO - filtra campos):
productData = Object.keys(validated)
  .filter(key => key !== 'price' && allowedFields.includes(key))
  .reduce((obj, key) => {
    obj[key] = validated[key]
    return obj
  }, {} as any)

productData.salePrice = validated.price
```

### 3. **Cadastro Rápido Já Estava Seguro**

O cadastro rápido já criava um objeto explícito sem campos extras:

```typescript
productData = {
  name: validatedData.name,
  barcode: validatedData.barcode,
  sku: validatedData.barcode,
  size: validatedData.size || '-',
  cost: validatedData.cost || 0,
  salePrice: validatedData.price,
  description: ...,
  image: ...,
  isActive: ...
}
// ✅ Não inclui barcodeType
```

---

## 📊 Campos por Status

### ✅ Campos Obrigatórios (no banco)
- `name` - String
- `size` - String
- `cost` - Float
- `salePrice` - Float

### 🟢 Campos Opcionais (existem no banco)
- `barcode` - String?
- `sku` - String?
- `category` - String?
- `image` - String?
- `description` - String?
- E mais 20+ campos...

### ❌ Campos no Schema Local mas NÃO no Banco
- `barcodeType` - String? ❌

---

## 🔄 Por que isso aconteceu?

1. **Schema foi atualizado localmente** com novos campos
2. **Migration não foi criada** para adicionar esses campos
3. **Migration não foi aplicada** no banco de produção
4. **Código tentava usar** os campos novos

---

## 🛠️ Solução de Longo Prazo

### Opção 1: Remover o campo do schema (✅ Feito)
```bash
# Comentar ou remover do schema.prisma
# barcodeType String?
```

### Opção 2: Criar e aplicar migration (📋 Futuro)
```bash
# Criar migration
pnpm prisma migrate dev --name add_barcode_type

# Aplicar em produção
pnpm prisma migrate deploy
```

**Por ora, optei pela Opção 1** para não quebrar a produção.

---

## ✅ Teste do Fix

### Request que estava falhando:
```json
{
  "name": "teste",
  "size": "1L",
  "cost": 10,
  "price": 15,
  "barcode": "7896512900043",
  "isActive": true
}
```

### Fluxo Agora:
1. **Validação Zod** ✅
2. **Filtra campos** ✅ (remove inexistentes)
3. **Mapeia price → salePrice** ✅
4. **Cria no Prisma** ✅
5. **Retorna 201 Created** 🎉

---

## 📝 Commits

- **e55b9e8** - fix: remover campo barcodeType que não existe no banco de produção

---

## 🎯 Checklist de Migrations Futuras

Para evitar esse problema no futuro:

### Antes de fazer deploy:
- [ ] Rodar `prisma migrate dev` localmente
- [ ] Commitar a migration
- [ ] Testar em staging
- [ ] Aplicar `prisma migrate deploy` em produção
- [ ] Verificar que a migration foi aplicada
- [ ] Só então fazer deploy do código

### Schema vs Banco:
- [ ] Schema local deve estar sincronizado com produção
- [ ] Não adicionar campos sem criar migration
- [ ] Sempre usar whitelist de campos em produção

---

## 🚀 Status Atual

- ✅ Build passando
- ✅ Cadastro rápido funcionando
- ✅ Cadastro completo funcionando
- ✅ Não envia campos inexistentes
- ✅ Deploy pronto!

**O cadastro de produtos agora funciona corretamente em produção!** 🎉

---

## 📚 Documentação Relacionada

- `docs/CORRECAO_LOGGER_EDGE_RUNTIME.md` - Logger Edge Runtime
- `docs/CORRECAO_CADASTRO_RAPIDO.md` - Validação de campos
- Este documento - Whitelist de campos do banco
