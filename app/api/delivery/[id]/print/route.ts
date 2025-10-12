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
    const printServerUrl = process.env.PRINT_SERVER_URL
    const printServerToken = process.env.PRINT_SERVER_TOKEN
    
    // Se não houver print-server configurado, apenas retorna os dados
    if (!printServerUrl) {
      console.warn("PRINT_SERVER_URL não configurado. Impressão desabilitada.")
      return NextResponse.json({ 
        success: true,
        message: "Print-server não configurado. Configure PRINT_SERVER_URL para habilitar impressão.",
        data: printData // Retorna dados para debug
      })
    }
    
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      // Adicionar token se configurado
      if (printServerToken) {
        headers["Authorization"] = `Bearer ${printServerToken}`
      }
      
      const response = await fetch(`${printServerUrl}/print`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "delivery",
          data: printData
        }),
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Erro desconhecido" }))
        throw new Error(error.error || error.message || "Erro ao enviar para impressora")
      }

      const result = await response.json()
      
      return NextResponse.json({ 
        success: true,
        message: result.message || "Impressão enviada com sucesso"
      })
    } catch (fetchError: any) {
      // Se erro de conexão, avisar mas não falhar
      if (fetchError.name === 'AbortError') {
        console.error("Timeout ao conectar no print-server:", printServerUrl)
        return NextResponse.json({ 
          success: false,
          error: "Timeout: Print-server demorou muito para responder. Verifique se está rodando.",
          message: "Servidor de impressão não respondeu"
        }, { status: 504 }) // Gateway Timeout
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNREFUSED') {
        console.error("Print-server não acessível:", printServerUrl)
        return NextResponse.json({ 
          success: false,
          error: "Print-server não está acessível. Verifique se está rodando.",
          message: "Servidor de impressão offline"
        }, { status: 503 }) // Service Unavailable
      }
      
      throw fetchError
    }

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
