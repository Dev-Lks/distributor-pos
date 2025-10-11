# ⚠️ Impressora Térmica e Deploy na Vercel

## 🚨 Problema Identificado

**A impressora térmica NÃO funciona quando o app está hospedado na Vercel (ou qualquer serviço cloud).**

### Por quê?

1. **Impressora física**: A impressora térmica precisa estar conectada via USB, Rede local ou Serial
2. **Servidor na nuvem**: A Vercel roda seu código em servidores nos EUA/Europa
3. **Sem acesso físico**: Os servidores da Vercel não têm acesso à sua impressora local

```
Seu Computador Local          Servidor Vercel (Nuvem)
┌─────────────────┐           ┌─────────────────┐
│  🖨️ Impressora  │           │                 │
│     (USB)       │  ❌ SEM   │   Seu App      │
│                 │  CONEXÃO  │                 │
└─────────────────┘           └─────────────────┘
```

---

## ✅ Soluções Possíveis

### **Solução 1: Arquitetura Híbrida (RECOMENDADA)**

Use a Vercel para o frontend/dashboard e um servidor local para impressão.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Frontend/Dashboard (Vercel - Nuvem)          │
│  - Interface do usuário                        │
│  - Gerenciamento de produtos                   │
│  - Relatórios, etc.                           │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 │ API REST/WebSocket
                 │
┌────────────────▼────────────────────────────────┐
│                                                 │
│  Servidor Local (Seu Computador/Raspberry Pi) │
│  - Conectado à impressora física              │
│  - Recebe comandos de impressão               │
│  - Envia jobs para a impressora               │
│                                                 │
└─────────────────────────────────────────────────┘
                 │
                 │ USB/Serial/Rede Local
                 │
            ┌────▼────┐
            │ 🖨️ Impressora │
            │   Térmica   │
            └─────────────┘
```

#### Como Implementar:

**1. Mantenha o app principal na Vercel**
- Dashboard, gestão de produtos, relatórios
- API principal

**2. Crie um servidor de impressão local**
- Rode em seu computador/Raspberry Pi
- Conecte à impressora física
- Exponha uma API simples

**3. Comunique via API**
- App na Vercel envia dados de impressão via HTTP/WebSocket
- Servidor local processa e imprime

---

### **Solução 2: Self-Hosted Completo**

Rode toda a aplicação em um servidor local (não na Vercel).

**Onde hospedar:**
- ✅ Seu próprio computador/servidor
- ✅ Raspberry Pi 4 (barato e eficiente)
- ✅ VPS local (se tiver IP fixo)
- ✅ NAS (Synology, QNAP, etc.)

**Como fazer:**
```bash
# No seu servidor local
npm run build
npm run start

# Ou com Docker
docker-compose up -d
```

**Vantagens:**
- ✅ Controle total
- ✅ Impressora funciona direto
- ✅ Mais rápido (rede local)

**Desvantagens:**
- ❌ Precisa manter servidor ligado 24/7
- ❌ Precisa configurar rede/firewall
- ❌ Manutenção manual

---

### **Solução 3: Servidor de Impressão Dedicado (PROFISSIONAL)**

Crie um microsserviço só para impressão que roda localmente.

```typescript
// print-server/index.ts
import express from 'express'
import { ThermalPrinterService } from './printer'

const app = express()
app.use(express.json())

const printer = new ThermalPrinterService({
  type: 'USB',
  connectionString: '/dev/usb/lp0',
  width: 48,
  encoding: 'UTF-8',
})

app.post('/api/print', async (req, res) => {
  try {
    const { type, data, authToken } = req.body
    
    // Validar token de segurança
    if (authToken !== process.env.PRINT_AUTH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Imprimir
    await printer.print(data, type)
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(3001, () => {
  console.log('🖨️  Print Server running on port 3001')
})
```

**No seu app principal (Vercel):**
```typescript
// lib/hardware/remotePrinter.ts
export async function printRemote(data: any, type: string) {
  const response = await fetch(`${process.env.PRINT_SERVER_URL}/api/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data,
      type,
      authToken: process.env.PRINT_AUTH_TOKEN,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to print')
  }
  
  return response.json()
}
```

---

## 🎯 Solução Recomendada Para Você

### **Opção A: Pequeno Negócio (1 PDV)**

**Use: Solução 2 (Self-Hosted)**

1. Compre um Raspberry Pi 4 (≈ R$ 500)
2. Instale o app nele
3. Conecte a impressora via USB
4. Configure domínio local ou use Tailscale/ngrok para acesso remoto

**Setup:**
```bash
# No Raspberry Pi
git clone seu-repo
cd claudiao
npm install
npm run build
npm run start

# Configure para iniciar automaticamente
sudo systemctl enable claudiao
```

### **Opção B: Múltiplos PDVs / Franquia**

**Use: Solução 3 (Servidor de Impressão Dedicado)**

1. App principal na Vercel (dashboard, gestão)
2. Servidor de impressão em cada PDV (Raspberry Pi)
3. Comunicação via WebSocket/API

**Benefícios:**
- ✅ Dashboard central na nuvem
- ✅ Cada PDV tem sua própria impressora
- ✅ Escalável
- ✅ Fácil de gerenciar

---

## 📝 Guia de Implementação: Arquitetura Híbrida

### Passo 1: Criar Servidor de Impressão Local

```bash
mkdir print-server
cd print-server
npm init -y
npm install express node-thermal-printer dotenv cors
```

**print-server/index.js:**
```javascript
const express = require('express')
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Configurar impressora
const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: process.env.PRINTER_PORT || '/dev/usb/lp0',
  width: 48,
})

// Endpoint de status
app.get('/api/printer/status', async (req, res) => {
  try {
    const isConnected = await printer.isPrinterConnected()
    res.json({
      connected: isConnected,
      online: isConnected,
      paperStatus: 'ok',
    })
  } catch (error) {
    res.json({
      connected: false,
      online: false,
      paperStatus: 'out',
      error: error.message,
    })
  }
})

// Endpoint de impressão
app.post('/api/printer/print', async (req, res) => {
  try {
    const { template, authToken } = req.body
    
    // Validar token
    if (authToken !== process.env.AUTH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Limpar buffer
    printer.clear()
    
    // Processar comandos
    for (const cmd of template.commands) {
      switch (cmd.type) {
        case 'text':
          if (cmd.bold) printer.bold(true)
          printer.println(cmd.value || '')
          if (cmd.bold) printer.bold(false)
          break
        case 'align':
          if (cmd.value === 'center') printer.alignCenter()
          else if (cmd.value === 'right') printer.alignRight()
          else printer.alignLeft()
          break
        case 'feed':
          for (let i = 0; i < (cmd.lines || 1); i++) {
            printer.newLine()
          }
          break
        case 'separator':
          printer.println((cmd.char || '-').repeat(48))
          break
        case 'cut':
          printer.cut()
          break
      }
    }
    
    // Imprimir
    await printer.execute()
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Teste
app.post('/api/printer/test', async (req, res) => {
  try {
    printer.clear()
    printer.alignCenter()
    printer.println('=== TESTE DE IMPRESSÃO ===')
    printer.newLine()
    printer.alignLeft()
    printer.println('Se você está lendo isso,')
    printer.println('sua impressora está funcionando!')
    printer.newLine()
    printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`)
    printer.newLine()
    printer.newLine()
    printer.cut()
    
    await printer.execute()
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🖨️  Print Server running on http://localhost:${PORT}`)
})
```

**print-server/.env:**
```env
PRINTER_PORT=/dev/usb/lp0
AUTH_TOKEN=seu-token-secreto-aqui
PORT=3001
```

### Passo 2: Atualizar App Principal (Vercel)

**lib/hardware/remotePrinter.ts:**
```typescript
'use client'

export interface PrinterConfig {
  serverUrl: string
  authToken: string
}

let config: PrinterConfig | null = null

export function configurePrintServer(cfg: PrinterConfig) {
  config = cfg
  // Salvar no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('print-server-config', JSON.stringify(cfg))
  }
}

export function loadPrintServerConfig(): PrinterConfig | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('print-server-config')
    if (saved) {
      config = JSON.parse(saved)
      return config
    }
  }
  return null
}

export async function printRemote(template: any) {
  if (!config) {
    config = loadPrintServerConfig()
  }
  
  if (!config) {
    throw new Error('Print server not configured')
  }
  
  const response = await fetch(`${config.serverUrl}/api/printer/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template,
      authToken: config.authToken,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Print failed')
  }
  
  return response.json()
}

export async function getPrinterStatus() {
  if (!config) {
    config = loadPrintServerConfig()
  }
  
  if (!config) {
    return {
      connected: false,
      online: false,
      paperStatus: 'out',
      error: 'Print server not configured',
    }
  }
  
  try {
    const response = await fetch(`${config.serverUrl}/api/printer/status`)
    return await response.json()
  } catch (error) {
    return {
      connected: false,
      online: false,
      paperStatus: 'out',
      error: error.message,
    }
  }
}
```

### Passo 3: Adicionar Configuração na UI

Adicione um campo para configurar o servidor de impressão:

```typescript
// No HardwareSettings.tsx, adicione:

const [printServerUrl, setPrintServerUrl] = useState('http://localhost:3001')
const [printServerToken, setPrintServerToken] = useState('')

// No render:
<div className="space-y-4">
  <div className="space-y-2">
    <Label>Servidor de Impressão (URL)</Label>
    <Input
      value={printServerUrl}
      onChange={(e) => setPrintServerUrl(e.target.value)}
      placeholder="http://192.168.1.100:3001"
    />
    <p className="text-xs text-muted-foreground">
      URL do servidor local de impressão (ex: http://localhost:3001)
    </p>
  </div>
  
  <div className="space-y-2">
    <Label>Token de Autenticação</Label>
    <Input
      type="password"
      value={printServerToken}
      onChange={(e) => setPrintServerToken(e.target.value)}
      placeholder="seu-token-secreto"
    />
  </div>
  
  <Button onClick={() => {
    configurePrintServer({
      serverUrl: printServerUrl,
      authToken: printServerToken,
    })
    toast.success('Configuração salva!')
  }}>
    Salvar Configuração
  </Button>
</div>
```

---

## 🚀 Como Usar

### No servidor local (onde a impressora está):
```bash
cd print-server
npm start
```

### No app (Vercel):
1. Configure o servidor de impressão nas configurações
2. Use normalmente - as impressões vão para o servidor local

---

## 📱 Alternativa: App Móvel Nativo

Se precisar de mobilidade total, considere criar um app React Native que:
- Roda no tablet/celular
- Conecta via Bluetooth à impressora
- Sincroniza dados com a Vercel via API

---

## ✅ Recomendação Final

**Para seu caso:**
1. **Deploy na Vercel**: Dashboard, relatórios, gestão
2. **Raspberry Pi local**: Servidor de impressão
3. **Comunicação**: API REST simples

**Custo:**
- Raspberry Pi 4: ~R$ 500 (única vez)
- Vercel: Grátis (hobby plan)
- Total: ~R$ 500

**Vantagens:**
- ✅ Melhor de dois mundos
- ✅ Dashboard sempre acessível (nuvem)
- ✅ Impressora funciona (local)
- ✅ Escalável

---

## 📞 Próximos Passos

1. Decida qual solução usar
2. Se escolher híbrida, posso criar os arquivos do servidor de impressão
3. Configure e teste

Qual solução faz mais sentido para você?
