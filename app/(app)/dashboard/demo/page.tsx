"use client"

import { NotificationsTester } from "@/components/NotificationsTester"
import { Breadcrumb } from "@/components/Breadcrumb"
import { Card } from "@/components/ui/card"

/**
 * Página de demonstração das novas features
 * Remova ou integre em outro lugar conforme necessário
 */
export default function DemoPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Demonstração de Features</h1>
        <p className="text-muted-foreground">
          Página de teste para breadcrumb e notificações
        </p>
      </div>

      {/* Seção 1: Breadcrumb */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Breadcrumb Melhorado</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O breadcrumb abaixo demonstra a navegação automática:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <Breadcrumb />
          </div>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p>✨ <strong>Features:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Auto-geração baseada na rota URL</li>
              <li>Ícone de home inteligente</li>
              <li>Links navegáveis em cada nível</li>
              <li>Responsivo para mobile</li>
              <li>Suporte a breadcrumbs customizados</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Seção 2: Notificações */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Notificações em Tempo Real</h2>
        <NotificationsTester />
        
        <div className="mt-6 text-xs space-y-2 text-muted-foreground">
          <p>✨ <strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>4 tipos de notificação: info, success, warning, error</li>
            <li>Persistência em localStorage</li>
            <li>Auto-dismiss configurável</li>
            <li>Ações customizáveis por notificação</li>
            <li>Marcar como lido individual ou em lote</li>
            <li>Tempo relativo automático (há pouco, há 2h, etc)</li>
            <li>Badge com contador de não-lidas na sidebar</li>
            <li>Suporte a dark/light mode</li>
          </ul>
        </div>
      </Card>

      {/* Seção 3: Documentação */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Documentação</h2>
        <div className="space-y-3 text-sm">
          <p>
            Para saber como usar estas features em seus componentes, consulte:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                FEATURES_BREADCRUMB_NOTIFICATIONS.md
              </code>
              - Documentação completa
            </li>
            <li>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                INTEGRATION_BREADCRUMB_NOTIFICATIONS.md
              </code>
              - Guia de integração e exemplos
            </li>
          </ul>
        </div>
      </Card>

      {/* Seção 4: Integração Rápida */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Integração Rápida</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. Usar Hook de Notificações</h3>
            <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">
{`import { useInAppNotifications } from "@/hooks/useInAppNotifications"

const { addNotification } = useInAppNotifications()

addNotification("Sucesso", "Operação realizada!", "success", 5000)`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Usar Breadcrumb</h3>
            <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">
{`import { Breadcrumb } from "@/components/Breadcrumb"

// Auto-gerado (recomendado)
<Breadcrumb />

// Customizado
<Breadcrumb items={customItems} />`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Notificação com Ação</h3>
            <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">
{`const { addNotificationWithAction } = useInAppNotifications()

addNotificationWithAction(
  "Estoque Baixo",
  "Produto X com estoque crítico",
  {
    label: "Ver Estoque",
    onClick: () => router.push("/dashboard/inventory")
  },
  "warning"
)`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
