# 🚀 Deploy da Impressora Térmica em Produção

## Arquitetura

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│                     │         │                      │         │                 │
│  Vercel/Cloud       │  HTTP   │  Servidor Local/VPS  │   USB   │  Impressora     │
│  (Next.js API)      │ ──────> │  (Print-Server)      │ ──────> │  Térmica        │
│                     │         │  Port 3001           │         │                 │
└─────────────────────┘         └──────────────────────┘         └─────────────────┘
```

## 📋 Pré-requisitos

1. **Servidor com impressora conectada** (pode ser um PC local, Raspberry Pi, ou VPS)
2. **Node.js 16+** instalado no servidor
3. **Impressora térmica** conectada via USB/Serial/Rede
4. **IP fixo ou domínio** apontando para o servidor (ou túnel ngrok/cloudflare)

---

## 🔧 Setup do Print-Server

### 1. Preparar o Servidor

#### No servidor local (onde a impressora está conectada):

```bash
# 1. Clonar apenas a pasta print-server
git clone https://github.com/Dev-Lks/claudiao.git
cd claudiao/print-server

# 2. Instalar dependências
npm install
# ou
pnpm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Exemplo de `.env` para produção:**

```env
# Porta do servidor
PORT=3001

# Porta da impressora
PRINTER_PORT=/dev/usb/lp0              # Linux
# PRINTER_PORT=COM3                    # Windows
# PRINTER_PORT=192.168.1.100:9100      # Rede

# Largura da impressora
PRINTER_WIDTH=48

# Token de autenticação (IMPORTANTE: Gere um token seguro!)
AUTH_TOKEN=SuaChaveSecretaSuperSegura123!@#

# Origens permitidas (CORS)
ALLOWED_ORIGINS=https://www.nitrobeer.com.br,https://nitrobeer.com.br
```

**⚠️ IMPORTANTE:** 
- Troque `AUTH_TOKEN` por um token seguro e único
- Adicione apenas as origens do seu domínio em `ALLOWED_ORIGINS`

### 3. Testar Conexão da Impressora

```bash
# Linux: Verificar porta USB
ls -l /dev/usb/lp*

# Dar permissão (se necessário)
sudo chmod 666 /dev/usb/lp0

# Testar impressão
npm run test
```

Deve imprimir um recibo de teste!

### 4. Iniciar Print-Server

#### Desenvolvimento:
```bash
npm run dev
```

#### Produção (com PM2):
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar servidor
pm2 start index.js --name print-server

# Configurar auto-start no boot
pm2 startup
pm2 save

# Ver logs
pm2 logs print-server

# Status
pm2 status
```

### 5. Expor Servidor para Internet

Você tem 3 opções:

#### **Opção A: Túnel Cloudflare (Recomendado - Grátis)**

```bash
# Instalar cloudflared
# Linux:
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Criar túnel
cloudflared tunnel --url http://localhost:3001

# Vai gerar uma URL tipo: https://random-name.trycloudflare.com
```

Para túnel permanente:
```bash
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

#### **Opção B: Ngrok (Simples - Limitado no free)**

```bash
# Instalar ngrok
npm install -g ngrok

# Criar conta em https://ngrok.com e pegar auth token
ngrok authtoken SEU_TOKEN

# Iniciar túnel
ngrok http 3001

# Vai gerar URL tipo: https://random.ngrok.io
```

#### **Opção C: IP Fixo + Firewall (Avançado)**

```bash
# Abrir porta no firewall (Ubuntu/Debian)
sudo ufw allow 3001/tcp

# Configurar port forwarding no roteador
# Direcionar porta 3001 para IP interno do servidor
```

---

## ☁️ Configurar Next.js (Vercel)

### 1. Adicionar Variáveis de Ambiente na Vercel

Acesse: [Vercel Dashboard](https://vercel.com) → Seu Projeto → Settings → Environment Variables

Adicione:

```
PRINT_SERVER_URL = https://print.nitrobeer.com.br
PRINT_SERVER_TOKEN = SuaChaveSecretaSuperSegura123!@#
```

**⚠️ Use os mesmos valores do `.env` do print-server!**

**✅ URL Permanente Configurada:** `https://print.nitrobeer.com.br` via Cloudflare Tunnel

### 2. Deploy

```bash
git add .
git commit -m "feat: configurar print-server em produção"
git push origin main
```

A Vercel vai fazer deploy automaticamente.

---

## ✅ Testar Integração

### 1. Via cURL (direto no print-server):

```bash
curl -X POST https://seu-tunnel.trycloudflare.com/api/health
```

Deve retornar:
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-10-12T..."
}
```

### 2. Via Interface Web:

1. Acesse: https://www.nitrobeer.com.br/dashboard/delivery
2. Clique em uma entrega
3. Clique em "Imprimir" 🖨️
4. Deve imprimir o comprovante!

### 3. Ver Logs:

```bash
# No servidor com print-server
pm2 logs print-server

# Deve mostrar:
# ✅ Impressora configurada: /dev/usb/lp0
# 🖨️ SERVIDOR DE IMPRESSÃO
# Porta: 3001
```

---

## 🐛 Troubleshooting

### Erro: "Print-server não está acessível"

**Causa:** Next.js não consegue se conectar ao print-server

**Soluções:**
1. Verificar se print-server está rodando: `pm2 status`
2. Verificar túnel: `curl https://seu-tunnel/api/health`
3. Verificar variáveis na Vercel: `PRINT_SERVER_URL` correta?
4. Ver logs do print-server: `pm2 logs print-server`

### Erro: "Impressora não disponível"

**Causa:** Print-server não consegue acessar impressora

**Soluções:**
1. Verificar conexão USB: `ls -l /dev/usb/lp*`
2. Dar permissão: `sudo chmod 666 /dev/usb/lp0`
3. Verificar porta no `.env`: `PRINTER_PORT=/dev/usb/lp0`
4. Testar impressora: `npm run test` (na pasta print-server)
5. Reiniciar print-server: `pm2 restart print-server`

### Erro: "CORS blocked"

**Causa:** Domínio não está em `ALLOWED_ORIGINS`

**Solução:**
1. Editar `.env` do print-server:
   ```env
   ALLOWED_ORIGINS=https://www.nitrobeer.com.br,https://nitrobeer.com.br
   ```
2. Reiniciar: `pm2 restart print-server`

### Erro: "Unauthorized - Token inválido"

**Causa:** Token divergente entre Next.js e print-server

**Solução:**
1. Verificar `.env` do print-server: `AUTH_TOKEN=...`
2. Verificar variável na Vercel: `PRINT_SERVER_TOKEN=...`
3. Devem ser **idênticos**!

---

## 🔒 Segurança

### ✅ Checklist de Segurança:

- [ ] `AUTH_TOKEN` forte e único (mínimo 32 caracteres)
- [ ] `ALLOWED_ORIGINS` com apenas seus domínios
- [ ] Túnel com HTTPS (cloudflare/ngrok)
- [ ] Firewall bloqueando acesso direto à porta 3001 (se usar IP fixo)
- [ ] Print-server rodando como serviço (PM2)
- [ ] Logs sendo monitorados
- [ ] Backup da configuração

### Gerar Token Seguro:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

---

## 📊 Monitoramento

### Ver Status:

```bash
# Status do PM2
pm2 status

# Logs em tempo real
pm2 logs print-server --lines 100

# Métricas
pm2 monit
```

### Dashboard PM2 Plus (Opcional):

```bash
# Criar conta em: https://app.pm2.io
pm2 link SEU_SECRET_KEY SEU_PUBLIC_KEY

# Vai permitir monitorar remotamente via web
```

---

## 🔄 Manutenção

### Atualizar Print-Server:

```bash
cd print-server
git pull origin main
npm install
pm2 restart print-server
```

### Backup:

```bash
# Backup da configuração
cp .env .env.backup

# Backup do código
tar -czf print-server-backup.tar.gz print-server/
```

### Logs:

```bash
# Limpar logs antigos
pm2 flush

# Ver erros recentes
pm2 logs print-server --err --lines 50
```

---

## 📚 Recursos

- **Tutorial Completo:** `/TUTORIAL_IMPRESSORA_TERMICA.md`
- **Documentação node-thermal-printer:** https://github.com/Klemen1337/node-thermal-printer
- **PM2 Docs:** https://pm2.keymetrics.io/
- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

## 🆘 Suporte

Em caso de problemas:

1. Verificar logs: `pm2 logs print-server`
2. Testar localmente: `curl http://localhost:3001/api/health`
3. Ver status da impressora: `npm run test`
4. Consultar documentação: `/TUTORIAL_IMPRESSORA_TERMICA.md`

---

**✅ Setup Completo!** Agora sua impressora térmica está integrada em produção! 🎉
