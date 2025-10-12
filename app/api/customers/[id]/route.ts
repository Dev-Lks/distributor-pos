import { NextRequest, NextResponse } from "next/server"

import { prisma, type Prisma } from "@/lib/prisma"
import { getServerAuth, notAuthenticated, unauthorized } from "@/lib/serverAuth"

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  document: true,
  phone: true,
  email: true,
  address: true,
  lastPurchaseAt: true,
  totalOrders: true,
  totalSpend: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bonifications: true,
      sales: true,
    },
  },
} satisfies Prisma.CustomerSelect

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { session, hasPermission } = await getServerAuth()
  
  if (!session) return notAuthenticated()
  if (!hasPermission("VIEW_CUSTOMERS")) return unauthorized("Você não tem permissão para visualizar clientes")

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: CUSTOMER_SELECT,
    })

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      document: customer.document ?? null,
      phone: customer.phone ?? null,
      email: customer.email ?? null,
      address: customer.address ?? null,
      lastPurchaseAt: customer.lastPurchaseAt,
      totalOrders: customer.totalOrders,
      totalSpend: customer.totalSpend,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      bonificationsCount: customer._count?.bonifications ?? 0,
      salesCount: customer._count?.sales ?? 0,
    })
  } catch (error) {
    console.error("Failed to fetch customer", error)
    return NextResponse.json({ error: "Não foi possível carregar o cliente." }, { status: 500 })
  }
}
