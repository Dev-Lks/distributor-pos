# 🖨️ Servidor de Impressão Local

Servidor Node.js para gerenciar impressão em impressoras térmicas locais, permitindo que aplicações hospedadas na nuvem (como Vercel) possam imprimir em impressoras físicas.

## 🚀 Início Rápido

### 1. Instalar dependências
```bash
cd print-server
npm install
```

### 2. Configurar
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
nano .env
```

**Configurações disponíveis (.env):**
```env
# Porta da impressora
PRINTER_PORT=/dev/usb/lp0     # Linux/Mac
# PRINTER_PORT=COM3            # Windows
# PRINTER_PORT=192.168.1.100:9100  # Rede

# Token de autenticação (MUDE ISSO!)
AUTH_TOKEN=meu-token-super-secreto-123456

# Porta do servidor
PORT=3001

# Largura do papel (caracteres)
PRINTER_WIDTH=48

# Origens permitidas (CORS)
ALLOWED_ORIGINS=http://localhost:3000,https://seu-app.vercel.app
```

### 3. Iniciar servidor
```bash
npm start

# Ou em modo desenvolvimento (auto-reload)
npm run dev
```

### 4. Testar
```bash
npm test
```

## 📡 API Endpoints

### GET /api/health
Health check do servidor.

**Resposta:**
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-10-11T14:30:00.000Z"
}
```

### GET /api/printer/status
Verificar status da impressora.

**Resposta:**
```json
{
  "success": true,
  "connected": true,
  "online": true,
  "paperStatus": "ok",
  "config": {
    "port": "/dev/usb/lp0",
    "width": 48
  }
}
```

### POST /api/printer/configure
Reconfigurar impressora.

**Headers:**
```
Authorization: Bearer SEU_TOKEN
```

**Body:**
```json
{
  "port": "/dev/usb/lp0",
  "width": 48,
  "type": "EPSON"
}
```

### POST /api/printer/print
Imprimir um template.

**Headers:**
```
Authorization: Bearer SEU_TOKEN
```

**Body:**
```json
{
  "template": {
    "commands": [
      { "type": "align", "value": "center" },
      { "type": "text", "value": "MINHA LOJA", "bold": true, "size": "large" },
      { "type": "feed", "lines": 1 },
      { "type": "separator", "char": "=" },
      { "type": "text", "value": "Total: R$ 10.00" },
      { "type": "feed", "lines": 2 },
      { "type": "cut" }
    ]
  }
}
```

**Tipos de comandos:**
- `align`: `left`, `center`, `right`
- `text`: `value`, `bold`, `size` (small/normal/large)
- `feed`: `lines` (número)
- `separator`: `char` (caractere)
- `qrcode`: `data` (string)
- `barcode`: `data` (string)
- `cut`: cortar papel

### POST /api/printer/test
Imprimir página de teste.

**Headers:**
```
Authorization: Bearer SEU_TOKEN
```

## 🔒 Segurança

1. **Mude o AUTH_TOKEN**: Use um token forte e único
2. **Configure CORS**: Limite os domínios permitidos em ALLOWED_ORIGINS
3. **Use HTTPS**: Em produção, use um proxy reverso com SSL (nginx, caddy)
4. **Firewall**: Bloqueie a porta 3001 para acesso externo (apenas local/VPN)

## 🐧 Linux: Permissões da Impressora

Se você tiver problemas de permissão no Linux:

```bash
# Adicionar usuário ao grupo lp
sudo usermod -a -G lp $USER

# Ou dar permissão direta
sudo chmod 666 /dev/usb/lp0

# Criar regra udev permanente
sudo nano /etc/udev/rules.d/99-printer.rules
```

Adicione:
```
SUBSYSTEM=="usb", ATTR{idVendor}=="XXXX", ATTR{idProduct}=="YYYY", MODE="0666"
```

Recarregue:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## 🪟 Windows: Encontrar Porta COM

1. Abra o Gerenciador de Dispositivos
2. Expanda "Portas (COM e LPT)"
3. Encontre sua impressora (ex: COM3)
4. Use essa porta no .env

## 🌐 Rede: Impressora via TCP/IP

Se sua impressora está na rede:

```env
PRINTER_PORT=192.168.1.100:9100
```

**Descobrir IP:**
1. Imprima página de configuração da impressora
2. Ou verifique no roteador

## 🔄 Iniciar Automaticamente

### Linux (systemd)

```bash
# Criar serviço
sudo nano /etc/systemd/system/print-server.service
```

```ini
[Unit]
Description=Print Server
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/print-server
ExecStart=/usr/bin/node index.js
Restart=always
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar e iniciar
sudo systemctl enable print-server
sudo systemctl start print-server

# Verificar status
sudo systemctl status print-server
```

### Windows (NSSM)

1. Baixe NSSM: https://nssm.cc/download
2. Execute: `nssm install PrintServer`
3. Configure:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\caminho\para\print-server`
   - Arguments: `index.js`

## 📊 Logs

Os logs aparecem no console. Para salvar em arquivo:

```bash
# Linux/Mac
npm start > print-server.log 2>&1

# Ou com PM2
npm install -g pm2
pm2 start index.js --name print-server
pm2 logs print-server
```

## 🐳 Docker (Opcional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --production

# Copiar código
COPY . .

# Expor porta
EXPOSE 3001

# Executar
CMD ["node", "index.js"]
```

```bash
# Build
docker build -t print-server .

# Run (com acesso à impressora USB)
docker run -d --device=/dev/usb/lp0 -p 3001:3001 --env-file .env print-server
```

## 🆘 Troubleshooting

### "Impressora não disponível"
- Verifique se está ligada
- Confirme a porta no .env
- Linux: verifique permissões

### "Unauthorized"
- Verifique se o AUTH_TOKEN está correto
- Certifique-se de enviar no header Authorization

### "CORS error"
- Adicione seu domínio em ALLOWED_ORIGINS
- Formato: `http://localhost:3000,https://app.vercel.app`

### Impressão não sai
- Verifique se há papel
- Teste com `npm test`
- Veja os logs do servidor

## 📞 Suporte

Para mais informações, consulte:
- `IMPRESSORA_E_VERCEL.md` - Arquitetura completa
- `CONFIGURACAO_IMPRESSORA.md` - Configuração de impressora
