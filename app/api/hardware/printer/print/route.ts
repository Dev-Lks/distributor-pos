import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { 
  generateSaleReceipt, 
  generateCashTransactionReceipt,
  generateCashClosingReceipt,
  generateDeliveryReceipt 
} from '@/lib/hardware/printerTemplates'
import { prisma } from '@/lib/prisma'
import { printerPrintSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const { data, type } = printerPrintSchema.parse(await request.json())
    const payload = data as Record<string, any>

    // Busca configurações globais do sistema
    let systemSettings = await prisma.systemSettings.findFirst();
    
    // Se não existir, criar com valores padrão
    if (!systemSettings) {
      systemSettings = await prisma.systemSettings.create({
        data: {
          businessName: "Minha Loja",
        }
      });
    }

    // Busca configurações de hardware do ponto de venda (se houver)
    const pointOfSaleId = typeof payload.pointOfSaleId === 'string' ? payload.pointOfSaleId : undefined
    let hardwareConfig = null
    
    if (pointOfSaleId) {
      hardwareConfig = await prisma.hardwareConfig.findUnique({
        where: { pointOfSaleId },
      })
    }

    const config = {
      storeName: systemSettings.businessName,
      storeDocument: systemSettings.cnpj || undefined,
      storeAddress: systemSettings.address || undefined,
      storePhone: systemSettings.phone || undefined,
      footerMessage: hardwareConfig?.footerMessage || systemSettings.receiptFooterMessage || 'Obrigado pela preferência!',
      logoUrl: hardwareConfig?.logoUrl || systemSettings.receiptLogoUrl || undefined,
      showQRCode: systemSettings.receiptShowQRCode,
      width: hardwareConfig?.printerWidth || systemSettings.receiptWidth || 48,
    }

    let template
    
    switch (type) {
      case 'sale':
        // Busca venda completa
        const saleId = typeof payload.id === 'string' ? payload.id : typeof payload.saleId === 'string' ? payload.saleId : null

        if (!saleId) {
          return NextResponse.json(
            { success: false, message: 'Identificador da venda é obrigatório' },
            { status: 400 }
          )
        }

        const sale = await prisma.sale.findUnique({
          where: { id: saleId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            pointOfSale: true,
          },
        })
        
        if (!sale) {
          return NextResponse.json(
            { success: false, message: 'Venda não encontrada' },
            { status: 404 }
          )
        }
        
        template = generateSaleReceipt(sale as any, config)
        
        // Atualiza metadata da venda com info de impressão
        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            metadata: {
              ...(sale.metadata as any || {}),
              printedAt: new Date().toISOString(),
              printStatus: 'success',
            },
          },
        })
        break

      case 'cash-transaction':
        // Build a transaction object with required fields so the receipt generator receives a proper CashTransaction
        const cashTransaction = {
          type: (payload.type as any) ?? 'SUPPLY',
          amount: Number((payload.amount ?? payload.value) ?? 0),
          createdAt: payload.createdAt ?? new Date().toISOString(),
          description: payload.description,
          performedBy: payload.performedBy,
        } as any

        template = generateCashTransactionReceipt(cashTransaction, config)
        break

      case 'cash-closing':
        template = generateCashClosingReceipt(payload, config)
        break

      case 'delivery':
      case 'delivery-driver':
      case 'delivery-customer':
      case 'delivery-organizer':
        // Busca entrega completa se for um ID
  let deliveryData: Record<string, any> = payload
        const deliveryId = typeof payload.id === 'string' ? payload.id : typeof payload.deliveryId === 'string' ? payload.deliveryId : null

        if (deliveryId) {
          const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: {
              customer: true,
              driver: true,
            },
          })
          
          if (!delivery) {
            return NextResponse.json(
              { success: false, message: 'Entrega não encontrada' },
              { status: 404 }
            )
          }
          
          deliveryData = {
            ...delivery,
            items: Array.isArray(payload.items) ? payload.items : [],
          }
        }
        
        // Determina o tipo de recibo
        let receiptType: 'driver' | 'customer' | 'organizer' = 'customer'
        if (type === 'delivery-driver') receiptType = 'driver'
        else if (type === 'delivery-organizer') receiptType = 'organizer'
        else if (typeof payload.receiptType === 'string') receiptType = payload.receiptType as 'driver' | 'customer' | 'organizer'

        template = generateDeliveryReceipt(deliveryData, config, receiptType)
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Tipo de recibo não suportado' },
          { status: 400 }
        )
    }

    // Envia para o print-server
    const printServerUrl = process.env.PRINT_SERVER_URL
    const authToken = process.env.PRINT_SERVER_TOKEN || process.env.PRINT_SERVER_AUTH_TOKEN

    if (!printServerUrl) {
      return NextResponse.json(
        { success: false, message: 'Print server não configurado' },
        { status: 503 }
      )
    }

    const printResponse = await fetch(`${printServerUrl}/api/printer/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({ template }),
    })

    if (!printResponse.ok) {
      const errorData = await printResponse.json()
      throw new Error(errorData.error || 'Erro ao imprimir no print-server')
    }
    
    // TODO: Registra job de impressão quando PrintJob estiver disponível
    // const printJob = await prisma.printJob.create({
    //   data: {
    //     type,
    //     data: data,
    //     status: 'completed',
    //     completedAt: new Date(),
    //     retryCount: 0,
    //   },
    // })

    return NextResponse.json({ 
      success: true, 
      // jobId: printJob.id,
      message: 'Recibo impresso com sucesso' 
    })
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues.at(0)
      return NextResponse.json(
        { success: false, message: issue?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    logger.error('Erro ao imprimir:', { error })
    
    // TODO: Registra falha no job quando PrintJob estiver disponível
    // try {
    //   await prisma.printJob.create({
    //     data: {
    //       type: request.body ? 'sale' : 'unknown',
    //       data: {},
    //       status: 'failed',
    //       error: error instanceof Error ? error.message : 'Erro desconhecido',
    //       retryCount: 0,
    //     },
    //   })
    // } catch (dbError) {
    //   logger.error('Erro ao registrar falha:', dbError)
    // }

    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao imprimir' 
      },
      { status: 500 }
    )
  }
}
