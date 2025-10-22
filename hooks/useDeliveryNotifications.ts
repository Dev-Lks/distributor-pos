/**
 * Hook para notificar mudanças em entregas
 * 
 * Uso:
 * ```tsx
 * import { useDeliveryNotifications } from '@/hooks/useDeliveryNotifications';
 * 
 * export function MyComponent() {
 *   const { notifyDeliveryStatusChange } = useDeliveryNotifications();
 *   
 *   const handleStatusChange = async (deliveryId: string, newStatus: string) => {
 *     await notifyDeliveryStatusChange(deliveryId, newStatus);
 *   }
 * }
 * ```
 */

import { useCallback } from 'react';
import { notifyDeliveryStatus } from '@/lib/notifications';
import { useQuery } from '@tanstack/react-query';

interface UserNotificationSettings {
  enableDeliveryUpdates: boolean;
}

export function useDeliveryNotifications() {
  // Carregar preferências do usuário
  const { data: settings } = useQuery<UserNotificationSettings>({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/notifications');
      if (!res.ok) return { enableDeliveryUpdates: true };
      return res.json();
    },
  });

  const notifyDeliveryStatusChange = useCallback(
    async (
      deliveryId: string,
      status: string,
      driverName?: string,
      customerName?: string
    ) => {
      // Respeitar preferências do usuário
      if (!settings?.enableDeliveryUpdates) {
        return;
      }

      await notifyDeliveryStatus(deliveryId, status, driverName, customerName);
    },
    [settings?.enableDeliveryUpdates]
  );

  return {
    notifyDeliveryStatusChange,
  };
}
