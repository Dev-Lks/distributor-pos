# 🗑️ Deletar Usuários - Documentação

## ✅ Implementação Completa

A funcionalidade de deletar usuários foi implementada com dois níveis de segurança:

1. **Soft Delete (Desativar)** - Recomendado ✅
2. **Hard Delete (Permanente)** - Apenas sem dados associados ⚠️

---

## 📋 Funcionalidades Implementadas

### 1. Soft Delete (Desativação) - Padrão

**O que faz:**
- Altera status do usuário para `INACTIVE`
- Preserva todos os dados históricos
- Impede login no sistema
- Pode ser revertido a qualquer momento

**API:** `DELETE /api/users/[id]`

**Proteções:**
- ✅ Apenas administradores
- ✅ Não pode deletar a si mesmo
- ✅ Mantém integridade dos dados

**Quando usar:**
- Usuário saiu da empresa
- Suspensão temporária
- Manutenção de histórico
- 99% dos casos ✅

### 2. Hard Delete (Permanente) - Cuidado!

**O que faz:**
- Remove o usuário completamente do banco
- Apaga todas as permissões e vinculações
- Ação irreversível ⚠️

**API:** `DELETE /api/users/[id]/permanent`

**Proteções:**
- ✅ Apenas administradores
- ✅ Não pode deletar a si mesmo
- ✅ **Bloqueia se houver dados associados:**
  - Vendas criadas
  - Sessões de caixa
  - Movimentações de estoque
  - Pedidos criados

**Quando usar:**
- Usuário criado por engano (sem dados)
- Conta teste sem histórico
- Solicitação de LGPD (direito ao esquecimento)
- Raramente necessário ⚠️

---

## 🎨 Interface do Usuário

### Página de Listagem (`/dashboard/admin/users`)

**Botões disponíveis:**
```
┌─────────────────────────────────────────────────┐
│ Usuário         | Status  | Ações              │
├─────────────────────────────────────────────────┤
│ João Silva      | Ativo   | [Editar] [Desativar] [Deletar] │
│ Maria Santos    | Inativo | [Editar] [Ativar]              │
└─────────────────────────────────────────────────┘
```

**Regras de exibição:**
- ✅ Botão "Deletar" aparece apenas para usuários **não inativos**
- ✅ Usuários já inativos não mostram botão "Deletar"
- ✅ Botão em vermelho para destacar ação destrutiva

### Dialog de Confirmação

**Ao clicar em "Deletar":**
```
╔═══════════════════════════════════════════════════╗
║  ⚠️ Desativar Usuário                             ║
╟───────────────────────────────────────────────────╢
║                                                   ║
║  Tem certeza que deseja desativar o usuário      ║
║  João Silva?                                      ║
║                                                   ║
║  ⚠️ Atenção:                                      ║
║  • O usuário não poderá mais fazer login         ║
║  • Todas as permissões serão mantidas            ║
║  • Os dados históricos serão preservados         ║
║  • Você pode reativar o usuário a qualquer momento║
║                                                   ║
║  Esta ação não apaga os dados, apenas desativa   ║
║  o acesso ao sistema.                            ║
║                                                   ║
║           [Cancelar]  [Sim, Desativar]           ║
╚═══════════════════════════════════════════════════╝
```

---

## 🔧 Componentes Criados

### 1. `DeleteUserDialog.tsx`

**Localização:** `components/admin/DeleteUserDialog.tsx`

**Props:**
```typescript
interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  isPending?: boolean;
}
```

**Características:**
- Dialog de confirmação com AlertDialog
- Visual em vermelho (ação destrutiva)
- Informações claras sobre o que acontecerá
- Loading state durante a operação
- Mensagens de aviso detalhadas

---

## 🔌 APIs Implementadas

### 1. Soft Delete (Desativar)

**Endpoint:** `DELETE /api/users/[id]`

**Autenticação:** Bearer Token (session)

**Permissões:** `isAdmin: true`

**Request:**
```bash
DELETE /api/users/clx123abc
```

**Response Success (200):**
```json
{
  "message": "Usuário desativado com sucesso"
}
```

**Response Error (400) - Tentou deletar a si mesmo:**
```json
{
  "error": "Você não pode desativar sua própria conta"
}
```

**Response Error (403) - Sem permissão:**
```json
{
  "error": "Não autorizado"
}
```

### 2. Hard Delete (Permanente)

**Endpoint:** `DELETE /api/users/[id]/permanent`

**Autenticação:** Bearer Token (session)

**Permissões:** `isAdmin: true`

**Request:**
```bash
DELETE /api/users/clx123abc/permanent
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Usuário deletado permanentemente com sucesso"
}
```

**Response Error (400) - Possui dados:**
```json
{
  "error": "Este usuário possui vendas, movimentações ou outros dados associados...",
  "details": {
    "salesCreated": 45,
    "cashSessions": 12,
    "inventoryMovements": 23,
    "ordersCreated": 8
  }
}
```

**Response Error (404):**
```json
{
  "error": "Usuário não encontrado"
}
```

---

## 🔐 Segurança e Validações

### Validações Implementadas

#### Soft Delete:
1. ✅ Verificar autenticação
2. ✅ Verificar se é admin
3. ✅ Não permitir deletar a si mesmo
4. ✅ Atualizar status para INACTIVE

#### Hard Delete:
1. ✅ Verificar autenticação
2. ✅ Verificar se é admin
3. ✅ Não permitir deletar a si mesmo
4. ✅ Verificar se usuário existe
5. ✅ **Verificar se possui dados associados**
6. ✅ Bloquear se tiver vendas/movimentações
7. ✅ Executar delete em cascade

### Proteções de Integridade

**Bloqueios implementados:**
- Não pode deletar usuário com vendas
- Não pode deletar usuário com sessões de caixa
- Não pode deletar usuário com movimentações
- Não pode deletar usuário com pedidos

**Por que?**
- Preserva histórico de auditoria
- Mantém integridade referencial
- Evita quebra de relatórios
- Atende requisitos legais

---

## 📊 Fluxo de Trabalho

### Desativar Usuário (Recomendado)

```
1. Admin acessa /dashboard/admin/users
2. Encontra usuário na lista
3. Clica em "Deletar" (botão vermelho)
4. Dialog de confirmação aparece
5. Admin lê os avisos
6. Clica em "Sim, Desativar"
7. API desativa o usuário
8. Status muda para INACTIVE
9. Toast de sucesso aparece
10. Lista atualiza automaticamente
✅ Usuário não pode mais fazer login
✅ Dados históricos preservados
```

### Reativar Usuário

```
1. Admin acessa /dashboard/admin/users
2. Filtra por status "Inativo"
3. Encontra usuário desativado
4. Clica em "Ativar"
5. API reativa o usuário
6. Status muda para ACTIVE
✅ Usuário pode fazer login novamente
```

### Deletar Permanentemente (Raramente)

```
1. Admin identifica necessidade (LGPD, erro, etc)
2. Verifica se usuário não tem dados associados
3. Faz requisição para API /permanent
4. API valida e bloqueia se houver dados
5. Se não houver dados, deleta permanentemente
⚠️ Ação irreversível!
```

---

## 🧪 Como Testar

### 1. Testar Soft Delete (Desativar)

```bash
# 1. Fazer login como admin
Email: admin@nitrobeer.com
Senha: admin123

# 2. Criar usuário teste
→ /dashboard/admin/users
→ Clicar "Novo Usuário"
→ Preencher: "Usuário Teste" / teste@email.com
→ Criar

# 3. Desativar usuário
→ Na lista, clicar "Deletar" no usuário teste
→ Ler mensagens do dialog
→ Confirmar "Sim, Desativar"
→ Verificar toast de sucesso
→ Ver status mudou para "Inativo"

# 4. Tentar fazer login com usuário desativado
→ Logout
→ Login: teste@email.com
→ Deve falhar (usuário inativo)

# 5. Reativar usuário
→ Login como admin
→ /dashboard/admin/users
→ Filtrar por "Inativo"
→ Clicar "Ativar"
→ Verificar status volta para "Ativo"
```

### 2. Testar Hard Delete (API)

```bash
# Usando curl ou Postman

# Tentar deletar usuário COM dados (deve falhar)
DELETE http://localhost:3000/api/users/<ID_COM_VENDAS>/permanent

# Resposta esperada:
{
  "error": "Este usuário possui vendas...",
  "details": {
    "salesCreated": 10,
    ...
  }
}

# Deletar usuário SEM dados (deve suceder)
DELETE http://localhost:3000/api/users/<ID_SEM_DADOS>/permanent

# Resposta esperada:
{
  "success": true,
  "message": "Usuário deletado permanentemente com sucesso"
}
```

### 3. Testar Proteções

```bash
# Tentar deletar a si mesmo (deve falhar)
DELETE /api/users/<SEU_ID>

# Resposta:
{
  "error": "Você não pode desativar sua própria conta"
}

# Tentar deletar sem ser admin (deve falhar)
→ Login como usuário comum
→ Não deve ver botão "Deletar"
→ Se tentar via API: 403 Forbidden
```

---

## 📈 Melhorias Futuras (Sugestões)

### 1. Confirmação Extra para Hard Delete
```typescript
// Adicionar campo de confirmação manual
"Digite 'DELETAR' para confirmar"
```

### 2. Logs de Auditoria
```typescript
// Registrar quem deletou, quando e por quê
await prisma.auditLog.create({
  data: {
    action: 'USER_DELETED',
    userId: session.user.id,
    targetId: deletedUserId,
    reason: 'Usuário solicitou LGPD',
  }
});
```

### 3. Soft Delete com Data de Exclusão
```typescript
// Agendar exclusão permanente após X dias
deletedAt: new Date(),
permanentDeleteAt: add(new Date(), { days: 30 })
```

### 4. Exportar Dados Antes de Deletar
```typescript
// Gerar backup dos dados do usuário
// Para atender LGPD e ter registro
```

---

## 🎯 Boas Práticas

### ✅ Recomendações

1. **Sempre use Soft Delete** (desativar)
2. **Hard Delete apenas em casos extremos**
3. **Documente o motivo** da exclusão
4. **Faça backup antes** de deletar permanentemente
5. **Comunique o usuário** sobre a desativação
6. **Revise periodicamente** usuários inativos

### ⚠️ Avisos

1. **Nunca delete usuários com vendas**
2. **Não delete administradores ativos**
3. **Verifique dependências antes**
4. **Teste em ambiente de dev primeiro**
5. **Tenha backups atualizados**

---

## 📝 Checklist de Implementação

- [x] API de soft delete (desativar)
- [x] API de hard delete (permanente)
- [x] Componente DeleteUserDialog
- [x] Botão "Deletar" na listagem
- [x] Dialog de confirmação
- [x] Proteção: não deletar a si mesmo
- [x] Proteção: verificar dados associados
- [x] Validação de permissões (admin only)
- [x] Toast notifications
- [x] Invalidação de cache (React Query)
- [x] Documentação completa
- [x] Testes manuais realizados

---

## 🎉 Conclusão

A funcionalidade de deletar usuários está **100% implementada** com segurança e boas práticas!

**Características principais:**
✅ Soft delete como padrão (desativar)
✅ Hard delete com proteções
✅ Dialog de confirmação claro
✅ Validações robustas
✅ Preservação de dados históricos
✅ Interface intuitiva
✅ Feedback visual adequado

**Pronto para uso em produção! 🚀**

---

*Documentação criada em: 06/10/2025*
