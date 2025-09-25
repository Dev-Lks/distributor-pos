"use client"

import { useState } from "react"
import { BellRing, KeyRound, Laptop, Mail, RefreshCw, ShieldCheck, Smartphone, UserCog } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const channels = [
  { id: "email", label: "E-mail", description: "Receba relatórios instantâneos", icon: Mail },
  { id: "push", label: "Push", description: "Alertas no tablet ou PWA", icon: Smartphone },
  { id: "desktop", label: "Desktop", description: "Notificações no navegador", icon: Laptop }
] as const

type ChannelId = (typeof channels)[number]["id"]

export default function SettingsPage() {
  const [enabledChannels, setEnabledChannels] = useState<Record<ChannelId, boolean>>({
    email: true,
    push: true,
    desktop: false
  })

  const [autoSync, setAutoSync] = useState(true)
  const [inventoryAlerts, setInventoryAlerts] = useState(true)
  const [salesReceipt, setSalesReceipt] = useState(false)

  const toggleChannel = (id: ChannelId) => {
    setEnabledChannels((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-none">
        <CardHeader className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit bg-primary/15 text-primary">
              Central de controle
            </Badge>
            <CardTitle className="text-2xl md:text-3xl">Configurações do sistema</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Ajuste preferências operacionais, integrações e notificações para manter o NitroBeer rodando de forma
              confiável em todos os pontos de venda.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sincronizar dados
            </Button>
            <Button size="sm" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Salvar alterações
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Preferências gerais</CardTitle>
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
                    defaultValue="NitroBeer Tap House"
                    placeholder="Ex.: NitroBeer Tap House"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-point">Ponto principal</Label>
                  <Select defaultValue="main">
                    <SelectTrigger id="default-point">
                      <SelectValue placeholder="Selecione o ponto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Tap da Matriz</SelectItem>
                      <SelectItem value="beach">Quiosque Praia</SelectItem>
                      <SelectItem value="arena">Arena Eventos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">Sincronização automática com Google Sheets</p>
                    <p className="text-xs text-muted-foreground">
                      Controle se o estoque e as vendas são enviados automaticamente após cada alteração.
                    </p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support-email">E-mail para suporte</Label>
                  <Input
                    id="support-email"
                    type="email"
                    placeholder="contato@nitrobeer.com"
                    defaultValue="contato@nitrobeer.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing-message">Mensagem no comprovante</Label>
                  <textarea
                    id="closing-message"
                    placeholder="Agradeça ao cliente e incentive a fidelidade"
                    defaultValue="Obrigado por escolher a NitroBeer! Aproveite 10% off no próximo growler."
                    className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Alertas e notificações</CardTitle>
              <CardDescription>
                Escolha como os responsáveis são avisados sobre rupturas e movimentações críticas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">Alertas de estoque crítico</p>
                  <p className="text-xs text-muted-foreground">
                    Receba avisos quando algum produto atingir o estoque mínimo em qualquer localização.
                  </p>
                </div>
                <Switch checked={inventoryAlerts} onCheckedChange={setInventoryAlerts} />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">Envio automático de comprovante</p>
                  <p className="text-xs text-muted-foreground">
                    Dispare um recibo por e-mail sempre que a venda for finalizada no tablet.
                  </p>
                </div>
                <Switch checked={salesReceipt} onCheckedChange={setSalesReceipt} />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {channels.map((channel) => {
                  const Icon = channel.icon
                  const enabled = enabledChannels[channel.id]
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "group flex h-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                        enabled
                          ? "border-primary/60 bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border",
                            enabled ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{channel.label}</p>
                          <p className="text-xs text-muted-foreground">{channel.description}</p>
                        </div>
                      </div>
                      <Badge variant={enabled ? "default" : "secondary"} className="text-[11px]">
                        {enabled ? "Ativado" : "Desativado"}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Segurança e acessos</CardTitle>
              <CardDescription>
                Gerencie o PIN de acesso e quem pode operar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">PIN mestre</p>
                    <p className="text-xs text-muted-foreground">
                      O PIN protege o dashboard e o PDV em dispositivos não autorizados. Altere periodicamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">Novo PIN (4 dígitos)</Label>
                <Input id="pin" type="password" maxLength={4} placeholder="••••" className="text-center tracking-[0.6rem]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrador responsável</Label>
                <Input id="admin-email" type="email" placeholder="admin@nitrobeer.com" />
              </div>

              <Button variant="outline" className="w-full gap-2">
                <UserCog className="h-4 w-4" />
                Gerenciar operadores
              </Button>
            </CardContent>
          </Card>

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
                  <p className="text-xs text-muted-foreground">Hoje às 09:12 • Estoque atualizado com Google Sheets</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">PIN alterado</p>
                  <p className="text-xs text-muted-foreground">Ontem às 19:47 • Alteração feita por Lucas (matriz)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <UserCog className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Novo operador adicionado</p>
                  <p className="text-xs text-muted-foreground">Ontem às 17:21 • Paula agora opera o quiosque praia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
