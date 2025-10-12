# ⚡ Guia Rápido: Impressão de Deliveries

## ✅ Status Atual

- ✅ Variáveis configuradas na Vercel (`PRINT_SERVER_URL`, `PRINT_SERVER_TOKEN`)
- ✅ Endpoint de impressão de deliveries funcionando
- ✅ Botão de configuração desabilitado (não é mais necessário)

---

## 🖨️ Como Imprimir Deliveries AGORA

### 1️⃣ Configurar Print-Server (UMA VEZ)

**No computador onde a impressora está conectada:**

```bash
# Baixar código
git clone https://github.com/Dev-Lks/claudiao.git
cd claudiao/print-server

# Instalar
./install.sh

# Configurar
nano .env
```

**Edite o `.env`:**
```env
PORT=3001
PRINTER_PORT=/dev/usb/lp0  # Sua porta USB
PRINTER_WIDTH=48
AUTH_TOKEN=meu-token-super-secreto-123456  # MESMO da Vercel!
ALLOWED_ORIGINS=https://www.nitrobeer.com.br,https://nitrobeer.com.br
```

```bash
# Testar
npm run test  # Deve imprimir um recibo de teste

# Iniciar
pm2 start index.js --name print-server
pm2 save
```

### 2️⃣ Expor para Internet (UMA VEZ)

**Escolha UMA opção:**

#### Opção A: Cloudflare Tunnel (Recomendado)
```bash
# Instalar
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Criar túnel
cloudflared tunnel --url http://localhost:3001

# Vai gerar URL tipo: https://abc.trycloudflare.com
# COPIE ESSA URL!
```

#### Opção B: Ngrok
```bash
npm install -g ngrok
ngrok authtoken SEU_TOKEN  # Pegar em ngrok.com
ngrok http 3001

# Vai gerar URL tipo: https://xyz.ngrok.io
# COPIE ESSA URL!
```

### 3️⃣ Atualizar URL na Vercel (SE MUDOU)

Se você usou túnel temporário (ngrok/cloudflare sem domínio):

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Edite `PRINT_SERVER_URL` para a nova URL do túnel
3. Redeploy o projeto

---

## 🎯 USAR Impressão (Sempre)

Agora é **SUPER SIMPLES**:

1. Acesse: https://www.nitrobeer.com.br/dashboard/delivery
2. Clique em qualquer entrega
3. Clique no botão **"Imprimir"** 🖨️
4. **PRONTO!** O recibo vai sair da impressora! ✨

---

## 🔍 Verificar se está Funcionando

### No servidor local:
```bash
# Ver se print-server está rodando
pm2 status

# Ver logs em tempo real
pm2 logs print-server

# Testar localmente
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{
  "success": true,
  "status": "online"
}
```

### Pela internet:
```bash
curl https://sua-url-do-tunnel/api/health
```

---

## ❌ NÃO Tente Mais:

- ❌ **NÃO** clique no botão "Configurar Hardware" nas páginas de vendas
- ❌ **NÃO** tente configurar impressora pela interface web
- ❌ **NÃO** use o endpoint `/api/hardware/printer/configure`

Tudo isso foi **desabilitado** porque não funciona em serverless (Vercel).

---

## ✅ O que Fazer:

- ✅ Configure o **print-server no servidor local** (passos acima)
- ✅ Use o botão **"Imprimir"** nas páginas de delivery
- ✅ A impressão é **automática** via API

---

## 🐛 Troubleshooting

### Erro: "Print-server não está acessível"

**Verificar:**
```bash
# 1. Print-server está rodando?
pm2 status

# 2. Túnel está ativo?
ps aux | grep cloudflared  # ou ngrok

# 3. URL correta na Vercel?
# Verifique em: https://vercel.com/projeto/settings/environment-variables
```

### Erro: "Impressora não disponível"

**Verificar:**
```bash
# 1. Impressora conectada?
ls /dev/usb/lp*

# 2. Permissões OK?
sudo chmod 666 /dev/usb/lp0

# 3. Testar impressora
cd print-server
npm run test
```

### Print-server para de responder

**Reiniciar:**
```bash
pm2 restart print-server
pm2 logs print-server  # Ver o que aconteceu
```

---

## 📊 Resumo

| O que | Onde | Quando |
|-------|------|--------|
| **Configurar print-server** | Servidor local | UMA VEZ |
| **Expor túnel** | Servidor local | UMA VEZ (ou sempre se temporário) |
| **Configurar variáveis** | Vercel | UMA VEZ (ou quando URL mudar) |
| **Imprimir delivery** | Interface web | SEMPRE que quiser imprimir |

---

## 🎉 Pronto!

Depois de configurar UMA VEZ:
1. Print-server rodando localmente
2. Túnel expondo para internet
3. Variáveis configuradas na Vercel

Você pode simplesmente:
- Acessar delivery
- Clicar em "Imprimir"
- **BOOM!** 🖨️ Impresso!

---

**📚 Documentação Completa:**
- `/TUTORIAL_IMPRESSORA_TERMICA.md` - Setup detalhado
- `/DEPLOY_IMPRESSORA_PRODUCAO.md` - Deploy em produção
- `/CHECKLIST_PRODUCAO_IMPRESSORA.md` - Checklist rápido
