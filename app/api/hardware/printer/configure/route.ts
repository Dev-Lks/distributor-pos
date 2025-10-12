import { NextRequest, NextResponse } from 'next/server'

/**
 * NOTA: Este endpoint foi desabilitado porque node-thermal-printer
 * não funciona em ambientes serverless (Vercel/Edge Functions).
 * 
 * Use o print-server separado executando em um servidor local/VPS.
 * 
 * Para configurar:
 * 1. Instale o print-server: cd print-server && ./install.sh
 * 2. Configure: nano .env
 * 3. Inicie: pm2 start index.js --name print-server
 * 4. Configure URL no projeto: PRINT_SERVER_URL=http://localhost:3001
 * 
 * Veja: /TUTORIAL_IMPRESSORA_TERMICA.md e /DEPLOY_IMPRESSORA_PRODUCAO.md
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Configuração de impressora local desabilitada. Use o print-server separado.',
      help: 'Veja /TUTORIAL_IMPRESSORA_TERMICA.md para instruções de setup',
      documentation: [
        '/TUTORIAL_IMPRESSORA_TERMICA.md',
        '/DEPLOY_IMPRESSORA_PRODUCAO.md',
        '/print-server/README.md'
      ]
    },
    { status: 501 } // Not Implemented
  )
}

// Desabilitar outros métodos também
export async function GET(request: NextRequest) {
  return POST(request)
}
