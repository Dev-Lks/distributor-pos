import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Proxy para o print-server separado.
 * 
 * Este endpoint encaminha as requisições de configuração para o print-server
 * que deve estar rodando em PRINT_SERVER_URL.
 * 
 * Para configurar o print-server:
 * 1. Configure a variável: PRINT_SERVER_URL=https://print.nitrobeer.com.br
 * 2. Configure o token: PRINT_SERVER_AUTH_TOKEN=seu_token_secreto
 * 
 * Veja: /TUTORIAL_IMPRESSORA_TERMICA.md e /DEPLOY_IMPRESSORA_PRODUCAO.md
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
    const body = await request.json()

    const response = await fetch(`${printServerUrl}/api/printer/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify(body),
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
