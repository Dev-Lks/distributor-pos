import { NextRequest, NextResponse } from 'next/server'
import { getPrinterInstance } from '@/lib/hardware/thermalPrinter'

export async function POST(request: NextRequest) {
  try {
    const printer = getPrinterInstance()
    await printer.testPrint()
    
    return NextResponse.json({ 
      success: true,
      message: 'Teste de impressão enviado com sucesso' 
    })
  } catch (error) {
    console.error('Erro no teste de impressão:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro no teste de impressão' 
      },
      { status: 500 }
    )
  }
}
