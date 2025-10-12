# ✅ Checklist: Impressora Térmica em Produção

## 📦 Arquivos Criados/Modificados

### ✅ Arquivos de Configuração
- [x] `.env` (raiz do projeto) - Adicionado `PRINT_SERVER_URL` e `PRINT_SERVER_TOKEN`
- [x] `.env.example` (raiz) - Template com variáveis do print-server
- [x] `print-server/.env` - Configuração do servidor de impressão
- [x] `print-server/.env.example` - Template atualizado

### ✅ Código Backend
- [x] `app/api/delivery/[id]/print/route.ts` - Melhorado com:
  - Timeout de 10s
  - Tratamento de erros ECONNREFUSED
  - Suporte a token de autenticação
  - Mensagens de erro detalhadas
  
- [x] `app/api/hardware/printer/configure/route.ts` - Desabilitado (não funciona em serverless)

- [x] `print-server/index.js` - Print-server funcional com:
  - Endpoint `/print` para deliveries
  - Função `printDelivery()` completa
  - Formatação de recibos
  - Corte de papel automático

### ✅ Documentação
- [x] `TUTORIAL_IMPRESSORA_TERMICA.md` - Tutorial completo de setup
- [x] `DEPLOY_IMPRESSORA_PRODUCAO.md` - **NOVO** Guia de deploy em produção
- [x] `print-server/README.md` - Documentação do servidor
- [x] `print-server/install.sh` - Script de instalação melhorado

---

## 🎯 Para Colocar em Produção

### 1️⃣ No Servidor Local (onde está a impressora)

```bash
# 1. Clonar repositório
git clone https://github.com/Dev-Lks/claudiao.git
cd claudiao/print-server

# 2. Instalar
./install.sh

# 3. Configurar .env
nano .env
```

**Edite:**
```env
PORT=3001
PRINTER_PORT=/dev/usb/lp0  # Ajuste para sua impressora
PRINTER_WIDTH=48
AUTH_TOKEN=GERE_UM_TOKEN_SEGURO_AQUI
ALLOWED_ORIGINS=https://www.nitrobeer.com.br,https://nitrobeer.com.br
```

**Gerar token seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
# 4. Testar
npm run test

# 5. Iniciar com PM2
pm2 start index.js --name print-server
pm2 startup
pm2 save
```

---

### 2️⃣ Expor para Internet

**Opção A: Cloudflare Tunnel (Recomendado - Grátis)**

```bash
# Instalar
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login
cloudflared login

# Criar túnel
cloudflared tunnel create print-server

# Configurar
cloudflared tunnel route dns print-server print.seudominio.com

# Iniciar com PM2
pm2 start cloudflared --name cloudflare-tunnel -- tunnel run print-server
pm2 save
```

**Opção B: Ngrok (Simples)**

```bash
npm install -g ngrok
ngrok authtoken SEU_TOKEN
ngrok http 3001

# Anote a URL gerada (ex: https://abc123.ngrok.io)
```

---

### 3️⃣ Na Vercel (Next.js)

Acesse: [Vercel Dashboard](https://vercel.com) → Seu Projeto → Settings → Environment Variables

**Adicione:**
```
PRINT_SERVER_URL = https://seu-tunnel.cloudflare.com
PRINT_SERVER_TOKEN = o-mesmo-token-do-env-do-print-server
```

**Deploy:**
```bash
git add .
git commit -m "feat: configurar print-server em produção"
git push origin main
```

---

## ✅ Testar

### 1. Health Check
```bash
curl https://seu-tunnel.cloudflare.com/api/health
```

Deve retornar:
```json
{"success":true,"status":"online"}
```

### 2. Via Interface
1. Acesse https://www.nitrobeer.com.br/dashboard/delivery
2. Clique em uma entrega
3. Clique em **"Imprimir"** 🖨️
4. Deve imprimir!

### 3. Ver Logs
```bash
# No servidor
pm2 logs print-server

# Deve mostrar:
# ✅ Impressora configurada
# 🖨️ SERVIDOR DE IMPRESSÃO
# POST /print 200
```

---

## 🐛 Troubleshooting Rápido

### Erro: "Print-server não está acessível"
```bash
# Verificar se está rodando
pm2 status

# Reiniciar
pm2 restart print-server

# Ver logs
pm2 logs print-server --lines 50
```

### Erro: "Impressora não disponível"
```bash
# Verificar porta
ls /dev/usb/lp*

# Dar permissão
sudo chmod 666 /dev/usb/lp0

# Testar
cd print-server
npm run test
```

### Erro: "CORS blocked"
Adicione seu domínio em `print-server/.env`:
```env
ALLOWED_ORIGINS=https://www.nitrobeer.com.br,https://nitrobeer.com.br
```

Depois:
```bash
pm2 restart print-server
```

---

## 📚 Documentação Completa

- **Setup básico:** `/TUTORIAL_IMPRESSORA_TERMICA.md`
- **Deploy produção:** `/DEPLOY_IMPRESSORA_PRODUCAO.md`
- **Print-server:** `/print-server/README.md`

---

## 🎉 Pronto!

Agora você tem:
- ✅ Print-server rodando no servidor local
- ✅ Túnel expondo para internet
- ✅ Next.js (Vercel) conectado ao print-server
- ✅ Impressão de deliveries funcionando
- ✅ Monitoramento com PM2

**Para imprimir:** Basta clicar no botão "Imprimir" em qualquer delivery! 🖨️

---

## 🔄 Manutenção

### Atualizar código:
```bash
cd print-server
git pull origin main
npm install
pm2 restart print-server
```

### Ver logs:
```bash
pm2 logs print-server --lines 100
```

### Backup:
```bash
cp .env .env.backup
tar -czf print-server-backup-$(date +%Y%m%d).tar.gz print-server/
```

---

**Tudo configurado! 🚀**
