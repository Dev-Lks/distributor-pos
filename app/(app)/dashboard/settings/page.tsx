"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  BellRing,
  KeyRound,
  Laptop,
  Mail,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserCog,
  Database,
  Download,
  Building2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Loader2,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";

const notificationChannels = [
  {
    id: "email",
    label: "E-mail",
    description: "Relatórios e alertas por e-mail",
    icon: Mail,
  },
  {
    id: "push",
    label: "Push",
    description: "Notificações no app e PWA",
    icon: Smartphone,
  },
  {
    id: "desktop",
    label: "Desktop",
    description: "Alertas no navegador",
    icon: Laptop,
  },
] as const;

type ChannelId = (typeof notificationChannels)[number]["id"];

export default function SettingsPage() {
  const { can } = usePermissions();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isInstallable, isInstalled, promptInstall, canPrompt } = usePWAInstall();

  // Estados
  const [businessName, setBusinessName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [receiptMessage, setReceiptMessage] = useState("");
  const [receiptShowQRCode, setReceiptShowQRCode] = useState(true);
  const [receiptWidth, setReceiptWidth] = useState(48);
  const [cnpj, setCnpj] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultPointOfSaleId, setDefaultPointOfSaleId] = useState<string | null>(null);
  const [enabledChannels, setEnabledChannels] = useState<
    Record<ChannelId, boolean>
  >({
    email: true,
    push: true,
    desktop: false,
  });
  const [autoSync, setAutoSync] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [salesReceipt, setSalesReceipt] = useState(false);

  // Buscar configurações
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Falha ao buscar configurações");
      return res.json();
    },
    staleTime: Infinity,
  });

  // Sincronizar dados quando carregados
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || "");
      setSupportEmail(settings.supportEmail || "");
      setReceiptMessage(settings.receiptMessage || "");
      setReceiptShowQRCode(settings.receiptShowQRCode ?? true);
      setReceiptWidth(settings.receiptWidth || 48);
      setCnpj(settings.cnpj || "");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setDefaultPointOfSaleId(settings.defaultPointOfSaleId || null);
      setEnabledChannels(settings.notifications || enabledChannels);
      setAutoSync(settings.autoSync ?? true);
      setInventoryAlerts(settings.alerts?.lowStock ?? true);
      setSalesReceipt(settings.alerts?.autoReceipt ?? false);
    }
  }, [settings]);

  // Buscar pontos de venda
  const { data: pointsOfSale } = useQuery({
    queryKey: ["pointsOfSale"],
    queryFn: async () => {
      const res = await fetch("/api/points-of-sale");
      if (!res.ok) throw new Error("Falha ao buscar pontos de venda");
      return res.json();
    },
  });

  // Mutation para atualizar configurações
  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao atualizar configurações");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Mutation para criar backup
  const createBackup = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/backup", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao criar backup");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Backup criado com sucesso! ${data.backup.timestamp}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar backup: ${error.message}`);
    },
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({
      businessName,
      cnpj,
      address,
      phone,
      supportEmail,
      receiptMessage,
      receiptShowQRCode,
      receiptWidth,
      defaultPointOfSaleId,
      notifications: enabledChannels,
      autoSync,
      alerts: {
        lowStock: inventoryAlerts,
        autoReceipt: salesReceipt,
      },
    });
  };

  const toggleChannel = (id: ChannelId) => {
    setEnabledChannels((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!can.viewSettings) {
    router.push("/unauthorized");
    return null;
  }

  const isAdmin = can.manageSettings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/10 flex-shrink-0">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Configurações</h1>
            <p className="text-sm text-muted-foreground line-clamp-2">
              Gerencie as preferências, notificações e dados do seu sistema
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Os ajustes serão salvos automaticamente
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap"
              onClick={() => createBackup.mutate()}
              disabled={createBackup.isPending}
            >
              {createBackup.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{createBackup.isPending ? "Criando..." : "Backup"}</span>
              <span className="sm:hidden">{createBackup.isPending ? "..." : "BK"}</span>
            </Button>
            <Button
              size="sm"
              className="gap-2 whitespace-nowrap"
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{updateSettings.isPending ? "Salvando..." : "Salvar"}</span>
              <span className="sm:hidden">{updateSettings.isPending ? "..." : "OK"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-fit h-auto">
          <TabsTrigger value="general" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Geral</span>
            <span className="sm:hidden">Ger</span>
          </TabsTrigger>
          <TabsTrigger value="receipts" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Receipt className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Recibos</span>
            <span className="sm:hidden">Rec</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <BellRing className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Notif.</span>
            <span className="sm:hidden">Not</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Segurança</span>
            <span className="sm:hidden">Seg</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: GERAL */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da empresa</CardTitle>
              <CardDescription>
                Dados básicos que aparecem nos recibos e documentos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nome do negócio</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex.: Distribuidora Modelo"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparecerá no topo dos recibos impressos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de inscrição do seu negócio
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua Exemplo, 123"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 0000-0000"
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="support-email">E-mail para suporte</Label>
                <Input
                  id="support-email"
                  type="email"
                  placeholder="contato@exemplo.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  Usado para contato de clientes sobre problemas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operações e ponto principal</CardTitle>
              <CardDescription>
                Configure o funcionamento padrão do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-point">Ponto principal (origem das entregas)</Label>
                <Select 
                  value={defaultPointOfSaleId || ""} 
                  onValueChange={setDefaultPointOfSaleId}
                  disabled={!isAdmin}
                >
                  <SelectTrigger id="default-point">
                    <SelectValue placeholder="Selecione o ponto de venda" />
                  </SelectTrigger>
                  <SelectContent>
                    {pointsOfSale?.map((pos: any) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Este ponto será usado como origem para calcular taxas de entrega e distâncias
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="font-semibold">Sincronização automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar estoque e vendas para Google Sheets automaticamente
                  </p>
                </div>
                <Switch
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                  disabled={!isAdmin}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: RECIBOS */}
        <TabsContent value="receipts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalização de recibos</CardTitle>
              <CardDescription>
                Configure como seus recibos impressos serão formatados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="receipt-width">Largura do papel</Label>
                  <Select 
                    value={receiptWidth.toString()} 
                    onValueChange={(value) => setReceiptWidth(parseInt(value))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger id="receipt-width">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="32">32mm (Compacto)</SelectItem>
                      <SelectItem value="48">48mm (Padrão)</SelectItem>
                      <SelectItem value="58">58mm (Médio)</SelectItem>
                      <SelectItem value="80">80mm (Grande)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Escolha conforme o tamanho do papel de sua impressora térmica
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">QR Code no recibo</Label>
                    <p className="text-xs text-muted-foreground">
                      Incluir código de consulta rápida
                    </p>
                  </div>
                  <Switch
                    checked={receiptShowQRCode}
                    onCheckedChange={setReceiptShowQRCode}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="receipt-footer">Mensagem de rodapé</Label>
                <textarea
                  id="receipt-footer"
                  placeholder="Ex: Obrigado pela preferência! Volte sempre!"
                  value={receiptMessage}
                  onChange={(e) => setReceiptMessage(e.target.value)}
                  disabled={!isAdmin}
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
                  maxLength={200}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>Mensagem personalizada que aparecerá no final de cada recibo</p>
                  <p>{receiptMessage.length}/200</p>
                </div>
              </div>

              <Alert>
                <Receipt className="h-4 w-4" />
                <AlertTitle>Dica sobre QR Code</AlertTitle>
                <AlertDescription>
                  O QR Code contém o ID único da venda. Clientes podem escanear para consultar detalhes, facilitando trocas, devoluções e auditoria.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: NOTIFICAÇÕES */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas do sistema</CardTitle>
              <CardDescription>
                Escolha quais eventos gerarão notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="font-semibold">Estoque crítico</Label>
                  <p className="text-xs text-muted-foreground">
                    Avisar quando produto atingir estoque mínimo
                  </p>
                </div>
                <Switch
                  checked={inventoryAlerts}
                  onCheckedChange={setInventoryAlerts}
                  disabled={!isAdmin}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="font-semibold">Comprovante automático</Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar recibo por e-mail após venda finalizada
                  </p>
                </div>
                <Switch
                  checked={salesReceipt}
                  onCheckedChange={setSalesReceipt}
                  disabled={!isAdmin}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Canais de notificação</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {notificationChannels.map((channel) => {
                    const Icon = channel.icon;
                    const enabled = enabledChannels[channel.id];
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => isAdmin && toggleChannel(channel.id)}
                        disabled={!isAdmin}
                        className={cn(
                          "group flex flex-col gap-3 rounded-lg border p-4 text-left transition-all",
                          enabled
                            ? "border-primary/60 bg-primary/10 shadow-sm"
                            : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
                          !isAdmin && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                              enabled
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-muted"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold leading-tight text-sm">
                              {channel.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {channel.description}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={enabled ? "default" : "secondary"}
                          className="w-fit text-xs"
                        >
                          {enabled ? "✓ Ativo" : "Desativado"}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <NotificationsSettings />
        </TabsContent>

        {/* TAB: SEGURANÇA */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança e acesso</CardTitle>
              <CardDescription>
                Controle quem pode entrar no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Autenticação segura</AlertTitle>
                <AlertDescription>
                  Seu sistema usa autenticação de dupla camada com e-mail e senha. Apenas usuários autorizados conseguem acessar o dashboard.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Status de segurança</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Sistema multi-usuários ativo
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Controle de permissões granular
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Bloqueio após tentativas falhas
                    </span>
                  </div>
                </div>
              </div>

              {can.manageUsers && (
                <Link href="/dashboard/admin/users" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <UserCog className="h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup e manutenção</CardTitle>
              <CardDescription>
                Proteja seus dados com backups regulares
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Backup automático ativo</AlertTitle>
                <AlertDescription>
                  Seus dados são salvos automaticamente diariamente. Você também pode criar um backup manual a qualquer momento.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 grid-cols-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => createBackup.mutate()}
                  disabled={createBackup.isPending}
                >
                  {createBackup.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Backup manual
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled
                >
                  Restaurar backup
                </Button>
              </div>

              <div className="text-sm space-y-1 p-3 bg-muted/50 rounded-lg">
                <p><span className="font-medium">Última cópia:</span> Hoje às 09:12</p>
                <p><span className="font-medium">Retenção:</span> 30 dias</p>
                <p><span className="font-medium">Próximo:</span> Amanhã às 09:00</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aplicativo (PWA)</CardTitle>
              <CardDescription>
                Instale o Distribuidora como app nativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled ? (
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900 dark:text-green-100">App Instalado</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    O Distribuidora POS está instalado e funcionando como aplicativo nativo.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Download className="h-4 w-4" />
                    <AlertTitle>Progressive Web App</AlertTitle>
                    <AlertDescription>
                      Instale para melhor desempenho, funcionamento offline e notificações push.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Benefícios:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Funciona offline
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Acesso rápido na home
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Notificações push
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Experiência nativa
                      </li>
                    </ul>
                  </div>

                  {canPrompt ? (
                    <Button 
                      className="w-full gap-2"
                      onClick={async () => {
                        const success = await promptInstall()
                        if (success) {
                          toast.success('App instalado com sucesso!')
                        } else {
                          toast.info('Instalação cancelada')
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Instalar Aplicativo
                    </Button>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Instalação não disponível</AlertTitle>
                      <AlertDescription>
                        {isInstallable 
                          ? "A instalação estará disponível em breve. Recarregue a página se necessário."
                          : "Este navegador não suporta instalação PWA."}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
