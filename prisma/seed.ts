import { PrismaClient } from '@prisma/client';
import { products } from '../lib/products';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        id: product.id,
        name: product.name,
        size: product.size,
        price: new Decimal(product.price)
      }
    });
  }

  console.log(`Seeded ${products.length} products successfully`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });