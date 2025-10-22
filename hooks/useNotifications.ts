import { useEffect, useState } from 'react';
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  testNotification,
} from '@/lib/notifications';

/**
 * Hook para gerenciar notificações no aplicativo
 */
export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar suporte ao iniciar
  useEffect(() => {
    const checkSupport = () => {
      setIsSupported('Notification' in window);
      setIsEnabled(areNotificationsEnabled());
    };

    checkSupport();

    // Escutar mudanças de permissão (em alguns navegadores)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((result) => {
        setIsEnabled(result.state === 'granted');
        result.addEventListener('change', () => {
          setIsEnabled(result.state === 'granted');
        });
      });
    }
  }, []);

  /**
   * Pedir permissão de notificações
   */
  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setIsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Erro ao pedir permissão:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Testar notificações
   */
  const test = async () => {
    if (!isEnabled) {
      await requestPermission();
    }
    await testNotification();
  };

  return {
    isSupported,
    isEnabled,
    isLoading,
    requestPermission,
    test,
  };
}
