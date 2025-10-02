# 🧪 Guia de Teste - Sistema de Permissões Granulares

## Servidor Rodando
✅ Next.js: http://localhost:3001

---

## 📝 Roteiro de Teste Completo

### 1. Login como Administrador

**URL:** http://localhost:3001/login

**Credenciais:**
```
Email: admin@nitrobeer.com
Senha: admin123
```

**Verificar:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/dashboard`
- ✅ Admin tem acesso a todas as áreas

---

### 2. Acessar Gestão de Usuários

**URL:** http://localhost:3001/admin/users

**O que você deve ver:**
- ✅ Lista de usuários (admin + vendedor)
- ✅ Coluna "Tipo" mostrando 👑 Administrador / 👤 Usuário
- ✅ Coluna "Permissões" mostrando "Todas" para admin
- ✅ Botão "Editar" em cada usuário
- ✅ Filtros: "Todos os tipos", "Todos os status"
- ✅ Campo de busca funcionando

**Testar:**
1. Buscar por "admin" - deve filtrar
2. Filtrar por "Administradores" - deve mostrar só admin
3. Filtrar por "Usuários Comuns" - deve mostrar vendedor

---

### 3. Editar Usuário Vendedor

**Ação:** Clicar em "Editar" no usuário `vendedor@nitrobeer.com`

**URL:** http://localhost:3001/admin/users/{id}

**O que você deve ver:**

#### Seção: Informações Básicas
- ✅ Nome Completo: "João Vendedor"
- ✅ Email: "vendedor@nitrobeer.com" (desabilitado)
- ✅ Telefone, CPF (editáveis)
- ✅ Status: Dropdown (Ativo/Inativo/Suspenso)
- ✅ Checkbox "Administrador" (desmarcado)

#### Seção: Permissões
- ✅ Título: "Permissões (10/44 selecionadas)"
- ✅ Campo de busca de permissões
- ✅ Botão "Selecionar Todas" / "Desmarcar Todas"
- ✅ 11 categorias expandidas:
  - Dashboard e Visualizações
  - Vendas
  - Produtos
  - Inventário
  - Clientes
  - Caixa
  - Encomendas
  - Pontos de Venda
  - Usuários e Permissões
  - Bonificações
  - Configurações

**Testar Funcionalidades:**

1. **Busca de Permissões**
   - Digite "vendas" → Deve filtrar só permissões de vendas
   - Digite "visualizar" → Deve mostrar todas com "visualizar"
   - Limpe busca → Volta ao normal

2. **Selecionar/Desmarcar Individual**
   - Clique em "Visualizar Dashboard"
   - Contador deve mudar para "11/44"
   - Clique novamente → Volta para "10/44"

3. **Selecionar Todas da Categoria**
   - Clique no checkbox ao lado de "Vendas"
   - Todas as 6 permissões de vendas devem marcar
   - Contador deve atualizar
   - Clique novamente → Desmarca todas

4. **Selecionar Todas Global**
   - Clique em "Selecionar Todas" no topo
   - Contador deve ir para "44/44"
   - Clique em "Desmarcar Todas"
   - Contador volta para "0/44"

5. **Salvar Alterações**
   - Marque "VIEW_DASHBOARD", "VIEW_REPORTS"
   - Clique em "Salvar Alterações"
   - Deve mostrar toast "Usuário atualizado com sucesso!"
   - Recarregue página → Permissões devem persistir

6. **Tornar Admin**
   - Marque checkbox "Administrador"
   - Seção de permissões deve desaparecer
   - Deve mostrar aviso: "Este usuário é um administrador..."
   - Salve → Usuário agora é admin

---

### 4. Testar Login com Vendedor

**Logout do Admin:**
- Clique no avatar/menu
- Logout

**Login como Vendedor:**
```
Email: vendedor@nitrobeer.com
Senha: vendedor123
```

**Verificar Restrições:**
- ✅ Não consegue acessar `/admin/users` (redirect para /unauthorized)
- ✅ Não consegue acessar `/dashboard` se não tiver VIEW_DASHBOARD
- ✅ Menu lateral só mostra opções com permissão
- ✅ Botões de ações restritos aparecem desabilitados ou ocultos

---

### 5. Testar Hook usePermissions

**Abrir DevTools Console**

**No componente que usa o hook:**
```typescript
const { can, isAdmin, permissions } = usePermissions();

console.log('isAdmin:', isAdmin); // false (vendedor)
console.log('permissions:', permissions); // Array com permissões
console.log('can.viewDashboard:', can.viewDashboard); // true/false
console.log('can.manageUsers:', can.manageUsers); // false
```

---

## 🔍 Pontos de Validação

### ✅ Checklist Completo

**Backend:**
- [ ] Login funciona para admin e vendedor
- [ ] Sessão carrega `isAdmin` + `permissions` array
- [ ] API `/api/users` retorna lista com permissões
- [ ] API `/api/users/[id]` atualiza permissões
- [ ] Middleware bloqueia rotas sem permissão

**Frontend:**
- [ ] Página de listagem mostra tipo e quantidade de permissões
- [ ] Filtros funcionam (tipo e status)
- [ ] Busca funciona
- [ ] Página de edição carrega dados corretamente
- [ ] Componente PermissionsManager exibe 44 permissões
- [ ] Busca de permissões filtra corretamente
- [ ] Checkbox individual funciona
- [ ] Checkbox de categoria funciona
- [ ] Botão "Selecionar Todas" funciona
- [ ] Contador atualiza em tempo real
- [ ] Salvar persiste as mudanças
- [ ] Toggle Admin oculta/mostra permissões
- [ ] Toast de sucesso/erro aparece

**Permissões:**
- [ ] Admin tem acesso a tudo
- [ ] Vendedor tem acesso limitado
- [ ] Hook `usePermissions()` funciona
- [ ] Componentes respeitam permissões
- [ ] Redirect para /unauthorized quando sem acesso

---

## 🐛 Possíveis Problemas e Soluções

### Problema: "Cannot find module"
**Solução:**
```bash
pnpm install
pnpm prisma generate
```

### Problema: "Prisma Client out of sync"
**Solução:**
```bash
pnpm prisma generate
```

### Problema: "Database connection error"
**Solução:**
```bash
# Verificar .env.local tem DATABASE_URL
# Rodar migrations
pnpm prisma db push
```

### Problema: "Admin não tem permissões"
**Solução:**
```bash
npx tsx scripts/setup-admin.ts
```

### Problema: "Usuário não existe"
**Solução:**
```bash
npx tsx scripts/create-admin.ts
npx tsx scripts/create-test-user.ts
```

---

## 📸 Screenshots Esperados

### 1. Listagem de Usuários
```
┌───────────────────────────────────────────────┐
│ Gestão de Usuários                 [+ Novo]   │
├───────────────────────────────────────────────┤
│ [🔍 Buscar...] [Tipo ▼] [Status ▼]          │
├───────────────────────────────────────────────┤
│ Nome    | Email          | Tipo    | Permissões│
│ Admin   | admin@...      | 👑Admin | Todas     │
│ Vendedor| vendedor@...   | 👤User  | 10        │
└───────────────────────────────────────────────┘
```

### 2. Edição de Permissões
```
┌───────────────────────────────────────────────┐
│ Permissões (15/44 selecionadas)               │
│ [🔍 Buscar...] [☑ Selecionar Todas]          │
├───────────────────────────────────────────────┤
│ ☑ Dashboard e Visualizações (2/3)            │
│   ☑ Visualizar Dashboard                      │
│   ☑ Visualizar Analytics                      │
│   ☐ Visualizar Relatórios                     │
├───────────────────────────────────────────────┤
│ ☐ Vendas (0/6)                                │
│   ☐ Criar Vendas                              │
│   ☐ Visualizar Todas as Vendas               │
│   ...                                          │
└───────────────────────────────────────────────┘
```

---

## ✨ Dicas de Teste

1. **Teste com 2 navegadores**
   - Chrome: Admin logado
   - Firefox: Vendedor logado
   - Compare o que cada um vê

2. **Use React DevTools**
   - Inspecione props do PermissionsManager
   - Veja estado do selectedPermissions

3. **Console do Browser**
   - Network tab para ver chamadas API
   - Console para ver logs de permissões

4. **Prisma Studio**
   ```bash
   npx prisma studio
   ```
   - Ver dados do banco em tempo real
   - Verificar permissões salvas

---

## 🎯 Resultado Esperado

Ao final dos testes, você deve conseguir:

✅ Criar/editar usuários como admin
✅ Atribuir permissões individualmente
✅ Usar busca e filtros
✅ Selecionar/desmarcar em massa
✅ Salvar e persistir mudanças
✅ Login com diferentes níveis de acesso
✅ Ver restrições sendo aplicadas

---

## 📊 Métricas de Sucesso

- **Performance:** Página carrega em < 2s
- **Usabilidade:** Consegue atribuir permissões em < 30s
- **Funcionalidade:** 100% das features funcionando
- **Bugs:** 0 erros no console
- **UX:** Interface intuitiva e responsiva

---

**Status:** ✅ Sistema pronto para teste completo!

**Servidor:** http://localhost:3001

**Começar:** http://localhost:3001/login
