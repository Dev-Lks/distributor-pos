export type CashSessionStatusLiteral = "OPEN" | "CLOSING" | "CLOSED"
export type CashTransactionTypeLiteral = "OPENING" | "SUPPLY" | "WITHDRAWAL" | "ADJUSTMENT"

export type CashSessionTransaction = {
  id: string
  type: CashTransactionTypeLiteral
  amount: number
  description: string | null
  paymentMethod: string | null
  createdAt: string
  performedBy?: {
    id: string
    name: string | null
  } | null
}

export type CashSessionSaleSummary = {
  id: string
  total: number
  date: string
  paymentMethod: string | null
}

export type CashSessionSnapshot = {
  id: string
  status: CashSessionStatusLiteral
  userId: string
  pointOfSaleId: string | null
  openedAt: string
  closedAt: string | null
  openingAmount: number
  closingAmount: number | null
  expectedClosingAmount: number
  differenceAmount: number | null
  totals: {
    supplies: number
    withdrawals: number
    adjustments: number
    opening: number
    cashPayments: number
    nonCashPayments: number
  }
  totalsByPaymentMethod: Record<string, number>
  runningBalance: number
  notes: string | null
  pointOfSale?: {
    id: string
    name: string
    channel: string | null
  } | null
  user: {
    id: string
    name: string | null
    email: string
  }
  transactions: CashSessionTransaction[]
  sales: CashSessionSaleSummary[]
}
