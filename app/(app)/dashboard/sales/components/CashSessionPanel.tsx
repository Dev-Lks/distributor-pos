import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  PiggyBank,
  DoorOpen,
  DoorClosed,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
} from "lucide-react"
import type { CashSessionSnapshot } from "@/types/cash"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface CashSessionPanelProps {
  session: CashSessionSnapshot | null
  loading?: boolean
  onOpenSession: () => void
  onRegisterTransaction: () => void
  onCloseSession: () => void
}

/**
 * Painel de controle da sessão de caixa
 */
export function CashSessionPanel({
  session,
  loading = false,
  onOpenSession,
  onRegisterTransaction,
  onCloseSession,
}: CashSessionPanelProps) {
  const isSessionOpen = session?.status === "OPEN"

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Caixa
          </CardTitle>
          {session && (
            <Badge
              variant={isSessionOpen ? "default" : "secondary"}
              className="font-mono"
            >
              {isSessionOpen ? "ABERTO" : session.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!session ? (
          /* Nenhuma sessão ativa */
          <div className="space-y-4">
            <div className="text-center py-6">
              <DoorClosed className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-1">
                Nenhuma sessão ativa
              </p>
              <p className="text-xs text-muted-foreground">
                Abra o caixa para começar as vendas
              </p>
            </div>

            <Button
              onClick={onOpenSession}
              className="w-full"
              size="lg"
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
          </div>
        ) : (
          /* Sessão ativa */
          <>
            {/* Informações da Sessão */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Aberto há
                </span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(session.openedAt), {
                    locale: ptBR,
                  })}
                </span>
              </div>

              <Separator />

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Inicial</span>
                  <span>{currencyFormatter.format(session.openingAmount)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendas (Dinheiro)</span>
                  <span className="text-green-600">
                    +{currencyFormatter.format(session.totals.cashPayments)}
                  </span>
                </div>

                {session.totals.supplies > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suprimentos</span>
                    <span className="text-green-600">
                      +{currencyFormatter.format(session.totals.supplies)}
                    </span>
                  </div>
                )}

                {session.totals.withdrawals > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sangrias</span>
                    <span className="text-red-600">
                      -{currencyFormatter.format(session.totals.withdrawals)}
                    </span>
                  </div>
                )}

                {session.totals.adjustments !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ajustes</span>
                    <span className={session.totals.adjustments > 0 ? "text-green-600" : "text-red-600"}>
                      {session.totals.adjustments > 0 ? "+" : ""}
                      {currencyFormatter.format(session.totals.adjustments)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Saldo Atual */}
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-primary/10">
                <span className="font-medium">Saldo em Caixa</span>
                <span className="text-xl font-bold text-primary">
                  {currencyFormatter.format(session.runningBalance)}
                </span>
              </div>

              {/* Vendas não-dinheiro (informativo) */}
              {session.totals.nonCashPayments > 0 && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  <p>
                    Vendas em cartão/PIX:{" "}
                    <span className="font-medium">
                      {currencyFormatter.format(session.totals.nonCashPayments)}
                    </span>
                  </p>
                  <p className="text-[10px] mt-0.5">
                    (não incluídas no saldo do caixa)
                  </p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onRegisterTransaction}
              >
                <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                Suprimento / Sangria
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={onCloseSession}
              >
                <DoorClosed className="h-4 w-4 mr-2" />
                Fechar Caixa
              </Button>
            </div>

            {/* Info do Ponto de Venda */}
            {session.pointOfSale && (
              <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                <p>
                  {session.pointOfSale.name}
                  {session.pointOfSale.channel && ` • ${session.pointOfSale.channel}`}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
