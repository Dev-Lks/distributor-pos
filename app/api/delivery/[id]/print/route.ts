import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params
    
    // Buscar delivery completa
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: true,
        sale: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })

    if (!delivery) {
      return NextResponse.json({ error: "Entrega não encontrada" }, { status: 404 })
    }

    // Formatar dados para impressão
    const printData = formatDeliveryForPrint(delivery)

    // Enviar para impressora térmica via print-server
    const printServerUrl = process.env.PRINT_SERVER_URL || "http://localhost:3001"
    
    const response = await fetch(`${printServerUrl}/print`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "delivery",
        data: printData
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Erro ao enviar para impressora")
    }

    return NextResponse.json({ 
      success: true,
      message: "Impressão enviada com sucesso" 
    })

  } catch (error: any) {
    console.error("Erro ao imprimir delivery:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao imprimir" },
      { status: 500 }
    )
  }
}

function formatDeliveryForPrint(delivery: any) {
  return {
    // Cabeçalho
    header: {
      title: "COMPROVANTE DE ENTREGA",
      deliveryNumber: delivery.deliveryNumber,
      date: new Date(delivery.createdAt).toLocaleString("pt-BR"),
      status: delivery.status
    },

    // Cliente
    customer: {
      name: delivery.customer?.name || "N/A",
      phone: delivery.customer?.phone || "N/A"
    },

    // Endereço
    address: {
      street: delivery.deliveryAddress,
      number: delivery.addressNumber,
      complement: delivery.addressComplement,
      district: delivery.district,
      city: delivery.city,
      state: delivery.state,
      postalCode: delivery.postalCode,
      reference: delivery.referencePoint,
      instructions: delivery.deliveryInstructions
    },

    // Itens
    items: delivery.sale?.items?.map((item: any) => ({
      name: item.product?.name || item.name || "Produto",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      discount: item.discount || 0
    })) || [],

    // Financeiro
    financial: {
      subtotal: delivery.subtotal,
      discountValue: delivery.discountValue || 0,
      deliveryFee: delivery.deliveryFee,
      total: delivery.total
    },

    // Pagamento
    payment: {
      method: delivery.paymentMethod,
      paidInAdvance: delivery.paidInAdvance,
      changeFor: delivery.changeFor
    },

    // Agendamento
    scheduledFor: delivery.scheduledFor 
      ? new Date(delivery.scheduledFor).toLocaleString("pt-BR")
      : null,

    // Observações
    notes: delivery.notes,

    // Rodapé
    footer: {
      createdBy: delivery.createdBy?.name || "Sistema",
      printedAt: new Date().toLocaleString("pt-BR")
    }
  }
}
