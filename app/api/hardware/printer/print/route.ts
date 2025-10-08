import { NextRequest, NextResponse } from 'next/server'
import { getPrinterInstance } from '@/lib/hardware/thermalPrinter'
import { 
  generateSaleReceipt, 
  generateCashTransactionReceipt,
  generateCashClosingReceipt 
} from '@/lib/hardware/printerTemplates'
import { prisma } from '@/lib/prisma'
import type { ReceiptType } from '@/lib/hardware/types'

export async function POST(request: NextRequest) {
  try {
    const { data, type } = await request.json() as { data: any; type: ReceiptType }
    
    if (!data || !type) {
      return NextResponse.json(
        { success: false, message: 'Dados ou tipo de recibo não fornecidos' },
        { status: 400 }
      )
    }

    // Busca configurações do ponto de venda
    const pointOfSaleId = data.pointOfSaleId
    let hardwareConfig = null
    
    // TODO: Descomentar quando HardwareConfig estiver disponível
    // if (pointOfSaleId) {
    //   hardwareConfig = await prisma.hardwareConfig.findUnique({
    //     where: { pointOfSaleId },
    //   })
    // }

    const config = {
      storeName: 'Minha Loja', // TODO: Buscar do banco
      storeDocument: '00.000.000/0001-00', // TODO: Buscar do banco
      storeAddress: undefined,
      storePhone: '(00) 0000-0000', // TODO: Buscar do banco
      footerMessage: 'Obrigado pela preferência!',
      width: 48,
    }

    let template
    
    switch (type) {
      case 'sale':
        // Busca venda completa
        const sale = await prisma.sale.findUnique({
          where: { id: data.id || data.saleId },
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
        template = generateCashTransactionReceipt(data, config)
        break

      case 'cash-closing':
        template = generateCashClosingReceipt(data, config)
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Tipo de recibo não suportado' },
          { status: 400 }
        )
    }

    // Imprime
    const printer = getPrinterInstance()
    await printer.print(template)
    
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
    console.error('Erro ao imprimir:', error)
    
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
    //   console.error('Erro ao registrar falha:', dbError)
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
