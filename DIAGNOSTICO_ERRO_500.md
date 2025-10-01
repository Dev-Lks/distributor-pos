# 🔧 DIAGNÓSTICO: Erro 500 nas APIs

## 🎯 PROBLEMA IDENTIFICADO

O erro **NÃO** está nas APIs novas que criamos. O HAR mostra:

```json
{
  "url": "https://www.nitrobeer.com.br/api/inventory",
  "status": 500,
  "response": {"error":"Failed to update inventory"}
}
```

### Análise:
1. ❌ **Erro está em PRODUÇÃO** (Vercel: www.nitrobeer.com.br)
2. ❌ **API afetada:** `/api/inventory` (POST) - **API ANTIGA** 
3. ✅ **As novas APIs** (`/api/analytics/*`) **ainda não foram deployadas**

---

## 🔍 CAUSA PROVÁVEL

O erro na API `/api/inventory` está acontecendo porque:

### Opção 1: Prisma Client Desatualizado
O schema do Prisma foi modificado mas o client não foi regenerado em produção:
```bash
prisma generate
```

### Opção 2: Erro na Query do Prisma
A query está tentando acessar campos que não existem no banco de produção.

### Opção 3: Variável de Ambiente
`DATABASE_URL` em produção pode estar incorreta ou o banco inacessível.

---

## ✅ SOLUÇÃO RÁPIDA

### 1. Regenerar Prisma Client (Local)
```powershell
pnpm prisma generate
```

### 2. Fazer novo Deploy para Vercel
```powershell
git add .
git commit -m "fix: regenerate prisma client and add analytics APIs"
git push origin main
```

### 3. Verificar Variáveis de Ambiente no Vercel
- Acessar: https://vercel.com/dashboard
- Ir em: **Settings → Environment Variables**
- Verificar: `DATABASE_URL` está correta

---

## 🧪 TESTAR AS NOVAS APIs LOCALMENTE

### Iniciar servidor local:
```powershell
pnpm dev
```

### Testar cada API:

#### 1. Top Products
```powershell
curl http://localhost:3000/api/analytics/top-products?period=today
```

#### 2. Stock Alerts
```powershell
curl http://localhost:3000/api/analytics/stock-alerts
```

#### 3. Recent Activity
```powershell
curl http://localhost:3000/api/analytics/recent-activity?limit=10
```

#### 4. Team Performance
```powershell
curl http://localhost:3000/api/analytics/team-performance?period=today
```

#### 5. Upcoming Events
```powershell
curl http://localhost:3000/api/analytics/upcoming-events?days=7
```

---

## 🚨 IMPORTANTE

### As APIs novas NÃO estão causando o erro!

O erro é na API **antiga** `/api/inventory` que já existia. Isso significa:

1. ✅ **As novas APIs estão OK** (não deployadas ainda)
2. ❌ **A API antiga tem um bug** (já estava quebrada antes)
3. 🔧 **Precisa fazer deploy** das novas APIs + fix da antiga

---

## 🛠️ FIX COMPLETO

### Passo 1: Regenerar Prisma
```powershell
pnpm prisma generate
```

### Passo 2: Build local para testar
```powershell
pnpm build
```

### Passo 3: Se build OK, fazer deploy
```powershell
git add .
git commit -m "fix: prisma client + add analytics APIs"
git push origin main
```

### Passo 4: Aguardar deploy no Vercel (2-3 min)

### Passo 5: Testar em produção
```
https://www.nitrobeer.com.br/api/analytics/top-products?period=today
```

---

## 📊 STATUS DAS APIs

### APIs Novas (✅ Criadas, ❌ Não deployadas)
- [ ] `/api/analytics/top-products`
- [ ] `/api/analytics/stock-alerts`
- [ ] `/api/analytics/recent-activity`
- [ ] `/api/analytics/team-performance`
- [ ] `/api/analytics/upcoming-events`

### APIs Antigas (❌ Com erro 500)
- [x] `/api/inventory` (POST) - **QUEBRADA EM PRODUÇÃO**

---

## 🎯 PRÓXIMOS PASSOS

1. Execute: `pnpm prisma generate`
2. Execute: `pnpm build` (para testar)
3. Se OK: `git push` para deployar
4. Aguarde Vercel fazer deploy
5. Teste as novas APIs em produção

---

**🍺 As novas APIs estão prontas, só precisam ser deployadas!**
