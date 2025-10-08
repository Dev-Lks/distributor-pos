import { NextRequest, NextResponse } from 'next/server'
import { getPrinterInstance } from '@/lib/hardware/thermalPrinter'
import { PrinterConfig } from '@/lib/hardware/types'

export async function POST(request: NextRequest) {
  try {
    const config: PrinterConfig = await request.json()
    
    if (!config.type || !config.connectionString || !config.width || !config.encoding) {
      return NextResponse.json(
        { success: false, message: 'Configuração incompleta' },
        { status: 400 }
      )
    }

    const printer = getPrinterInstance()
    printer.configure(config)
    
    // Testa a conexão
    const status = await printer.getStatus()
    
    if (!status.connected) {
      return NextResponse.json(
        { success: false, message: 'Não foi possível conectar à impressora' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Impressora configurada com sucesso',
      status 
    })
  } catch (error) {
    console.error('Erro ao configurar impressora:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao configurar impressora' 
      },
      { status: 500 }
    )
  }
}
