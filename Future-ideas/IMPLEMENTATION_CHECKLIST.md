# ✅ Checklist de Implementação Multi-Tenant

Use este checklist para acompanhar o progresso da transformação em SaaS.

---

## 🎯 PRÉ-REQUISITOS

- [ ] Decisão tomada: Vai transformar em SaaS? ✅
- [ ] Escolheu o nome do domínio (ex: `nitrobeer.app`, `poscraft.com.br`)
- [ ] Registrou o domínio
- [ ] Conta no Stripe criada (modo test)
- [ ] Definiu os planos e preços finais
- [ ] Tem pelo menos 3 meses de runway (custos cobertos)

---

## 📦 FASE 1: INFRAESTRUTURA (Semana 1-2)

### Database & Schema

- [ ] Backup completo do banco atual
- [ ] Criar modelo `Tenant` no schema.prisma
- [ ] Adicionar `tenantId` em TODOS os modelos existentes:
  - [ ] User
  - [ ] Product
  - [ ] Inventory
  - [ ] Sale
  - [ ] Customer
  - [ ] PointOfSale
  - [ ] CashSession
  - [ ] PendingCart
  - [ ] DailyReport
  - [ ] SaleItem
  - [ ] SalePayment
  - [ ] ProductPointOfSale
  - [ ] CustomerBonification
  - [ ] (verificar se não esqueceu nenhum)

- [ ] Adicionar índices em `tenantId`
- [ ] Atualizar `@@unique` constraints para incluir `tenantId`
- [ ] Gerar migration: `prisma migrate dev --name add-multi-tenant`
- [ ] Testar migration em ambiente de dev

### Tenant Utilities

- [ ] Criar `lib/tenant.ts` com funções:
  - [ ] `getTenantIdFromRequest()`
  - [ ] `extractSubdomain()`
  - [ ] `checkTenantLimits()`
  - [ ] `incrementTenantUsage()`
  - [ ] `validateTenantAction()`
  - [ ] `hasFeature()`

- [ ] Criar `lib/prisma-tenant.ts` para client com filtro automático

### Middleware

- [ ] Atualizar `middleware.ts` para detectar subdomain
- [ ] Testar detecção de tenant via subdomain
- [ ] Adicionar fallback para query param (dev mode)
- [ ] Configurar DNS wildcard (*.seudominio.com)

---

## 🔐 FASE 2: AUTENTICAÇÃO (Semana 2-3)

### NextAuth

- [ ] Adicionar `tenantId` ao modelo User
- [ ] Atualizar `lib/auth.ts` callbacks:
  - [ ] JWT callback incluir tenantId
  - [ ] Session callback incluir tenantId
  - [ ] Adicionar role OWNER

- [ ] Atualizar `types/next-auth.d.ts`
- [ ] Testar login com tenant

### Login Multi-tenant

- [ ] Criar `app/(auth)/[tenant]/login/page.tsx`
- [ ] Validar se tenant existe antes do login
- [ ] Mostrar logo do tenant na tela de login
- [ ] Bloquear login se tenant suspenso
- [ ] Redirecionar para subdomain correto após login

---

## 🔧 FASE 3: ATUALIZAR APIs (Semana 3-5)

**Para CADA endpoint de API, fazer:**

### Produtos
- [ ] GET `/api/products` - filtrar por tenantId
- [ ] POST `/api/products` - incluir tenantId, verificar limites
- [ ] PATCH `/api/products` - verificar ownership
- [ ] DELETE `/api/products` - verificar ownership

### Vendas
- [ ] GET `/api/sales` - filtrar por tenantId
- [ ] POST `/api/sales` - incluir tenantId, verificar limites
- [ ] PATCH `/api/sales/[id]` - verificar ownership
- [ ] DELETE `/api/sales/[id]` - verificar ownership

### Clientes
- [ ] GET `/api/customers` - filtrar por tenantId
- [ ] POST `/api/customers` - incluir tenantId
- [ ] PATCH `/api/customers` - verificar ownership
- [ ] DELETE `/api/customers` - verificar ownership

### Inventário
- [ ] GET `/api/inventory` - filtrar por tenantId
- [ ] POST `/api/inventory` - incluir tenantId
- [ ] PATCH `/api/inventory` - verificar ownership
- [ ] POST `/api/inventory/transfer` - verificar ownership

### Pontos de Venda
- [ ] GET `/api/points` - filtrar por tenantId
- [ ] POST `/api/points` - incluir tenantId, verificar limites
- [ ] PATCH `/api/points` - verificar ownership
- [ ] DELETE `/api/points` - verificar ownership

### Caixa
- [ ] GET `/api/cash-sessions` - filtrar por tenantId
- [ ] POST `/api/cash-sessions` - incluir tenantId
- [ ] PATCH `/api/cash-sessions` - verificar ownership

### Relatórios
- [ ] GET `/api/reports/daily` - filtrar por tenantId
- [ ] POST `/api/reports/daily` - incluir tenantId

### Outros
- [ ] Atualizar TODOS os outros endpoints
- [ ] Revisar código de hooks (useProducts, useSales, etc)
- [ ] Adicionar error handling consistente

---

## 💳 FASE 4: BILLING (Semana 5-7)

### Stripe Setup

- [ ] Criar produtos no Stripe:
  - [ ] Starter - R$ 97/mês
  - [ ] Business - R$ 297/mês
  - [ ] Enterprise - R$ 897/mês
  - [ ] Versões anuais (com desconto)

- [ ] Configurar webhooks no Stripe
- [ ] Criar `app/api/webhooks/stripe/route.ts`
- [ ] Implementar handlers para:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`

### Billing Pages

- [ ] Criar `app/[tenant]/billing/page.tsx`
- [ ] Mostrar plano atual
- [ ] Botão de upgrade/downgrade
- [ ] Histórico de faturas
- [ ] Método de pagamento
- [ ] Cancelar assinatura

### Limite de Uso

- [ ] Implementar verificação de limites em TODAS as ações
- [ ] Mostrar banner quando próximo do limite
- [ ] Bloquear ações quando limite atingido
- [ ] Sugerir upgrade automaticamente

---

## 🎨 FASE 5: ONBOARDING (Semana 7-8)

### Signup Flow

- [ ] Criar `app/signup/page.tsx`
- [ ] Form de registro:
  - [ ] Nome da empresa
  - [ ] Slug (validar unicidade)
  - [ ] Nome do responsável
  - [ ] Email
  - [ ] Senha
  - [ ] Telefone (opcional)
  - [ ] CNPJ (opcional)

- [ ] Validar disponibilidade de slug em real-time
- [ ] Criar tenant + usuário OWNER automaticamente
- [ ] Enviar email de boas-vindas
- [ ] Redirecionar para subdomain do tenant

### Setup Wizard

- [ ] Criar `app/[tenant]/setup/page.tsx`
- [ ] Passo 1: Perfil da empresa (logo, cores)
- [ ] Passo 2: Primeiro ponto de venda
- [ ] Passo 3: Importar produtos (template CSV)
- [ ] Passo 4: Convidar equipe
- [ ] Passo 5: Tutorial interativo
- [ ] Marcar onboarding como completo

### Email Templates

- [ ] Template: Boas-vindas
- [ ] Template: Convite de usuário
- [ ] Template: Trial ending (7 dias antes)
- [ ] Template: Trial ended
- [ ] Template: Pagamento confirmado
- [ ] Template: Pagamento falhou
- [ ] Template: Nota fiscal

---

## 🎯 FASE 6: LANDING PAGE (Semana 8-9)

### Marketing Site

- [ ] Criar `app/(marketing)/page.tsx`
- [ ] Hero section com CTA claro
- [ ] Seção de features
- [ ] Seção de pricing
- [ ] Depoimentos (casos de sucesso)
- [ ] FAQ
- [ ] Footer com links

### Páginas Adicionais

- [ ] `/pricing` - Comparação de planos
- [ ] `/about` - Sobre você/empresa
- [ ] `/contact` - Formulário de contato
- [ ] `/terms` - Termos de serviço
- [ ] `/privacy` - Política de privacidade
- [ ] `/blog` - Blog (opcional)

### SEO

- [ ] Meta tags otimizadas
- [ ] Open Graph para redes sociais
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Google Analytics
- [ ] Google Search Console

---

## 👨‍💼 FASE 7: ADMIN DASHBOARD (Semana 9-10)

### Super Admin

- [ ] Criar `app/admin/page.tsx` (só você acessa)
- [ ] Lista de todos os tenants
- [ ] Métricas globais:
  - [ ] MRR (Monthly Recurring Revenue)
  - [ ] Churn rate
  - [ ] Novos signups
  - [ ] Trials ativos
  - [ ] Conversão trial→paid

- [ ] Ações:
  - [ ] Suspender tenant
  - [ ] Alterar plano manualmente
  - [ ] Ver logs de um tenant
  - [ ] Impersonate (logar como cliente)

- [ ] Relatórios:
  - [ ] Receita por mês
  - [ ] Top clientes (por receita)
  - [ ] Churn analysis
  - [ ] Usage metrics

---

## 🧪 FASE 8: TESTES (Semana 10-11)

### Testes Manuais

- [ ] Criar tenant de teste
- [ ] Testar signup completo
- [ ] Testar login com tenant correto
- [ ] Tentar acessar dados de outro tenant (deve bloquear)
- [ ] Testar upgrade de plano
- [ ] Testar downgrade de plano
- [ ] Testar cancelamento
- [ ] Testar trial expirando
- [ ] Testar limites de uso
- [ ] Testar convite de usuário
- [ ] Testar todas as funcionalidades principais

### Testes Automatizados

- [ ] Unit tests para funções críticas
- [ ] Integration tests para APIs
- [ ] E2E tests para fluxos principais
- [ ] Load testing (simular múltiplos tenants)

### Security Audit

- [ ] Revisar TODAS as queries para ter tenantId
- [ ] Verificar SQL injection prevention
- [ ] Verificar XSS prevention
- [ ] Testar rate limiting
- [ ] Revisar permissões de roles
- [ ] Verificar data leakage entre tenants

---

## 🚀 FASE 9: DEPLOY & LAUNCH (Semana 11-12)

### Preparação

- [ ] Migrar banco de produção
- [ ] Configurar DNS wildcard
- [ ] Configurar SSL para subdomains
- [ ] Configurar variáveis de ambiente produção
- [ ] Configurar Stripe em modo live
- [ ] Configurar webhooks em produção
- [ ] Setup monitoring (Sentry, LogRocket)
- [ ] Criar backups automáticos

### Soft Launch

- [ ] Migrar NitroBeer (seu pai) para novo sistema
- [ ] Convidar 5 beta testers
- [ ] Coletar feedback por 2 semanas
- [ ] Iterar e corrigir bugs

### Public Launch

- [ ] Anunciar em redes sociais
- [ ] Postar em grupos relevantes
- [ ] Email para lista de interessados
- [ ] Press release (opcional)
- [ ] Product Hunt (opcional)

---

## 📊 FASE 10: OPERAÇÃO & CRESCIMENTO (Contínuo)

### Marketing

- [ ] Configurar Google Ads
- [ ] Configurar Facebook/Instagram Ads
- [ ] Criar conteúdo (blog posts, vídeos)
- [ ] SEO contínuo
- [ ] Programa de afiliados
- [ ] Parcerias estratégicas

### Suporte

- [ ] Configurar chat (Intercom, Crisp)
- [ ] Criar base de conhecimento
- [ ] FAQ automático
- [ ] Sistema de tickets
- [ ] SLA por plano

### Produto

- [ ] Coletar feedback continuamente
- [ ] Roadmap público
- [ ] Changelog
- [ ] Beta testing de novas features
- [ ] A/B testing

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Esta Semana:
1. [ ] Fazer backup do banco
2. [ ] Começar a modificar schema.prisma
3. [ ] Criar modelo Tenant
4. [ ] Gerar primeira migration

### Próxima Semana:
1. [ ] Adicionar tenantId em todos os modelos
2. [ ] Criar lib/tenant.ts
3. [ ] Atualizar middleware.ts
4. [ ] Testar detecção de tenant

### Em 2 Semanas:
1. [ ] Atualizar NextAuth
2. [ ] Começar a migrar APIs
3. [ ] Testar isolamento de dados

---

## 💡 DICAS IMPORTANTES

### ⚠️ CRÍTICO - Não esquecer:
- **SEMPRE** filtrar por tenantId em queries
- **SEMPRE** validar ownership antes de editar/deletar
- **SEMPRE** verificar limites antes de criar recursos
- **SEMPRE** logar ações críticas para auditoria

### 🐛 Bugs Comuns:
- Esquecer tenantId em alguma query
- Não validar se recurso pertence ao tenant
- Não verificar limites de uso
- Não lidar com trial expirado
- Não testar com múltiplos tenants simultaneamente

### ✅ Boas Práticas:
- Comitar frequentemente
- Testar cada API após modificar
- Documentar mudanças importantes
- Usar feature flags para rollout gradual
- Manter versão single-tenant funcionando até ter certeza

---

## 📚 Recursos Úteis

- [Roadmap Detalhado](./MULTI_TENANT_ROADMAP.md)
- [Modelo de Negócio](./BUSINESS_MODEL.md)
- [Schema Example](./prisma/schema-multitenant.prisma.example)
- [API Example](./app/api/products/route-multitenant.ts.example)
- [Middleware Example](./middleware-multitenant.ts.example)

---

## 🤝 Precisa de Ajuda?

Se travar em algum passo, pode me chamar! Estou aqui para ajudar em cada fase.

**Bora transformar isso em um SaaS de sucesso! 🚀🍺**
