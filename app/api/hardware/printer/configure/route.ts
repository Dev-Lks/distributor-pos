import { NextRequest, NextResponse } from 'next/server'

/**
 * NOTA: Este endpoint foi desabilitado porque node-thermal-printer
 * não funciona em ambientes serverless (Vercel/Edge Functions).
 * 
 * Use o print-server separado executando em um servidor local/VPS.
 * Veja: /print-server/README.md e /TUTORIAL_IMPRESSORA_TERMICA.md
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Este endpoint foi desabilitado. Use o print-server separado para configuração da impressora.',
      documentation: '/TUTORIAL_IMPRESSORA_TERMICA.md'
    },
    { status: 501 } // Not Implemented
  )
}
