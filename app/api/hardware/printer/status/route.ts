import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Proxy para status da impressora no print-server
 */
export async function GET(request: NextRequest) {
  const printServerUrl = process.env.PRINT_SERVER_URL
  const authToken = process.env.PRINT_SERVER_TOKEN || process.env.PRINT_SERVER_AUTH_TOKEN

  if (!printServerUrl) {
    return NextResponse.json(
      { 
        connected: false, 
        online: false, 
        paperStatus: 'out',
        error: 'Print server não configurado',
      },
      { status: 503 }
    )
  }

  try {
    const response = await fetch(`${printServerUrl}/api/printer/status`, {
      method: 'GET',
      headers: {
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    logger.error('Erro ao conectar ao print-server:', { error })
    return NextResponse.json(
      { 
        connected: false, 
        online: false, 
        paperStatus: 'out',
        error: 'Erro ao conectar ao print-server',
      },
      { status: 503 }
    )
  }
}
