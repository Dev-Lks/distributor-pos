"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Lock, Unlock, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useCashSession } from "@/lib/useCashSession"
import {
  OpenSessionDialog,
  TransactionDialog,
  CloseSessionDialog,
} from "../CashDialogs"
import type { CashTransactionTypeLiteral } from "@/types/cash"

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

  // Cash session mutations
  const {
    openSession,
    closeSession,
    registerTransaction,
    isOpening,
    isClosing,
    isRegisteringTransaction,
  } = useCashSession(pointOfSaleId)

  const isOpen = session?.status === "OPEN"

  // Handlers
  const handleOpenSession = async (amount: number, notes?: string) => {
    try {
      await openSession({ openingAmount: amount, pointOfSaleId, notes })
      setOpenDialogOpen(false)
    } catch (error) {
      console.error('Error opening session:', error)
    }
  }

  const handleCloseSession = async (closingAmount: number, notes?: string) => {
    if (!session?.id) return
    try {
      await closeSession({ sessionId: session.id, closingAmount, notes })
      setCloseDialogOpen(false)
    } catch (error) {
      console.error('Error closing session:', error)
    }
  }

  const handleTransaction = async (
    type: Exclude<CashTransactionTypeLiteral, "OPENING">,
    amount: number,
    description?: string
  ) => {
    if (!session?.id) return
    try {
      await registerTransaction({ sessionId: session.id, type, amount, description })
      setTransactionDialogOpen(false)
    } catch (error) {
      console.error('Error registering transaction:', error)
    }
  }

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
        onConfirm={handleOpenSession}
        loading={isOpening}
      />
      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onConfirm={handleTransaction}
        loading={isRegisteringTransaction}
      />
      <CloseSessionDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleCloseSession}
        session={session}
        loading={isClosing}
      />
    </>
  )
}
