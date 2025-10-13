"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";
import { usePWAInstall } from "@/lib/usePWAInstall";
import {
  BellRing,
  KeyRound,
  Laptop,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserCog,
  Database,
  Download,
  Upload,
  Settings2,
  Building2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Receipt,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const channels = [
  {
    id: "email",
    label: "E-mail",
    description: "Receba relatórios instantâneos",
    icon: Mail,
  },
  {
    id: "push",
    label: "Push",
    description: "Alertas no tablet ou PWA",
    icon: Smartphone,
  },
  {
    id: "desktop",
    label: "Desktop",
    description: "Notificações no navegador",
    icon: Laptop,
  },
] as const;

type ChannelId = (typeof channels)[number]["id"];

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
      const data = await res.json();

      // Atualizar estados
      setBusinessName(data.businessName || "");
      setSupportEmail(data.supportEmail || "");
      setReceiptMessage(data.receiptMessage || "");
      setReceiptShowQRCode(data.receiptShowQRCode ?? true);
      setReceiptWidth(data.receiptWidth || 48);
      setCnpj(data.cnpj || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setDefaultPointOfSaleId(data.defaultPointOfSaleId || null);
      setEnabledChannels(data.notifications || enabledChannels);
      setAutoSync(data.autoSync ?? true);
      setInventoryAlerts(data.alerts?.lowStock ?? true);
      setSalesReceipt(data.alerts?.autoReceipt ?? false);

      return data;
    },
  });

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

  return (
    <div className="space-y-6">
      <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-none">
        <CardHeader className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit bg-primary/15 text-primary">
              Central de controle
            </Badge>
            <CardTitle className="text-2xl md:text-3xl">
              Configurações do sistema
            </CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Ajuste preferências operacionais, integrações e notificações para
              manter o NitroBeer rodando de forma confiável em todos os pontos
              de venda.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => createBackup.mutate()}
                  disabled={createBackup.isPending}
                >
                  <Database className="h-4 w-4" />
                  {createBackup.isPending ? "Criando..." : "Criar Backup"}
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleSaveSettings}
                  disabled={updateSettings.isPending}
                >
                  <Save className="h-4 w-4" />
                  {updateSettings.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {/* Preferências Gerais */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Preferências gerais
              </CardTitle>
              <CardDescription>
                Defina como o sistema se comporta no dia a dia das operações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nome do negócio</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex.: NitroBeer Tap House"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este nome aparecerá nos recibos impressos
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
                    Será exibido no cabeçalho dos recibos
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="default-point">Ponto principal (origem das entregas)</Label>
                <Select 
                  value={defaultPointOfSaleId || ""} 
                  onValueChange={setDefaultPointOfSaleId}
                  disabled={!isAdmin}
                >
                  <SelectTrigger id="default-point">
                    <SelectValue placeholder="Selecione o ponto" />
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
                  Este ponto será usado como origem para calcular taxa de entrega
                </p>
              </div>

              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Sincronização automática com Google Sheets
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Controle se o estoque e as vendas são enviados
                      automaticamente após cada alteração.
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support-email">E-mail para suporte</Label>
                  <Input
                    id="support-email"
                    type="email"
                    placeholder="contato@nitrobeer.com"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Recibos */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Configurações de Recibos
              </CardTitle>
              <CardDescription>
                Personalize a aparência e informações dos recibos impressos na impressora térmica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="receipt-width">Largura do papel (mm)</Label>
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
                    Escolha conforme o tamanho do papel da sua impressora
                  </p>
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-0.5">
                    <Label>Exibir QR Code</Label>
                    <p className="text-xs text-muted-foreground">
                      Inclui um QR Code no final do recibo para consulta rápida da venda
                    </p>
                  </div>
                  <Switch
                    checked={receiptShowQRCode}
                    onCheckedChange={setReceiptShowQRCode}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-footer">Mensagem de rodapé</Label>
                <textarea
                  id="receipt-footer"
                  placeholder="Ex: Obrigado pela preferência! Volte sempre!"
                  value={receiptMessage}
                  onChange={(e) => setReceiptMessage(e.target.value)}
                  disabled={!isAdmin}
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-50"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {receiptMessage.length}/200 caracteres
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      📱 Sobre o QR Code
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      O QR Code impresso nos recibos contém o ID único da venda. Ele permite que clientes e funcionários 
                      consultem rapidamente os detalhes da compra, facilitando trocas, devoluções e auditoria. 
                      Basta escanear com qualquer leitor de QR Code no celular.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas e Notificações */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                Alertas e notificações
              </CardTitle>
              <CardDescription>
                Escolha como os responsáveis são avisados sobre rupturas e
                movimentações críticas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">Alertas de estoque crítico</p>
                  <p className="text-xs text-muted-foreground">
                    Receba avisos quando algum produto atingir o estoque mínimo
                    em qualquer localização.
                  </p>
                </div>
                <Switch
                  checked={inventoryAlerts}
                  onCheckedChange={setInventoryAlerts}
                  disabled={!isAdmin}
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Envio automático de comprovante
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dispare um recibo por e-mail sempre que a venda for
                    finalizada no tablet.
                  </p>
                </div>
                <Switch
                  checked={salesReceipt}
                  onCheckedChange={setSalesReceipt}
                  disabled={!isAdmin}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  const enabled = enabledChannels[channel.id];
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => isAdmin && toggleChannel(channel.id)}
                      disabled={!isAdmin}
                      className={cn(
                        "group flex h-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                        enabled
                          ? "border-primary/60 bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                        !isAdmin && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border",
                            enabled
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">
                            {channel.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {channel.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={enabled ? "default" : "secondary"}
                        className="text-[11px]"
                      >
                        {enabled ? "Ativado" : "Desativado"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Segurança e Acessos */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Segurança e acessos
              </CardTitle>
              <CardDescription>
                Controle quem pode entrar no sistema e mantenha o POS protegido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Autenticação com e-mail e senha
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Apenas usuários autorizados conseguem acessar o dashboard
                      e registrar vendas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Sistema multi-usuários ativo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Controle de permissões granular</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Bloqueio após tentativas falhas</span>
                </div>
              </div>

              {can.manageUsers && (
                <Link href="/dashboard/admin/users">
                  <Button variant="outline" className="w-full gap-2">
                    <UserCog className="h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Instalação PWA */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Instalação do App
              </CardTitle>
              <CardDescription>
                Instale o NitroBeer POS como um aplicativo nativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled ? (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        App Instalado com Sucesso
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        O NitroBeer POS está instalado e rodando como aplicativo nativo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Download className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Progressive Web App (PWA)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Instale o app para acesso rápido, funcionamento offline e melhor desempenho.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Funciona offline</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Acesso mais rápido</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Notificações push</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Experiência nativa</span>
                    </div>
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
                    <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                      {isInstallable ? (
                        <p>A instalação estará disponível em breve. Recarregue a página se necessário.</p>
                      ) : (
                        <p>Este navegador não suporta instalação PWA ou o app já está instalado.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Backup e Manutenção */}
          {isAdmin && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup e manutenção
                </CardTitle>
                <CardDescription>
                  Proteja seus dados com backups regulares.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold">Backup Automático</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure backups automáticos para proteger seus dados contra
                    perda acidental.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 justify-start"
                    onClick={() => createBackup.mutate()}
                    disabled={createBackup.isPending}
                  >
                    <Download className="h-4 w-4" />
                    Criar backup manual
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 justify-start"
                    disabled
                  >
                    <Upload className="h-4 w-4" />
                    Restaurar backup
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Último backup: Hoje às 09:12</p>
                  <p>• Retenção: 30 dias</p>
                  <p>• Próximo backup: Amanhã às 09:00</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs e Auditoria */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Logs e auditoria</CardTitle>
              <CardDescription>
                Acompanhe as últimas ações registradas no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <BellRing className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Sincronização concluída</p>
                  <p className="text-xs text-muted-foreground">
                    Hoje às 09:12 • Estoque atualizado com Google Sheets
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Configurações atualizadas</p>
                  <p className="text-xs text-muted-foreground">
                    Ontem às 19:47 • Alteração feita por Admin
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <UserCog className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Novo usuário criado</p>
                  <p className="text-xs text-muted-foreground">
                    Ontem às 17:21 • Paula adicionada ao sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
