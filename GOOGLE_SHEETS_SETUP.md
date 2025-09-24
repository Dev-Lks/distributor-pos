# NitroBeer POS - Configuração Google Sheets

## ✅ Backup de Vendas no Google Sheets (Gratuito)

### 1. Criar Planilha Google
1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha chamada "NitroBeer Vendas"
3. **IMPORTANTE:** Na primeira linha (A1:G1), adicione os cabeçalhos EXATAMENTE assim:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| ID da Venda | Data/Hora | Total | Método Pagamento | Cliente | Itens | Qtd Itens |

### 2. Compartilhar Planilha
1. Clique em "Compartilhar" (botão azul no canto superior direito)
2. Altere as permissões para **"Qualquer pessoa com o link pode editar"**
3. Copie o ID da planilha da URL (parte entre `/d/` e `/edit`)

**Seu Sheet ID já está configurado:** `1MRq1X_DnecEFJ48buVXo2beaB2uVAvs9H6P_uwyAL_A`

### 3. API Key Já Configurada
✅ Sua API Key já está no código: `AIzaSyATLKA63NPfmxx_RgkkxZQLwbhoVp9cHgE`

### 4. Como Funciona

**Salvamento Automático:**
- Toda venda é salva automaticamente no Google Sheets
- Dados incluem: ID, data, total, método de pagamento, cliente, itens detalhados

**Backup Manual:**
- No dashboard, use o botão "Backup Manual" para sincronizar vendas antigas
- Verifique status das vendas no Sheets com "Verificar Sheets"

### 5. Formato dos Dados Salvos

Cada venda cria uma linha com:
- **ID da Venda:** Identificador único
- **Data/Hora:** Timestamp ISO completo
- **Total:** Valor formatado (ex: "R$ 45.90")
- **Método Pagamento:** cash/card/pix/other
- **Cliente:** Nome do cliente (opcional)
- **Itens:** Lista detalhada (ex: "Cerveja (2x R$12.50) | Refrigerante (1x R$5.00)")
- **Qtd Itens:** Número total de itens diferentes

### 6. Limites Gratuitos
- ✅ 100 requests/100 segundos
- ✅ 1000 requests/dia
- ✅ Suficiente para pequenos/médios negócios!

### 7. Exemplo de Planilha
```
ID da Venda     | Data/Hora              | Total     | Método Pagamento | Cliente      | Itens                          | Qtd Itens
sale_1234567890 | 2025-09-24T14:30:00Z | R$ 45.90 | pix            | João Silva  | Cerveja (2x R$12.50) | Refrigerante (1x R$5.00) | 3
```

## 🎯 **Teste a Configuração**

1. Faça uma venda no sistema
2. Vá no dashboard e clique em "Verificar Sheets"
3. Veja se os dados apareceram na sua planilha Google!

## 🔧 **Solução de Problemas**

**Erro "Quota exceeded":**
- Aguarde alguns minutos (limite de 100 requests/100s)

**Dados não aparecem:**
- Verifique se a planilha está compartilhada como "pode editar"
- Confirme se os cabeçalhos estão exatamente como especificado

**API Key inválida:**
- A chave já está configurada, mas se der erro, gere uma nova no Google Cloud Console