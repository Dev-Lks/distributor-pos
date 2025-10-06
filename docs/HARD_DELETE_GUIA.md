# 🗑️ Hard Delete de Usuários - Guia Completo

## ⚠️ ATENÇÃO: Ação Irreversível

O **hard delete** remove o usuário **PERMANENTEMENTE** do banco de dados. Use com extrema cautela!

---

## 📍 Onde Encontrar

### Página de Edição do Usuário

**Rota:** `/dashboard/admin/users/[id]`

**Localização:** Seção "Zona de Perigo" no final da página

```
┌──────────────────────────────────────────────────┐
│ 📋 Informações Básicas                           │
│ [campos do formulário]                           │
├──────────────────────────────────────────────────┤
│ 🔐 Permissões                                    │
│ [gerenciador de permissões]                      │
├──────────────────────────────────────────────────┤
│ 🔑 [Resetar Senha]     [Cancelar] [Salvar]      │
├──────────────────────────────────────────────────┤
│ ⚠️ ZONA DE PERIGO                                │
│ Deletar permanentemente apaga todos os dados     │
│              [🗑️ Deletar Permanentemente]        │
└──────────────────────────────────────────────────┘
```

---

## 🎯 Como Funciona

### 1. Visual da Interface

**"Zona de Perigo":**
- Fundo vermelho claro
- Borda vermelha
- Título em destaque
- Aviso sobre irreversibilidade
- Botão vermelho escuro

### 2. Dialog de Confirmação Extra

Ao clicar em "Deletar Permanentemente", aparece um dialog detalhado:

```
╔════════════════════════════════════════════════════╗
║ 🗑️ DELETAR PERMANENTEMENTE USUÁRIO                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║ ⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!                    ║
║                                                    ║
║ Você está prestes a deletar PERMANENTEMENTE:      ║
║ ┌────────────────────────────────────────┐        ║
║ │ João Silva                             │        ║
║ │ joao@email.com                         │        ║
║ └────────────────────────────────────────┘        ║
║                                                    ║
║ ⚠️ USUÁRIO POSSUI DADOS ASSOCIADOS                ║
║ • 45 vendas criadas                               ║
║ • 12 sessões de caixa                             ║
║ • 23 movimentações de estoque                     ║
║ • 8 pedidos criados                               ║
║                                                    ║
║ ⚠️ A API bloqueará esta operação!                 ║
║                                                    ║
║ Esta ação irá:                                    ║
║ × Apagar o usuário do banco de dados              ║
║ × Remover permissões e vinculações                ║
║ × Não pode ser revertida                          ║
║ × Quebrar histórico se houver vendas              ║
║                                                    ║
║ 💡 Recomendação: Use a desativação (soft delete)  ║
║                                                    ║
║ Para confirmar, digite DELETAR abaixo:            ║
║ [________________________]                         ║
║                                                    ║
║        [Cancelar]  [Deletar Permanentemente]      ║
╚════════════════════════════════════════════════════╝
```

### 3. Proteções Implementadas

**No Dialog:**
- ✅ Exibe dados associados (se houver)
- ✅ Campo de confirmação manual (digitar "DELETAR")
- ✅ Botão desabilitado até confirmar
- ✅ Aviso sobre consequências
- ✅ Recomendação de usar soft delete

**Na API:**
- ✅ Verifica se é administrador
- ✅ Não permite deletar a si mesmo
- ✅ **Bloqueia se houver vendas**
- ✅ **Bloqueia se houver sessões de caixa**
- ✅ **Bloqueia se houver movimentações**
- ✅ **Bloqueia se houver pedidos**

---

## 🔧 Detalhes Técnicos

### API Endpoint

**Rota:** `DELETE /api/users/[id]/permanent`

**Permissões:** Apenas administradores

**Fluxo:**
1. Verifica autenticação
2. Verifica se é admin
3. Verifica se não está deletando a si mesmo
4. Busca dados do usuário + counts
5. **Verifica se possui dados associados**
6. Se tiver dados → **BLOQUEIA com erro 400**
7. Se não tiver dados → Deleta permanentemente

**Resposta Success (200):**
```json
{
  "success": true,
  "message": "Usuário deletado permanentemente com sucesso"
}
```

**Resposta Error - Possui Dados (400):**
```json
{
  "error": "Este usuário possui vendas, movimentações ou outros dados associados. Por segurança, não é possível deletar permanentemente. Use a desativação ao invés disso.",
  "details": {
    "salesCreated": 45,
    "cashSessions": 12,
    "inventoryMovements": 23,
    "ordersCreated": 8
  }
}
```

**Resposta Error - Tentou deletar a si mesmo (400):**
```json
{
  "error": "Você não pode deletar sua própria conta"
}
```

---

## 📊 Fluxo Completo

### Cenário 1: Usuário SEM Dados (Sucesso)

```
1. Admin acessa /dashboard/admin/users/[id]
2. Rola até "Zona de Perigo"
3. Clica "Deletar Permanentemente"
4. Dialog abre
5. Lê avisos (não mostra dados associados)
6. Digita "DELETAR" no campo
7. Botão é habilitado
8. Clica "Deletar Permanentemente"
9. API processa e deleta
10. Toast: "Usuário deletado permanentemente!"
11. Redireciona para /dashboard/admin/users
✅ Usuário removido do sistema
```

### Cenário 2: Usuário COM Dados (Bloqueado)

```
1. Admin acessa /dashboard/admin/users/[id]
2. Rola até "Zona de Perigo"
3. Clica "Deletar Permanentemente"
4. Dialog abre
5. Vê avisos em AMARELO sobre dados:
   ⚠️ USUÁRIO POSSUI DADOS ASSOCIADOS
   • 45 vendas criadas
   • 12 sessões de caixa
   • 23 movimentações de estoque
   • 8 pedidos criados
   
   ⚠️ A API bloqueará esta operação!
6. Digita "DELETAR" (mesmo assim)
7. Clica "Deletar Permanentemente"
8. API retorna erro 400
9. Toast de erro com mensagem
❌ Operação bloqueada - Use soft delete
```

### Cenário 3: Admin Tenta Deletar a Si Mesmo (Bloqueado)

```
1. Admin edita sua própria conta
2. Tenta deletar permanentemente
3. API bloqueia imediatamente
4. Toast: "Você não pode deletar sua própria conta"
❌ Operação bloqueada
```

---

## 🧪 Como Testar

### Teste 1: Deletar Usuário Sem Dados

```bash
# 1. Criar usuário teste
→ /dashboard/admin/users
→ Criar "Teste Hard Delete" / teste-hard@email.com
→ Não criar vendas/movimentações

# 2. Editar usuário
→ Clicar "Editar" no usuário teste
→ Ir até "Zona de Perigo"

# 3. Deletar permanentemente
→ Clicar "Deletar Permanentemente"
→ Ver dialog de confirmação
→ Verificar que NÃO mostra dados associados
→ Digitar "DELETAR"
→ Confirmar

# 4. Verificar resultado
✅ Toast: "Usuário deletado permanentemente!"
✅ Redirecionado para listagem
✅ Usuário sumiu da lista
✅ Não pode mais fazer login
```

### Teste 2: Tentar Deletar Usuário Com Dados

```bash
# 1. Usar usuário existente com vendas
→ Editar usuário que já criou vendas
→ Ir até "Zona de Perigo"

# 2. Tentar deletar
→ Clicar "Deletar Permanentemente"
→ Ver dialog com AVISOS AMARELOS
→ Ver lista de dados associados
→ Ler: "A API bloqueará esta operação!"

# 3. Confirmar mesmo assim (para testar)
→ Digitar "DELETAR"
→ Confirmar

# 4. Verificar resultado
❌ Toast de erro com detalhes
❌ Usuário ainda existe
💡 Mensagem recomenda usar soft delete
```

### Teste 3: Admin Tentar Deletar a Si Mesmo

```bash
# 1. Login como admin
→ admin@nitrobeer.com

# 2. Editar própria conta
→ Encontrar seu usuário na lista
→ Clicar "Editar"

# 3. Tentar deletar
→ Rolar até "Zona de Perigo"
→ Clicar "Deletar Permanentemente"
→ Confirmar no dialog

# 4. Verificar resultado
❌ Toast: "Você não pode deletar sua própria conta"
❌ Operação bloqueada pela API
```

---

## ⚖️ Quando Usar Cada Tipo

### Soft Delete (Desativar) - USE ISTO! ✅

**Quando usar:**
- ✅ Usuário saiu da empresa
- ✅ Suspensão temporária ou definitiva
- ✅ Manter histórico de auditoria
- ✅ Preservar integridade de vendas/movimentações
- ✅ 99% dos casos
- ✅ Pode ser revertido

**Como fazer:**
- Na listagem: botão "Desativar"
- Ou mude status para "INACTIVE" na edição

### Hard Delete (Permanente) - CUIDADO! ⚠️

**Quando usar:**
- ⚠️ Conta criada por engano (sem dados)
- ⚠️ Conta teste em ambiente de dev
- ⚠️ Solicitação LGPD (direito ao esquecimento)
- ⚠️ Apenas se NÃO houver dados associados
- ⚠️ Raramente necessário

**Como fazer:**
- Editar usuário → "Zona de Perigo" → "Deletar Permanentemente"
- Confirmar digitando "DELETAR"

---

## 🎨 Componentes Implementados

### 1. HardDeleteUserDialog

**Localização:** `components/admin/HardDeleteUserDialog.tsx`

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  userEmail: string;
  isPending?: boolean;
  hasData?: {
    salesCreated: number;
    cashSessions: number;
    inventoryMovements: number;
    ordersCreated: number;
  };
}
```

**Características:**
- Dialog extra grande (max-w-2xl)
- Múltiplos avisos coloridos
- Campo de confirmação manual
- Exibe dados associados se houver
- Loading state durante operação
- Visual destrutivo (vermelho)

### 2. Zona de Perigo na Página

**Localização:** `app/(app)/dashboard/admin/users/[id]/page.tsx`

**Características:**
- Seção separada no final do formulário
- Fundo vermelho claro
- Borda vermelha
- Texto explicativo
- Botão vermelho escuro
- Só aparece na edição (não na criação)

---

## 📈 Melhorias Futuras

### 1. Log de Auditoria
```typescript
// Registrar quem deletou e quando
await prisma.auditLog.create({
  data: {
    action: 'USER_HARD_DELETED',
    performedBy: session.user.id,
    targetId: deletedUserId,
    reason: confirmationReason,
  }
});
```

### 2. Backup Antes de Deletar
```typescript
// Gerar backup automático dos dados
const backup = await exportUserData(userId);
await saveBackup(backup);
```

### 3. Período de Retenção
```typescript
// Marcar para deleção após X dias
await prisma.user.update({
  data: {
    status: 'PENDING_DELETE',
    scheduledDeleteAt: add(new Date(), { days: 30 })
  }
});
```

### 4. Confirmar com Senha
```typescript
// Pedir senha do admin para confirmar
<Input type="password" placeholder="Digite sua senha para confirmar" />
```

---

## 📋 Checklist de Implementação

- [x] Componente HardDeleteUserDialog
- [x] Zona de Perigo na página de edição
- [x] Botão "Deletar Permanentemente"
- [x] API de hard delete com proteções
- [x] Campo de confirmação manual ("DELETAR")
- [x] Exibir dados associados no dialog
- [x] Bloqueio na API se houver dados
- [x] Não permitir deletar a si mesmo
- [x] Toast notifications
- [x] Redirecionamento após deletar
- [x] Loading states
- [x] Documentação completa

---

## 🎉 Conclusão

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║  ✅ HARD DELETE - 100% IMPLEMENTADO! ✅          ║
║                                                  ║
║  • Interface na "Zona de Perigo"                ║
║  • Dialog com confirmação extra                 ║
║  • Campo manual "DELETAR"                       ║
║  • Exibe dados associados                       ║
║  • API bloqueia se houver dados                 ║
║  • Múltiplas proteções                          ║
║  • Visual destrutivo claro                      ║
║                                                  ║
║  ⚠️ USE COM EXTREMA CAUTELA! ⚠️                 ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

**Principais características:**
- ✅ Confirmação manual digitando "DELETAR"
- ✅ Exibe dados associados se houver
- ✅ Bloqueia na API se tiver vendas/movimentações
- ✅ Não pode deletar a si mesmo
- ✅ Visual em vermelho (zona de perigo)
- ✅ Múltiplos avisos sobre irreversibilidade
- ✅ Recomenda usar soft delete

**⚠️ RECOMENDAÇÃO FINAL:**

**Use SEMPRE o soft delete (desativar) ao invés do hard delete!**

O hard delete deve ser usado apenas em casos extremíssimos onde:
1. Usuário foi criado por engano
2. Não possui nenhum dado no sistema
3. Solicitação legal (LGPD)

Em 99% dos casos, a desativação é suficiente e mais segura!

---

**Data:** 06/10/2025  
**Status:** ✅ Completo  
**Pronto para uso:** Sim, com cautela! ⚠️
