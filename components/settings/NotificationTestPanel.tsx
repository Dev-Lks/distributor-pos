'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Zap,
  Package,
  AlertTriangle,
  DollarSign,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  notifyDeliveryStatus,
  notifyStockAlert,
  notifySaleCompleted,
  testNotification,
} from '@/lib/notifications';
import { toast } from 'sonner';

export function NotificationTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [testType, setTestType] = useState<
    'delivery' | 'stock' | 'sale' | 'custom'
  >('delivery');

  // Delivery test
  const [deliveryId, setDeliveryId] = useState('DEL-001');
  const [deliveryStatus, setDeliveryStatus] = useState('assigned');
  const [driverName, setDriverName] = useState('João Silva');
  const [customerName, setCustomerName] = useState('Cliente Teste');

  // Stock test
  const [productName, setProductName] = useState('Chopp Brahma 20L');
  const [pointName, setPointName] = useState('Câmara Fria');
  const [stockQty, setStockQty] = useState('3');

  // Sale test
  const [saleId, setSaleId] = useState('SALE-001');
  const [saleAmount, setSaleAmount] = useState('450.00');
  const [saleName, setSaleName] = useState('João Silva');

  // Custom test
  const [customTitle, setCustomTitle] = useState('Título da Notificação');
  const [customBody, setCustomBody] = useState('Mensagem de teste');
  const [customTag, setCustomTag] = useState('test');

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      switch (testType) {
        case 'delivery':
          await notifyDeliveryStatus(deliveryId, deliveryStatus, driverName, customerName);
          toast.success('Notificação de entrega enviada!');
          break;

        case 'stock':
          await notifyStockAlert(productName, pointName, parseInt(stockQty) || 0);
          toast.success('Notificação de estoque enviada!');
          break;

        case 'sale':
          await notifySaleCompleted(saleId, parseFloat(saleAmount) || 0, saleName);
          toast.success('Notificação de venda enviada!');
          break;

        case 'custom':
          await testNotification();
          toast.success('Notificação de teste enviada!');
          break;
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          🧪 Painel de Teste de Notificações
        </CardTitle>
        <CardDescription>
          Teste diferentes tipos de notificações push para validar sua configuração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de tipo de notificação */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Tipo de Notificação</Label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              { id: 'delivery', label: '📦 Entrega', icon: Package },
              { id: 'stock', label: '⚠️ Estoque', icon: AlertTriangle },
              { id: 'sale', label: '💰 Venda', icon: DollarSign },
              { id: 'custom', label: '✨ Custom', icon: Zap },
            ].map((item) => (
              <Button
                key={item.id}
                variant={testType === item.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestType(item.id as typeof testType)}
                className="gap-2"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Campos de teste por tipo */}
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 space-y-4">
          {testType === 'delivery' && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery-id">ID da Entrega</Label>
                  <Input
                    id="delivery-id"
                    value={deliveryId}
                    onChange={(e) => setDeliveryId(e.target.value)}
                    placeholder="DEL-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-status">Status</Label>
                  <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                    <SelectTrigger id="delivery-status">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver-name">Nome do Motorista</Label>
                  <Input
                    id="driver-name"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nome do Cliente</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Cliente Teste"
                  />
                </div>
              </div>
            </>
          )}

          {testType === 'stock' && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Nome do Produto</Label>
                  <Input
                    id="product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Chopp Brahma 20L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="point-name">Local</Label>
                  <Input
                    id="point-name"
                    value={pointName}
                    onChange={(e) => setPointName(e.target.value)}
                    placeholder="Câmara Fria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock-qty">Quantidade</Label>
                  <Input
                    id="stock-qty"
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>
            </>
          )}

          {testType === 'sale' && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sale-id">ID da Venda</Label>
                  <Input
                    id="sale-id"
                    value={saleId}
                    onChange={(e) => setSaleId(e.target.value)}
                    placeholder="SALE-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-amount">Valor (R$)</Label>
                  <Input
                    id="sale-amount"
                    type="number"
                    step="0.01"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    placeholder="450.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-name">Nome do Cliente</Label>
                  <Input
                    id="sale-name"
                    value={saleName}
                    onChange={(e) => setSaleName(e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
              </div>
            </>
          )}

          {testType === 'custom' && (
            <>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-title">Título</Label>
                  <Input
                    id="custom-title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Título da Notificação"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-body">Mensagem</Label>
                  <Textarea
                    id="custom-body"
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="Mensagem de teste"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-tag">Tag (para agrupar)</Label>
                  <Input
                    id="custom-tag"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="test"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Informações de status */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-3 flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Mobil/PWA</p>
              <p className="text-xs text-blue-800 dark:text-blue-200">Funciona melhor instalado como app</p>
            </div>
          </div>

          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100">Permissão</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">Ative em Settings primeiro</p>
            </div>
          </div>

          <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-900 dark:text-green-100">Som/Vibração</p>
              <p className="text-xs text-green-800 dark:text-green-200">Configure em preferências</p>
            </div>
          </div>
        </div>

        {/* Botão de envio */}
        <Button
          onClick={handleTestNotification}
          disabled={isLoading}
          size="lg"
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? 'Enviando...' : '🚀 Enviar Notificação de Teste'}
        </Button>

        {/* Dicas */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-sm">
          <p className="font-semibold text-slate-900 dark:text-slate-100">💡 Dicas de Teste:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-xs">
            <li>Se não aparecer nada, verifique se ativou permissões em Settings</li>
            <li>Instale o app PWA (Menu → Instalar) para melhor experiência</li>
            <li>Notificações aparecem mesmo com aba fechada (em background)</li>
            <li>Som e vibração dependem das configurações do dispositivo</li>
            <li>Clique na notificação para abrir a página correspondente</li>
            <li>No desktop, aparecem no canto inferior direito</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
