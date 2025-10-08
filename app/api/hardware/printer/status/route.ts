import { NextRequest, NextResponse } from 'next/server'
import { getPrinterInstance } from '@/lib/hardware/thermalPrinter'

export async function GET(request: NextRequest) {
  try {
    const printer = getPrinterInstance()
    const status = await printer.getStatus()
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Erro ao obter status da impressora:', error)
    return NextResponse.json(
      { 
        connected: false, 
        online: false, 
        paperStatus: 'out',
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
}
