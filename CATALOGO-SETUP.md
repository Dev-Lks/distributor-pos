# Configuração do Catálogo

## 📚 Sobre

Visualizador moderno do catálogo de produtos em PDF, acessível em `https://catalogo.exemplo.com.br`

## ✨ Funcionalidades

- 📄 Visualização página por página do PDF
- 🔍 Controles de zoom (60% - 300%)
- ⬅️➡️ Navegação entre páginas
- 📱 Design responsivo (desktop e mobile)
- 🌙 Suporte a tema escuro
- 📥 Download do catálogo
- 🖥️ Modo tela cheia
- 🎨 Interface moderna e intuitiva

## 🚀 Acesso

### URL Principal
- **Subdomínio:** `https://catalogo.exemplo.com.br`
- **Rota direta:** `https://exemplo.com.br/catalogo`

## 🔧 Configuração do Subdomínio no Vercel

### Passo 1: Adicionar o Domínio no Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto (distributor-pos)
3. Vá em **Settings** → **Domains**
4. Clique em **Add Domain**
5. Digite: `catalogo.exemplo.com.br`
6. Clique em **Add**

### Passo 2: Configurar DNS

A Vercel fornecerá registros DNS para configurar. Você precisa adicionar no seu provedor de DNS (onde seu domínio está registrado):

#### Opção A: CNAME (Recomendado)
```
Type: CNAME
Name: catalogo
Value: cname.vercel-dns.com
TTL: 3600
```

#### Opção B: A Record
```
Type: A
Name: catalogo
Value: 76.76.21.21
TTL: 3600
```

### Passo 3: Aguardar Propagação

- A propagação DNS pode levar de alguns minutos a 48 horas
- Você pode verificar o status em **Settings** → **Domains** no Vercel
- Use [dnschecker.org](https://dnschecker.org) para verificar a propagação

### Passo 4: Verificar SSL

A Vercel automaticamente provisiona um certificado SSL. Após a propagação:
- O ícone de cadeado aparecerá ao lado do domínio no painel
- Seu site estará acessível via HTTPS

## 📂 Estrutura de Arquivos

```
app/
├── catalogo/
│   ├── page.tsx          # Componente principal do visualizador
│   └── layout.tsx        # Layout e metadados
public/
└── catalogo.pdf  # Arquivo PDF do catálogo
```

## 🎨 Personalização

### Alterar o PDF

Substitua o arquivo `public/catalogo.pdf` pelo novo catálogo e faça o deploy:

```bash
# Substituir o PDF
# (copie seu novo PDF para public/catalogo.pdf)

# Deploy
git add public/catalogo.pdf
git commit -m "Atualizar catálogo"
git push
```

### Personalizar Cores e Estilos

Edite `app/catalogo/page.tsx` para alterar:
- **Logo:** Linha 51-53
- **Cores do tema:** Classes Tailwind nos botões e containers
- **Texto do rodapé:** Linhas 253-262

### Ajustar Zoom Padrão

No arquivo `app/catalogo/page.tsx`, linha 17:
```typescript
const [scale, setScale] = useState(1.2); // Altere o valor (0.6 - 3.0)
```

## 🔄 Atualização e Deploy

### Deploy Automático
Qualquer commit na branch `main` acionará um deploy automático no Vercel.

### Deploy Manual
```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Deploy
vercel --prod
```

## 🐛 Troubleshooting

### Problema: Subdomínio não está acessível

**Soluções:**
1. Verifique se os registros DNS foram adicionados corretamente
2. Aguarde a propagação (até 48h)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Teste em modo anônimo/privado

### Problema: PDF não carrega

**Soluções:**
1. Verifique se o arquivo existe em `public/catalogo.pdf`
2. Confirme que o arquivo não está corrompido
3. Verifique o console do navegador para erros
4. Limpe o cache e recarregue (Ctrl+F5)

### Problema: Erro 404

**Soluções:**
1. Confirme que o deploy foi bem-sucedido no Vercel
2. Verifique o arquivo `vercel.json` com a configuração de rewrites
3. Teste a rota direta: `https://seudominio.com.br/catalogo`

### Problema: Estilo quebrado

**Soluções:**
1. Execute `pnpm install` para garantir que todas as dependências estão instaladas
2. Verifique se o build passou: `pnpm build`
3. Limpe o cache do Next.js: `rm -rf .next`

## 📊 Monitoramento

### Vercel Analytics

Ative o Vercel Analytics para monitorar:
- Número de visualizações
- Tempo de carregamento
- Dispositivos e navegadores usados
- Geografia dos visitantes

### Logs

Veja logs em tempo real:
```bash
vercel logs https://catalogo.exemplo.com.br
```

## 🔐 Segurança

O catálogo é público, mas você pode adicionar proteção:

### Opção 1: Password Protection (Vercel)
Em **Settings** → **Password Protection** no Vercel

### Opção 2: Autenticação Personalizada
Modifique `middleware.ts` para adicionar verificação de autenticação

## 📱 SEO e Meta Tags

Meta tags já configuradas em `app/catalogo/layout.tsx`:
- Título
- Descrição
- Keywords
- Open Graph (compartilhamento em redes sociais)

## 💡 Dicas

1. **Otimize o PDF:** Use ferramentas como Adobe Acrobat ou [iLovePDF](https://www.ilovepdf.com/compress_pdf) para reduzir o tamanho
2. **Mantenha atualizado:** Configure um processo para atualizar o catálogo regularmente
3. **Monitore performance:** Use o Vercel Analytics para entender o uso
4. **Backup:** Mantenha cópias do PDF em diferentes locais

## 📧 Suporte

Para questões técnicas ou problemas, contate a equipe de desenvolvimento.

---

**Última atualização:** Outubro 2025
