# 🚀 IMPLEMENTAÇÃO: Sistema de Multi-Usuários e Gestão com RBAC

## 📋 CONTEXTO DO PROJETO

Este é um sistema de gestão comercial (ERP/POS) com:
- Vendas e gestão de caixa
- Controle de inventário avançado
- Múltiplos pontos de venda (PDVs)
- Encomendas e pedidos personalizados
- Relatórios e analytics
- Sistema de bonificações para clientes

**Tecnologias atuais:**
- Next.js 14+ (App Router)
- Prisma ORM + PostgreSQL
- NextAuth.js para autenticação
- shadcn/ui + Tailwind CSS
- React Query para state management

---

## 🎯 OBJETIVO

Implementar um sistema completo de **multi-usuários com RBAC (Role-Based Access Control)** que permita:

1. ✅ Autenticação segura com diferentes níveis de acesso
2. ✅ Gestão de usuários (CRUD completo)
3. ✅ Vinculação de usuários a pontos de venda
4. ✅ Controle de permissões granular por role
5. ✅ Rastreamento de ações (quem fez o quê)
6. ✅ Dashboards personalizados por role
7. ✅ Preparação para multi-tenancy (empresas separadas)

---

## 👥 ESTRUTURA DE ROLES E PERMISSÕES

### Roles Principais:

#### 🔴 **ADMIN** (Administrador)
- **Acesso:** Total e irrestrito
- **Permissões:**
  - Gerenciar todos os usuários (criar, editar, desativar, resetar senha)
  - Ver e gerenciar todos os pontos de venda
  - Acesso a relatórios globais (todos os PDVs)
  - Gerenciar inventário global (produtos, lotes, movimentações)
  - Forçar fechamento de caixas
  - Gerenciar clientes e bonificações
  - Gerenciar encomendas de todos os PDVs
  - Configurações do sistema
- **Navegação:** `/dashboard/global` (visão geral de tudo)

#### 🟠 **MANAGER** (Gerente)
- **Acesso:** Gerencia um ou múltiplos pontos de venda específicos
- **Permissões:**
  - Criar e editar vendedores vinculados aos seus PDVs
  - Ver relatórios dos PDVs que gerencia
  - Gerenciar inventário dos seus PDVs (transferências, ajustes)
  - Abrir e fechar sessões de caixa
  - Editar e excluir clientes
  - Gerenciar encomendas dos seus PDVs
  - Aprovar bonificações
  - Ver desempenho de vendedores dos seus PDVs
- **Navegação:** `/dashboard?pos={ids}` (filtrado por seus PDVs)
- **Restrições:** NÃO pode criar outros gerentes ou admins

#### 🟢 **SELLER** (Vendedor)
- **Acesso:** Limitado ao ponto de venda ativo
- **Permissões:**
  - Registrar vendas
  - Cadastrar novos clientes (somente criar)
  - Ver e consultar estoque (somente leitura)
  - Abrir e fechar caixa (se permitido)
  - Criar encomendas
  - Ver apenas suas próprias vendas e desempenho pessoal
  - Consultar histórico de clientes
- **Navegação:** `/sales` (direto para tela de vendas)
- **Restrições:** NÃO pode editar produtos, NÃO vê vendas de outros, NÃO acessa relatórios gerenciais

#### 🔵 **CASHIER** (Operador de Caixa) - OPCIONAL
- **Acesso:** Apenas operações de caixa
- **Permissões:**
  - Abrir e fechar sessões de caixa
  - Registrar transações de caixa (suprimento, sangria)
  - Processar pagamentos
  - Ver saldo de caixa atual
- **Navegação:** `/cash-session`
- **Restrições:** NÃO pode criar vendas completas, apenas processar pagamentos

#### 🟣 **SUPERVISOR** (Supervisor) - OPCIONAL
- **Acesso:** Intermediário entre gerente e vendedor
- **Permissões:**
  - Ver relatórios dos PDVs onde atua
  - Gerenciar vendedores (mas não editar)
  - Aprovar descontos especiais
  - Ver desempenho da equipe
- **Navegação:** `/reports?pos={id}`
- **Restrições:** NÃO pode criar usuários, NÃO pode editar inventário

---

## 🗄️ SCHEMA DO BANCO DE DADOS (Prisma)

### 1️⃣ Modificar modelo `User` existente

```prisma
enum UserRole {
  ADMIN
  MANAGER
  SELLER
  CASHIER
  SUPERVISOR
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_ACTIVATION
}

model User {
  id                String         @id @default(cuid())
  
  // Informações básicas
  fullName          String
  email             String         @unique
  passwordHash      String
  phone             String?
  cpf               String?        @unique
  avatarUrl         String?
  
  // Permissões e status
  role              UserRole       @default(SELLER)
  status            UserStatus     @default(ACTIVE)
  
  // Multi-tenancy (preparação futura)
  tenantId          String?        // Para separar empresas no futuro
  
  // Metadados
  lastLoginAt       DateTime?
  passwordChangedAt DateTime?
  failedLoginAttempts Int         @default(0)
  lockedUntil       DateTime?
  
  // Timestamps
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  createdById       String?        // Quem criou este usuário
  
  // Relações
  cashSessions      CashSession[]
  cashTransactions  CashTransaction[] @relation("UserCashTransactions")
  pendingCarts      PendingCart[]     @relation("UserPendingCarts")
  userPointsOfSale  UserPointOfSale[] // Nova relação!
  salesCreated      Sale[]            @relation("SaleCreatedBy") // Nova relação!
  inventoryMovements InventoryMovement[] @relation("MovementPerformedBy") // Nova relação!
  ordersCreated     Order[]           @relation("OrderCreatedBy") // Nova relação!
  ordersAssigned    Order[]           @relation("OrderAssignedTo") // Nova relação!
  
  @@index([email])
  @@index([status])
  @@index([role])
  @@index([tenantId])
}
```

### 2️⃣ Criar modelo `UserPointOfSale` (vinculação usuário ↔ PDV)

```prisma
enum RoleInPOS {
  MANAGER      // Gerencia este PDV
  SELLER       // Vende neste PDV
  CASHIER      // Opera caixa neste PDV
  SUPERVISOR   // Supervisiona este PDV
}

model UserPointOfSale {
  id            String      @id @default(cuid())
  userId        String
  pointOfSaleId String
  roleInPOS     RoleInPOS   @default(SELLER)
  isPrimary     Boolean     @default(false) // PDV padrão do usuário
  isActive      Boolean     @default(true)  // Pode desativar sem deletar
  assignedAt    DateTime    @default(now())
  assignedBy    String?     // Quem fez a vinculação
  
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  pointOfSale   PointOfSale @relation(fields: [pointOfSaleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, pointOfSaleId])
  @@index([userId])
  @@index([pointOfSaleId])
  @@index([isPrimary])
}
```

### 3️⃣ Criar modelo `Permission` (RBAC avançado - opcional)

```prisma
model Permission {
  id          String   @id @default(cuid())
  key         String   @unique // Ex: "manage_users", "view_reports"
  name        String   // Nome legível
  description String?
  category    String?  // Ex: "users", "sales", "inventory"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  rolePermissions RolePermission[]
}

model RolePermission {
  id           String     @id @default(cuid())
  role         UserRole
  permissionId String
  granted      Boolean    @default(true)
  
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([role, permissionId])
  @@index([role])
}

// Permissões por usuário (overrides)
model UserPermission {
  id           String     @id @default(cuid())
  userId       String
  permissionId String
  granted      Boolean    // true = conceder, false = revogar
  grantedBy    String?
  grantedAt    DateTime   @default(now())
  
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([userId, permissionId])
  @@index([userId])
}
```

### 4️⃣ Modificar modelos existentes para rastreamento

```prisma
// Adicionar nos modelos Sale, InventoryMovement, Order, etc:

model Sale {
  // ... campos existentes ...
  
  createdById   String?
  createdBy     User?   @relation("SaleCreatedBy", fields: [createdById], references: [id])
  
  @@index([createdById])
}

model InventoryMovement {
  // ... campos existentes ...
  
  performedById String?
  performedBy   User?   @relation("MovementPerformedBy", fields: [performedById], references: [id])
  
  @@index([performedById])
}

model Order {
  // ... campos existentes ...
  
  createdById   String?
  createdBy     User?   @relation("OrderCreatedBy", fields: [createdById], references: [id])
  
  assignedToId  String?
  assignedTo    User?   @relation("OrderAssignedTo", fields: [assignedToId], references: [id])
  
  @@index([createdById])
  @@index([assignedToId])
}

// Adicionar relação no modelo PointOfSale:
model PointOfSale {
  // ... campos existentes ...
  userPointsOfSale UserPointOfSale[]
}
```

---

## 🔐 AUTENTICAÇÃO (NextAuth.js)

### Configurar `lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            userPointsOfSale: {
              where: { isActive: true },
              include: {
                pointOfSale: true
              }
            }
          }
        });

        if (!user) {
          throw new Error("Credenciais inválidas");
        }

        // Verificar status do usuário
        if (user.status === UserStatus.INACTIVE) {
          throw new Error("Usuário inativo. Contate o administrador.");
        }

        if (user.status === UserStatus.SUSPENDED) {
          throw new Error("Usuário suspenso. Contate o administrador.");
        }

        // Verificar bloqueio por tentativas falhas
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Conta temporariamente bloqueada. Tente novamente mais tarde.");
        }

        // Validar senha
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Incrementar tentativas falhas
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lockedUntil: user.failedLoginAttempts >= 4 
                ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
                : undefined
            }
          });
          throw new Error("Credenciais inválidas");
        }

        // Reset tentativas falhas e atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl,
          tenantId: user.tenantId,
          pointsOfSale: user.userPointsOfSale.map(ups => ({
            id: ups.pointOfSaleId,
            name: ups.pointOfSale.name,
            roleInPOS: ups.roleInPOS,
            isPrimary: ups.isPrimary
          }))
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.tenantId = user.tenantId;
        token.pointsOfSale = user.pointsOfSale;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.tenantId = token.tenantId as string | null;
        session.user.pointsOfSale = token.pointsOfSale as any[];
      }
      return session;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login"
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60 // 8 horas
  },

  secret: process.env.NEXTAUTH_SECRET
};
```

### Atualizar `types/next-auth.d.ts`:

```typescript
import { UserRole, UserStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      tenantId: string | null;
      pointsOfSale: Array<{
        id: string;
        name: string;
        roleInPOS: string;
        isPrimary: boolean;
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    status: UserStatus;
    tenantId: string | null;
    avatarUrl: string | null;
    pointsOfSale: Array<{
      id: string;
      name: string;
      roleInPOS: string;
      isPrimary: boolean;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    tenantId: string | null;
    pointsOfSale: Array<{
      id: string;
      name: string;
      roleInPOS: string;
      isPrimary: boolean;
    }>;
  }
}
```

---

## 🛡️ MIDDLEWARE DE AUTORIZAÇÃO

### Criar `middleware.ts` na raiz do projeto:

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Rotas públicas
    if (path.startsWith("/login") || path.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Usuário não autenticado
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Proteção de rotas por role
    const role = token.role as UserRole;

    // Rotas exclusivas do ADMIN
    if (path.startsWith("/admin") || path.startsWith("/dashboard/users")) {
      if (role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Rotas de gerente
    if (path.startsWith("/dashboard") && !path.startsWith("/dashboard/users")) {
      if (role === UserRole.SELLER || role === UserRole.CASHIER) {
        return NextResponse.redirect(new URL("/sales", req.url));
      }
    }

    // Rotas de relatórios
    if (path.startsWith("/reports")) {
      if (role === UserRole.SELLER || role === UserRole.CASHIER) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Gestão de inventário
    if (path.startsWith("/inventory") && path.includes("/edit")) {
      if (role === UserRole.SELLER || role === UserRole.CASHIER) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/sales/:path*",
    "/inventory/:path*",
    "/reports/:path*",
    "/orders/:path*"
  ]
};
```

### Criar hook `lib/usePermissions.ts`:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const can = {
    // Gestão de usuários
    manageUsers: role === UserRole.ADMIN,
    createSellers: role === UserRole.ADMIN || role === UserRole.MANAGER,
    viewAllUsers: role === UserRole.ADMIN,
    
    // Vendas
    createSales: true, // Todos podem criar vendas
    viewAllSales: role === UserRole.ADMIN || role === UserRole.MANAGER,
    viewOwnSales: true,
    deleteSales: role === UserRole.ADMIN || role === UserRole.MANAGER,
    
    // Inventário
    manageInventory: role === UserRole.ADMIN || role === UserRole.MANAGER,
    viewInventory: true, // Todos podem ver
    transferStock: role === UserRole.ADMIN || role === UserRole.MANAGER,
    adjustStock: role === UserRole.ADMIN || role === UserRole.MANAGER,
    
    // Relatórios
    viewGlobalReports: role === UserRole.ADMIN,
    viewPOSReports: role === UserRole.ADMIN || role === UserRole.MANAGER || role === UserRole.SUPERVISOR,
    viewOwnPerformance: true,
    
    // Caixa
    manageCashSessions: role !== UserRole.SELLER,
    openCashSession: role !== UserRole.SELLER,
    forceCloseCashSession: role === UserRole.ADMIN,
    
    // Clientes
    createCustomers: true, // Todos podem cadastrar
    editCustomers: role === UserRole.ADMIN || role === UserRole.MANAGER,
    deleteCustomers: role === UserRole.ADMIN,
    
    // Encomendas
    createOrders: true,
    manageOrders: role === UserRole.ADMIN || role === UserRole.MANAGER,
    viewAllOrders: role === UserRole.ADMIN || role === UserRole.MANAGER,
    
    // Pontos de venda
    managePOS: role === UserRole.ADMIN,
    viewPOSData: role !== UserRole.SELLER,
    
    // Bonificações
    approveBonifications: role === UserRole.ADMIN || role === UserRole.MANAGER,
    createBonifications: true
  };

  const is = {
    admin: role === UserRole.ADMIN,
    manager: role === UserRole.MANAGER,
    seller: role === UserRole.SELLER,
    cashier: role === UserRole.CASHIER,
    supervisor: role === UserRole.SUPERVISOR
  };

  return { can, is, role };
}
```

---

## 🎨 INTERFACE DE GESTÃO DE USUÁRIOS

### Criar página `app/(app)/admin/users/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Filter } from "lucide-react";
import { UserTable } from "@/components/admin/UserTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { usePermissions } from "@/lib/usePermissions";
import { redirect } from "next/navigation";

export default function UsersPage() {
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  if (!can.manageUsers) {
    redirect("/unauthorized");
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchQuery, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      
      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      return res.json();
    }
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e acessos
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={roleFilter || ""}
          onChange={(e) => setRoleFilter(e.target.value || null)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Todos os papéis</option>
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Gerente</option>
          <option value="SELLER">Vendedor</option>
          <option value="CASHIER">Caixa</option>
          <option value="SUPERVISOR">Supervisor</option>
        </select>

        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
          <option value="SUSPENDED">Suspenso</option>
        </select>
      </div>

      {/* Tabela */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onEdit={setEditingUser}
      />

      {/* Dialogs */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </div>
  );
}
```

### Criar componente `components/admin/CreateUserDialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const createUserSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "SELLER", "CASHIER", "SUPERVISOR"]),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  pointsOfSaleIds: z.array(z.string()).min(1, "Selecione pelo menos um PDV")
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export function CreateUserDialog({ open, onOpenChange }: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: pointsOfSale } = useQuery({
    queryKey: ["points-of-sale"],
    queryFn: async () => {
      const res = await fetch("/api/points-of-sale");
      return res.json();
    }
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cpf: "",
      role: "SELLER",
      password: "",
      pointsOfSaleIds: []
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao criar usuário");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Usuário criado!",
        description: "O usuário foi criado com sucesso."
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo usuário
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                placeholder="João Silva"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="joao@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...form.register("cpf")}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="role">Papel *</Label>
              <select
                id="role"
                {...form.register("role")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="SELLER">Vendedor</option>
                <option value="CASHIER">Caixa</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="MANAGER">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <Label htmlFor="password">Senha Temporária *</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder="******"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Pontos de Venda *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pointsOfSale?.map((pos: any) => (
                <label key={pos.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={pos.id}
                    {...form.register("pointsOfSaleIds")}
                  />
                  <span>{pos.name}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.pointsOfSaleIds && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.pointsOfSaleIds.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔌 API ROUTES

### Criar `app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

// GET /api/users - Listar usuários com filtros
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search, mode: "insensitive" } }
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const users = await prisma.user.findMany({
    where,
    include: {
      userPointsOfSale: {
        include: {
          pointOfSale: true
        }
      },
      _count: {
        select: {
          salesCreated: true,
          cashSessions: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(users);
}

// POST /api/users - Criar novo usuário
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Apenas ADMIN pode criar qualquer usuário
  // MANAGER só pode criar SELLER e CASHIER
  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { fullName, email, password, phone, cpf, role, pointsOfSaleIds } = body;

  // Validações
  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (!pointsOfSaleIds || pointsOfSaleIds.length === 0) {
    return NextResponse.json(
      { error: "Selecione pelo menos um ponto de venda" },
      { status: 400 }
    );
  }

  // MANAGER não pode criar ADMIN ou outros MANAGERS
  if (session.user.role === UserRole.MANAGER) {
    if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar este tipo de usuário" },
        { status: 403 }
      );
    }
  }

  // Verificar se email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Email já cadastrado" },
      { status: 400 }
    );
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  // Criar usuário com vinculações aos PDVs
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      phone,
      cpf,
      role: role || UserRole.SELLER,
      createdById: session.user.id,
      userPointsOfSale: {
        create: pointsOfSaleIds.map((posId: string, index: number) => ({
          pointOfSaleId: posId,
          roleInPOS: role === UserRole.MANAGER ? "MANAGER" : "SELLER",
          isPrimary: index === 0, // Primeiro PDV é o primário
          assignedBy: session.user.id
        }))
      }
    },
    include: {
      userPointsOfSale: {
        include: {
          pointOfSale: true
        }
      }
    }
  });

  return NextResponse.json(user, { status: 201 });
}
```

### Criar `app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";

// GET /api/users/[id] - Buscar usuário por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      userPointsOfSale: {
        include: {
          pointOfSale: true
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/users/[id] - Atualizar usuário
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MANAGER)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { fullName, phone, cpf, role, status, pointsOfSaleIds, newPassword } = body;

  const updateData: any = {};
  if (fullName) updateData.fullName = fullName;
  if (phone !== undefined) updateData.phone = phone;
  if (cpf !== undefined) updateData.cpf = cpf;
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  // Se nova senha foi fornecida
  if (newPassword) {
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    updateData.passwordChangedAt = new Date();
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData
  });

  // Atualizar vinculações de PDVs se fornecido
  if (pointsOfSaleIds) {
    // Remover vinculações antigas
    await prisma.userPointOfSale.deleteMany({
      where: { userId: params.id }
    });

    // Criar novas vinculações
    await prisma.userPointOfSale.createMany({
      data: pointsOfSaleIds.map((posId: string, index: number) => ({
        userId: params.id,
        pointOfSaleId: posId,
        roleInPOS: role === UserRole.MANAGER ? "MANAGER" : "SELLER",
        isPrimary: index === 0,
        assignedBy: session.user.id
      }))
    });
  }

  return NextResponse.json(user);
}

// DELETE /api/users/[id] - Desativar usuário (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Não permitir que o admin delete a si mesmo
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode desativar sua própria conta" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { status: UserStatus.INACTIVE }
  });

  return NextResponse.json({ message: "Usuário desativado com sucesso" });
}
```

---

## 🧭 NAVEGAÇÃO E REDIRECIONAMENTO

### Atualizar `app/(auth)/login/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        toast({
          title: "Erro ao fazer login",
          description: result.error,
          variant: "destructive"
        });
      } else {
        // Redirecionar baseado no role
        const session = await fetch("/api/auth/session").then(r => r.json());
        const role = session?.user?.role;

        if (role === "ADMIN" || role === "MANAGER" || role === "SUPERVISOR") {
          router.push("/dashboard");
        } else if (role === "SELLER") {
          router.push("/sales");
        } else if (role === "CASHIER") {
          router.push("/cash-session");
        } else {
          router.push("/");
        }

        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Bem-vindo</h1>
          <p className="text-muted-foreground mt-2">
            Entre com suas credenciais
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

## 📊 FILTROS POR ROLE NOS RELATÓRIOS

### Criar hook `lib/useUserContext.ts`:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { UserRole } from "@prisma/client";

export function useUserContext() {
  const { data: session } = useSession();

  const userPOSIds = useMemo(() => {
    return session?.user?.pointsOfSale?.map(pos => pos.id) || [];
  }, [session]);

  const primaryPOS = useMemo(() => {
    return session?.user?.pointsOfSale?.find(pos => pos.isPrimary);
  }, [session]);

  const canAccessPOS = (posId: string) => {
    if (session?.user?.role === UserRole.ADMIN) return true;
    return userPOSIds.includes(posId);
  };

  const shouldFilterByPOS = () => {
    return session?.user?.role !== UserRole.ADMIN;
  };

  return {
    user: session?.user,
    userPOSIds,
    primaryPOS,
    canAccessPOS,
    shouldFilterByPOS
  };
}
```

### Atualizar `lib/useSales.ts` para filtrar por usuário:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useUserContext } from "./useUserContext";
import { UserRole } from "@prisma/client";

export function useSales(filters?: {
  startDate?: Date;
  endDate?: Date;
  pointOfSaleId?: string;
}) {
  const { user, userPOSIds, shouldFilterByPOS } = useUserContext();

  return useQuery({
    queryKey: ["sales", filters, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.startDate) {
        params.set("startDate", filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.set("endDate", filters.endDate.toISOString());
      }

      // ADMIN vê tudo, outros veem apenas seus PDVs
      if (shouldFilterByPOS()) {
        if (filters?.pointOfSaleId) {
          params.set("pointOfSaleId", filters.pointOfSaleId);
        } else {
          // Se não especificou PDV, filtrar por todos os PDVs do usuário
          params.set("pointOfSaleIds", userPOSIds.join(","));
        }
      } else if (filters?.pointOfSaleId) {
        params.set("pointOfSaleId", filters.pointOfSaleId);
      }

      // SELLER vê apenas suas próprias vendas
      if (user?.role === UserRole.SELLER) {
        params.set("createdById", user.id);
      }

      const res = await fetch(`/api/sales?${params}`);
      if (!res.ok) throw new Error("Falha ao buscar vendas");
      return res.json();
    },
    enabled: !!user
  });
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Execute na ordem:

### 1. Schema e Banco de Dados
- [ ] Adicionar enums `UserRole`, `UserStatus`, `RoleInPOS`
- [ ] Modificar modelo `User` com novos campos
- [ ] Criar modelo `UserPointOfSale`
- [ ] (Opcional) Criar modelos `Permission`, `RolePermission`, `UserPermission`
- [ ] Adicionar campos `createdById`, `performedById` nos modelos existentes
- [ ] Rodar `prisma migrate dev --name add-multi-user-system`
- [ ] Criar seed script para criar primeiro admin

### 2. Autenticação
- [ ] Instalar dependências: `npm install bcryptjs @types/bcryptjs`
- [ ] Atualizar `lib/auth.ts` com nova lógica de autenticação
- [ ] Atualizar `types/next-auth.d.ts` com novos tipos
- [ ] Testar login com credenciais

### 3. Autorização
- [ ] Criar `middleware.ts` para proteção de rotas
- [ ] Criar hook `usePermissions.ts`
- [ ] Criar hook `useUserContext.ts`
- [ ] Testar acesso às rotas por diferentes roles

### 4. API Routes
- [ ] Criar `GET /api/users` (listar com filtros)
- [ ] Criar `POST /api/users` (criar usuário)
- [ ] Criar `GET /api/users/[id]` (buscar por ID)
- [ ] Criar `PATCH /api/users/[id]` (atualizar)
- [ ] Criar `DELETE /api/users/[id]` (desativar)
- [ ] Adicionar validações e permissões em todas as rotas existentes

### 5. Interface de Gestão
- [ ] Criar página `/admin/users`
- [ ] Criar componente `UserTable`
- [ ] Criar componente `CreateUserDialog`
- [ ] Criar componente `EditUserDialog`
- [ ] Criar componente `ResetPasswordDialog`
- [ ] Criar componente `UserPointsOfSaleManager`

### 6. Navegação e UX
- [ ] Atualizar página de login com redirecionamento por role
- [ ] Criar página `/unauthorized`
- [ ] Adicionar seletor de PDV na navbar (se múltiplos PDVs)
- [ ] Atualizar sidebar com links baseados em permissões
- [ ] Criar indicador visual do PDV ativo

### 7. Filtros e Queries
- [ ] Atualizar `useSales` para filtrar por role
- [ ] Atualizar `useInventory` para filtrar por PDV
- [ ] Atualizar `useReports` para filtrar por permissões
- [ ] Atualizar `useOrders` para filtrar por PDV
- [ ] Adicionar filtro "criado por" nas tabelas

### 8. Rastreamento de Ações
- [ ] Adicionar `createdById` em todas as operações de criação
- [ ] Adicionar `performedById` em movimentações de estoque
- [ ] Criar logs de auditoria (opcional)
- [ ] Criar relatório de atividades por usuário

### 9. Testes
- [ ] Testar criação de usuários por ADMIN
- [ ] Testar criação de vendedores por MANAGER
- [ ] Testar acesso negado para roles inadequados
- [ ] Testar filtros de vendas por role
- [ ] Testar sessões de caixa com múltiplos usuários
- [ ] Testar reset de senha
- [ ] Testar desativação de usuários

### 10. Documentação
- [ ] Documentar permissões de cada role
- [ ] Criar guia de onboarding para novos usuários
- [ ] Documentar fluxo de criação de usuários
- [ ] Criar FAQ sobre gestão de usuários

---

## 🔮 PRÓXIMOS PASSOS (FUTURO)

### Multi-Tenancy (Multi-Empresa)
- Adicionar modelo `Tenant`
- Isolar dados por `tenantId`
- Criar subdomínios/URLs personalizadas
- Sistema de billing por tenant
- Configurações customizadas por tenant

### Permissões Avançadas
- Interface para criar permissões customizadas
- Sistema de grupos de permissões
- Permissões temporárias (com expiração)
- Logs detalhados de mudanças de permissões

### Segurança Adicional
- Autenticação de dois fatores (2FA)
- Histórico de logins
- Detecção de logins suspeitos
- Política de senha forte
- Expiração de sessões por inatividade

---

## 📞 SUPORTE E DÚVIDAS

Se encontrar dificuldades durante a implementação:
1. Verifique o checklist acima
2. Revise os logs do Prisma e do Next.js
3. Teste endpoints isoladamente com Postman/Insomnia
4. Valide permissões no middleware
5. Use `console.log` nos hooks para debug

**Boa implementação! 🚀**
