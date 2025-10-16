import { useCallback } from "react"
import { toast } from "sonner"
import { handleError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import { useCashSession } from "@/hooks/useCashSession"
import type { CashTransactionTypeLiteral } from "@/types/cash"

/**
 * Hook wrapper para controles de sessão de caixa com lógica de UI
 * Simplifica o uso do useCashSession adicionando feedback visual
 */
export function useCashSessionControls(pointOfSaleId: string | null) {
  const cashSession = useCashSession(pointOfSaleId ?? undefined)

  /**
   * Abre uma nova sessão de caixa
   */
  const handleOpenSession = useCallback(async (initialAmount: number, notes?: string) => {
    if (!pointOfSaleId) {
      toast.error("Selecione um ponto de venda")
      return false
    }

    try {
      await cashSession.openSession({
        openingAmount: initialAmount,
        pointOfSaleId,
        notes,
      })
      toast.success("Caixa aberto com sucesso!")
      return true
    } catch (error) {
      const { message } = handleError(error)
      logger.error("Erro ao abrir caixa", { error, pointOfSaleId })
      toast.error("Erro ao abrir caixa", {
        description: message || "Tente novamente",
      })
      return false
    }
  }, [pointOfSaleId, cashSession])

  /**
   * Registra uma transação (suprimento, sangria, ajuste)
   */
  const handleTransaction = useCallback(async (
    type: Exclude<CashTransactionTypeLiteral, "OPENING">,
    amount: number,
    description?: string
  ) => {
    if (!cashSession.session) {
      toast.error("Nenhuma sessão de caixa ativa")
      return false
    }

    try {
      await cashSession.registerTransaction({
        sessionId: cashSession.session.id,
        type,
        amount,
        description,
      })
      
      const labels: Record<Exclude<CashTransactionTypeLiteral, "OPENING">, string> = {
        SUPPLY: "Suprimento",
        WITHDRAWAL: "Sangria",
        ADJUSTMENT: "Ajuste",
      }

      toast.success(`${labels[type]} registrado com sucesso!`)
      return true
    } catch (error) {
      const { message } = handleError(error)
      logger.error("Erro ao registrar transação", { error, type, sessionId: cashSession.session?.id })
      toast.error("Erro ao registrar transação", {
        description: message || "Tente novamente",
      })
      return false
    }
  }, [cashSession])

  /**
   * Fecha a sessão de caixa atual
   */
  const handleCloseSession = useCallback(async (closingAmount: number, notes?: string) => {
    if (!cashSession.session) {
      toast.error("Nenhuma sessão de caixa ativa")
      return false
    }

    try {
      await cashSession.closeSession({
        sessionId: cashSession.session.id,
        closingAmount,
        notes,
      })
      toast.success("Caixa fechado com sucesso!")
      return true
    } catch (error) {
      const { message } = handleError(error)
      logger.error("Erro ao fechar caixa", { error, sessionId: cashSession.session?.id })
      toast.error("Erro ao fechar caixa", {
        description: message || "Tente novamente",
      })
      return false
    }
  }, [cashSession])

  return {
    ...cashSession,
    handleOpenSession,
    handleTransaction,
    handleCloseSession,
  }
}
