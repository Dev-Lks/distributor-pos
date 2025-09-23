import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  { name: 'American lager', size: '1,5L', cost: 11.4, salePrice: 20, isBonified: false },
  { name: 'American lager', size: '1,5L', cost: 0, salePrice: 20, isBonified: true },
  { name: 'Ipa', size: '1,5L', cost: 15.85, salePrice: 23, isBonified: false },
  { name: 'Ipa', size: '1,5L', cost: 0, salePrice: 23, isBonified: true },
  { name: 'Pilsen Premium', size: '1,5L', cost: 9.4, salePrice: 18, isBonified: false },
  { name: 'Pilsen Premium', size: '1,5L', cost: 0, salePrice: 18, isBonified: true },
  { name: 'Vinho', size: '1,5L', cost: 12.4, salePrice: 22, isBonified: false },
  { name: 'Weiss', size: '1,5L', cost: 13.4, salePrice: 23, isBonified: false },
  { name: 'American lager', size: '600ml', cost: 7.9, salePrice: 14, isBonified: false },
  { name: 'Ipa', size: '600ml', cost: 7.9, salePrice: 15, isBonified: false },
  { name: 'Ipa', size: '600ml', cost: 0, salePrice: 15, isBonified: true },
  { name: 'Pilsen Premium', size: '600ml', cost: 6.9, salePrice: 11, isBonified: false },
  { name: 'Pilsen Premium', size: '600ml', cost: 0, salePrice: 11, isBonified: true },
  { name: 'Vinho', size: '600ml', cost: 7.9, salePrice: 15, isBonified: false },
  { name: 'Vinho', size: '600ml', cost: 0, salePrice: 15, isBonified: true },
  { name: 'Weiss', size: '600ml', cost: 7.9, salePrice: 15, isBonified: false },
  { name: 'American Lager', size: '50L', cost: 400, salePrice: 875, isBonified: false },
  { name: 'Pilsen Lager', size: '50L', cost: 280, salePrice: 630, isBonified: false },
  { name: 'Pilsen Lager', size: '50L', cost: 0, salePrice: 781.2, isBonified: true },
  { name: 'Pilsen Premium', size: '50L', cost: 280, salePrice: 630, isBonified: false },
  { name: 'Pilsen Premium', size: '50L', cost: 0, salePrice: 781.2, isBonified: true },
  { name: 'Pilsen Tradicional', size: '50L', cost: 255, salePrice: 575, isBonified: false },
  { name: 'Ipa', size: '30L', cost: 0, salePrice: 0, isBonified: true },
  { name: 'American lager', size: '30L', cost: 240, salePrice: 525, isBonified: false },
  { name: 'Pilsen Lager', size: '30L', cost: 168, salePrice: 378, isBonified: false },
  { name: 'Pilsen Lager', size: '30L', cost: 0, salePrice: 497.7, isBonified: true },
  { name: 'Pilsen Premium', size: '30L', cost: 168, salePrice: 378, isBonified: false },
  { name: 'Pilsen Premium', size: '30L', cost: 0, salePrice: 497.7, isBonified: true },
  { name: 'Pilsen Tradicional', size: '30L', cost: 153, salePrice: 0, isBonified: false },
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