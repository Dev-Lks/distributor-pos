import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  // Produtos 1,5L
  { name: 'American lager', size: '1,5L', cost: 11.4, salePrice: 20, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Ipa', size: '1,5L', cost: 15.85, salePrice: 23, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Premium', size: '1,5L', cost: 9.4, salePrice: 18, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Vinho', size: '1,5L', cost: 12.4, salePrice: 22, isBonified: false, category: 'Coquetel', bonifications: 0 },
  { name: 'Weiss', size: '1,5L', cost: 13.4, salePrice: 23, isBonified: false, category: 'Chopp', bonifications: 0 },

  // Produtos 600ml
  { name: 'American lager', size: '600ml', cost: 7.9, salePrice: 14, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Ipa', size: '600ml', cost: 7.9, salePrice: 15, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Premium', size: '600ml', cost: 6.9, salePrice: 11, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Vinho', size: '600ml', cost: 7.9, salePrice: 15, isBonified: false, category: 'Coquetel', bonifications: 0 },
  { name: 'Weiss', size: '600ml', cost: 7.9, salePrice: 15, isBonified: false, category: 'Chopp', bonifications: 0 },

  // Produtos 50L
  { name: 'American Lager', size: '50L', cost: 400, salePrice: 875, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Lager', size: '50L', cost: 280, salePrice: 630, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Premium', size: '50L', cost: 280, salePrice: 630, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Tradicional', size: '50L', cost: 255, salePrice: 575, isBonified: false, category: 'Chopp', bonifications: 0 },

  // Produtos 30L
  { name: 'American lager', size: '30L', cost: 240, salePrice: 525, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Lager', size: '30L', cost: 168, salePrice: 378, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Premium', size: '30L', cost: 168, salePrice: 378, isBonified: false, category: 'Chopp', bonifications: 0 },
  { name: 'Pilsen Tradicional', size: '30L', cost: 153, salePrice: 345, isBonified: false, category: 'Chopp', bonifications: 0 },
]

async function main() {
  console.log('Seeding products...')

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  console.log('Seeding complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })