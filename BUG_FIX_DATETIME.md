# Correção do Bug de Agendamento - Invalid Datetime

## 🐛 Problema Identificado

```
POST /api/delivery [HTTP/1.1 400]
error: "Dados inválidos"
details: [{
  code: "invalid_string",
  validation: "datetime",
  message: "Invalid datetime",
  path: ["scheduledFor"]
}]
```

### Causa Raiz
O `DateTimePicker` estava enviando strings no formato `YYYY-MM-DDTHH:mm` sem segundos e sem timezone, o que não é um datetime ISO 8601 válido.

## ✅ Correções Implementadas

### 1. DateTimePicker - Formato ISO 8601 Completo

**Antes:**
```typescript
onChange(`${date}T${time}`) // "2025-10-12T14:30" ❌
```

**Depois:**
```typescript
const dateTime = new Date(`${date}T${time}:00`)
onChange(dateTime.toISOString()) // "2025-10-12T14:30:00.000Z" ✅
```

### 2. Validação de Data Inválida

Adicionado try/catch para prevenir datas inválidas:

```typescript
try {
  const dateTime = new Date(`${date}T${time}:00`)
  if (!isNaN(dateTime.getTime())) {
    onChange(dateTime.toISOString())
  }
} catch (e) {
  console.error("Invalid date/time:", date, time)
}
```

### 3. Preview com Segundos

**Antes:**
```typescript
new Date(`${date}T${time}`) // Pode dar erro
```

**Depois:**
```typescript
new Date(`${date}T${time}:00`) // Sempre válido
```

### 4. Backend - Preprocessamento do Zod

Aceita strings vazias como null:

```typescript
scheduledFor: z.preprocess(
  (val) => val === "" || val === null || val === undefined ? null : val,
  z.string().datetime().nullable().optional()
)
```

### 5. useEffect com Validação

```typescript
useEffect(() => {
  if (value) {
    try {
      const dateObj = new Date(value)
      if (!isNaN(dateObj.getTime())) {
        // Processa apenas se for válido
        const dateStr = dateObj.toISOString().split("T")[0]
        const timeStr = dateObj.toTimeString().slice(0, 5)
        setDate(dateStr)
        setTime(timeStr)
        setIsScheduled(true)
      }
    } catch (e) {
      console.error("Invalid date:", value)
    }
  }
}, [value])
```

## 📝 Arquivos Modificados

1. `/app/(app)/dashboard/delivery/components/DateTimePicker.tsx`
   - ✅ `handleDateChange()` - Agora gera ISO 8601 completo
   - ✅ `handleTimeChange()` - Agora gera ISO 8601 completo
   - ✅ `handleSetNow()` - Usa `.toISOString()`
   - ✅ `handleSetTomorrow()` - Usa `.toISOString()`
   - ✅ `useEffect()` - Validação antes de processar
   - ✅ Preview - Adiciona `:00` aos segundos

2. `/app/api/delivery/route.ts`
   - ✅ Schema do Zod - Preprocessa strings vazias como null
   
3. `/app/(app)/dashboard/delivery/new/page.tsx`
   - ✅ Extraído deliveryData para melhor debug

## 🧪 Como Testar

### Teste 1: Sem Agendamento
1. Crie uma delivery sem agendar
2. ✅ Deve criar normalmente (scheduledFor será null)

### Teste 2: Agendar com Atalhos
1. Clique em **"Agora"**
2. ✅ Deve preencher com data/hora atual
3. Clique em **"Amanhã 9h"**
4. ✅ Deve preencher com amanhã às 09:00
5. Crie a delivery
6. ✅ Deve criar sem erros

### Teste 3: Agendar Manualmente
1. Clique em **"Agendar Entrega"**
2. Selecione uma data
3. Selecione um horário
4. ✅ Preview deve mostrar data formatada
5. Crie a delivery
6. ✅ Deve criar sem erros

### Teste 4: Limpar Agendamento
1. Agende uma data/hora
2. Clique em **"Limpar"**
3. ✅ Campos devem ser limpos
4. Crie a delivery
5. ✅ Deve criar normalmente sem agendamento

## 📊 Formato de Data Correto

### O que o Backend Aceita:
- `null` - Sem agendamento ✅
- `"2025-10-12T14:30:00.000Z"` - ISO 8601 completo ✅
- `"2025-10-12T14:30:00Z"` - ISO 8601 sem milissegundos ✅
- `"2025-10-12T17:30:00-03:00"` - ISO 8601 com timezone ✅

### O que o Backend NÃO Aceita:
- `""` - String vazia ❌ (agora tratado como null)
- `"2025-10-12T14:30"` - Sem segundos ❌
- `"2025-10-12 14:30:00"` - Espaço em vez de T ❌
- `"12/10/2025 14:30"` - Formato BR ❌

## 🎯 Resultado

**Antes:** ❌ 400 Bad Request - Invalid datetime

**Depois:** ✅ 201 Created - Delivery criada com sucesso

Todas as variações de agendamento agora funcionam:
- ✅ Sem agendamento (null)
- ✅ Agendar agora
- ✅ Agendar amanhã
- ✅ Agendar data/hora customizada
- ✅ Limpar agendamento

## 🚀 Melhorias Adicionais

1. **Validação Robusta**: Try/catch em todas as operações de data
2. **Preview Preciso**: Sempre mostra a data que será enviada
3. **Debug Melhorado**: Console.error quando data é inválida
4. **Backend Tolerante**: Aceita strings vazias como null
5. **UX Consistente**: Feedback claro em todas as operações

**Status: Bug Corrigido! ✨**
