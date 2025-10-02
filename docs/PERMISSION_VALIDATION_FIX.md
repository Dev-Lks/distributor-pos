# 🔒 Correção Completa: Validação de Permissões

## ❌ Problemas Identificados

1. **Menu não filtra corretamente** - Mostra itens sem permissão
2. **APIs sem validação** - Vendedor consegue deletar/editar sem permissão

---

## ✅ Soluções Implementadas

### 1. Helper de Autenticação no Servidor (`lib/serverAuth.ts`)

Criado helper reutilizável para validar permissões em APIs:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { PermissionKey } from "@prisma/client";

export async function getServerAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { 
      session: null, 
      isAdmin: false, 
      permissions: [] as PermissionKey[], 
      hasPermission: () => false 
    };
  }

  const isAdmin = session.user.isAdmin || false;
  const permissions = (session.user.permissions || []) as PermissionKey[];

  const hasPermission = (permission: PermissionKey) => {
    return isAdmin || permissions.includes(permission);
  };

  return { session, isAdmin, permissions, hasPermission };
}

export function unauthorized(message = "Não autorizado") {
  return Response.json({ error: message }, { status: 403 });
}

export function notAuthenticated(message = "Não autenticado") {
  return Response.json({ error: message }, { status: 401 });
}
```

### 2. APIs Corrigidas

#### ✅ `/api/customers` - TODAS as operações protegidas

```typescript
import { getServerAuth, notAuthenticated, unauthorized } from "@/lib/serverAuth"

// GET - VIEW_CUSTOMERS
export async function GET(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("VIEW_CUSTOMERS")) {
    return unauthorized("Você não tem permissão para visualizar clientes")
  }
  // ... resto do código
}

// POST - CREATE_CUSTOMERS
export async function POST(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("CREATE_CUSTOMERS")) {
    return unauthorized("Você não tem permissão para criar clientes")
  }
  // ... resto do código
}

// PATCH - EDIT_CUSTOMERS
export async function PATCH(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("EDIT_CUSTOMERS")) {
    return unauthorized("Você não tem permissão para editar clientes")
  }
  // ... resto do código
}

// DELETE - DELETE_CUSTOMERS
export async function DELETE(request: NextRequest) {
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("DELETE_CUSTOMERS")) {
    return unauthorized("Você não tem permissão para deletar clientes")
  }
  // ... resto do código
}
```

#### ✅ `/api/products` - TODAS as operações protegidas

```typescript
// GET - VIEW_PRODUCTS
// POST - CREATE_PRODUCTS
// PATCH - EDIT_PRODUCTS
// DELETE - DELETE_PRODUCTS
```

### 3. Debug Adicionado

Adicionado logs temporários para investigar:

**Middleware (`middleware.ts`):**
```typescript
// DEBUG: Log para verificar permissões (REMOVER DEPOIS)
if (!isAdmin && path.startsWith("/dashboard")) {
  console.log("🔍 DEBUG Middleware:", {
    path,
    isAdmin,
    email: token.email,
    permissions: permissions.length > 0 ? permissions : "VAZIO!",
  });
}
```

**SidebarLayout (`components/SidebarLayout.tsx`):**
```typescript
// DEBUG: Verificar permissões (REMOVER DEPOIS)
console.log("🔍 SidebarLayout Debug:", {
  isAdmin,
  email: session?.user?.email,
  permissionsCount: session?.user?.permissions?.length || 0,
  permissions: session?.user?.permissions,
  canViewDashboard: can.viewDashboard,
  canViewReports: can.viewReports,
})
```

---

## 📋 Mapeamento Completo: API → Permissão

### Customers (`/api/customers`)
| Método | Permissão | Status |
|--------|-----------|--------|
| GET | `VIEW_CUSTOMERS` | ✅ Protegido |
| POST | `CREATE_CUSTOMERS` | ✅ Protegido |
| PATCH | `EDIT_CUSTOMERS` | ✅ Protegido |
| DELETE | `DELETE_CUSTOMERS` | ✅ Protegido |

### Products (`/api/products`)
| Método | Permissão | Status |
|--------|-----------|--------|
| GET | `VIEW_PRODUCTS` | ✅ Protegido |
| POST | `CREATE_PRODUCTS` | ✅ Protegido |
| PATCH | `EDIT_PRODUCTS` | ✅ Protegido |
| DELETE | `DELETE_PRODUCTS` | ✅ Protegido |

### Sales (`/api/sales`)
| Método | Permissão | Status |
|--------|-----------|--------|
| GET | `VIEW_OWN_SALES` ou `VIEW_ALL_SALES` | ⚠️ Verificar |
| POST | `CREATE_SALES` | ⚠️ Verificar |
| PATCH | `EDIT_SALES` | ⚠️ Verificar |
| DELETE | `DELETE_SALES` | ⚠️ Verificar |

### Inventory (`/api/inventory`)
| Método | Permissão | Status |
|--------|-----------|--------|
| GET | `VIEW_INVENTORY` | ⚠️ Verificar |
| POST | `MANAGE_INVENTORY` | ⚠️ Verificar |
| PATCH | `MANAGE_INVENTORY` | ⚠️ Verificar |
| DELETE | `MANAGE_INVENTORY` | ⚠️ Verificar |

### Orders (`/api/orders`)
| Método | Permissão | Status |
|--------|-----------|--------|
| GET | `VIEW_ORDERS` | ⚠️ Verificar |
| POST | `CREATE_ORDERS` | ⚠️ Verificar |
| PATCH | `EDIT_ORDERS` | ⚠️ Verificar |
| DELETE | `DELETE_ORDERS` | ⚠️ Verificar |

### Users (`/api/users`)
| Método | Permissão | Status |
|--------|-----------|--------|
| GET | `isAdmin` (exclusivo) | ✅ Já implementado |
| POST | `isAdmin` (exclusivo) | ✅ Já implementado |
| PATCH | `isAdmin` (exclusivo) | ✅ Já implementado |
| DELETE | `isAdmin` (exclusivo) | ✅ Já implementado |

---

## 🧪 Como Testar

### 1. Verificar Logs no Console do Navegador

Abra DevTools (F12) e verifique o console:

```
🔍 SidebarLayout Debug: {
  isAdmin: false,
  email: "vendedor@nitrobeer.com",
  permissionsCount: 13,
  permissions: ["CREATE_SALES", "VIEW_OWN_SALES", ...],
  canViewDashboard: true,
  canViewReports: true
}
```

**Se `permissions` está vazio:**
- Problema no JWT → Fazer logout/login para gerar novo token

**Se `permissions` tem valores mas `can.viewDashboard` é false:**
- Problema no hook `usePermissions()`

### 2. Testar DELETE sem Permissão

#### Como Admin:
1. Vá em `/admin/users`
2. Edite o vendedor
3. **Desmarque** `DELETE_CUSTOMERS`
4. Salve

#### Como Vendedor:
1. Faça logout e login como vendedor
2. Vá em `/dashboard/customers`
3. Tente deletar um cliente
4. **Resultado esperado:** Erro 403 "Você não tem permissão para deletar clientes"

### 3. Verificar Menu

#### Como Vendedor (sem VIEW_REPORTS):
1. Menu **NÃO** deve mostrar "Relatórios"
2. Menu **NÃO** deve mostrar "Configurações" (se não tiver VIEW_SETTINGS)
3. Menu **DEVE** mostrar "PDV" (tem CREATE_SALES)
4. Menu **DEVE** mostrar "Clientes" (tem VIEW_CUSTOMERS)

---

## 📊 Comportamento Esperado

### Vendedor com Permissões Básicas

**Permissões:**
- CREATE_SALES
- VIEW_OWN_SALES
- VIEW_PRODUCTS
- VIEW_CUSTOMERS
- CREATE_CUSTOMERS

**Menu visível:**
- ✅ Vendas → PDV
- ✅ Vendas → Registro
- ✅ Estoque → Produtos (somente leitura)
- ✅ Operacional → Clientes

**APIs permitidas:**
- ✅ GET /api/products
- ✅ GET /api/customers
- ✅ POST /api/customers
- ✅ POST /api/sales
- ✅ GET /api/sales (apenas suas vendas)

**APIs bloqueadas:**
- ❌ DELETE /api/customers (sem DELETE_CUSTOMERS)
- ❌ PATCH /api/customers (sem EDIT_CUSTOMERS)
- ❌ DELETE /api/products (sem DELETE_PRODUCTS)
- ❌ GET /api/users (não é admin)

---

## 🔄 Próximos Passos

### 1. Corrigir APIs Restantes
Aplicar o mesmo padrão em:
- [ ] `/api/sales`
- [ ] `/api/inventory`
- [ ] `/api/orders`
- [ ] `/api/cash-sessions`
- [ ] `/api/points`
- [ ] `/api/customer-bonifications`

### 2. Remover Logs de Debug
Após confirmar que tudo funciona:
```bash
# Remover logs do middleware.ts
# Remover logs do SidebarLayout.tsx
```

### 3. Testar Cenários Completos
- [ ] Vendedor tenta deletar → 403
- [ ] Vendedor tenta editar usuário → 403
- [ ] Menu filtra corretamente
- [ ] Logout/login atualiza permissões

---

## ✅ Status Atual

### Implementado:
- ✅ Helper `getServerAuth()`
- ✅ API `/api/customers` 100% protegida
- ✅ API `/api/products` 100% protegida
- ✅ Logs de debug adicionados

### Pendente:
- ⚠️ Proteger APIs restantes (sales, inventory, orders)
- ⚠️ Verificar por que menu não está filtrando
- ⚠️ Testar com vendedor real
- ⚠️ Remover logs de debug

---

**Testar agora:**
1. Faça logout
2. Login como vendedor
3. Verifique console do navegador para logs
4. Tente deletar um cliente
5. Verifique se recebe erro 403

O sistema agora tem 2 camadas de proteção:
1. **UI (Sidebar)** - Oculta botões/menus
2. **API** - Valida permissões no servidor ✅
