# ✅ Checklist de Melhorias - Claudiao

> Use este arquivo para marcar o progresso das melhorias

## 🎯 Progresso Geral

- [ ] Fase 1: Limpeza e Otimização (0/3)
- [ ] Fase 2: TypeScript e Segurança (0/4)
- [ ] Fase 3: Refatoração (0/3)
- [ ] Fase 4: Testes (0/3)
- [ ] Fase 5: Documentação (0/2)
- [ ] Fase 6: CI/CD (0/1)

---

## 🔴 Fase 1: Limpeza e Otimização

### Sprint 1.1: Dependências
- [ ] Verificar uso com grep
- [ ] Remover do package.json
- [ ] Executar pnpm install
- [ ] Testar build
- [ ] Commit

### Sprint 1.2: Logger
- [ ] Criar lib/logger.ts
- [ ] Substituir console.log no middleware
- [ ] Substituir em lib/googleSheets.ts
- [ ] Substituir em components/SidebarLayout.tsx
- [ ] Substituir em lib/useSales.ts
- [ ] Substituir em components/PWA*.tsx
- [ ] Substituir em app/api/settings
- [ ] Commit

### Sprint 1.3: Limpeza Console
- [ ] Substituir todos console.log restantes
- [ ] Adicionar regra ESLint
- [ ] Commit

---

## 🟡 Fase 2: TypeScript

### Sprint 2.1: Tipos Globais
- [ ] Criar types/api.ts
- [ ] Criar types/forms.ts
- [ ] Criar types/errors.ts
- [ ] Criar types/index.ts
- [ ] Commit

### Sprint 2.2: Eliminar any - Components
- [ ] admin/users/page.tsx
- [ ] admin/users/[id]/page.tsx
- [ ] inventory/page.tsx
- [ ] sales/hooks/useCheckout.ts
- [ ] sales/hooks/useCashSessionControls.ts
- [ ] Commit

### Sprint 2.3: Eliminar any - API
- [ ] reports/[id]/csv/route.ts
- [ ] sales/route.ts
- [ ] orders/route.ts
- [ ] Commit

### Sprint 2.4: Erros
- [ ] Criar lib/errors.ts
- [ ] Substituir catch (error: any)
- [ ] Adicionar handleError helper
- [ ] Commit

---

## 🟢 Fase 3: Refatoração

### Sprint 3.1: Middleware
- [ ] Criar lib/middleware/permissions.ts
- [ ] Criar lib/middleware/utils.ts
- [ ] Refatorar middleware.ts
- [ ] Reduzir para ~80 linhas
- [ ] Commit

### Sprint 3.2: Componentes Grandes
- [ ] Quebrar inventory/import/route.ts
- [ ] Criar lib/inventory/importParser.ts
- [ ] Criar lib/inventory/importValidator.ts
- [ ] Criar lib/inventory/importProcessor.ts
- [ ] Quebrar inventory/page.tsx
- [ ] Commit

### Sprint 3.3: salesDB
- [ ] Criar app/api/sales/export/xlsx/route.ts
- [ ] Criar app/api/sales/export/csv/route.ts
- [ ] Refatorar salesDB.ts
- [ ] Adicionar progress feedback
- [ ] Commit

---

## 🧪 Fase 4: Testes

### Sprint 4.1: Setup
- [ ] Instalar dependências
- [ ] Criar vitest.config.ts
- [ ] Criar __tests__/setup.ts
- [ ] Criar testes para utils
- [ ] Criar testes para logger
- [ ] Commit

### Sprint 4.2: Testes Unitários
- [ ] Teste: lib/auth.ts
- [ ] Teste: lib/permissions.ts
- [ ] Teste: lib/errors.ts
- [ ] Teste: lib/logger.ts
- [ ] Cobertura > 60%
- [ ] Commit

### Sprint 4.3: ESLint/Prettier
- [ ] Atualizar .eslintrc.json
- [ ] Criar .prettierrc
- [ ] Executar lint --fix
- [ ] Executar prettier --write
- [ ] Commit

---

## 📚 Fase 5: Documentação

### Sprint 5.1: Código
- [ ] JSDoc em funções complexas
- [ ] Documentar tipos exportados
- [ ] Documentar API routes
- [ ] Criar docs/API.md
- [ ] Commit

### Sprint 5.2: Guias
- [ ] Atualizar README.md
- [ ] Criar docs/SETUP.md
- [ ] Criar docs/ARCHITECTURE.md
- [ ] Criar docs/CONTRIBUTING.md
- [ ] Commit

---

## 🚀 Fase 6: CI/CD

### Sprint 6.1: GitHub Actions
- [ ] Criar .github/workflows/ci.yml
- [ ] Workflow de testes
- [ ] Workflow de build
- [ ] Configurar cache
- [ ] Commit

---

## 📊 Métricas Atuais

| Métrica | Antes | Depois | Progresso |
|---------|-------|--------|-----------|
| Dependencies | 75 | 75 | ⏳ |
| Bundle Size | 2.5MB | 2.5MB | ⏳ |
| Build Time | 45s | 45s | ⏳ |
| TypeScript any | 30+ | 30+ | ⏳ |
| Console.log | 20+ | 20+ | ⏳ |
| Test Coverage | 0% | 0% | ⏳ |

---

**Última atualização**: 07/10/2025
