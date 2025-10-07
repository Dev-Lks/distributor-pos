# 🗑️ Dependências a Remover

> Lista verificada de dependências não utilizadas no projeto

## ❌ Dependencies (Produção)

```json
{
  "react-grid-layout": "^1.5.2",
  "react-window": "^2.2.0",
  "react-resizable-panels": "^2.1.7",
  "cmdk": "1.0.4",
  "input-otp": "1.4.1",
  "iconv-lite": "^0.6.3",
  "@react-spring/web": "^10.0.3",
  "@use-gesture/react": "^10.3.1"
}
```

## ❌ DevDependencies

```json
{
  "react-window-infinite-loader": "^2.0.0",
  "@types/react-window": "^2.0.0"
}
```

---

## 📋 Verificação de Uso

| Dependência | Verificado | Status | Observação |
|-------------|-----------|--------|------------|
| react-grid-layout | ✅ | ❌ Não usado | Apenas comentário no código |
| react-window | ✅ | ❌ Não usado | Apenas comentário no código |
| react-window-infinite-loader | ✅ | ❌ Não usado | Dev dependency não usada |
| react-resizable-panels | ✅ | ❌ Não usado | Nenhuma importação encontrada |
| cmdk | ✅ | ❌ Não usado | Nenhuma importação encontrada |
| input-otp | ✅ | ❌ Não usado | Nenhuma importação encontrada |
| iconv-lite | ✅ | ❌ Não usado | Nenhuma importação encontrada |
| @react-spring/web | ✅ | ❌ Não usado | Nenhuma importação encontrada |
| @use-gesture/react | ✅ | ❌ Não usado | Nenhuma importação encontrada |
| @types/react-window | ✅ | ❌ Não usado | Type def não usado |

---

## ✅ Dependências USADAS (não remover)

| Dependência | Onde é usado |
|-------------|--------------|
| xlsx | `app/api/inventory/import/route.ts`, `lib/salesDB.ts` |
| vaul | `components/ui/drawer.tsx` |
| react-qr-code | `app/(home)/page.tsx` |
| embla-carousel-react | Componentes de carousel |
| jspdf | Geração de PDFs |
| pdfkit | Geração de PDFs no servidor |
| googleapis | `app/api/sheets/route.ts`, `lib/googleSheets.ts` |
| nodemailer | Sistema de email |
| idb | `lib/salesDB.ts` (IndexedDB) |

---

## 🚀 Comando para Remover Tudo

```bash
pnpm remove react-grid-layout react-window react-window-infinite-loader \
  react-resizable-panels cmdk input-otp iconv-lite \
  @react-spring/web @use-gesture/react @types/react-window
```

---

## 📊 Impacto Estimado

### Antes
```
node_modules/: ~1.2GB
package.json dependencies: 75
```

### Depois
```
node_modules/: ~1.05GB (-150MB)
package.json dependencies: 65 (-10)
```

### Bundle Size
```
Antes:  ~2.5MB
Depois: ~2.3MB (-200KB)
```

---

## ⚠️ Atenção

Antes de remover, verifique:

1. **Grep search completo:**
```bash
grep -r "react-grid-layout\|react-window\|cmdk\|input-otp" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
```

2. **Teste o build:**
```bash
pnpm build
```

3. **Teste a aplicação:**
```bash
pnpm dev
# Navegue pelas principais funcionalidades
```

---

## 🔍 Evidências de Não Uso

### react-grid-layout
```
Busca: grep -r "react-grid-layout" --include="*.ts" --include="*.tsx" .
Resultado: Apenas comentário em components/dashboard/widgets/DashboardWidgetGrid.tsx
```

### react-window
```
Busca: grep -r "react-window" --include="*.ts" --include="*.tsx" .
Resultado: Apenas comentário em components/VirtualList.tsx
```

### cmdk
```
Busca: grep -r "cmdk" --include="*.ts" --include="*.tsx" .
Resultado: Nenhuma importação encontrada
```

### input-otp
```
Busca: grep -r "input-otp" --include="*.ts" --include="*.tsx" .
Resultado: Nenhuma importação encontrada
```

### iconv-lite
```
Busca: grep -r "iconv-lite" --include="*.ts" --include="*.tsx" .
Resultado: Nenhuma importação encontrada
```

### @react-spring/web
```
Busca: grep -r "@react-spring" --include="*.ts" --include="*.tsx" .
Resultado: Nenhuma importação encontrada
```

### @use-gesture/react
```
Busca: grep -r "@use-gesture" --include="*.ts" --include="*.tsx" .
Resultado: Nenhuma importação encontrada
```

---

## 📝 Checklist Pós-Remoção

Após remover as dependências:

- [ ] `pnpm install` executado com sucesso
- [ ] `pnpm build` executado sem erros
- [ ] `pnpm dev` inicia normalmente
- [ ] Testado login e autenticação
- [ ] Testado dashboard principal
- [ ] Testado vendas (PDV)
- [ ] Testado produtos
- [ ] Testado inventário
- [ ] Testado relatórios
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum aviso sobre módulos faltando

---

## 💾 Backup de Segurança

Antes de fazer mudanças:

```bash
# Backup do package.json
cp package.json package.json.backup

# Backup do pnpm-lock.yaml
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# Ou criar branch
git checkout -b cleanup/remove-unused-deps
```

Para restaurar se algo der errado:
```bash
cp package.json.backup package.json
cp pnpm-lock.yaml.backup pnpm-lock.yaml
pnpm install
```

---

**Última verificação**: 07/10/2025
**Status**: ✅ Pronto para remoção
