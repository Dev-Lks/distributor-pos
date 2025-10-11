# 🎨 Guia Rápido: Personalizar Recibos da Impressora

## 📍 Onde Configurar

O arquivo principal é:
```
lib/hardware/printerTemplates.ts
```

## 🚀 Passo a Passo Rápido

### 1️⃣ Escolha um Template

Temos **5 templates prontos** em:
```
lib/hardware/printerTemplatesExamples.ts
```

**Templates disponíveis:**
1. 🎯 **Moderno e Minimalista** - Clean e direto ao ponto
2. 📜 **Tradicional com Borda** - Clássico com bordas decorativas
3. 🎉 **Divertido com Emojis** - Descontraído e colorido (bem... preto e branco com emojis 😄)
4. 💼 **Profissional com Nota Fiscal** - Formato corporativo
5. 📄 **Compacto** - Economiza papel ao máximo

### 2️⃣ Copiar o Template

1. Abra: `lib/hardware/printerTemplatesExamples.ts`
2. Copie a função do template que você quer (ex: `generateModernReceipt`)
3. Cole em: `lib/hardware/printerTemplates.ts`
4. Substitua a função `generateSaleReceipt` existente

### 3️⃣ Personalizar

Edite a função copiada com seus dados:

```typescript
// Mude o nome da loja
commands.push({ type: 'text', value: 'MINHA CERVEJARIA', size: 'large', bold: true })

// Adicione redes sociais
commands.push({ type: 'text', value: 'Instagram: @minhacervejaria' })
commands.push({ type: 'text', value: 'WhatsApp: (11) 98765-4321' })

// Mensagem personalizada
commands.push({ type: 'text', value: '🍺 Beba com moderação! 🍺' })
```

### 4️⃣ Testar

1. Vá para a página de **Vendas (PDV)**
2. Clique no **ícone da impressora** 🖨️
3. Clique em **"Testar Impressão"**
4. Veja o resultado!

---

## 💡 Personalizações Populares

### Adicionar Logo ASCII
```typescript
commands.push({ type: 'text', value: '╔════════════════╗' })
commands.push({ type: 'text', value: '║  MINHA LOJA   ║' })
commands.push({ type: 'text', value: '╚════════════════╝' })
```

### Programa de Fidelidade
```typescript
if (sale.customerName) {
  const points = Math.floor(sale.total)
  commands.push({ type: 'text', value: `⭐ Você ganhou: ${points} pontos!` })
  commands.push({ type: 'text', value: 'A cada 100 pontos = R$ 10 OFF' })
}
```

### Promoções
```typescript
commands.push({ type: 'text', value: '🎉 PROMOÇÃO DA SEMANA! 🎉' })
commands.push({ type: 'text', value: 'Compre 3 e ganhe 10% OFF' })
```

### Redes Sociais
```typescript
commands.push({ type: 'text', value: '📱 SIGA-NOS!' })
commands.push({ type: 'text', value: 'Instagram: @suaconta' })
commands.push({ type: 'text', value: 'Facebook: /SuaPagina' })
```

---

## 📖 Documentação Completa

- **Guia completo**: `PERSONALIZACAO_RECIBOS.md` ← Leia este para mais detalhes
- **Templates prontos**: `lib/hardware/printerTemplatesExamples.ts`
- **Código atual**: `lib/hardware/printerTemplates.ts`

---

## 🎯 Exemplo Rápido

Quer apenas adicionar seu Instagram? Faça assim:

1. Abra: `lib/hardware/printerTemplates.ts`
2. Encontre a linha que tem: `'Obrigado pela preferência!'`
3. Adicione antes dela:

```typescript
// Suas redes sociais
commands.push({ type: 'feed', lines: 1 })
commands.push({ type: 'separator', char: '~' })
commands.push({ type: 'text', value: '📱 SIGA-NOS!' })
commands.push({ type: 'text', value: 'Instagram: @suacervejaria' })
commands.push({ type: 'text', value: 'WhatsApp: (11) 98765-4321' })
commands.push({ type: 'separator', char: '~' })
commands.push({ type: 'feed', lines: 1 })
```

4. Salve e teste!

---

## ⚡ Comandos Disponíveis

| Comando | Uso | Exemplo |
|---------|-----|---------|
| `text` | Imprimir texto | `{ type: 'text', value: 'Olá!', bold: true }` |
| `align` | Alinhar | `{ type: 'align', value: 'center' }` |
| `separator` | Linha | `{ type: 'separator', char: '=' }` |
| `feed` | Pular linhas | `{ type: 'feed', lines: 2 }` |
| `qrcode` | QR Code | `{ type: 'qrcode', data: 'texto' }` |
| `cut` | Cortar papel | `{ type: 'cut' }` |

---

## ✅ Checklist

- [ ] Escolhi um template
- [ ] Copiei para `printerTemplates.ts`
- [ ] Personalizei com meus dados
- [ ] Testei a impressão
- [ ] Ajustei o que precisa
- [ ] Pronto para usar! 🎉

---

## 🆘 Precisa de Ajuda?

- Consulte: `PERSONALIZACAO_RECIBOS.md` para guia completo
- Veja exemplos em: `lib/hardware/printerTemplatesExamples.ts`
- Problemas com impressora: `COMO_ACESSAR_IMPRESSORA.md`

**Boas personalizações! 🎨✨**
