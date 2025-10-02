# Sistema de Permissões Granulares - NitroBeer POS

## Visão Geral

O sistema foi **redesenhado** de um modelo baseado em **roles fixas** (ADMIN, MANAGER, SELLER, CASHIER, SUPERVISOR) para um sistema de **permissões granulares** onde o administrador define manualmente o que cada usuário pode e não pode fazer.

## Mudanças Principais

### Antes (Sistema de Roles)
- ❌ 5 roles fixas predefinidas
- ❌ Permissões fixas por role
- ❌ Impossível customizar permissões por usuário
- ❌ Campo `role` no User model
- ❌ Campo `roleInPOS` no UserPointOfSale model

### Depois (Sistema de Permissões)
- ✅ 44 permissões granulares
- ✅ Admin atribui permissões individualmente
- ✅ Customização completa por usuário
- ✅ Campo `isAdmin` (boolean) no User model
- ✅ Model `UserPermission` para rastrear permissões
- ✅ Sem campo `roleInPOS` - simplificado

## Arquitetura do Sistema

### 1. Database Schema

```prisma
enum PermissionKey {
  // Dashboard (3)
  VIEW_DASHBOARD
  VIEW_ANALYTICS
  VIEW_REPORTS
  
  // Vendas (6)
  CREATE_SALES
  VIEW_ALL_SALES
  VIEW_OWN_SALES
  EDIT_SALES
  DELETE_SALES
  APPLY_DISCOUNTS
  
  // Produtos (5)
  VIEW_PRODUCTS
  CREATE_PRODUCTS
  EDIT_PRODUCTS
  DELETE_PRODUCTS
  MANAGE_PRICES
  
  // Inventário (5)
  VIEW_INVENTORY
  MANAGE_INVENTORY
  TRANSFER_STOCK
  ADJUST_STOCK
  VIEW_STOCK_MOVEMENTS
  
  // Clientes (5)
  VIEW_CUSTOMERS
  CREATE_CUSTOMERS
  EDIT_CUSTOMERS
  DELETE_CUSTOMERS
  VIEW_CUSTOMER_HISTORY
  
  // Caixa (5)
  OPEN_CASH_SESSION
  CLOSE_CASH_SESSION
  MANAGE_CASH_TRANSACTIONS
  FORCE_CLOSE_CASH
  VIEW_CASH_REPORTS
  
  // Encomendas (5)
  VIEW_ORDERS
  CREATE_ORDERS
  EDIT_ORDERS
  DELETE_ORDERS
  MANAGE_ORDER_STATUS
  
  // Pontos de Venda (2)
  VIEW_POINTS_OF_SALE
  MANAGE_POINTS_OF_SALE
  
  // Usuários (3)
  MANAGE_USERS
  VIEW_USERS
  ASSIGN_PERMISSIONS
  
  // Bonificações (3)
  CREATE_BONIFICATIONS
  APPROVE_BONIFICATIONS
  VIEW_BONIFICATIONS
  
  // Configurações (2)
  VIEW_SETTINGS
  MANAGE_SETTINGS
}

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  passwordHash          String
  fullName              String
  isAdmin               Boolean   @default(false)  // 👈 Substitui o campo "role"
  status                UserStatus @default(ACTIVE)
  
  // Relações
  permissions           UserPermission[]  // 👈 Lista de permissões do usuário
  userPointsOfSale      UserPointOfSale[]
  ...
}

model UserPermission {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(...)
  permission  PermissionKey
  granted     Boolean       @default(true)
  grantedBy   String?
  grantedAt   DateTime      @default(now())
  
  @@unique([userId, permission])
}

model UserPointOfSale {
  id             String       @id @default(cuid())
  userId         String
  pointOfSaleId  String
  isPrimary      Boolean      @default(false)
  assignedBy     String?
  
  // ❌ Removido: roleInPOS
  
  user           User         @relation(...)
  pointOfSale    PointOfSale  @relation(...)
}
```

### 2. NextAuth Session

```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;           // 👈 Substitui "role"
      permissions: PermissionKey[]; // 👈 Array de permissões
      pointsOfSale: Array<{
        id: string;
        name: string;
        isPrimary: boolean;
        // ❌ Removido: roleInPOS
      }>;
    };
  }
}
```

### 3. Autenticação (`lib/auth.ts`)

```typescript
// Carregar permissões no login
const user = await prisma.user.findUnique({
  where: { email },
  include: {
    permissions: true,
    userPointsOfSale: {
      include: { pointOfSale: true }
    }
  }
});

// Retornar na sessão
return {
  id: user.id,
  email: user.email,
  isAdmin: user.isAdmin,
  permissions: user.permissions.map(p => p.permission),
  pointsOfSale: user.userPointsOfSale.map(ups => ({
    id: ups.pointOfSaleId,
    name: ups.pointOfSale.name,
    isPrimary: ups.isPrimary,
  })),
};
```

### 4. Middleware (`middleware.ts`)

```typescript
const isAdmin = token.isAdmin as boolean;
const permissions = (token.permissions as string[]) || [];

// Rotas admin
if (path.startsWith("/admin")) {
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

// Rotas de dashboard
if (path.startsWith("/dashboard")) {
  if (!isAdmin && !permissions.includes("VIEW_DASHBOARD")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}
```

### 5. Hook de Permissões (`lib/usePermissions.ts`)

```typescript
export function usePermissions() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin || false;
  const permissions = (session?.user?.permissions || []) as PermissionKey[];

  const hasPermission = (permission: PermissionKey) => {
    return isAdmin || permissions.includes(permission);
  };

  const can = {
    viewDashboard: hasPermission("VIEW_DASHBOARD"),
    createSales: hasPermission("CREATE_SALES"),
    viewAllSales: hasPermission("VIEW_ALL_SALES"),
    manageUsers: hasPermission("MANAGE_USERS"),
    // ... 44 permissões granulares
  };

  return { can, isAdmin, permissions, hasPermission };
}
```

### 6. APIs

#### GET /api/users
```typescript
// Apenas ADMIN pode listar usuários
if (!session || !session.user.isAdmin) {
  return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
}
```

#### POST /api/users
```typescript
// Criar usuário com permissões
const user = await prisma.user.create({
  data: {
    fullName,
    email,
    passwordHash,
    isAdmin: isAdmin || false,
    permissions: {
      create: permissions.map(perm => ({
        permission: perm,
        granted: true,
        grantedBy: session.user.id,
      })),
    },
  },
});
```

#### PATCH /api/users/[id]
```typescript
// Atualizar permissões
if (permissions) {
  await prisma.userPermission.deleteMany({
    where: { userId: params.id },
  });
  
  await prisma.userPermission.createMany({
    data: permissions.map(perm => ({
      userId: params.id,
      permission: perm,
      granted: true,
      grantedBy: session.user.id,
    })),
  });
}
```

#### GET /api/permissions
```typescript
// Listar todas as permissões organizadas por categoria
// Apenas ADMIN pode acessar
export async function GET() {
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  
  return NextResponse.json({
    dashboard: { permissions: [...] },
    sales: { permissions: [...] },
    products: { permissions: [...] },
    // ... todas as categorias
  });
}
```

## Fluxo de Uso

### 1. Criar Novo Usuário (Admin)

1. Admin acessa `/admin/users`
2. Clica em "Novo Usuário"
3. Preenche dados básicos (nome, email, senha)
4. Seleciona pontos de venda
5. **Marca individualmente cada permissão** que deseja conceder
6. Salva

### 2. Editar Permissões (Admin)

1. Admin acessa `/admin/users`
2. Clica em usuário existente
3. Vê lista de todas as 44 permissões organizadas por categoria
4. Marca/desmarca permissões conforme necessário
5. Salva

### 3. Login e Autorização (Usuário)

1. Usuário faz login em `/login`
2. Sistema carrega `isAdmin` + array de `permissions`
3. Redirecionamento para `/dashboard`
4. Middleware verifica se tem `VIEW_DASHBOARD` permission
5. Hook `usePermissions()` controla visibilidade de botões/menus
6. APIs verificam permissões específicas antes de executar ações

## Migração de Dados

### Script de Migração

```bash
npx tsx scripts/migrate-roles-to-permissions.ts
```

Converte roles antigas para permissões:
- **ADMIN** → isAdmin=true + todas as 44 permissões
- **MANAGER** → ~35 permissões (sem FORCE_CLOSE_CASH, DELETE_PRODUCTS, etc.)
- **SUPERVISOR** → ~20 permissões (visualizações e operações básicas)
- **SELLER** → ~10 permissões (criar vendas, ver produtos, criar clientes)
- **CASHIER** → ~10 permissões (vendas, caixa, clientes básicos)

### Setup Admin

```bash
npx tsx scripts/setup-admin.ts
```

Configura o usuário admin@nitrobeer.com:
- Define `isAdmin = true`
- Remove permissões antigas
- Adiciona todas as 44 permissões

## Categorias de Permissões

| Categoria | Permissões | Descrição |
|-----------|-----------|-----------|
| **Dashboard** | 3 | VIEW_DASHBOARD, VIEW_ANALYTICS, VIEW_REPORTS |
| **Vendas** | 6 | Criar, visualizar (todas/próprias), editar, deletar, descontos |
| **Produtos** | 5 | CRUD completo + gerenciar preços |
| **Inventário** | 5 | Ver, gerenciar, transferir, ajustar, movimentações |
| **Clientes** | 5 | CRUD + ver histórico |
| **Caixa** | 5 | Abrir, fechar, gerenciar, forçar fechamento, relatórios |
| **Encomendas** | 5 | CRUD + gerenciar status |
| **Pontos de Venda** | 2 | Ver e gerenciar |
| **Usuários** | 3 | Gerenciar, ver, atribuir permissões |
| **Bonificações** | 3 | Criar, aprovar, visualizar |
| **Configurações** | 2 | Ver e gerenciar |

## Exemplos de Uso

### No Frontend (React Component)

```tsx
'use client';

import { usePermissions } from '@/lib/usePermissions';

export function SalesPage() {
  const { can, isAdmin } = usePermissions();
  
  return (
    <div>
      {can.viewDashboard && <DashboardLink />}
      
      {can.createSales && (
        <Button onClick={createSale}>Nova Venda</Button>
      )}
      
      {can.viewAllSales ? (
        <AllSalesTable />
      ) : can.viewOwnSales ? (
        <OwnSalesTable />
      ) : (
        <AccessDenied />
      )}
      
      {(can.editSales || isAdmin) && (
        <Button onClick={editSale}>Editar</Button>
      )}
    </div>
  );
}
```

### Na API Route

```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Verificar permissão específica
  if (!session?.user?.isAdmin && 
      !session?.user?.permissions?.includes('CREATE_SALES')) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  
  // Processar venda...
}
```

### No Middleware

```typescript
if (path.startsWith("/inventory/edit")) {
  if (!isAdmin && !permissions.includes("MANAGE_INVENTORY")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}
```

## Vantagens do Sistema

1. **Flexibilidade Total**: Admin define exatamente o que cada usuário pode fazer
2. **Granularidade**: 44 permissões específicas vs 5 roles genéricas
3. **Auditoria**: Rastreamento de quem concedeu cada permissão e quando
4. **Escalabilidade**: Fácil adicionar novas permissões sem afetar código existente
5. **Simplicidade**: Sem hierarquia complexa de roles
6. **Segurança**: Controle preciso de acesso a recursos críticos

## Próximos Passos

### Implementar UI de Gerenciamento de Permissões

1. **Página de Edição de Usuário** (`/admin/users/[id]`)
   - Formulário com dados básicos
   - Grid de permissões organizadas por categoria
   - Checkboxes para marcar/desmarcar
   - Botão "Select All" por categoria
   - Search/filter de permissões

2. **Componente `PermissionsManager`**
   ```tsx
   <PermissionsManager
     userId={user.id}
     currentPermissions={user.permissions}
     onSave={handleSavePermissions}
   />
   ```

3. **Templates de Permissões** (Opcional)
   - "Vendedor Básico" - 10 permissões
   - "Gerente de Loja" - 35 permissões
   - "Supervisor" - 20 permissões
   - Admin pode aplicar template e depois ajustar

4. **Histórico de Mudanças** (Futuro)
   - Log de quem concedeu/revogou permissões
   - Quando foi feito
   - Página de auditoria

## Comandos Úteis

```bash
# Gerar Prisma Client após mudanças no schema
pnpm prisma generate

# Sincronizar database com schema
pnpm prisma db push

# Migrar roles para permissões
npx tsx scripts/migrate-roles-to-permissions.ts

# Configurar admin
npx tsx scripts/setup-admin.ts

# Abrir Prisma Studio
pnpm prisma studio

# Verificar erros TypeScript
pnpm tsc --noEmit
```

## Arquivos Modificados

### Core
- ✅ `prisma/schema.prisma` - Schema redesenhado
- ✅ `types/next-auth.d.ts` - Tipos atualizados
- ✅ `lib/auth.ts` - Carregamento de permissões
- ✅ `lib/usePermissions.ts` - Hook reescrito
- ✅ `middleware.ts` - Proteção por permissões

### APIs
- ✅ `app/api/users/route.ts` - CRUD com permissões
- ✅ `app/api/users/[id]/route.ts` - Update com permissões
- ✅ `app/api/permissions/route.ts` - Listar permissões disponíveis

### Auth
- ✅ `app/(auth)/login/page.tsx` - Redirect simplificado

### Scripts
- ✅ `scripts/migrate-roles-to-permissions.ts` - Migração
- ✅ `scripts/setup-admin.ts` - Setup admin

### Pendentes
- ⏳ `app/(app)/admin/users/page.tsx` - UI de gerenciamento
- ⏳ `app/(app)/admin/users/[id]/page.tsx` - Edição de permissões
- ⏳ `components/PermissionsManager.tsx` - Componente de permissões
- ⏳ Atualizar outras páginas para usar novo hook

## Estado Atual

✅ **Backend Completo**
- Database schema atualizado
- Auth com permissões funcionando
- APIs migradas para novo sistema
- Middleware protegendo rotas
- Scripts de migração prontos

⏳ **Frontend em Progresso**
- Hook usePermissions atualizado
- Login page atualizada
- **Falta**: UI de gerenciamento de permissões na página de admin

## Conclusão

O sistema foi **completamente redesenhado** para oferecer controle granular de permissões. Não existem mais roles fixas - o administrador define individualmente o que cada usuário pode fazer através de 44 permissões específicas organizadas em 11 categorias.

**Total:** 44 permissões granulares disponíveis para customização completa do acesso de cada usuário.
