# 🖨️ Tutorial: Setup e Uso da Impressora Térmica

## 📋 Índice
1. [Requisitos](#requisitos)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Como Usar](#como-usar)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos

### Hardware
- **Impressora térmica** compatível com ESC/POS (recomendado: Epson TM-T20, Bematech MP-4200)
- **Cabo USB** ou **Conexão de Rede**

### Software
- **Node.js** versão 16 ou superior
- **Linux/Windows/MacOS**

---

## 📦 Instalação

### 1. Instalar Dependências do Print Server

```bash
cd print-server
npm install
```

ou

```bash
cd print-server
pnpm install
```

### 2. Conectar a Impressora

#### No Linux:
1. Conecte a impressora via USB
2. Verifique a porta:
```bash
ls /dev/usb/
```
Você verá algo como: `lp0`, `lp1`

3. Dê permissões:
```bash
sudo chmod 666 /dev/usb/lp0
```

#### No Windows:
1. Conecte via USB
2. A porta será: `USB001`, `LPT1`, etc.
3. Verifique em: Painel de Controle → Dispositivos e Impressoras

#### No MacOS:
1. Conecte via USB
2. A porta será: `/dev/cu.usbmodem*` ou `/dev/tty.usbmodem*`

---

## ⚙️ Configuração

### 1. Criar arquivo `.env` no print-server

```bash
cd print-server
cp .env.example .env
```

### 2. Editar `.env`:

```env
# Porta do servidor
PORT=3001

# Porta da impressora
PRINTER_PORT=/dev/usb/lp0           # Linux
# PRINTER_PORT=USB001                # Windows
# PRINTER_PORT=/dev/cu.usbmodem14101 # MacOS

# Largura da impressora (caracteres)
PRINTER_WIDTH=48

# Token de autenticação (opcional para /print)
AUTH_TOKEN=seu_token_secreto_aqui

# Origens permitidas (CORS)
ALLOWED_ORIGINS=http://localhost:3000,https://seu-dominio.com
```

### 3. No projeto principal (.env na raiz):

```env
# URL do print server
PRINT_SERVER_URL=http://localhost:3001
```

---

## 🚀 Como Usar

### 1. Iniciar o Print Server

#### Desenvolvimento:
```bash
cd print-server
npm run dev
```

#### Produção:
```bash
cd print-server
npm start
```

#### Com PM2 (recomendado para produção):
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar servidor
cd print-server
pm2 start index.js --name "print-server"

# Ver status
pm2 status

# Ver logs
pm2 logs print-server

# Reiniciar
pm2 restart print-server

# Parar
pm2 stop print-server
```

### 2. Verificar Status

Acesse: `http://localhost:3001/api/health`

Resposta esperada:
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-10-12T14:30:00.000Z"
}
```

### 3. Testar Impressora

```bash
cd print-server
node test.js
```

Ou via API:
```bash
curl -X POST http://localhost:3001/api/printer/test \
  -H "Authorization: Bearer seu_token_secreto_aqui" \
  -H "Content-Type: application/json"
```

### 4. Imprimir Delivery

#### Pela Interface Web:
1. Acesse **Dashboard → Delivery**
2. Clique em uma entrega
3. Clique no botão **"Imprimir"** 🖨️
4. O comprovante será impresso automaticamente

#### Via API:
```bash
curl -X POST http://localhost:3001/print \
  -H "Content-Type: application/json" \
  -d '{
    "type": "delivery",
    "data": {
      "header": {
        "title": "COMPROVANTE DE ENTREGA",
        "deliveryNumber": "DEL-2025-001",
        "date": "12/10/2025 14:30",
        "status": "PENDING"
      },
      "customer": {
        "name": "João Silva",
        "phone": "(11) 98765-4321"
      },
      "address": {
        "street": "Rua das Flores",
        "number": "123",
        "district": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "postalCode": "01310-100"
      },
      "items": [
        {
          "name": "Produto A",
          "quantity": 2,
          "unitPrice": 10.00,
          "totalPrice": 20.00
        }
      ],
      "financial": {
        "subtotal": 20.00,
        "deliveryFee": 5.00,
        "discountValue": 0,
        "total": 25.00
      },
      "payment": {
        "method": "MONEY",
        "paidInAdvance": false
      }
    }
  }'
```

---

## 🐛 Troubleshooting

### Problema: "Impressora não disponível"

#### Solução 1: Verificar conexão
```bash
# Linux
ls -l /dev/usb/lp*

# Se não aparecer, reconecte o USB
sudo dmesg | grep -i usb
```

#### Solução 2: Verificar permissões (Linux)
```bash
sudo chmod 666 /dev/usb/lp0

# Ou adicionar seu usuário ao grupo lp
sudo usermod -a -G lp $USER
# Fazer logout e login novamente
```

#### Solução 3: Verificar porta no .env
```env
# Tente diferentes portas
PRINTER_PORT=/dev/usb/lp0
# ou
PRINTER_PORT=/dev/usb/lp1
```

### Problema: Caracteres estranhos na impressão

#### Solução: Ajustar encoding
No `print-server/index.js`:
```javascript
let printerConfig = {
  type: PrinterTypes.EPSON,
  interface: process.env.PRINTER_PORT || '/dev/usb/lp0',
  width: parseInt(process.env.PRINTER_WIDTH) || 48,
  characterSet: 'BRAZIL',  // ← Adicionar
  removeSpecialCharacters: false,
}
```

### Problema: Papel não corta

#### Solução: Verificar modelo da impressora
Algumas impressoras não suportam o comando de corte. Comente a linha:
```javascript
// printer.cut()  // ← Comentar esta linha
```

### Problema: Print server não inicia

#### Solução 1: Verificar porta em uso
```bash
# Linux/Mac
lsof -i :3001

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
```

#### Solução 2: Mudar porta
No `.env`:
```env
PORT=3002  # ou outra porta livre
```

### Problema: Erro "Permission denied" (Linux)

#### Solução: Adicionar regra udev
1. Criar arquivo `/etc/udev/rules.d/99-thermal-printer.rules`:
```bash
sudo nano /etc/udev/rules.d/99-thermal-printer.rules
```

2. Adicionar:
```
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0202", MODE="0666"
```
(Ajuste `idVendor` e `idProduct` para sua impressora)

3. Recarregar regras:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

4. Reconectar impressora

---

## 📝 Comandos Úteis

### PM2 (Produção)
```bash
# Iniciar
pm2 start print-server/index.js --name "print-server"

# Auto-start no boot
pm2 startup
pm2 save

# Monitorar
pm2 monit

# Logs
pm2 logs print-server

# Restart
pm2 restart print-server

# Stop
pm2 stop print-server

# Delete
pm2 delete print-server
```

### Systemd (Linux - alternativa ao PM2)

1. Criar serviço:
```bash
sudo nano /etc/systemd/system/print-server.service
```

2. Conteúdo:
```ini
[Unit]
Description=Thermal Printer Server
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/print-server
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

3. Ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable print-server
sudo systemctl start print-server
sudo systemctl status print-server
```

---

## ✅ Checklist de Setup

- [ ] Node.js instalado
- [ ] Impressora conectada (USB ou Rede)
- [ ] Porta da impressora identificada
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Print server iniciado
- [ ] Teste de impressão realizado
- [ ] URL do print server configurada no projeto principal
- [ ] Delivery impresso com sucesso

---

## 🎯 Próximos Passos

1. **Configurar PM2** para auto-restart
2. **Testar em produção** com diferentes impressoras
3. **Adicionar outros tipos** de impressão (recibos, cupons fiscais)
4. **Implementar fila** de impressão para múltiplas impressoras
5. **Dashboard de monitoramento** de impressões

---

## 📚 Documentação Adicional

- [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer)
- [ESC/POS Commands](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**Precisa de ajuda?** Entre em contato com o suporte técnico.
