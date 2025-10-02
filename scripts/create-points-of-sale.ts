/**
 * Script para criar pontos de venda padrão
 * 
 * Execute: npx tsx scripts/create-points-of-sale.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPointsOfSale = [
  {
    name: 'Loja Principal',
    code: 'LJ01',
    channel: 'RETAIL',
    isActive: true,
    city: 'São Paulo',
    state: 'SP',
  },
  {
    name: 'Delivery',
    code: 'DEL01',
    channel: 'DELIVERY',
    isActive: true,
  },
  {
    name: 'Eventos',
    code: 'EVT01',
    channel: 'EVENTS',
    isActive: true,
  },
];

async function createPointsOfSale() {
  try {
    console.log('🏪 Criando pontos de venda...\n');

    for (const pos of defaultPointsOfSale) {
      const existing = await prisma.pointOfSale.findUnique({
        where: { code: pos.code },
      });

      if (existing) {
        console.log(`⚠️  PDV já existe: ${pos.name} (${pos.code})`);
        continue;
      }

      const created = await prisma.pointOfSale.create({
        data: pos,
      });

      console.log(`✅ PDV criado: ${created.name} (${created.code})`);
    }

    console.log('\n✅ Pontos de venda criados com sucesso!\n');

    // Vincular admin ao primeiro PDV
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (admin) {
      const firstPOS = await prisma.pointOfSale.findFirst();
      if (firstPOS) {
        const existingLink = await prisma.userPointOfSale.findFirst({
          where: { userId: admin.id, pointOfSaleId: firstPOS.id },
        });

        if (!existingLink) {
          await prisma.userPointOfSale.create({
            data: {
              userId: admin.id,
              pointOfSaleId: firstPOS.id,
              roleInPOS: 'MANAGER',
              isPrimary: true,
            },
          });
          console.log(`✅ Admin vinculado ao PDV: ${firstPOS.name}\n`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro ao criar PDVs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createPointsOfSale();
