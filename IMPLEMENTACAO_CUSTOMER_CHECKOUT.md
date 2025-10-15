# Implementação: Novo Modal de Cliente no Checkout

## 📋 Resumo da Mudança

Substituído o modal simples de cadastro de cliente por um fluxo mais inteligente no PDV que:

1. **Pergunta se o cliente já tem cadastro**
2. **Se sim**: Busca por CPF/CNPJ
3. **Se não**: Pergunta se quer cadastrar (não obrigatório)

## 🎯 Arquivos Criados

### 1. CustomerCheckoutDialog.tsx
**Localização**: `/app/(app)/dashboard/sales/components/CustomerCheckoutDialog.tsx`

**Funcionalidades**:
- ✅ Modal com 3 steps (choice → search → register)
- ✅ Busca de cliente por CPF/CNPJ
- ✅ Validação de CPF/CNPJ
- ✅ Formatação automática de documentos
- ✅ Cadastro rápido de novo cliente
- ✅ Opção de finalizar sem cliente
- ✅ Navegação entre steps com botão "Voltar"

### 2. radio-group.tsx (UI Component)
**Localização**: `/components/ui/radio-group.tsx`

Componente shadcn/ui para seleção de opções.

### 3. Função formatDocument
**Localização**: `/lib/documents.ts`

Nova função exportada para formatar CPF/CNPJ:
- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`

## 🔄 Arquivos Modificados

### 1. app/(app)/dashboard/sales/page.tsx

**Mudanças**:
- ✅ Substituído `CustomerDialog` por `CustomerCheckoutDialog`
- ✅ Removido estado `customerPromptEnabled` (não é mais necessário)
- ✅ Removido localStorage do customer prompt
- ✅ Novos handlers:
  - `handleSaveWithCustomer()` - Cliente existente
  - `handleSaveWithNewCustomer()` - Cadastrar novo
  - `handleSaveWithoutCustomer()` - Sem cliente

**Fluxo Atualizado**:
```typescript
handleFinalizeSale()
  ↓
Abre CustomerCheckoutDialog (sempre)
  ↓
[Cliente tem cadastro?]
  ├─ Sim → Busca por CPF
  │   ↓
  │   Cliente encontrado → Finaliza com cliente
  │
  └─ Não → [Quer cadastrar?]
      ├─ Sim → Cadastro rápido → Finaliza com novo cliente
      └─ Não → Finaliza sem cliente
```

## 🎨 Interface do Usuário

### Step 1: Choice (Escolha)
```
┌─────────────────────────────────────┐
│ Informações do Cliente              │
├─────────────────────────────────────┤
│                                     │
│ O cliente já tem cadastro?          │
│                                     │
│ ○ Sim, já é cadastrado              │
│   Vou buscar pelo CPF/CNPJ          │
│                                     │
│ ○ Não, é novo                       │
│   Vou decidir se quero cadastrar    │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Deseja cadastrar o cliente?         │
│                                     │
│ ○ Sim, vou cadastrar agora          │
│   Cadastro rápido de cliente        │
│                                     │
│ ○ Não, finalizar sem cadastro       │
│   Venda sem identificação           │
│                                     │
│         [Cancelar]  [Continuar]     │
└─────────────────────────────────────┘
```

### Step 2: Search (Busca)
```
┌─────────────────────────────────────┐
│ Buscar Cliente                      │
├─────────────────────────────────────┤
│                                     │
│ Digite o CPF ou CNPJ do cliente     │
│ [___________________] [🔍]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 João Silva                   │ │
│ │ 🏢 Pessoa Física                │ │
│ │ 📄 123.456.789-00               │ │
│ │ 📞 (11) 98765-4321              │ │
│ │ 📍 Rua Exemplo, 123             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Voltar] [Sem cliente] [Confirmar]  │
└─────────────────────────────────────┘
```

### Step 3: Register (Cadastro)
```
┌─────────────────────────────────────┐
│ Cadastrar Novo Cliente              │
├─────────────────────────────────────┤
│ Cadastro rápido de novo cliente     │
│                                     │
│ Nome *                              │
│ [________________________]          │
│                                     │
│ CPF/CNPJ (opcional)                 │
│ [________________________]          │
│                                     │
│ Telefone (opcional)                 │
│ [________________________]          │
│                                     │
│ Endereço (opcional)                 │
│ [________________________]          │
│                                     │
│ [Voltar] [Sem cadastro] [Cadastrar] │
└─────────────────────────────────────┘
```

## 🔌 Integração com API

### Busca de Cliente
```typescript
GET /api/customers?search={cpf_cnpj}
// Retorna: Customer[]
```

### Criar Cliente
```typescript
POST /api/customers
Body: {
  name: string
  document?: string
  phone?: string
  address?: string
}
// Retorna: Customer
```

### Finalizar Venda com Cliente
```typescript
POST /api/sales
Body: {
  items: [...],
  paymentMethod: "cash" | "card" | "pix",
  pointOfSaleId: string,
  total: number,
  customerData: {
    customerId?: string,  // ID do cliente existente
    name: string,
    phone?: string,
    address?: string
  }
}
```

## ✅ Validações Implementadas

1. **CPF/CNPJ**: Validação completa com `validateCpfCnpj()`
2. **Sanitização**: Remove caracteres especiais com `sanitizeDocument()`
3. **Formatação**: Exibe formatado com `formatDocument()`
4. **Nome obrigatório**: No cadastro rápido
5. **Cliente não encontrado**: Mensagem amigável com opção de cadastrar

## 🧪 Testes Sugeridos

1. ✅ Finalizar venda com cliente existente (busca por CPF)
2. ✅ Finalizar venda com novo cliente (cadastro rápido)
3. ✅ Finalizar venda sem cliente
4. ✅ Buscar cliente inexistente
5. ✅ Validar CPF/CNPJ inválido
6. ✅ Navegar entre steps (Voltar)
7. ✅ Cancelar o modal
8. ✅ Cadastrar cliente com campos opcionais vazios

## 🎯 Benefícios

- ✅ **UX melhorada**: Fluxo mais intuitivo
- ✅ **Menos cliques**: Cadastro rápido integrado
- ✅ **Flexível**: Permite finalizar sem cliente
- ✅ **Validação**: CPF/CNPJ validado na hora
- ✅ **Busca inteligente**: Encontra por documento
- ✅ **Responsivo**: Funciona em mobile e desktop

## 📝 Notas Importantes

- O modal **sempre** é exibido ao finalizar venda
- Não há mais opção "sempre perguntar" (foi removida)
- Cadastro de cliente cria registro no banco antes de finalizar venda
- Se criar cliente falhar, não finaliza a venda
- Mantém impressão automática de recibo após finalização

## 🚀 Próximos Passos (Opcional)

1. Adicionar histórico de compras do cliente no modal de busca
2. Adicionar sugestões de clientes frequentes
3. Adicionar scanner de CPF/CNPJ (câmera)
4. Adicionar validação de e-mail no cadastro
5. Adicionar campo de observações no cadastro rápido
