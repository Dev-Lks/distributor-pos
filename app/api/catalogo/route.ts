import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'catalogo.pdf');
    const pdfBuffer = await readFile(pdfPath);

    const response = new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="catalogo-distribuidora.pdf"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

    // Remover headers que podem bloquear o iframe
    response.headers.delete('X-Frame-Options');
    
    return response;
  } catch (error) {
    console.error('Error loading PDF:', error);
    return NextResponse.json(
      { error: 'PDF not found' },
      { status: 404 }
    );
  }
}
