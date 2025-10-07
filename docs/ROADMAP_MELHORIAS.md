# 🗺️ Roadmap de Melhorias - Projeto Claudiao

> **Data de Criação**: 07 de Outubro de 2025
> **Status**: 📋 Planejamento

---

## 📊 Resumo Executivo

Este roadmap documenta todas as melhorias identificadas na análise de código do projeto Claudiao, organizadas por prioridade e impacto.

**Métricas Estimadas:**
- ⏱️ Tempo total: ~12-16 horas
- 💰 Redução de bundle: ~15-20MB
- 🚀 Melhoria de performance: 15-25%
- 🛡️ Melhoria de qualidade: Significativa

---

## 🎯 Fase 1: Limpeza e Otimização (2-3 horas)

### Sprint 1.1: Remover Dependências Não Utilizadas
**Prioridade**: 🔴 ALTA | **Impacto**: Alto | **Complexidade**: Baixa

**Dependências a Remover:**
```json
{
  "react-grid-layout": "^1.5.2",
  "react-window": "^2.2.0", 
  "react-window-infinite-loader": "^2.0.0",
  "react-resizable-panels": "^2.1.7",
  "cmdk": "1.0.4",
  "input-otp": "1.4.1",
  "iconv-lite": "^0.6.3",
  "@react-spring/web": "^10.0.3",
  "@use-gesture/react": "^10.3.1"
}

// DevDependencies
{
  "@types/react-window": "^2.0.0"
}
```

**Tarefas:**
- [ ] Verificar novamente uso com grep search mais abrangente
- [ ] Remover do package.json
- [ ] Executar `pnpm prune` ou `pnpm install`
- [ ] Testar build completo
- [ ] Commit: `chore: remove unused dependencies`

**Benefícios:**
- Redução do bundle size
- Build mais rápido
- Menor superfície de ataque (segurança)

---

### Sprint 1.2: Sistema de Logger Profissional
**Prioridade**: 🔴 ALTA | **Impacto**: Médio | **Complexidade**: Baixa

**Criar:** `lib/logger.ts`

```typescript
/**
 * Sistema de logging centralizado
 * Evita console.log em produção e facilita debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && level === 'debug') return

    const timestamp = new Date().toISOString()
    const prefix = this.isServer ? '[Server]' : '[Client]'
    const emoji = this.getEmoji(level)

    const logMessage = `${emoji} ${prefix} [${timestamp}] ${message}`

    switch (level) {
      case 'error':
        console.error(logMessage, context || '')
        break
      case 'warn':
        console.warn(logMessage, context || '')
        break
      case 'info':
        console.info(logMessage, context || '')
        break
      case 'debug':
        console.log(logMessage, context || '')
        break
    }
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }
    return emojis[level]
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()
```

**Tarefas:**
- [ ] Criar `lib/logger.ts`
- [ ] Substituir console.log no middleware (linha 38)
- [ ] Substituir console.log em lib/googleSheets.ts
- [ ] Substituir console.log em components/SidebarLayout.tsx (linha 203)
- [ ] Substituir console.log em scripts/ (manter, são scripts de debug)
- [ ] Substituir console.log em prisma/seed.ts (manter, é seed)
- [ ] Commit: `feat: add professional logger system`

**Arquivos a Modificar:**
- `middleware.ts` (linha 38-43)
- `lib/googleSheets.ts` (linha 64)
- `lib/useSales.ts` (linha 240)
- `components/SidebarLayout.tsx` (linha 203)
- `components/PWAInstall.tsx` (linhas 10, 13)
- `components/PWAInstallPrompt.tsx` (linha 27)
- `app/api/settings/backup/route.ts` (linha 51)
- `app/api/settings/route.ts` (linha 85)

---

### Sprint 1.3: Limpeza de Console.logs
**Prioridade**: 🔴 ALTA | **Impacto**: Médio | **Complexidade**: Baixa

**Tarefas:**
- [ ] Substituir 20+ console.log por logger
- [ ] Remover console.log de debug temporários
- [ ] Manter apenas em scripts e seed (são ferramentas)
- [ ] Adicionar regra ESLint: `no-console: ["error", { allow: ["error"] }]`
- [ ] Commit: `refactor: replace console.log with logger`

---

## 🔒 Fase 2: TypeScript e Segurança de Tipos (3-4 horas)

### Sprint 2.1: Criar Tipos Globais
**Prioridade**: 🔴 ALTA | **Impacto**: Alto | **Complexidade**: Média

**Criar:** `types/api.ts`

```typescript
// Tipos para API Responses
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Tipos para Forms
export interface UserFormData {
  name: string
  email: string
  password?: string
  isAdmin: boolean
  permissions: string[]
}

export interface ProductFormData {
  name: string
  sku: string
  category: string
  price: number
  stock: number
}

// Tipos para Errors
export interface AppError extends Error {
  code?: string
  statusCode?: number
}
```

**Tarefas:**
- [ ] Criar `types/api.ts`
- [ ] Criar `types/forms.ts`
- [ ] Criar `types/errors.ts`
- [ ] Exportar tudo de `types/index.ts`
- [ ] Commit: `feat: add global TypeScript types`

---

### Sprint 2.2: Eliminar `any` - Fase 1 (Components)
**Prioridade**: 🔴 ALTA | **Impacto**: Alto | **Complexidade**: Média

**Arquivos Prioritários:**
```
app/(app)/dashboard/admin/users/page.tsx - linha 185
app/(app)/dashboard/admin/users/[id]/page.tsx - linhas 33, 50, 60
app/(app)/dashboard/inventory/page.tsx - linhas 216, 463
app/(app)/dashboard/sales/hooks/useCheckout.ts - linha 15 (2x)
app/(app)/dashboard/sales/hooks/useCashSessionControls.ts - linhas 30, 68, 94
```

**Tarefas:**
- [ ] Criar tipos para User, Product, Inventory
- [ ] Substituir `any` por tipos apropriados em admin/users
- [ ] Substituir `any` em hooks de vendas
- [ ] Substituir `any` em inventory
- [ ] Commit: `refactor: replace any with proper types in components`

---

### Sprint 2.3: Eliminar `any` - Fase 2 (API Routes)
**Prioridade**: 🟡 MÉDIA | **Impacto**: Médio | **Complexidade**: Média

**Arquivos:**
```
app/api/reports/[id]/csv/route.ts - linha 53
app/api/sales/route.ts - linhas 149, 154
app/api/orders/route.ts - linha 277
```

**Tarefas:**
- [ ] Criar tipos para API responses
- [ ] Tipar corretamente metadata e records
- [ ] Substituir `as any` por type assertions apropriados
- [ ] Commit: `refactor: replace any with proper types in API routes`

---

### Sprint 2.4: Melhorar Tratamento de Erros
**Prioridade**: 🔴 ALTA | **Impacto**: Alto | **Complexidade**: Média

**Criar:** `lib/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export function handleError(error: unknown): { message: string; code: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code }
  }
  
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR' }
  }
  
  return { message: 'Erro desconhecido', code: 'UNKNOWN_ERROR' }
}
```

**Tarefas:**
- [ ] Criar `lib/errors.ts`
- [ ] Substituir `catch (error: any)` por tratamento apropriado
- [ ] Usar `handleError` helper em todos os catch blocks
- [ ] Commit: `feat: improve error handling with custom errors`

---

## 🏗️ Fase 3: Refatoração e Arquitetura (4-5 horas)

### Sprint 3.1: Refatorar Middleware
**Prioridade**: 🟡 MÉDIA | **Impacto**: Alto | **Complexidade**: Média

**Criar:** `lib/middleware/permissions.ts`

```typescript
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/admin': ['ADMIN'],
  '/dashboard/sales': ['CREATE_SALES', 'VIEW_OWN_SALES', 'VIEW_ALL_SALES'],
  '/dashboard/products': ['VIEW_PRODUCTS'],
  '/dashboard/inventory': ['VIEW_INVENTORY'],
  '/dashboard/inventory/edit': ['MANAGE_INVENTORY'],
  '/dashboard/inventory/create': ['MANAGE_INVENTORY'],
  '/dashboard/reports': ['VIEW_REPORTS'],
  '/dashboard/settings': ['MANAGE_SETTINGS'],
}

export function hasPermission(
  path: string, 
  isAdmin: boolean, 
  permissions: string[]
): boolean {
  if (isAdmin) return true
  
  const requiredPermissions = ROUTE_PERMISSIONS[path]
  if (!requiredPermissions) return true // Rota pública ou não mapeada
  
  return requiredPermissions.some(p => permissions.includes(p))
}
```

**Tarefas:**
- [ ] Criar `lib/middleware/permissions.ts`
- [ ] Criar `lib/middleware/utils.ts` para helpers
- [ ] Refatorar middleware.ts usando os novos helpers
- [ ] Reduzir middleware de 180 linhas para ~80 linhas
- [ ] Commit: `refactor: modularize middleware logic`

---

### Sprint 3.2: Quebrar Componentes Grandes
**Prioridade**: 🟡 MÉDIA | **Impacto**: Médio | **Complexidade**: Alta

**Arquivos Prioritários:**
- `app/api/inventory/import/route.ts` (402 linhas)
- `app/(app)/dashboard/inventory/page.tsx` (provavelmente 300+)
- `middleware.ts` (180 linhas)

**Tarefas:**
- [ ] Quebrar import/route.ts em:
  - `lib/inventory/importParser.ts`
  - `lib/inventory/importValidator.ts`
  - `lib/inventory/importProcessor.ts`
- [ ] Quebrar inventory/page.tsx em componentes menores
- [ ] Criar componentes reutilizáveis de filtros
- [ ] Commit: `refactor: break down large components`

---

### Sprint 3.3: Melhorar salesDB.ts
**Prioridade**: 🟡 MÉDIA | **Impacto**: Médio | **Complexidade**: Média

**Problemas Atuais:**
- IndexedDB no cliente (quota limitada)
- XLSX.writeFile não funciona em SSR
- Falta de tratamento de erros

**Solução:**
- Mover exports para API routes
- Usar Blob download no cliente
- Adicionar tratamento de erros apropriado

**Tarefas:**
- [ ] Criar API route para export XLSX: `app/api/sales/export/xlsx/route.ts`
- [ ] Criar API route para export CSV: `app/api/sales/export/csv/route.ts`
- [ ] Refatorar salesDB.ts para usar fetch nas exports
- [ ] Adicionar progress feedback no cliente
- [ ] Commit: `refactor: improve sales export system`

---

## 🧪 Fase 4: Testes e Qualidade (3-4 horas)

### Sprint 4.1: Configurar Testes
**Prioridade**: 🟢 BAIXA | **Impacto**: Alto (Longo Prazo) | **Complexidade**: Média

**Instalar:**
```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "vitest": "^1.0.0",
  "@vitejs/plugin-react": "^4.0.0"
}
```

**Tarefas:**
- [ ] Instalar dependências de teste
- [ ] Criar `vitest.config.ts`
- [ ] Criar `__tests__/setup.ts`
- [ ] Criar testes para utils: `__tests__/lib/utils.test.ts`
- [ ] Criar testes para logger: `__tests__/lib/logger.test.ts`
- [ ] Commit: `test: add testing infrastructure`

---

### Sprint 4.2: Testes Unitários Críticos
**Prioridade**: 🟢 BAIXA | **Impacto**: Alto | **Complexidade**: Alta

**Criar testes para:**
- `lib/auth.ts` - Autenticação
- `lib/permissions.ts` - Sistema de permissões
- `lib/errors.ts` - Error handling
- `lib/logger.ts` - Logger
- Helpers de validação

**Tarefas:**
- [ ] Teste: autenticação e sessões
- [ ] Teste: sistema de permissões
- [ ] Teste: tratamento de erros
- [ ] Teste: validações de formulários
- [ ] Cobertura mínima: 60%
- [ ] Commit: `test: add unit tests for critical paths`

---

### Sprint 4.3: ESLint e Prettier
**Prioridade**: 🟢 BAIXA | **Impacto**: Médio | **Complexidade**: Baixa

**Criar:** `.eslintrc.json` (atualizado)

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_" 
    }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Criar:** `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

**Tarefas:**
- [ ] Atualizar .eslintrc.json com regras mais rígidas
- [ ] Criar .prettierrc
- [ ] Executar `pnpm lint --fix`
- [ ] Executar `pnpm prettier --write .`
- [ ] Commit: `chore: improve linting and formatting rules`

---

## 📚 Fase 5: Documentação (2-3 horas)

### Sprint 5.1: Documentação de Código
**Prioridade**: 🟢 BAIXA | **Impacto**: Médio | **Complexidade**: Baixa

**Tarefas:**
- [ ] Adicionar JSDoc em funções complexas
- [ ] Documentar tipos exportados
- [ ] Documentar API routes com comentários
- [ ] Criar `docs/API.md` com endpoints
- [ ] Commit: `docs: add JSDoc comments to critical functions`

---

### Sprint 5.2: README e Guias
**Prioridade**: 🟢 BAIXA | **Impacto**: Baixo | **Complexidade**: Baixa

**Criar/Atualizar:**
- `README.md` - Overview do projeto
- `docs/SETUP.md` - Guia de setup
- `docs/ARCHITECTURE.md` - Arquitetura
- `docs/CONTRIBUTING.md` - Como contribuir

**Tarefas:**
- [ ] Atualizar README.md principal
- [ ] Criar guia de setup completo
- [ ] Documentar arquitetura do projeto
- [ ] Criar guia de contribuição
- [ ] Commit: `docs: improve project documentation`

---

## 🚀 Fase 6: CI/CD e Deploy (2-3 horas)

### Sprint 6.1: GitHub Actions
**Prioridade**: 🟢 BAIXA | **Impacto**: Alto (Automação) | **Complexidade**: Média

**Criar:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

**Tarefas:**
- [ ] Criar workflow de CI
- [ ] Adicionar workflow de testes
- [ ] Adicionar workflow de build
- [ ] Configurar cache do pnpm
- [ ] Commit: `ci: add GitHub Actions workflows`

---

## 📈 Cronograma Sugerido

### Semana 1: Fundação
- **Dia 1-2**: Fase 1 completa (Limpeza)
- **Dia 3-4**: Fase 2.1 e 2.2 (Tipos básicos)
- **Dia 5**: Fase 2.3 e 2.4 (Erros)

### Semana 2: Refatoração
- **Dia 1-2**: Fase 3.1 e 3.2 (Middleware e Components)
- **Dia 3**: Fase 3.3 (salesDB)
- **Dia 4-5**: Fase 4.1 e 4.2 (Testes)

### Semana 3: Polimento
- **Dia 1**: Fase 4.3 (ESLint/Prettier)
- **Dia 2-3**: Fase 5 (Documentação)
- **Dia 4-5**: Fase 6 (CI/CD) + Review geral

---

## ✅ Checklist Geral de Conclusão

### Qualidade de Código
- [ ] Zero dependências não utilizadas
- [ ] Zero uso de `any` (ou justificado)
- [ ] Zero console.log em produção
- [ ] Tratamento de erros apropriado em todos os catch blocks
- [ ] ESLint sem warnings

### Performance
- [ ] Bundle size reduzido em 15-20MB
- [ ] Build time melhorado
- [ ] Lighthouse score > 90

### Testes
- [ ] Cobertura de código > 60%
- [ ] Testes passando no CI
- [ ] Testes de integração críticos

### Documentação
- [ ] README atualizado
- [ ] API documentada
- [ ] Arquitetura documentada
- [ ] JSDoc em funções críticas

### CI/CD
- [ ] Pipeline de CI configurado
- [ ] Testes automáticos
- [ ] Build automático
- [ ] Deploy automático (opcional)

---

## 📊 Métricas de Sucesso

### Antes
- Dependencies: ~75
- Bundle size: ~2.5MB
- Build time: ~45s
- TypeScript any: 30+
- Console.log: 20+
- Test coverage: 0%

### Depois (Meta)
- Dependencies: ~65 (-10)
- Bundle size: ~2.3MB (-200KB)
- Build time: ~35s (-10s)
- TypeScript any: 0
- Console.log: 0 (produção)
- Test coverage: 60%+

---

## 🎯 Priorização Recomendada

Se tiver **tempo limitado**, faça nesta ordem:

1. ✅ **Fase 1**: Limpeza (3h) - Impacto imediato
2. ✅ **Sprint 2.1-2.2**: Tipos básicos (4h) - Segurança
3. ✅ **Sprint 2.4**: Erros (2h) - Robustez
4. ✅ **Sprint 3.1**: Middleware (2h) - Manutenibilidade

**Total: 11h para 80% do benefício**

---

## 📝 Notas Finais

- Este roadmap é flexível e pode ser ajustado
- Cada sprint pode ser um PR separado
- Mantenha testes rodando entre sprints
- Documente decisões importantes no código
- Peça review de código quando possível

---

**Última atualização**: 07/10/2025
**Mantido por**: GitHub Copilot + Dev Team
