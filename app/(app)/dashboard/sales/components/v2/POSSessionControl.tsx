"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Lock, Unlock, AlertCircle } from "lucide-react"
import { useState } from "react"
import {
  OpenSessionDialog,
  TransactionDialog,
  CloseSessionDialog,
} from "../CashDialogs"

interface POSSessionControlProps {
  session: any
  pointOfSaleId: string
  isLoading: boolean
}

export function POSSessionControl({
  session,
  pointOfSaleId,
  isLoading,
}: POSSessionControlProps) {
  const [openDialogOpen, setOpenDialogOpen] = useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  const isOpen = session?.status === "OPEN"

  if (isLoading) {
    return null
  }

  if (!pointOfSaleId) {
    return (
      <div className="border-t bg-muted/30 p-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Selecione um ponto de venda
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-t bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {isOpen ? (
                <>
                  <Unlock className="h-3 w-3" />
                  Caixa Aberto
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Caixa Fechado
                </>
              )}
            </Badge>
            {isOpen && session?.openingBalance && (
              <span className="text-sm text-muted-foreground">
                Abertura:{" "}
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(session.openingBalance)}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOpen ? (
              <Button size="sm" onClick={() => setOpenDialogOpen(true)}>
                <Unlock className="mr-2 h-4 w-4" />
                Abrir Caixa
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransactionDialogOpen(true)}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Movimentação
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCloseDialogOpen(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Fechar Caixa
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <OpenSessionDialog
        open={openDialogOpen}
        onOpenChange={setOpenDialogOpen}
        pointOfSaleId={pointOfSaleId}
      />
      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        session={session}
      />
      <CloseSessionDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        session={session}
      />
    </>
  )
}
