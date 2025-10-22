/**
 * Sistema de notificações push para o aplicativo
 * Suporta notificações persistentes no dispositivo
 */

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string; // Agrupa notificações do mesmo tipo
  vibrate?: number[];
  requireInteraction?: boolean; // Mantém notificação até interagir
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Pede permissão do navegador para enviar notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notificações não suportadas neste navegador');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Erro ao pedir permissão de notificações:', error);
      return false;
    }
  }

  return false;
}

/**
 * Verifica se notificações estão habilitadas
 */
export function areNotificationsEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Envia uma notificação persistente
 * Usa Service Worker se disponível (mais confiável)
 */
export async function sendNotification(
  payload: NotificationPayload,
  useServiceWorker: boolean = true
): Promise<void> {
  if (!areNotificationsEnabled()) {
    console.warn('⚠️ Permissão de notificações não concedida');
    return;
  }

  try {
    // Tentar usar Service Worker (mais confiável para persistência)
    if (
      useServiceWorker &&
      'serviceWorker' in navigator &&
      navigator.serviceWorker.controller
    ) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SEND_NOTIFICATION',
        payload,
      });
      return;
    }

    // Fallback: notificação direta via Notification API
    const notificationOptions: NotificationOptions & { 
      vibrate?: number[]
      actions?: NotificationAction[]
    } = {
      icon: payload.icon || '/MANUAL NITROBEER ID VISUAL.svg',
      badge: payload.badge || '/MANUAL NITROBEER ID VISUAL.svg',
      tag: payload.tag || 'default',
      vibrate: payload.vibrate || [200, 100, 200],
      requireInteraction: payload.requireInteraction ?? false,
      data: payload.data,
      actions: payload.actions,
    };

    if (payload.body) {
      notificationOptions.body = payload.body;
    }

    new Notification(payload.title, notificationOptions);
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
}

/**
 * Notificações para entregas
 */
export async function notifyDeliveryStatus(
  deliveryId: string,
  status: string,
  driverName?: string,
  customerName?: string
): Promise<void> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    pending: {
      title: '⏳ Entrega Pendente',
      body: 'Uma nova entrega está aguardando aceitar',
    },
    assigned: {
      title: `🚗 Entrega Atribuída`,
      body: driverName
        ? `${driverName} foi designado para sua entrega`
        : 'Um entregador foi atribuído',
    },
    in_transit: {
      title: '🚚 A Caminho',
      body: customerName
        ? `Sua entrega de ${customerName} está a caminho`
        : 'Sua entrega está a caminho',
    },
    arriving: {
      title: '📍 Chegando em 5 min',
      body: 'O entregador está próximo',
    },
    completed: {
      title: '✅ Entrega Concluída',
      body: 'Sua entrega foi finalizada com sucesso',
    },
    failed: {
      title: '❌ Entrega Falhada',
      body: 'Houve um problema com essa entrega',
    },
    canceled: {
      title: '🚫 Entrega Cancelada',
      body: 'A entrega foi cancelada',
    },
  };

  const message = statusMessages[status] || {
    title: '📦 Atualização de Entrega',
    body: `Status: ${status}`,
  };

  await sendNotification({
    title: message.title,
    body: message.body,
    tag: `delivery-${deliveryId}`, // Agrupa notificações do mesmo delivery
    icon: '/MANUAL NITROBEER ID VISUAL.svg',
    badge: '/MANUAL NITROBEER ID VISUAL.svg',
    vibrate: [200, 100, 200],
    requireInteraction: status === 'completed' || status === 'failed',
    data: {
      type: 'delivery',
      deliveryId,
      status,
      url: `/delivery/${deliveryId}`,
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Detalhes',
        icon: '/MANUAL NITROBEER ID VISUAL.svg',
      },
    ],
  });
}

/**
 * Notificação de alerta de estoque
 */
export async function notifyStockAlert(
  productName: string,
  pointOfSaleName: string,
  currentStock: number
): Promise<void> {
  await sendNotification({
    title: '⚠️ Estoque Crítico',
    body: `${productName} em ${pointOfSaleName} (${currentStock} unidades)`,
    tag: `stock-${productName}`,
    icon: '/MANUAL NITROBEER ID VISUAL.svg',
    badge: '/MANUAL NITROBEER ID VISUAL.svg',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: {
      type: 'stock_alert',
      productName,
      pointOfSaleName,
    },
  });
}

/**
 * Notificação de venda realizada
 */
export async function notifySaleCompleted(
  saleId: string,
  total: number,
  customerName?: string
): Promise<void> {
  await sendNotification({
    title: '💰 Venda Realizada',
    body: `${customerName || 'Venda'} • R$ ${total.toFixed(2)}`,
    tag: `sale-${saleId}`,
    icon: '/MANUAL NITROBEER ID VISUAL.svg',
    badge: '/MANUAL NITROBEER ID VISUAL.svg',
    vibrate: [150, 100, 150],
    data: {
      type: 'sale',
      saleId,
      total,
    },
  });
}

/**
 * Testa se notificações funcionam
 */
export async function testNotification(): Promise<void> {
  await sendNotification({
    title: '✅ Notificações Ativas!',
    body: 'Sistema de notificações configurado com sucesso',
    icon: '/MANUAL NITROBEER ID VISUAL.svg',
    badge: '/MANUAL NITROBEER ID VISUAL.svg',
    vibrate: [200, 100, 200, 100, 200],
  });
}

/**
 * Fechar todas as notificações com uma tag específica
 */
export async function closeNotificationsByTag(tag: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag });
    notifications.forEach((notif) => notif.close());
  } catch (error) {
    console.error('Erro ao fechar notificações:', error);
  }
}

/**
 * Obter todas as notificações ativas
 */
export async function getActiveNotifications(): Promise<Notification[]> {
  if (!('serviceWorker' in navigator)) return [];

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.getNotifications();
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    return [];
  }
}
