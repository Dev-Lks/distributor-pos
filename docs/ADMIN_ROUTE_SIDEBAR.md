# 👤 Rota de Administração na Sidebar

## ✅ Implementação

Adicionada nova seção **"Administração"** na sidebar que aparece apenas para usuários **admin**.

---

## 📋 Estrutura do Menu

### Nova Seção: "Administração"

```typescript
{
  heading: "Administração",
  items: [
    {
      label: "Usuários",
      description: "Gestão de usuários e permissões",
      href: "/admin/users",
      icon: User,
      permission: "manageUsers"
    }
  ]
}
```

---

## 🔒 Controle de Acesso

### Permissão Requerida: `MANAGE_USERS`

Apenas usuários com a permissão `MANAGE_USERS` (geralmente admins) verão este item no menu.

### Verificação em Múltiplas Camadas:

#### 1. Sidebar (UI)
```typescript
// SidebarLayout.tsx
const filteredNavSections = useMemo(() => {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permission) return true
        if (isAdmin) return true // Admin vê tudo
        return can[item.permission] // Verifica permissão específica
      }),
    }))
    .filter((section) => section.items.length > 0) // Remove seções vazias
}, [can, isAdmin])
```

**Resultado:**
- ✅ Admin → Vê "Administração" → "Usuários"
- ❌ Vendedor/Outro usuário → **Não vê** a seção

#### 2. Middleware (Rota)
```typescript
// middleware.ts
if (path.startsWith("/admin")) {
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}
```

**Resultado:**
- ✅ Admin → Pode acessar `/admin/users`
- ❌ Não-admin → Redireciona para `/unauthorized`

#### 3. API (Backend)
```typescript
// app/api/users/route.ts
const session = await getServerSession(authOptions);

if (!session || !session.user.isAdmin) {
  return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
}
```

**Resultado:**
- ✅ Admin → API funciona
- ❌ Não-admin → Retorna 403 Forbidden

---

## 🎨 Aparência no Menu

### Para Admin:

```
┌─────────────────────────────────────┐
│ Operacional                         │
│ ├─ Dashboard                        │
│ ├─ Encomendas                       │
│ └─ Clientes                         │
│                                     │
│ Vendas                              │
│ ├─ PDV                              │
│ └─ Registro de Vendas               │
│                                     │
│ Estoque                             │
│ ├─ Inventário                       │
│ ├─ Por Ponto                        │
│ └─ Produtos                         │
│                                     │
│ Relatórios                          │
│ ├─ Relatórios Z                     │
│ └─ Análise de Vendas                │
│                                     │
│ Configurações                       │
│ ├─ Pontos de Venda                  │
│ └─ Preferências                     │
│                                     │
│ Administração            ← NOVO!    │
│ └─ 👤 Usuários                      │
│    Gestão de usuários e permissões  │
└─────────────────────────────────────┘
```

### Para Vendedor/Usuário Comum:

```
┌─────────────────────────────────────┐
│ Vendas                              │
│ ├─ PDV                              │
│ └─ Registro de Vendas               │
│                                     │
│ Estoque                             │
│ └─ Produtos                         │
│                                     │
│ Operacional                         │
│ └─ Clientes                         │
│                                     │
│ ❌ Administração                    │
│    (SEÇÃO NÃO APARECE)              │
└─────────────────────────────────────┘
```

---

## 🔑 Permissão: MANAGE_USERS

### O que essa permissão permite:

1. **Ver menu "Administração"** → "Usuários"
2. **Acessar** `/admin/users` (listagem)
3. **Criar** novos usuários
4. **Editar** usuários existentes
5. **Alterar status** (ativar/desativar/suspender)
6. **Atribuir permissões** a outros usuários
7. **Deletar** usuários (se tiver DELETE_USERS também)

### Atribuição:

Por padrão, apenas **admins** (`isAdmin: true`) têm `MANAGE_USERS`.

Para dar esta permissão a um usuário não-admin:

```typescript
// Como admin, edite o usuário e marque:
✅ MANAGE_USERS
```

---

## 🧪 Como Testar

### 1. Login como Admin
```
Email: admin@nitrobeer.com
Senha: admin123
```

**Verificar:**
- ✅ Menu mostra seção "Administração"
- ✅ Item "Usuários" aparece
- ✅ Clicar leva para `/admin/users`
- ✅ Página carrega normalmente

### 2. Login como Vendedor
```
Email: vendedor@nitrobeer.com
Senha: vendedor123
```

**Verificar:**
- ❌ Menu **NÃO** mostra seção "Administração"
- ❌ Acessar `/admin/users` diretamente → Redireciona para `/unauthorized`

### 3. Criar Usuário com MANAGE_USERS
Como admin:
1. Vá em `/admin/users`
2. Edite um usuário não-admin
3. Marque apenas `MANAGE_USERS`
4. Salve

Como esse usuário:
- ✅ Verá "Administração" → "Usuários" no menu
- ✅ Poderá gerenciar outros usuários
- ❌ **NÃO** verá outras seções de admin (se existirem)

---

## 🎯 Ordem das Seções no Menu

1. **Operacional** (Dashboard, Encomendas, Clientes)
2. **Vendas** (PDV, Registro)
3. **Estoque** (Inventário, Por Ponto, Produtos)
4. **Relatórios** (Relatórios Z, Análise)
5. **Configurações** (Pontos de Venda, Preferências)
6. **Administração** ← NOVA! (Usuários)

---

## 🔮 Expansão Futura

A seção "Administração" pode ser expandida com mais itens:

```typescript
{
  heading: "Administração",
  items: [
    {
      label: "Usuários",
      href: "/admin/users",
      icon: User,
      permission: "manageUsers"
    },
    // Futuros:
    {
      label: "Auditoria",
      href: "/admin/audit",
      icon: FileText,
      permission: "viewAuditLogs"
    },
    {
      label: "Backup",
      href: "/admin/backup",
      icon: Database,
      permission: "manageBackups"
    },
    {
      label: "Integrations",
      href: "/admin/integrations",
      icon: Plug,
      permission: "manageIntegrations"
    }
  ]
}
```

---

## ✅ Status

**✅ IMPLEMENTADO**

- [x] Seção "Administração" criada
- [x] Item "Usuários" adicionado
- [x] Permissão `manageUsers` configurada
- [x] Ícone `User` importado
- [x] Descrição adicionada
- [x] Filtro automático funcionando

**Quando admin logar, verá a nova seção!** 🎉
