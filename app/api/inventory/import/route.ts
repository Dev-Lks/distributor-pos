import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type ExcelRow = {
  Quantidade: number; // Quantidade de compra
  Item: string;       // Nome do produto
  Tamanho: string;    // Tamanho (ex: 1,5L)
  Custo?: number;     // Custo unitário (opcional)
  ValorTotal?: number;// Valor total (opcional)
  Peso?: string;      // Peso (não usado no estoque)
  VendaConsumidor?: number; // Preço de venda sugerido
  TotalVenda?: number; // Total de venda (opcional)
  Local?: 'camara_fria' | 'casa' | 'ponto_venda'; // local destino
  MinStock?: number; // estoque mínimo
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rows, defaultLocation } = body as { rows: ExcelRow[]; defaultLocation?: 'camara_fria' | 'casa' | 'ponto_venda' };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    // Processar em transação: cria produto se não existir, ajusta preço, cria/atualiza stockLevel
  const results: Array<{ productId: string; name: string; size: string; quantity: number; location: string }> = [];
  const failures: Array<{ row: ExcelRow; reason: string }> = [];

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const r of rows) {
        const name = (r.Item || '').trim();
        const size = (r.Tamanho || '').trim();
        const qty = Number(r.Quantidade || 0);
        if (!name || !size || !Number.isFinite(qty) || qty <= 0) { failures.push({ row: r, reason: 'Missing required fields or invalid quantity' }); continue; }
        try {
          // Encontrar produto por nome+size
          let product = await tx.product.findFirst({ where: { name, size } });
          if (!product) {
            // cria novo produto com preço sugerido se existir, senão 0
            product = await tx.product.create({
              data: {
                name,
                size,
                price: (r.VendaConsumidor && Number(r.VendaConsumidor)) ? new Prisma.Decimal(Number(r.VendaConsumidor)) : new Prisma.Decimal(0)
              }
            });
          } else if (r.VendaConsumidor && Number(r.VendaConsumidor)) {
            // opcional: atualizar preço se diferente
            const newPrice = new Prisma.Decimal(Number(r.VendaConsumidor));
            if (!product.price.equals(newPrice)) {
              await tx.product.update({ where: { id: product.id }, data: { price: newPrice } });
            }
          }

          const location = r.Local || defaultLocation || 'camara_fria';
          const minStock = r.MinStock ?? 0;

          // Stock level existente
          const stock = await tx.stockLevel.findUnique({
            where: { productId_location: { productId: product.id, location } }
          });

          if (stock) {
            await tx.stockLevel.update({
              where: { productId_location: { productId: product.id, location } },
              data: { quantity: stock.quantity + qty, lastUpdated: new Date(), minStock }
            });
          } else {
            await tx.stockLevel.create({
              data: { productId: product.id, location, quantity: qty, minStock, lastUpdated: new Date() }
            });
          }

          // Registrar movimento de entrada
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              fromLocation: null,
              toLocation: location,
              quantity: qty,
              type: 'entry',
              timestamp: new Date(),
              notes: 'Importação Excel',
              user: 'Importador'
            }
          });

          results.push({ productId: product.id, name: product.name, size: product.size, quantity: qty, location });
        } catch (rowErr: unknown) {
          const reason = rowErr instanceof Error ? rowErr.message : String(rowErr);
          failures.push({ row: r, reason });
        }
      }
    });

    return NextResponse.json({ imported: results.length, items: results, failures });
  } catch (e) {
    console.error('Error importing inventory from Excel:', e);
    return NextResponse.json({ error: 'Failed to import inventory' }, { status: 500 });
  }
}
