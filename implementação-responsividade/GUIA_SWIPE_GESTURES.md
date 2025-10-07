# 🎯 Guia Rápido: Swipe Gestures

## Implementação em 5 Minutos

### Exemplo 1: Swipe em Lista de Produtos

```tsx
"use client"

import { SwipeableItem, swipeActions } from "@/components/SwipeableItem"
import { useProducts } from "@/lib/useProducts"
import { toast } from "sonner"

export function ProductsList() {
  const { data: products = [] } = useProducts()

  const handleEdit = (product) => {
    toast.info(`Editando: ${product.name}`)
    // Abrir modal de edição
  }

  const handleDelete = (product) => {
    toast.error(`Deletando: ${product.name}`)
    // Confirmar e deletar
  }

  return (
    <div className="space-y-2">
      {products.map(product => (
        <SwipeableItem
          key={product.id}
          leftAction={swipeActions.edit(() => handleEdit(product))}
          rightAction={swipeActions.delete(() => handleDelete(product))}
        >
          <div className="p-4 bg-card rounded-lg border">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-muted-foreground">
              R$ {product.price.toFixed(2)}
            </p>
          </div>
        </SwipeableItem>
      ))}
    </div>
  )
}
```

---

### Exemplo 2: Swipe com Actions Customizadas

```tsx
import { SwipeableItem } from "@/components/SwipeableItem"
import { Archive, Star } from "lucide-react"

<SwipeableItem
  leftAction={{
    icon: <Star className="h-5 w-5" />,
    label: "Favoritar",
    color: "warning",
    onClick: () => handleFavorite(item)
  }}
  rightAction={{
    icon: <Archive className="h-5 w-5" />,
    label: "Arquivar",
    color: "secondary",
    onClick: () => handleArchive(item)
  }}
>
  <YourContent />
</SwipeableItem>
```

---

### Exemplo 3: Swipe no Carrinho (Sales)

Adicione em `app/(app)/dashboard/sales/components/CartSection.tsx`:

```tsx
import { SwipeableItem, swipeActions } from "@/components/SwipeableItem"

// Dentro do map dos itens do carrinho:
{cart.map((item) => (
  <SwipeableItem
    key={item.product.id}
    rightAction={swipeActions.delete(() => onRemove(item.product.id))}
  >
    <div className="flex items-center justify-between p-3">
      {/* Conteúdo existente do item */}
    </div>
  </SwipeableItem>
))}
```

---

### Exemplo 4: Swipe Bidirecional

```tsx
<SwipeableItem
  leftAction={swipeActions.edit(handleEdit)}
  rightAction={swipeActions.delete(handleDelete)}
>
  <div className="p-4 bg-card">
    👈 Swipe LEFT para deletar
    <br />
    Swipe RIGHT para editar 👉
  </div>
</SwipeableItem>
```

---

## 🎨 Actions Disponíveis

### Presets Prontos

```tsx
import { swipeActions } from "@/components/SwipeableItem"

// 🗑️ Deletar (vermelho)
swipeActions.delete(() => handleDelete())

// ✏️ Editar (azul)
swipeActions.edit(() => handleEdit())

// 📦 Arquivar (cinza)
swipeActions.archive(() => handleArchive())

// ⋯ Mais opções (cinza)
swipeActions.more(() => handleMore())
```

### Cores Disponíveis

- `destructive` - 🔴 Vermelho
- `primary` - 🔵 Azul
- `secondary` - ⚪ Cinza
- `warning` - 🟡 Amarelo

---

## ⚙️ Configuração Avançada

### Hook Direto

```tsx
import { useSwipeGesture } from "@/lib/useSwipeGesture"

function MyComponent() {
  const { isSwiping, swipeDirection, swipeProgress, ref } = useSwipeGesture({
    onSwipeLeft: () => console.log("Swiped left!"),
    onSwipeRight: () => console.log("Swiped right!"),
    threshold: 80, // px
    velocityThreshold: 0.3,
    enabled: true,
  })

  return (
    <div ref={ref}>
      {isSwiping && (
        <div>Swiping {swipeDirection} - {Math.round(swipeProgress * 100)}%</div>
      )}
      <YourContent />
    </div>
  )
}
```

---

## 🔥 Dicas Pro

### 1. Desabilitar Swipe Condicionalmente

```tsx
<SwipeableItem
  disabled={isProcessing || !canDelete}
  rightAction={swipeActions.delete(handleDelete)}
>
  <YourContent />
</SwipeableItem>
```

### 2. Feedback Visual Durante Swipe

```tsx
function MyItem() {
  const { isSwiping, swipeProgress, ref } = useSwipeGesture({
    onSwipeLeft: handleDelete
  })

  return (
    <div 
      ref={ref}
      className={cn(
        "p-4 transition-colors",
        isSwiping && swipeProgress > 0.5 && "bg-destructive/10"
      )}
    >
      {/* Conteúdo */}
    </div>
  )
}
```

### 3. Confirmação Antes de Deletar

```tsx
const handleDeleteWithConfirm = (item) => {
  if (confirm(`Deletar ${item.name}?`)) {
    deleteItem(item.id)
  }
}

<SwipeableItem
  rightAction={swipeActions.delete(() => handleDeleteWithConfirm(item))}
>
  <YourContent />
</SwipeableItem>
```

---

## 📱 Comportamento Mobile

### Funciona automaticamente em:
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Firefox Mobile
- ✅ Edge Mobile

### Não interfere com:
- ✅ Scroll vertical
- ✅ Links clicáveis
- ✅ Botões internos
- ✅ Inputs de formulário

### Detecta apenas:
- ✅ Swipe horizontal
- ✅ Movimento > vertical
- ✅ Velocidade suficiente

---

## 🐛 Troubleshooting

### Swipe não funciona
1. Verifique se está em mobile (ou DevTools mobile mode)
2. Confirme que `disabled={false}`
3. Teste com `threshold: 50` (mais sensível)

### Swipe acidental durante scroll
1. Aumente `threshold: 120` (menos sensível)
2. Aumente `velocityThreshold: 0.5`

### Swipe muito lento
1. Diminua `threshold: 60`
2. Diminua `velocityThreshold: 0.2`

---

## 🎯 Próximos Exemplos

### Em Desenvolvimento:
- [ ] Swipe to reply (WhatsApp style)
- [ ] Swipe to mark as read
- [ ] Swipe to favorite
- [ ] Multi-direction swipe (4 directions)
- [ ] Long-press menu integration

---

**Pronto para testar?** Copie e cole qualquer exemplo acima! 🚀
