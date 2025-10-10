# 🎯 Guia Rápido: Scanner & Impressora

## 🏷️ Como usar o Scanner de Códigos de Barras

### No PDV (Vendas)
```
1. 📱 Página já está pronta para receber scans
2. 🔍 Escaneie o produto
3. ✅ Produto é adicionado ao carrinho automaticamente
4. 🔊 Som de "beep" confirma sucesso
```

**Visual:**
```
┌──────────────────────────────────────────┐
│ 🏷️ [Código de barras...]        [SCAN]  │ ← Input sempre visível
└──────────────────────────────────────────┘

Carrinho (2 itens)
├─ Cerveja Heineken 350ml  R$ 4,50  x2
└─ Coca-Cola 2L           R$ 8,90  x1
```

---

### Em Produtos
```
1. 🔍 Escaneie o código
2. Se existe → Abre edição ✏️
3. Se não existe → Abre cadastro rápido ➕
```

**Visual:**
```
Produto ENCONTRADO:
┌─────────────────────────────────┐
│ ✏️  Editar: Heineken 350ml     │
│                                 │
│ Nome: [Heineken 350ml       ]  │
│ Preço: [R$ 4,50            ]  │
│ ...                            │
└─────────────────────────────────┘

Produto NÃO ENCONTRADO:
┌─────────────────────────────────┐
│ ➕ Cadastro Rápido              │
│                                 │
│ Barcode: [7891234567890     ]  │ ← Já preenchido!
│ Nome: [________________     ]  │
│ Preço: [________________    ]  │
└─────────────────────────────────┘
```

---

### No Inventário
```
1. 🔍 Escaneie o produto
2. 📦 Modal de adicionar estoque abre
3. ➕ Digite quantidade
4. ✅ Confirme
```

**Visual:**
```
┌─────────────────────────────────┐
│ 📦 Adicionar Estoque            │
│                                 │
│ Produto: Heineken 350ml         │
│ Local: [Câmara Fria ▼]         │
│ Quantidade: [24            ]   │
│                                 │
│         [Cancelar] [Adicionar] │
└─────────────────────────────────┘
```

---

## 🖨️ Como usar a Impressora Térmica

### Status da Impressora

**Localização:** Canto superior direito (PDV e Encomendas)

```
┌──────────────────┐
│ 🖨️ Impressora    │
│    ✓ Pronta     │  ← Verde = OK
└──────────────────┘

┌──────────────────┐
│ 🖨️ Impressora    │
│    ⚠️ Sem papel  │  ← Vermelho = Atenção
└──────────────────┘

┌──────────────────┐
│ 🖨️ Impressora    │
│    🔄 Imprimindo │  ← Azul = Processando
└──────────────────┘
```

---

### Impressão Automática no PDV

**Quando imprime:**
- ✅ Ao finalizar venda
- ✅ Ao fechar caixa
- ✅ Ao registrar transação (suprimento/sangria)

**O que imprime:**
```
================================
       NITROBEER
    CNPJ: XX.XXX.XXX/XXXX-XX
   Rua Exemplo, 123 - Centro
      Tel: (XX) XXXXX-XXXX
================================

Venda #: 12345678
Data: 10/10/2025 14:30
PDV: Loja Centro
Cliente: João Silva

--------------------------------
ITEM              QTD     VALOR
--------------------------------
Heineken 350ml
2x    R$ 4,50         R$ 9,00

Coca-Cola 2L
1x    R$ 8,90         R$ 8,90

--------------------------------
SUBTOTAL:            R$ 17,90
DESCONTO:            -R$ 1,90
================================
TOTAL:               R$ 16,00
================================

Pagamento: Dinheiro

    [QR CODE DO PEDIDO]

   Obrigado pela preferência!
        Volte sempre! 😊

================================



[CORTE]
```

---

## 🎯 Cenários Práticos

### Cenário 1: Venda Rápida
```
👤 Cliente chega com 3 produtos

1. 🏷️ Scan: Heineken → ✅ No carrinho
2. 🏷️ Scan: Coca-Cola → ✅ No carrinho  
3. 🏷️ Scan: Doritos → ✅ No carrinho

4. 💰 Clica "Finalizar"
5. 🖨️ Recibo imprime automaticamente
6. ✅ Venda concluída

⏱️ Tempo total: ~15 segundos
```

---

### Cenário 2: Cadastro Express
```
👤 Cliente traz produto novo desconhecido

1. 🏷️ Scan no caixa → ❌ "Não encontrado"
2. 💡 "Cadastrar agora?" → Sim
3. ➕ Abre cadastro rápido com código já preenchido
4. ⌨️ Digita: "Red Bull 250ml", R$ 6,50
5. ✅ Salva produto
6. 🏷️ Scan novamente → Produto adicionado!

⏱️ Tempo total: ~45 segundos
```

---

### Cenário 3: Entrada de Mercadoria
```
📦 Recebeu entrega com 50 produtos

1. 🏷️ Scan produto 1
2. 📦 Modal abre
3. ⌨️ Digita: 12 (quantidade)
4. ✅ Confirma
5. 🔄 Repete para próximo produto...

⏱️ Tempo por produto: ~5 segundos
⏱️ Total 50 produtos: ~4 minutos
```

---

## 💡 Dicas Pro

### Scanner
- ✅ Mantenha distância de 10-30cm
- ✅ Código deve estar limpo e sem dobras
- ✅ Ângulo reto funciona melhor
- ✅ Luz adequada ajuda na leitura
- ❌ Evite reflexos de luz direta

### Impressora
- ✅ Use bobinas de 80mm (padrão)
- ✅ Mantenha papel sempre acima de 25%
- ✅ Limpe cabeça a cada 6 meses
- ✅ Teste impressão 1x por dia
- ❌ Não force papel manualmente

### Operação
- ✅ Mantenha backup de rolos extras
- ✅ Scanner sempre próximo do operador
- ✅ Impressora em local acessível
- ✅ Teste antes de abrir caixa
- ⚡ Use atalhos de teclado (Ctrl+B para focar scanner)

---

## 🔧 Configuração Inicial

### 1. Conectar Scanner
```
1. Plugue scanner USB
2. Aguarde reconhecimento (LED acende)
3. Teste em notepad (deve digitar automaticamente)
4. ✅ Pronto para usar!
```

### 2. Configurar Impressora

**Acesse:** PDV → Clique no status da impressora

```
┌──────────────────────────────────┐
│ ⚙️ Configuração da Impressora    │
│                                  │
│ Tipo: [USB ▼]                   │
│ Conexão: [/dev/usb/lp0      ]   │
│ Largura: [48 caracteres ▼]      │
│ Encoding: [UTF-8 ▼]             │
│                                  │
│ [Testar] [Cancelar] [Salvar]    │
└──────────────────────────────────┘
```

**Tipos de conexão:**
- USB: Mais comum, plug-and-play
- Network: Via IP (ex: 192.168.1.100:9100)
- Serial: Porta COM (Windows) ou /dev/tty* (Linux)

---

## 📱 Versão Mobile

### Scanner via Câmera (PWA)
```
🔜 Em breve:
- Scanner usando câmera do celular
- Funciona offline
- Mesmo comportamento do scanner físico
```

---

## ❓ Perguntas Frequentes

### O scanner não funciona?
```
1. ✅ Verificar se está conectado (LED aceso)
2. ✅ Testar em notepad
3. ✅ Verificar se página tem foco
4. ✅ Reiniciar scanner (desplugue e plugue)
```

### Impressora não imprime?
```
1. ✅ Verificar se está ligada
2. ✅ Verificar papel (não acabou?)
3. ✅ Clicar em "Testar" na configuração
4. ✅ Ver mensagem de erro no console
```

### Código não é reconhecido?
```
1. ✅ Verificar se código está cadastrado
2. ✅ Formato válido? (8-13 dígitos)
3. ✅ Código limpo e legível?
4. ✅ Testar digitação manual
```

---

## 🎨 Customização

### Sons de Feedback
**Localização:** `/public/sounds/`

Substitua por seus próprios:
- `beep-success.mp3` - Sucesso
- `beep-error.mp3` - Erro

### Template de Recibo
**Código:** `/lib/hardware/printerTemplates.ts`

Personalize:
- Logo da empresa
- Informações de contato
- Mensagens de rodapé
- Layout dos produtos

---

## 📊 Monitoramento

### Métricas disponíveis:
- ⏱️ Tempo médio de scan
- 📈 Produtos mais escaneados
- 🖨️ Recibos impressos por dia
- ⚠️ Taxa de erro de scan
- 📄 Consumo de papel

**Acesse:** Dashboard → Hardware Analytics (em breve)

---

**Pronto para usar! 🚀**

Qualquer dúvida, consulte a documentação completa em `HARDWARE_INTEGRATION_COMPLETE.md`
