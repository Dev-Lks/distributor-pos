# Distributor POS

[![CI](https://github.com/Dev-Lks/distributor-pos/actions/workflows/ci.yml/badge.svg)](https://github.com/Dev-Lks/distributor-pos/actions)

> English: point-of-sale and inventory management system built with Next.js, Prisma and PostgreSQL. Sales panel, stock tracking with batches and audits, thermal-printer integration, role-based access and automated backups.

Sistema de ponto de venda (PDV) e gestão de estoque, feito para a rotina de uma distribuidora de bebidas pequena: vender no balcão, controlar estoque, imprimir comanda e fechar o caixa no fim do dia.

O sistema nasceu de um negócio real da família (uma distribuidora, hoje encerrada) e foi desenvolvido ao longo de seis semanas, commit a commit, até entrar em uso no dia a dia. O seed que acompanha o repo usa dados fictícios.

## O que o sistema faz

- **PDV** — carrinho, bonificações, múltiplos meios de pagamento, impressão de comandas, gestão de caixa
- **Estoque** — KPIs em tempo real, curva ABC, lotes com QR code, alertas de vencimento com sugestão de desconto, auditorias com cálculo de diferença, movimentos com histórico completo, importação/exportação via Excel
- **Relatórios** — histórico de vendas, lucratividade, inventário, exportação CSV/Excel
- **Impressão térmica** — serviço dedicado (`print-server/`) para impressoras via porta serial
- **Acesso** — login com NextAuth, permissões por papel (admin/vendedor), rotas protegidas por middleware, rate limiting em login e API
- **Backup** — script de dump comprimido do Postgres (`pnpm backup`)

## Stack

Next.js 14 (App Router) · React 19 · TypeScript · Tailwind · Radix UI · React Query · React Hook Form + Zod · NextAuth · Prisma 6 · PostgreSQL · IndexedDB (cache local) · ESLint + Prettier · GitHub Actions (CI)

## Rodando localmente

Pré-requisitos: Node 18+ ou 20+, pnpm 8+, PostgreSQL 14+.

```bash
git clone https://github.com/Dev-Lks/distributor-pos.git
cd distributor-pos
pnpm install
cp .env.example .env   # ajuste DATABASE_URL e NEXTAUTH_SECRET
pnpm prisma migrate dev
pnpm prisma db seed    # dados fictícios de demonstração
pnpm dev               # http://localhost:3000
```

Login de demonstração (seed): `admin@example.com` / `admin123`.

Outros comandos úteis: `pnpm build`, `pnpm start`, `pnpm lint`, `npx prisma studio`.

## Estrutura

```text
app/
  (app)/dashboard/   # área logada: vendas, estoque, relatórios, admin
  api/               # API routes (vendas, produtos, estoque, backup...)
components/          # UI (shadcn/radix) + telas de PDV e inventário
lib/                 # auth, permissões, middlewares, validações
prisma/              # schema, migrations, seed fictício
print-server/        # serviço de impressão térmica (serial)
scripts/             # backup, setup de admin, checagens operacionais
```

## Estado do projeto

O sistema operou de verdade no dia a dia da distribuidora. O que ficou em aberto quando a operação encerrou: cobertura de testes automatizados (CI hoje roda lint, typecheck e build) e modo offline/PWA completo. Está publicado como portfólio do que foi construído e usado, não como produto ativo.

## Licença

MIT — veja [LICENSE](LICENSE).

## Autor

Lucas Antonio Nunes — [GitHub](https://github.com/Dev-Lks)
