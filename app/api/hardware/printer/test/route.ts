import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Proxy para teste de impressão no print-server
 */
export async function POST(request: NextRequest) {
  const printServerUrl = process.env.PRINT_SERVER_URL
  const authToken = process.env.PRINT_SERVER_TOKEN || process.env.PRINT_SERVER_AUTH_TOKEN

  if (!printServerUrl) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Print server não configurado',
        help: 'Configure PRINT_SERVER_URL no ambiente',
      },
      { status: 503 }
    )
  }

  try {
    const response = await fetch(`${printServerUrl}/api/printer/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    logger.error('Erro ao conectar ao print-server:', { error })
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao conectar ao print-server',
        error: error.message,
      },
      { status: 503 }
    )
  }
}
