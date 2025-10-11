# 🚀 Guia Rápido: Impressão na Vercel

## ⚡ Instalação em 5 Minutos

### 1️⃣ Instalar Servidor de Impressão

No computador onde a impressora está conectada:

```bash
cd print-server
chmod +x install.sh
./install.sh
```

### 2️⃣ Configurar

Edite o arquivo `.env`:

```bash
nano .env
```

**Mínimo necessário:**
```env
# Porta da impressora (MUDE SE NECESSÁRIO)
PRINTER_PORT=/dev/usb/lp0

# Token de segurança (CRIE UM FORTE!)
AUTH_TOKEN=seu-token-super-secreto-aqui-123456

# Adicione o domínio da Vercel
ALLOWED_ORIGINS=http://localhost:3000,https://seu-app.vercel.app
```

### 3️⃣ Iniciar Servidor

```bash
npm start
```

Você verá:
```
╔═══════════════════════════════════════╗
║   🖨️  SERVIDOR DE IMPRESSÃO        ║
╠═══════════════════════════════════════╣
║   Porta: 3001                        ║
║   Impressora: /dev/usb/lp0          ║
║   Status: Pronta ✅                  ║
╚═══════════════════════════════════════╝
```

### 4️⃣ Testar

```bash
npm test
```

Se funcionou, você verá uma página impressa! 🎉

### 5️⃣ Configurar no App

1. Acesse seu app na Vercel
2. Clique no ícone da impressora (canto superior direito)
3. Clique em "Configurar Servidor Remoto"
4. Preencha:
   - **URL:** `http://SEU_IP:3001` (ex: http://192.168.1.10:3001)
   - **Token:** O mesmo que você colocou no .env
5. Clique em "Testar Conexão"
6. Se OK, clique em "Imprimir Teste"
7. Salvar

Pronto! 🎊

---

## 🔍 Descobrir Seu IP

### Linux/Mac:
```bash
ip addr show | grep inet
# ou
ifconfig | grep inet
```

### Windows:
```cmd
ipconfig
```

Procure por algo como: `192.168.1.XXX`

---

## 🚨 Problemas Comuns

### ❌ "Não foi possível conectar ao servidor"

**Causa:** App não consegue alcançar o servidor

**Soluções:**
1. Verifique se o servidor está rodando: `npm start`
2. Teste localmente: http://localhost:3001/api/health
3. Verifique o firewall:
   ```bash
   # Linux
   sudo ufw allow 3001
   
   # Windows
   # Adicione regra no Windows Firewall para porta 3001
   ```
4. Use o IP correto (não `localhost` se estiver acessando de outro dispositivo)

### ❌ "Unauthorized"

**Causa:** Token incorreto

**Solução:**
- Verifique se o token no app é igual ao do arquivo `.env`
- Reinicie o servidor após mudar o `.env`

### ❌ "Impressora não conectada"

**Causa:** Servidor não encontra a impressora

**Soluções:**
1. Verifique se está ligada
2. Confirme a porta:
   ```bash
   # Linux
   ls /dev/usb/lp*
   
   # Windows
   # Gerenciador de Dispositivos > Portas (COM & LPT)
   ```
3. Verifique permissões (Linux):
   ```bash
   sudo chmod 666 /dev/usb/lp0
   ```
4. Reinicie o servidor: `npm start`

### ❌ "CORS error"

**Causa:** Domínio não autorizado

**Solução:**
Adicione seu domínio da Vercel no `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://seu-app.vercel.app
```

Reinicie o servidor.

---

## 🏠 Manter Servidor Rodando

### Opção 1: PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar
cd print-server
pm2 start index.js --name print-server

# Ver status
pm2 status

# Ver logs
pm2 logs print-server

# Parar
pm2 stop print-server

# Reiniciar
pm2 restart print-server

# Iniciar automaticamente no boot
pm2 startup
pm2 save
```

### Opção 2: tmux/screen

```bash
# Iniciar sessão
tmux new -s printer

# Rodar servidor
cd print-server
npm start

# Sair (deixar rodando)
Ctrl+B, D

# Retornar à sessão
tmux attach -t printer
```

### Opção 3: Systemd Service (Linux)

Ver seção completa no `print-server/README.md`

---

## 📱 Acessar de Outro Dispositivo

Se você quer imprimir de um celular/tablet na mesma rede:

1. Descubra o IP do computador com a impressora
2. Configure no app: `http://192.168.1.XXX:3001`
3. Certifique-se que estão na mesma rede Wi-Fi

---

## 🔒 Segurança

### Rede Local Apenas (Recomendado)

O servidor só deve ser acessível na sua rede local. Nunca exponha para a internet!

**Firewall:**
```bash
# Aceitar apenas rede local
sudo ufw allow from 192.168.1.0/24 to any port 3001
```

### Se Precisar de Acesso Externo

Use VPN (Tailscale, WireGuard) ou túnel SSH. **NUNCA** exponha direto!

---

## 💰 Custo Zero

Você pode usar qualquer computador que já tem:
- PC velho
- Laptop antigo
- Raspberry Pi (~R$ 300-500)

Basta deixar ligado e conectado à impressora.

---

## ⚙️ Configuração Avançada

### Múltiplas Impressoras

Edite `print-server/index.js`:
```javascript
// Adicionar rota para segunda impressora
app.post('/api/printer2/print', authenticate, async (req, res) => {
  // Use outra porta/IP
})
```

### SSL/HTTPS

Use nginx como proxy reverso:
```nginx
server {
    listen 443 ssl;
    server_name print.seudominio.local;
    
    ssl_certificate /caminho/cert.pem;
    ssl_certificate_key /caminho/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

### Logs Estruturados

Adicione Winston ou Pino para logs melhores.

---

## 📞 Precisa de Ajuda?

Consulte:
- `print-server/README.md` - Documentação completa do servidor
- `IMPRESSORA_E_VERCEL.md` - Explicação da arquitetura
- `CONFIGURACAO_IMPRESSORA.md` - Configuração de hardware

---

## ✅ Checklist Final

- [ ] Servidor instalado
- [ ] Arquivo `.env` configurado
- [ ] Token forte criado
- [ ] Domínio Vercel adicionado em ALLOWED_ORIGINS
- [ ] Servidor iniciado (`npm start`)
- [ ] Teste local funcionou (`npm test`)
- [ ] IP descoberto
- [ ] Firewall configurado (porta 3001 aberta)
- [ ] App configurado com IP e token
- [ ] Teste de impressão no app funcionou
- [ ] Servidor configurado para iniciar automaticamente

🎉 **Tudo pronto para produção!**
