# 🎯 Como Usar Impressão Remota

## 📋 Visão Geral

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│                 │         │                  │         │                │
│   App Vercel    │────────▶│  Print Server    │────────▶│   Impressora   │
│  (Nuvem ☁️)     │  HTTPS  │   (Local 🏠)     │   USB   │   Térmica 🖨️   │
│                 │         │                  │         │                │
└─────────────────┘         └──────────────────┘         └────────────────┘
     Navegador              PC/Raspberry Pi            Conectada por cabo
```

## 🔄 Fluxo de Impressão

1. **Usuário finaliza venda** no app (Vercel)
2. App envia template para **servidor local** via API
3. Servidor processa e **envia comandos** para impressora
4. Impressora **imprime o recibo**

---

## 📁 Estrutura de Arquivos

```
claudiao/
├── print-server/              ← Servidor local de impressão
│   ├── index.js              ← Código principal
│   ├── test.js               ← Script de teste
│   ├── package.json          ← Dependências
│   ├── .env                  ← SUAS CONFIGURAÇÕES
│   ├── .env.example          ← Exemplo de configuração
│   ├── install.sh            ← Instalador automático
│   └── README.md             ← Documentação completa
│
├── lib/hardware/
│   ├── remotePrinter.ts      ← Cliente (frontend)
│   └── printerTemplates.ts   ← Templates de recibo
│
├── components/hardware/
│   └── RemotePrinterConfig.tsx  ← UI de configuração
│
└── Documentação:
    ├── GUIA_RAPIDO_VERCEL_IMPRESSAO.md  ← Você está aqui!
    ├── IMPRESSORA_E_VERCEL.md           ← Arquitetura completa
    └── CONFIGURACAO_IMPRESSORA.md       ← Setup de hardware
```

---

## 🚀 Setup Inicial (Primeira Vez)

### No computador com a impressora:

```bash
# 1. Entre na pasta do servidor
cd print-server

# 2. Instale tudo automaticamente
./install.sh

# 3. Configure (edite o .env)
nano .env

# 4. Inicie o servidor
npm start
```

### No app (navegador):

1. Abra seu app na Vercel
2. Clique no **ícone de impressora** (canto superior direito)
3. Clique em **"Configurar Servidor Remoto"**
4. Preencha:
   - URL: `http://192.168.1.XXX:3001` (IP do computador)
   - Token: Mesmo do `.env`
5. Teste e salve

---

## 🔧 Uso Diário

### Iniciar servidor pela manhã:

```bash
cd print-server
npm start
```

**Ou deixe rodando sempre:**
```bash
npm install -g pm2
pm2 start index.js --name print-server
pm2 save
```

### Usar no app:

Funciona normalmente! O app automaticamente:
- Detecta que está na Vercel
- Usa impressão remota
- Envia para seu servidor local

---

## 🐛 Troubleshooting Visual

### ❌ Não imprime?

```
Verifique cada etapa:

1. Servidor está rodando?
   ├─ SIM → Próximo
   └─ NÃO → Execute: npm start

2. Teste local funciona?
   ├─ SIM → Próximo
   └─ NÃO → Verifique:
            - Impressora ligada?
            - Cabo conectado?
            - Porta correta no .env?

3. App conecta ao servidor?
   ├─ SIM → Próximo
   └─ NÃO → Verifique:
            - IP correto?
            - Firewall bloqueando?
            - Mesma rede Wi-Fi?

4. Token está correto?
   ├─ SIM → Próximo
   └─ NÃO → Corrija no app ou .env

5. Impressora tem papel?
   ├─ SIM → Chame suporte 😅
   └─ NÃO → Coloque papel!
```

---

## 🔍 Comandos Úteis

### Verificar se servidor está rodando:
```bash
curl http://localhost:3001/api/health
```

**Resposta esperada:**
```json
{"success":true,"status":"online"}
```

### Testar impressão:
```bash
npm test
```

### Ver logs (se usando PM2):
```bash
pm2 logs print-server
```

### Reiniciar servidor:
```bash
# Normal
Ctrl+C
npm start

# Com PM2
pm2 restart print-server
```

### Parar servidor:
```bash
# Normal
Ctrl+C

# Com PM2
pm2 stop print-server
```

---

## 🌐 Descobrir Seu IP

### Linux/Mac:
```bash
hostname -I | awk '{print $1}'
```

### Windows:
```cmd
ipconfig | findstr IPv4
```

### Ou use o roteador:
1. Acesse 192.168.1.1 (ou 192.168.0.1)
2. Procure "Dispositivos Conectados"
3. Encontre o computador com a impressora

---

## 📱 Configurar no App (Passo a Passo)

### Desktop:
```
1. Clique no ícone 🖨️ (canto superior direito)
2. Clique em "Configurações" ou ícone de engrenagem
3. Clique em "Configurar Servidor Remoto"
```

### Mobile:
```
1. Menu ☰ (canto superior esquerdo)
2. Hardware
3. Configurar Servidor Remoto
```

---

## 💡 Dicas Pro

### 1. Use IP Fixo

No roteador, reserve um IP fixo para o PC com a impressora.

**Por quê?** O IP não muda, não precisa reconfigurar o app.

### 2. Atalho para Iniciar

**Linux/Mac:**
```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
alias printer="cd ~/Projects/claudiao/print-server && npm start"
```

Depois só digite: `printer`

**Windows:**
Crie um `.bat`:
```batch
@echo off
cd C:\caminho\para\print-server
npm start
pause
```

### 3. Notificação de Status

Adicione no script de inicialização do sistema:
```bash
curl http://localhost:3001/api/health && \
  notify-send "Servidor de Impressão" "Online ✅"
```

### 4. Backup da Configuração

```bash
cp print-server/.env print-server/.env.backup
```

---

## 🎓 Entendendo o Código

### Como o App Decide Usar Impressão Remota?

Em `useThermalPrinter.ts` (ou similar):

```typescript
// Se estiver na Vercel (sem acesso direto à USB)
if (process.env.NEXT_PUBLIC_VERCEL) {
  return remotePrinter.print(template)
}

// Se local, usa node-thermal-printer
return localPrinter.print(template)
```

### Como Adicionar Seu Template?

Em `printerTemplates.ts`:

```typescript
export function meuTemplatePersonalizado(data: any) {
  return {
    commands: [
      { type: 'align', value: 'center' },
      { type: 'text', value: 'MEU TEMPLATE', bold: true },
      { type: 'separator' },
      // ... seus comandos
      { type: 'cut' },
    ],
  }
}
```

Depois use:
```typescript
const template = meuTemplatePersonalizado(saleData)
await printer.print(template)
```

---

## 🔐 Segurança

### ✅ Boas Práticas:

1. **Token forte:** Use no mínimo 32 caracteres aleatórios
2. **Firewall:** Bloqueie acesso externo à porta 3001
3. **Rede local:** Nunca exponha na internet pública
4. **HTTPS:** Use VPN ou SSL se precisar acesso remoto
5. **Logs:** Monitore acessos suspeitos

### ❌ NUNCA Faça:

1. Expor porta 3001 diretamente na internet
2. Usar token fraco tipo "123456"
3. Desabilitar autenticação
4. Compartilhar token publicamente

---

## 📊 Monitoramento

### Status Dashboard (adicional)

Você pode adicionar uma rota no servidor:

```javascript
app.get('/api/stats', authenticate, (req, res) => {
  res.json({
    uptime: process.uptime(),
    prints: printCount,
    lastPrint: lastPrintTime,
    errors: errorCount,
  })
})
```

E criar um dashboard no app mostrando essas métricas.

---

## 🎉 Conclusão

Você agora tem:

✅ Servidor de impressão funcional  
✅ App na Vercel imprimindo localmente  
✅ Configuração salva e persistente  
✅ Sistema de testes  
✅ Documentação completa  

**Próximos passos:**
1. Customize seus templates de recibo
2. Configure PM2 para auto-start
3. Adicione mais impressoras se necessário

**Dúvidas?** Consulte:
- `print-server/README.md`
- `IMPRESSORA_E_VERCEL.md`
- `CONFIGURACAO_IMPRESSORA.md`

---

**Feito com ❤️ para facilitar sua vida!**
