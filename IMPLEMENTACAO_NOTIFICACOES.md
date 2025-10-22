# 📱 Implementação de Notificações Push

## ✅ O que foi implementado

### 1. **Core de Notificações** (`lib/notifications.ts`)
- ✅ Funções para enviar notificações persistentes
- ✅ Suporte a notificações com vibrações
- ✅ Integração com Service Worker
- ✅ Notificações especializadas para:
  - Entregas (com múltiplos status)
  - Alertas de estoque
  - Vendas realizadas

### 2. **Service Worker Atualizado** (`public/sw.js`)
- ✅ Listeners para receber mensagens do cliente
- ✅ Handlers para cliques em notificações
- ✅ Navegação automática ao clicar em notificação
- ✅ Fechamento de notificações

### 3. **Hooks React**
- ✅ `useNotifications()` - Gerenciar permissões e teste
- ✅ `useDeliveryNotifications()` - Notificar mudanças de entregas

### 4. **Componente de Configurações** (`components/settings/NotificationsSettings.tsx`)
- ✅ UI completa para gerenciar notificações
- ✅ Toggles para cada tipo de notificação
- ✅ Configurações de som e vibração
- ✅ Botão para testar notificações
- ✅ Status de permissões visual

### 5. **API de Configurações** (`app/api/settings/notifications/route.ts`)
- ✅ GET - Buscar preferências do usuário
- ✅ PATCH - Atualizar preferências
- ✅ Suporta 6 tipos de configuração

### 6. **Schema do Banco** (`prisma/schema.prisma`)
- ✅ Model `UserPreferences` para salvar configurações
- ✅ Relação com User

---

## 🚀 Como Usar

### 1. Enviar Notificação de Entrega

```tsx
// Em um componente
import { useDeliveryNotifications } from '@/hooks/useDeliveryNotifications';

export function DeliveryComponent({ deliveryId, driverId, driverName, customerName }) {
  const { notifyDeliveryStatusChange } = useDeliveryNotifications();

  const handleStatusChange = async (newStatus: string) => {
    // Sua lógica de atualizar status...
    
    // Enviar notificação
    await notifyDeliveryStatusChange(
      deliveryId,
      newStatus,
      driverName,
      customerName
    );
  };

  return (
    // UI do componente...
  );
}
```

### 2. Status Disponíveis de Entrega

```typescript
'pending'      // ⏳ Entrega Pendente
'assigned'     // 🚗 Entrega Atribuída
'in_transit'   // 🚚 A Caminho
'arriving'     // 📍 Chegando em 5 min
'completed'    // ✅ Entrega Concluída
'failed'       // ❌ Entrega Falhada
'canceled'     // 🚫 Entrega Cancelada
```

### 3. Integrar com useUpdateDeliveryStatus

```tsx
// hooks/useDeliveries.ts - Adicione isso ao hook existente
import { useDeliveryNotifications } from '@/hooks/useDeliveryNotifications';

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  const { notifyDeliveryStatusChange } = useDeliveryNotifications();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes,
      driverName,    // novo
      customerName   // novo
    }: { 
      id: string; 
      status: string; 
      notes?: string;
      driverName?: string;
      customerName?: string;
    }) => {
      const response = await fetch(`/api/delivery/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar status");
      }
      
      // ✨ Enviar notificação aqui
      await notifyDeliveryStatusChange(id, status, driverName, customerName);
      
      return data as Delivery;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...DELIVERIES_QUERY_KEY, variables.id] });
    },
  });
}
```

### 4. Outras Notificações

```tsx
import { 
  sendNotification,
  notifyStockAlert,
  notifySaleCompleted,
  testNotification
} from '@/lib/notifications';

// Alerta de estoque
await notifyStockAlert('Chopp Brahma 20L', 'Ponto Centro', 3);

// Venda concluída
await notifySaleCompleted('SALE-123', 450.00, 'João Silva');

// Notificação customizada
await sendNotification({
  title: 'Título',
  body: 'Descrição',
  tag: 'minha-notificacao',
  data: { customData: 'valor' }
});

// Teste
await testNotification();
```

---

## 🔧 Configuração de Entregas (Exemplo Completo)

Se você tem um componente que atualiza status de entregas:

```tsx
// components/delivery/DeliveryStatusUpdater.tsx
'use client';

import { useState } from 'react';
import { useUpdateDeliveryStatus } from '@/hooks/useDeliveries';
import { useDeliveryNotifications } from '@/hooks/useDeliveryNotifications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeliveryStatusUpdaterProps {
  deliveryId: string;
  currentStatus: string;
  driverName?: string;
  customerName?: string;
}

export function DeliveryStatusUpdater({
  deliveryId,
  currentStatus,
  driverName,
  customerName,
}: DeliveryStatusUpdaterProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const updateMutation = useUpdateDeliveryStatus();

  const handleStatusChange = async () => {
    try {
      await updateMutation.mutateAsync({
        id: deliveryId,
        status: newStatus,
        driverName,
        customerName,
      });
      toast.success('Status atualizado e notificação enviada!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={newStatus} onValueChange={setNewStatus}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">⏳ Pendente</SelectItem>
          <SelectItem value="assigned">🚗 Atribuída</SelectItem>
          <SelectItem value="in_transit">🚚 A Caminho</SelectItem>
          <SelectItem value="arriving">📍 Chegando</SelectItem>
          <SelectItem value="completed">✅ Concluída</SelectItem>
          <SelectItem value="failed">❌ Falhada</SelectItem>
          <SelectItem value="canceled">🚫 Cancelada</SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={handleStatusChange}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
      </Button>
    </div>
  );
}
```

---

## 📍 Localização das Configurações

**Menu → Dashboard → Configurações → Notificações Push**

Ou vá diretamente em: `/dashboard/settings`

A seção aparece após instalar o app como PWA (recomendado).

---

## 📊 Fluxo de Notificações

```
┌─────────────────────────────────────────────────────────┐
│ Usuário muda status de entrega no dashboard             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ updateDeliveryStatus()        │
        │ na API                        │
        └────────────┬─────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Hook verifica se notificações   │
        │ estão habilitadas para user     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Service Worker envia notificação│
        │ com vibração + som              │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Notificação aparece no celular  │
        │ (mesmo offline ou em background)│
        └────────────────────────────────┘
```

---

## ✨ Features Extras

### Notificações Agrupadas
Por padrão, múltiplas notificações do mesmo delivery são agrupadas:

```tsx
// Mesma tag = agrupa notificações
tag: `delivery-${deliveryId}`
```

### Clique em Notificação
Ao clicar em uma notificação, abre automaticamente:

```tsx
data: {
  type: 'delivery',
  deliveryId,
  status,
  url: `/delivery/${deliveryId}`,  // Vai para cá ao clicar
}
```

### Fechar Todas as Notificações de um Delivery

```tsx
import { closeNotificationsByTag } from '@/lib/notifications';

// Fecha todas as notificações com essa tag
await closeNotificationsByTag(`delivery-${deliveryId}`);
```

### Obter Notificações Ativas

```tsx
import { getActiveNotifications } from '@/lib/notifications';

const active = await getActiveNotifications();
console.log(`Há ${active.length} notificações ativas`);
```

---

## 🛠️ Troubleshooting

### Notificações não aparecem?

1. **Verificar permissões:**
   ```tsx
   import { areNotificationsEnabled } from '@/lib/notifications';
   
   if (!areNotificationsEnabled()) {
     console.log('Permissão não concedida');
   }
   ```

2. **Testar:**
   - Vá em Settings → Notificações Push
   - Clique "Testar Notificação"
   - Deve aparecer uma notificação imediatamente

3. **Service Worker:**
   - Abra DevTools (F12)
   - Application → Service Workers
   - Verifique se está "activated and running"

### Notificações só funcionam com o app PWA instalado?

Não! Funcionam em qualquer navegador moderno, mas:
- **Web**: Notificações aparecem como janelas
- **PWA instalado**: Notificações aparecem no sistema operacional
- **Offline**: Se instalado como PWA, funciona mesmo offline (dentro do cache)

### Sons e vibrações não funcionam?

- Verificar em Settings se estão habilitados
- Alguns navegadores silenciam som de notificações
- Celulares em "Do Not Disturb" não vibram/tocam som

---

## 📚 Referências

- [Notification API MDN](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Notifications](https://web.dev/articles/push-notifications-overview)
- [Web Notifications Spec](https://www.w3.org/TR/notifications/)

---

## 🎉 Próximas Melhorias (Futura)

- [ ] Push notifications com backend (Web Push Protocol)
- [ ] Notificações agendadas
- [ ] Categorias de notificações
- [ ] Badge de contagem
- [ ] Ações customizadas em notificações
- [ ] Analytics de notificações
