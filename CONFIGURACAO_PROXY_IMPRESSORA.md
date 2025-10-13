# 🔧 Configuração da Impressora com Print Server

## ✅ O que foi implementado

A impressora térmica agora funciona através de um **proxy** no Next.js que encaminha as requisições para o print-server rodando em um servidor separado.

### Arquitetura

```
┌─────────────────────┐
│   Browser/UI        │
│  (Next.js Client)   │
└──────────┬──────────┘
           │
           │ /api/hardware/printer/*
           ▼
┌─────────────────────┐
│   Next.js API       │
│  (Vercel/Serverless)│ ◄─── Proxy
└──────────┬──────────┘
           │
           │ HTTPS
           ▼
┌─────────────────────┐
│   Print Server      │
│ (Cloudflare Tunnel) │ ◄─── https://print.nitrobeer.com.br
│   (VPS/Local)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Impressora Térmica  │
│   (USB/Serial)      │
└─────────────────────┘
```

## 📝 Passo a Passo de Configuração

### 1. Configurar Variáveis no Next.js (Vercel)

No painel da Vercel ou no arquivo `.env.local`:

```bash
PRINT_SERVER_URL=https://print.nitrobeer.com.br
PRINT_SERVER_AUTH_TOKEN=seu-token-super-secreto-aqui
```

**IMPORTANTE:** O `PRINT_SERVER_AUTH_TOKEN` deve ser o mesmo configurado no print-server!

### 2. Verificar Configuração do Print Server

No servidor onde o print-server está rodando, verifique o arquivo `.env`:

```bash
# No servidor/VPS
cd /caminho/do/print-server
cat .env
```

Deve conter:

```bash
PORT=3001
PRINTER_PORT=/dev/usb/lp0
PRINTER_WIDTH=48
AUTH_TOKEN=seu-token-super-secreto-aqui  # ◄─── Mesmo token!
ALLOWED_ORIGINS=https://www.nitrobeer.com.br,https://nitrobeer.com.br
```

### 3. Testar Conexão

#### 3.1. Testar Print Server Diretamente

```bash
# Status
curl https://print.nitrobeer.com.br/api/health

# Status da impressora (precisa do token)
curl -H "Authorization: Bearer seu-token-super-secreto-aqui" \
     https://print.nitrobeer.com.br/api/printer/status
```

#### 3.2. Testar via UI do Next.js

1. Acesse a página de configuração da impressora
2. Configure a porta (ex: `/dev/usb/lp0`)
3. Clique em "Salvar Configuração"
4. Clique em "Testar Impressão"

### 4. Logs e Troubleshooting

#### Ver logs do print-server

```bash
# Se usando PM2
pm2 logs print-server

# Se rodando direto
journalctl -u print-server -f
```

#### Problemas Comuns

##### ❌ "Print server não configurado"

**Solução:** Configure `PRINT_SERVER_URL` na Vercel:

```bash
vercel env add PRINT_SERVER_URL
# Digite: https://print.nitrobeer.com.br
```

##### ❌ "Unauthorized - Token inválido"

**Solução:** Configure `PRINT_SERVER_AUTH_TOKEN` na Vercel com o mesmo valor do print-server:

```bash
vercel env add PRINT_SERVER_AUTH_TOKEN
# Digite o mesmo token do print-server
```

##### ❌ "Erro ao conectar ao print-server"

**Possíveis causas:**

1. **Print-server não está rodando**
   ```bash
   pm2 restart print-server
   ```

2. **Cloudflare Tunnel não está ativo**
   ```bash
   cloudflared tunnel list
   cloudflared tunnel run print-server
   ```

3. **Firewall bloqueando**
   ```bash
   sudo ufw allow 3001/tcp
   ```

4. **CORS bloqueando**
   - Adicione o domínio do Next.js em `ALLOWED_ORIGINS` no print-server

##### ❌ "Impressora não disponível"

1. **Verificar conexão física**
   ```bash
   lsusb | grep -i printer
   ls -la /dev/usb/lp*
   ```

2. **Testar impressora diretamente**
   ```bash
   echo "Teste" > /dev/usb/lp0
   ```

3. **Verificar permissões**
   ```bash
   sudo usermod -a -G lp $USER
   sudo chmod 666 /dev/usb/lp0
   ```

### 5. Deploy e Produção

#### 5.1. Na Vercel

1. Vá em **Settings > Environment Variables**
2. Adicione:
   - `PRINT_SERVER_URL` = `https://print.nitrobeer.com.br`
   - `PRINT_SERVER_AUTH_TOKEN` = (seu token secreto)
3. Faça redeploy:
   ```bash
   vercel --prod
   ```

#### 5.2. No Servidor do Print-Server

1. **Certifique-se que está rodando:**
   ```bash
   pm2 status
   pm2 startup  # Configurar para iniciar no boot
   pm2 save
   ```

2. **Manter Cloudflare Tunnel sempre ativo:**
   ```bash
   sudo cloudflared service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   ```

## 🧪 Testes

### Teste Completo

```bash
# 1. Health check
curl https://print.nitrobeer.com.br/api/health

# 2. Status (com auth)
curl -H "Authorization: Bearer seu-token" \
     https://print.nitrobeer.com.br/api/printer/status

# 3. Teste de impressão (com auth)
curl -X POST \
     -H "Authorization: Bearer seu-token" \
     -H "Content-Type: application/json" \
     https://print.nitrobeer.com.br/api/printer/test

# 4. Via Next.js (proxy)
curl https://www.nitrobeer.com.br/api/hardware/printer/status
```

## 📚 Arquivos Modificados

- ✅ `/app/api/hardware/printer/configure/route.ts` - Proxy para configuração
- ✅ `/app/api/hardware/printer/status/route.ts` - Proxy para status
- ✅ `/app/api/hardware/printer/test/route.ts` - Proxy para teste
- ✅ `/app/api/hardware/printer/print/route.ts` - Gera template + envia para print-server
- ✅ `.env.example` - Documentação das variáveis

## 🔐 Segurança

1. **Nunca exponha o AUTH_TOKEN publicamente**
2. **Use HTTPS sempre** (Cloudflare Tunnel garante isso)
3. **Configure CORS corretamente** no print-server
4. **Mantenha o print-server atualizado**

## 🎯 Próximos Passos

- [ ] Configurar `PRINT_SERVER_URL` e `PRINT_SERVER_AUTH_TOKEN` na Vercel
- [ ] Testar configuração pela UI
- [ ] Testar impressão de recibo de venda
- [ ] Configurar backup automático do print-server
- [ ] Monitorar logs do print-server

## 📞 Suporte

Se precisar de ajuda, verifique:
- `/TUTORIAL_IMPRESSORA_TERMICA.md`
- `/DEPLOY_IMPRESSORA_PRODUCAO.md`
- `/print-server/README.md`
