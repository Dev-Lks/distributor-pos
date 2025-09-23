# NitroBeer POS - Sistema de Ponto de Venda

Sistema completo de ponto de venda para bares e restaurantes, desenvolvido com Next.js, Prisma e Neon.

## Funcionalidades

- **Ponto de Venda (POS)**: Interface intuitiva para registrar vendas em tablets
- **Controle de Inventário**: Gerenciamento de estoque em tempo real
- **Relatórios**: Histórico de vendas e métricas
- **Banco de Dados**: PostgreSQL via Neon com Prisma ORM

## Tecnologias

- **Frontend**: Next.js 14, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Banco**: PostgreSQL (Neon)
- **ORM**: Prisma
- **UI**: Radix UI, Lucide Icons

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   pnpm install
   ```

3. Configure o banco de dados:
   - O arquivo `.env` já está configurado com Neon
   - Execute as migrações:
     ```bash
     pnpm prisma migrate dev
     ```

4. Popule o banco com produtos iniciais:
   ```bash
   pnpm tsx prisma/seed.ts
   ```

5. Gere o cliente Prisma:
   ```bash
   pnpm prisma generate
   ```

6. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

## Uso

1. Acesse `http://localhost:3000/dashboard`
2. Digite o PIN: `1234`
3. Navegue entre as abas:
   - **Vendas**: Registre vendas adicionando produtos ao carrinho
   - **Estoque**: Visualize e edite quantidades de produtos
   - **Relatórios**: Veja histórico de vendas

## Estrutura do Banco

### Produtos
- American Lager, IPA, Pilsen Premium, Weiss, Vinho
- Tamanhos: 600ml, 1.5L, 30L, 50L
- Preços diferenciados por tamanho

### Funcionalidades Implementadas

- ✅ API de produtos (CRUD)
- ✅ API de vendas com atualização automática de estoque
- ✅ API de inventário
- ✅ Interface POS responsiva
- ✅ Controle de estoque
- ✅ Relatórios de vendas
- ✅ Seed de produtos baseado na lista fornecida

## Sugestões para Melhorias

- **Autenticação**: Implementar autenticação real (NextAuth.js)
- **Usuários**: Controle de acesso por usuário
- **Impressão**: Integração com impressoras térmicas
- **Offline**: Funcionamento offline com sincronização
- **Códigos de Barras**: Scanner de códigos
- **Pagamentos**: Integração com gateways de pagamento
- **Relatórios Avançados**: Gráficos e filtros por período
- **Notificações**: Alertas de estoque baixo

## Deploy

Para produção, configure as variáveis de ambiente no Vercel:

1. **DATABASE_URL**: Sua string de conexão do Neon
2. **NODE_ENV**: production

O projeto está configurado para deploy automático no Vercel com:
- Geração automática do cliente Prisma
- Build otimizado para produção
- APIs funcionais em produção
