'use client';

import { useEffect, useState } from 'react';
import { BellRing, Check, AlertCircle, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { NotificationTestPanel } from './NotificationTestPanel';

interface NotificationSettings {
  enableDeliveryUpdates: boolean;
  enableStockAlerts: boolean;
  enableSaleNotifications: boolean;
  enableDesktopNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function NotificationsSettings() {
  const queryClient = useQueryClient();
  const { isSupported, isEnabled, requestPermission, test } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>({
    enableDeliveryUpdates: true,
    enableStockAlerts: true,
    enableSaleNotifications: true,
    enableDesktopNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Carregar configurações salvas
  const { data: savedSettings } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/notifications');
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings((prev) => ({ ...prev, ...savedSettings }));
    }
  }, [savedSettings]);

  // Salvar configurações
  const saveSettings = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('Configurações de notificações salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings.mutate(newSettings);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Permissão de notificações concedida!');
    } else {
      toast.error('Permissão de notificações recusada');
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Sistema de notificações do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                Notificações não suportadas
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Seu navegador não suporta notificações push. Use um navegador moderno como Chrome, Firefox ou Safari.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Configure como você recebe atualizações sobre entregas, estoque e vendas no seu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status de permissão */}
        <div className={`rounded-lg border p-4 flex items-start gap-3 ${
          isEnabled
            ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900'
            : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900'
        }`}>
          <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isEnabled
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {isEnabled ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${
              isEnabled
                ? 'text-green-900 dark:text-green-100'
                : 'text-amber-900 dark:text-amber-100'
            }`}>
              {isEnabled ? '✅ Notificações Ativas' : '⚠️ Notificações Desativadas'}
            </p>
            <p className={`text-sm mt-1 ${
              isEnabled
                ? 'text-green-800 dark:text-green-200'
                : 'text-amber-800 dark:text-amber-200'
            }`}>
              {isEnabled
                ? 'Você está recebendo notificações push no seu dispositivo'
                : 'Clique no botão abaixo para ativar notificações'}
            </p>
          </div>
          {!isEnabled && (
            <Button
              size="sm"
              onClick={handleEnableNotifications}
              className="ml-auto flex-shrink-0"
            >
              Ativar
            </Button>
          )}
        </div>

        {isEnabled && (
          <>
            {/* Tipos de notificações */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Tipos de notificações
              </h3>

              <div className="space-y-3">
                {/* Entregas */}
                <div className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <Label className="font-semibold cursor-pointer">
                      📦 Atualizações de Entregas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações quando o status de uma entrega mudar (atribuído, a caminho, chegando, concluído)
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableDeliveryUpdates}
                    onCheckedChange={(value) =>
                      handleSettingChange('enableDeliveryUpdates', value)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>

                {/* Alertas de estoque */}
                <div className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <Label className="font-semibold cursor-pointer">
                      ⚠️ Alertas de Estoque Crítico
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba avisos quando um produto atingir o estoque mínimo configurado
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableStockAlerts}
                    onCheckedChange={(value) =>
                      handleSettingChange('enableStockAlerts', value)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>

                {/* Notificações de vendas */}
                <div className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <Label className="font-semibold cursor-pointer">
                      💰 Notificações de Vendas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas quando uma venda for concluída (configurável por ponto de venda)
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableSaleNotifications}
                    onCheckedChange={(value) =>
                      handleSettingChange('enableSaleNotifications', value)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>

                {/* Notificações de desktop */}
                <div className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <Label className="font-semibold cursor-pointer">
                      🖥️ Notificações de Desktop
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Mostre notificações como janelas flutuantes na tela (Desktop)
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableDesktopNotifications}
                    onCheckedChange={(value) =>
                      handleSettingChange('enableDesktopNotifications', value)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Experiência sensorial */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Experiência sensorial</h3>

              <div className="space-y-3">
                {/* Som */}
                <div className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <Label className="font-semibold cursor-pointer">
                      🔔 Som de Notificação
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Toque um som quando notificações chegarem
                    </p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(value) =>
                      handleSettingChange('soundEnabled', value)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>

                {/* Vibração */}
                <div className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <Label className="font-semibold cursor-pointer">
                      📳 Vibração do Dispositivo
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Vibre o celular/tablet ao receber notificações (se o dispositivo suportar)
                    </p>
                  </div>
                  <Switch
                    checked={settings.vibrationEnabled}
                    onCheckedChange={(value) =>
                      handleSettingChange('vibrationEnabled', value)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Teste */}
            <div className="border-t pt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={() => test()}
                className="flex-1 gap-2"
              >
                🧪 Testar Notificação
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Pronto
              </Badge>
            </div>

            {/* Dica */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                💡 Dica de Uso
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Instale o app PWA para melhor experiência de notificações (Menu → Instalar App)</li>
                <li>Notificações persistem mesmo com o app em background</li>
                <li>Clique em uma notificação para abrir a página correspondente</li>
                <li>Em celulares, você receberá notificações mesmo sem a aba aberta</li>
              </ul>
            </div>

            {/* Painel de teste */}
            <div className="border-t pt-6">
              <NotificationTestPanel />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
