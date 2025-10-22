"use client"

import { useInAppNotifications } from "@/hooks/useInAppNotifications"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Componente de demonstração das funcionalidades de notificações
 * Use este componente para testar todas as funcionalidades
 */
export function NotificationsTester() {
  const {
    addNotification,
    addNotificationWithAction,
    notifications,
    unreadCount,
  } = useInAppNotifications()

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Testador de Notificações</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Notificações: {notifications.length} | Não-lidas: {unreadCount}
        </p>
      </div>

      {/* Notificações Básicas */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Notificações Básicas:</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              addNotification(
                "Info",
                "Esta é uma notificação informativa",
                "info"
              )
            }
          >
            Info
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              addNotification(
                "Sucesso",
                "Operação realizada com sucesso!",
                "success"
              )
            }
          >
            Success
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              addNotification(
                "Aviso",
                "Atenção necessária nesta operação",
                "warning"
              )
            }
          >
            Warning
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              addNotification(
                "Erro",
                "Algo deu errado na operação",
                "error"
              )
            }
          >
            Error
          </Button>
        </div>
      </div>

      {/* Auto-dismiss */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Auto-dismiss (5 segundos):</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            addNotification(
              "Auto-dismiss",
              "Esta notificação desaparecerá em 5 segundos",
              "info",
              5000
            )
          }
        >
          Testar Auto-dismiss
        </Button>
      </div>

      {/* Notificações com Ação */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Com Ação Customizada:</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            addNotificationWithAction(
              "Estoque Baixo",
              "Produto X com estoque crítico",
              {
                label: "Ver Estoque",
                onClick: () => {
                  alert("Abrindo página de estoque...")
                  // window.location.href = "/dashboard/inventory"
                },
              },
              "warning"
            )
          }
        >
          Notificação com Ação
        </Button>
      </div>

      {/* Múltiplas Notificações */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Teste de Stress:</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            for (let i = 0; i < 5; i++) {
              setTimeout(() => {
                addNotification(
                  `Notificação ${i + 1}`,
                  `Esta é a notificação número ${i + 1}`,
                  ["info", "success", "warning", "error"][
                    i % 4
                  ] as "info" | "success" | "warning" | "error"
                )
              }, i * 300)
            }
          }}
        >
          Enviar 5 Notificações
        </Button>
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Notificações Ativas ({notifications.length}):
        </p>
        <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma notificação</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className="rounded border border-border/50 bg-muted/30 p-2"
              >
                <p className="font-medium">
                  {n.title} {!n.read ? "🔴" : "✓"}
                </p>
                <p className="text-muted-foreground">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
