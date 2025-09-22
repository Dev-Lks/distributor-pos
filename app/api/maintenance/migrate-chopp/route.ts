import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// One-off migration to convert 'Chopp (L)' products to 'Barril 30L' and 'Barril 50L'
export async function POST() {
  try {
    const choppProducts = await prisma.product.findMany({ where: { size: 'Chopp (L)' } });
    if (choppProducts.length === 0) {
      return NextResponse.json({ message: 'No Chopp (L) products found. Nothing to migrate.' });
    }

  const created: Array<{ oldId: string; new30Id: string; new50Id: string; pricePerL: number }> = [];

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const p of choppProducts) {
        // Interpret existing price as price per liter
        const pricePerL = Number(p.price as unknown as number);
        const price30 = new Prisma.Decimal(pricePerL * 30);
        const price50 = new Prisma.Decimal(pricePerL * 50);

        const baseId = p.id.endsWith('-chopp') ? p.id : `${p.id}-chopp`;
        const id30 = `${baseId}-30`;
        const id50 = `${baseId}-50`;

        const new30 = await tx.product.upsert({
          where: { id: id30 },
          update: { name: p.name, size: 'Barril 30L', price: price30 },
          create: { id: id30, name: p.name, size: 'Barril 30L', price: price30 }
        });
        const new50 = await tx.product.upsert({
          where: { id: id50 },
          update: { name: p.name, size: 'Barril 50L', price: price50 },
          create: { id: id50, name: p.name, size: 'Barril 50L', price: price50 }
        });

        created.push({ oldId: p.id, new30Id: new30.id, new50Id: new50.id, pricePerL });

        // Mark old product as discontinued
        await tx.product.update({ where: { id: p.id }, data: { size: 'Descontinuado (Chopp L)' } });
      }
    });

    return NextResponse.json({ migrated: created.length, created });
  } catch (e) {
    console.error('Migration failed', e);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
