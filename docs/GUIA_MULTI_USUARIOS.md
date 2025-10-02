# 🎯 GUIA RÁPIDO - Sistema Multi-Usuários RBAC

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Sistema de Banco de Dados Completo**
- ✅ Novos roles: ADMIN, MANAGER, SELLER, CASHIER, SUPERVISOR
- ✅ Status de usuário: ACTIVE, INACTIVE, SUSPENDED, PENDING_ACTIVATION
- ✅ Vinculação usuário ↔ pontos de venda (modelo `UserPointOfSale`)
- ✅ Rastreamento de ações (quem criou vendas, movimentações, pedidos)
- ✅ Campos de segurança (tentativas de login, bloqueio temporário)

### 2. **Autenticação e Segurança**
- ✅ Login com validação de status
- ✅ Bloqueio após 5 tentativas falhas (15 minutos)
- ✅ Registro de último login
- ✅ Redirecionamento automático por role após login

### 3. **Controle de Acesso (Middleware)**
- ✅ Proteção de rotas por role
- ✅ Página de "Acesso Negado" (/unauthorized)
- ✅ Hooks de permissões (usePermissions, useUserContext)

### 4. **API de Gestão de Usuários**
- ✅ GET /api/users - Listar com filtros
- ✅ POST /api/users - Criar novo usuário
- ✅ GET /api/users/[id] - Buscar usuário
- ✅ PATCH /api/users/[id] - Atualizar usuário
- ✅ DELETE /api/users/[id] - Desativar usuário

### 5. **Interface Web**
- ✅ Página de login atualizada
- ✅ Página de gestão de usuários (/admin/users)
- ✅ Página de acesso negado

---

## 🚀 COMO TESTAR

### Passo 1: Executar Seed (Criar Admin)
```bash
pnpm prisma db seed
```

**Credenciais padrão:**
- Email: admin@nitrobeer.com
- Senha: admin123

### Passo 2: Iniciar Servidor
```bash
pnpm dev
```

### Passo 3: Acessar e Testar

#### 3.1 Teste de Login
1. Acesse http://localhost:3000/login
2. Entre com admin@nitrobeer.com / admin123
3. Deve redirecionar para /dashboard (ADMIN vai para dashboard)

#### 3.2 Teste de Gestão de Usuários
1. Acesse http://localhost:3000/admin/users
2. Deve ver lista de usuários (no momento só admin)
3. Teste os filtros (role, status, busca)

#### 3.3 Teste de Permissões
1. Tente acessar /admin/users com um usuário SELLER (quando criar)
2. Deve ser redirecionado para /unauthorized

#### 3.4 Criar Novo Usuário (Via API)
Use Postman/Insomnia ou curl:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Vendedor",
    "email": "joao@nitrobeer.com",
    "password": "senha123",
    "phone": "11999999999",
    "role": "SELLER",
    "pointsOfSaleIds": ["ID_DO_PDV_AQUI"]
  }'
```

---

## 📋 PRÓXIMOS PASSOS PARA COMPLETAR

### 1. Criar Formulário de Novo Usuário (UI)
```
app/(app)/admin/users/components/
  ├── CreateUserDialog.tsx
  ├── EditUserDialog.tsx
  └── ResetPasswordDialog.tsx
```

### 2. Atualizar Queries para Filtrar por Usuário
- [ ] useSales - filtrar vendas por createdById
- [ ] useInventory - filtrar por PDV do usuário
- [ ] useOrders - filtrar pedidos por createdBy

### 3. Adicionar createdById em Operações
Atualizar APIs que criam registros:
- [ ] POST /api/sales - adicionar createdById
- [ ] POST /api/orders - adicionar createdBy
- [ ] POST /api/inventory/movements - adicionar performedById

### 4. Criar Relatório de Atividades
- [ ] Vendas por usuário
- [ ] Movimentações por usuário
- [ ] Log de ações (auditoria)

---

## 🔑 ESTRUTURA DE PERMISSÕES

| Recurso | ADMIN | MANAGER | SELLER | CASHIER | SUPERVISOR |
|---------|-------|---------|--------|---------|------------|
| Gestão de usuários | ✅ | ➖ Criar vendedores | ❌ | ❌ | ❌ |
| Ver todos os PDVs | ✅ | ➖ Seus PDVs | ❌ | ❌ | ➖ Seus PDVs |
| Criar vendas | ✅ | ✅ | ✅ | ❌ | ✅ |
| Ver todas as vendas | ✅ | ➖ Seus PDVs | ➖ Próprias | ❌ | ➖ Seus PDVs |
| Editar inventário | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver inventário | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios globais | ✅ | ❌ | ❌ | ❌ | ❌ |
| Relatórios de PDV | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gestão de caixa | ✅ | ✅ | ❌ | ✅ | ✅ |
| Criar clientes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar clientes | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🐛 TROUBLESHOOTING

### Erro: "Prisma Client não atualizado"
```bash
# Matar processos Node e regenerar
taskkill /F /IM node.exe /T
pnpm prisma generate
```

### Erro: "Usuário não tem permissão"
- Verifique o role do usuário no banco
- Verifique se o middleware está configurado
- Verifique se está logado (sessão válida)

### Erro: "PointOfSale não encontrado" ao criar usuário
```bash
# Criar ponto de venda primeiro
curl -X POST http://localhost:3000/api/points-of-sale \
  -H "Content-Type: application/json" \
  -d '{"name": "Loja Principal", "code": "LJ01"}'
```

---

## 📁 ARQUIVOS IMPORTANTES

```
prisma/
  └── schema.prisma ........................ Schema do banco (MODIFICADO)
  └── seed.ts .............................. Seed com novo admin (MODIFICADO)

lib/
  ├── auth.ts .............................. Autenticação NextAuth (MODIFICADO)
  ├── usePermissions.ts .................... Hook de permissões (NOVO)
  └── useUserContext.ts .................... Hook de contexto usuário (NOVO)

types/
  └── next-auth.d.ts ....................... Tipos NextAuth (MODIFICADO)

middleware.ts .............................. Proteção de rotas (MODIFICADO)

app/
  ├── (auth)/login/page.tsx ................ Login atualizado (MODIFICADO)
  ├── unauthorized/page.tsx ................ Acesso negado (NOVO)
  └── (app)/admin/users/page.tsx ........... Gestão de usuários (NOVO)

app/api/users/
  ├── route.ts ............................. GET e POST usuários (NOVO)
  └── [id]/route.ts ........................ GET, PATCH, DELETE usuário (NOVO)
```

---

## 🎓 CONCEITOS IMPLEMENTADOS

### RBAC (Role-Based Access Control)
Sistema de controle de acesso baseado em papéis (roles). Cada usuário tem um role que define suas permissões.

### Multi-Tenancy (Preparado)
Campo `tenantId` preparado para separar dados por empresa no futuro.

### Soft Delete
Usuários não são deletados, apenas desativados (status = INACTIVE).

### Audit Trail
Registros de quem criou/modificou cada recurso.

### Security Best Practices
- Hash de senhas (bcrypt)
- Bloqueio por tentativas
- Sessões com expiração
- Validação de status

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique os logs do console
2. Verifique o banco de dados (Prisma Studio: `pnpm prisma studio`)
3. Revise o middleware.ts
4. Teste as APIs diretamente (Postman)
5. Verifique a sessão NextAuth

---

**Status:** ✅ Core implementado e funcional
**Data:** 02/10/2025
**Versão:** 1.0
