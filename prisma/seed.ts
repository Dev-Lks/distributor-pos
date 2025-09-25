import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type PointOfSaleSeed = {
  code: string
  name: string
  channel: string
  managerName: string
  address: string
  city: string
  state: string
  country: string
  timezone?: string
  isActive?: boolean
}

type InventorySeed = {
  coldRoomQuantity: number
  houseQuantity: number
  salePointQuantity: number
  coldRoomMinStock: number
  houseMinStock: number
  salePointMinStock: number
  reservedQuantity?: number
  damagedQuantity?: number
  inTransitQuantity?: number
  safetyStock?: number
  reorderLeadTimeDays?: number
  averageDailyConsumption?: number
  turnoverDays?: number
  lastRestockedDaysAgo?: number
  lastAuditedDaysAgo?: number
}

type ProductPointAllocation = {
  pointCode: string
  quantity: number
  minStock: number
}

type ProductSeed = {
  sku: string
  name: string
  size: string
  cost: number
  salePrice: number
  category: string
  brand: string
  supplier: string
  packaging: string
  origin: string
  tags: string[]
  bonifications: number
  isActive?: boolean
  abv?: number
  ibu?: number
  shelfLifeDays?: number
  avgCost?: number
  lastPurchaseDaysAgo?: number
  priceUpdatedDaysAgo?: number
  inventory: InventorySeed
  pointAllocations: ProductPointAllocation[]
}

const pointsOfSaleSeed: PointOfSaleSeed[] = [
  {
    code: 'BAR-CENTRAL',
    name: 'Bar Central',
    channel: 'Balcão',
    managerName: 'Ana Souza',
    address: 'Rua Principal, 100',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    timezone: 'America/Sao_Paulo',
    isActive: true,
  },
  {
    code: 'ARENA-POPUP',
    name: 'Arena Nitro',
    channel: 'Eventos',
    managerName: 'Carlos Lima',
    address: 'Av. das Nações, 450',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    timezone: 'America/Sao_Paulo',
    isActive: true,
  },
  {
    code: 'DELIVERY-EXP',
    name: 'Delivery Express',
    channel: 'Delivery',
    managerName: 'Equipe Nitro',
    address: 'Operação própria',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    timezone: 'America/Sao_Paulo',
    isActive: true,
  },
]

const productsSeed: ProductSeed[] = [
  {
    sku: 'NB-LAGER-600',
    name: 'Nitro Lager',
    size: '600ml',
    cost: 8.9,
    salePrice: 15.9,
    category: 'Cerveja Lager',
    brand: 'NitroBeer',
    supplier: 'Nitro Distribuição',
    packaging: 'Long neck',
    origin: 'Brasil',
    tags: ['lager', 'refrescante', 'best seller'],
    bonifications: 12,
    abv: 4.8,
    ibu: 16,
    shelfLifeDays: 150,
    avgCost: 9.2,
    lastPurchaseDaysAgo: 7,
    priceUpdatedDaysAgo: 2,
    inventory: {
      coldRoomQuantity: 120,
      houseQuantity: 36,
      salePointQuantity: 48,
      coldRoomMinStock: 60,
      houseMinStock: 18,
      salePointMinStock: 24,
      safetyStock: 30,
      reorderLeadTimeDays: 4,
      averageDailyConsumption: 22,
      turnoverDays: 10,
      lastRestockedDaysAgo: 3,
      lastAuditedDaysAgo: 6,
      reservedQuantity: 8,
      inTransitQuantity: 12,
      damagedQuantity: 2,
    },
    pointAllocations: [
      { pointCode: 'BAR-CENTRAL', quantity: 30, minStock: 12 },
      { pointCode: 'ARENA-POPUP', quantity: 12, minStock: 6 },
      { pointCode: 'DELIVERY-EXP', quantity: 6, minStock: 4 },
    ],
  },
  {
    sku: 'NB-IPA-600',
    name: 'Nitro IPA',
    size: '600ml',
    cost: 11.7,
    salePrice: 19.9,
    category: 'Cerveja IPA',
    brand: 'NitroBeer',
    supplier: 'Nitro Distribuição',
    packaging: 'Long neck',
    origin: 'Brasil',
    tags: ['ipa', 'lupulada', 'equilibrada'],
    bonifications: 6,
    abv: 6.2,
    ibu: 45,
    shelfLifeDays: 120,
    avgCost: 12.1,
    lastPurchaseDaysAgo: 9,
    priceUpdatedDaysAgo: 4,
    inventory: {
      coldRoomQuantity: 80,
      houseQuantity: 24,
      salePointQuantity: 30,
      coldRoomMinStock: 40,
      houseMinStock: 12,
      salePointMinStock: 15,
      safetyStock: 22,
      reorderLeadTimeDays: 5,
      averageDailyConsumption: 16,
      turnoverDays: 12,
      lastRestockedDaysAgo: 4,
      lastAuditedDaysAgo: 9,
      reservedQuantity: 6,
      inTransitQuantity: 8,
      damagedQuantity: 1,
    },
    pointAllocations: [
      { pointCode: 'BAR-CENTRAL', quantity: 18, minStock: 10 },
      { pointCode: 'ARENA-POPUP', quantity: 8, minStock: 5 },
      { pointCode: 'DELIVERY-EXP', quantity: 4, minStock: 3 },
    ],
  },
  {
    sku: 'NB-WEISS-15',
    name: 'Nitro Weiss',
    size: '1,5L',
    cost: 13.4,
    salePrice: 24.9,
    category: 'Chopp Trigo',
    brand: 'NitroBeer',
    supplier: 'Nitro Distribuição',
    packaging: 'Growler PET',
    origin: 'Brasil',
    tags: ['trigo', 'suave', 'cítrica'],
    bonifications: 4,
    abv: 5.2,
    ibu: 18,
    shelfLifeDays: 45,
    avgCost: 13.9,
    lastPurchaseDaysAgo: 5,
    priceUpdatedDaysAgo: 5,
    inventory: {
      coldRoomQuantity: 40,
      houseQuantity: 14,
      salePointQuantity: 18,
      coldRoomMinStock: 24,
      houseMinStock: 8,
      salePointMinStock: 10,
      safetyStock: 12,
      reorderLeadTimeDays: 3,
      averageDailyConsumption: 9,
      turnoverDays: 8,
      lastRestockedDaysAgo: 2,
      lastAuditedDaysAgo: 7,
      reservedQuantity: 4,
      inTransitQuantity: 6,
    },
    pointAllocations: [
      { pointCode: 'BAR-CENTRAL', quantity: 10, minStock: 6 },
      { pointCode: 'ARENA-POPUP', quantity: 5, minStock: 3 },
      { pointCode: 'DELIVERY-EXP', quantity: 3, minStock: 2 },
    ],
  },
  {
    sku: 'NB-PILSEN-50L',
    name: 'Nitro Pilsen Barril',
    size: '50L',
    cost: 285,
    salePrice: 640,
    category: 'Barril Pilsen',
    brand: 'NitroBeer',
    supplier: 'Nitro Distribuição',
    packaging: 'Barril de aço',
    origin: 'Brasil',
    tags: ['pilsen', 'volume alto', 'eventos'],
    bonifications: 0,
    abv: 4.5,
    ibu: 14,
    shelfLifeDays: 30,
    avgCost: 290,
    lastPurchaseDaysAgo: 12,
    priceUpdatedDaysAgo: 10,
    inventory: {
      coldRoomQuantity: 24,
      houseQuantity: 10,
      salePointQuantity: 12,
      coldRoomMinStock: 12,
      houseMinStock: 6,
      salePointMinStock: 6,
      safetyStock: 8,
      reorderLeadTimeDays: 7,
      averageDailyConsumption: 4,
      turnoverDays: 15,
      lastRestockedDaysAgo: 5,
      lastAuditedDaysAgo: 11,
      inTransitQuantity: 4,
    },
    pointAllocations: [
      { pointCode: 'BAR-CENTRAL', quantity: 6, minStock: 2 },
      { pointCode: 'ARENA-POPUP', quantity: 4, minStock: 2 },
      { pointCode: 'DELIVERY-EXP', quantity: 2, minStock: 1 },
    ],
  },
  {
    sku: 'NB-SELTZER-355',
    name: 'Nitro Hard Seltzer',
    size: '355ml',
    cost: 5.2,
    salePrice: 12.9,
    category: 'Hard Seltzer',
    brand: 'NitroFizz',
    supplier: 'Nitro Drinks',
    packaging: 'Lata sleek',
    origin: 'Brasil',
    tags: ['hard seltzer', 'baixo carbo', 'tendência'],
    bonifications: 20,
    abv: 4.5,
    shelfLifeDays: 240,
    avgCost: 5.4,
    lastPurchaseDaysAgo: 3,
    priceUpdatedDaysAgo: 1,
    inventory: {
      coldRoomQuantity: 90,
      houseQuantity: 45,
      salePointQuantity: 60,
      coldRoomMinStock: 45,
      houseMinStock: 20,
      salePointMinStock: 24,
      safetyStock: 28,
      reorderLeadTimeDays: 6,
      averageDailyConsumption: 18,
      turnoverDays: 14,
      lastRestockedDaysAgo: 2,
      lastAuditedDaysAgo: 5,
      reservedQuantity: 10,
      inTransitQuantity: 18,
      damagedQuantity: 3,
    },
    pointAllocations: [
      { pointCode: 'BAR-CENTRAL', quantity: 28, minStock: 12 },
      { pointCode: 'ARENA-POPUP', quantity: 20, minStock: 8 },
      { pointCode: 'DELIVERY-EXP', quantity: 12, minStock: 6 },
    ],
  },
  {
    sku: 'NB-VINHO-750',
    name: 'Nitro Vinho Tinto Blend',
    size: '750ml',
    cost: 18.5,
    salePrice: 39.9,
    category: 'Vinhos',
    brand: 'NitroCellar',
    supplier: 'Adega Nitro',
    packaging: 'Garrafa vidro',
    origin: 'Brasil',
    tags: ['vinho tinto', 'blend exclusivo', 'harmonização'],
    bonifications: 2,
    abv: 13.2,
    shelfLifeDays: 365,
    avgCost: 19,
    lastPurchaseDaysAgo: 14,
    priceUpdatedDaysAgo: 6,
    inventory: {
      coldRoomQuantity: 32,
      houseQuantity: 18,
      salePointQuantity: 20,
      coldRoomMinStock: 16,
      houseMinStock: 8,
      salePointMinStock: 10,
      safetyStock: 12,
      reorderLeadTimeDays: 10,
      averageDailyConsumption: 6,
      turnoverDays: 20,
      lastRestockedDaysAgo: 7,
      lastAuditedDaysAgo: 12,
      reservedQuantity: 5,
      damagedQuantity: 1,
    },
    pointAllocations: [
      { pointCode: 'BAR-CENTRAL', quantity: 8, minStock: 4 },
      { pointCode: 'ARENA-POPUP', quantity: 4, minStock: 2 },
      { pointCode: 'DELIVERY-EXP', quantity: 8, minStock: 4 },
    ],
  },
]

const daysAgo = (value?: number) => {
  if (typeof value !== 'number') {
    return undefined
  }
  const now = new Date()
  now.setDate(now.getDate() - value)
  return now
}

const buildInventoryData = (inventory: InventorySeed) => {
  const { lastRestockedDaysAgo, lastAuditedDaysAgo, ...rest } = inventory
  return {
    ...rest,
    lastRestockedAt: daysAgo(lastRestockedDaysAgo),
    lastAuditedAt: daysAgo(lastAuditedDaysAgo),
  }
}

async function seedPointsOfSale() {
  console.log('📍 Sincronizando pontos de venda...')
  const records = await Promise.all(
    pointsOfSaleSeed.map((point) => {
      const { name, isActive = true } = point
      const pointData = { name, isActive }
      return prisma.pointOfSale.upsert({
        where: { name },
        update: pointData,
        create: pointData,
      })
    })
  )

  const map = new Map<string, (typeof records)[number]>()
  records.forEach((record, index) => {
    const seed = pointsOfSaleSeed[index]
    const storedRecord = { ...record, name: seed.name }
    map.set(seed.name, storedRecord)
    if (seed.code) {
      map.set(seed.code, storedRecord)
    }
  })
  console.log(`✅ ${records.length} pontos de venda sincronizados.`)
  return map
}

async function seedProducts(pointMap: Map<string, { id: string }>) {
  console.log('🍺 Sincronizando produtos...')
  for (const productSeed of productsSeed) {
    const {
      inventory,
      pointAllocations,
      lastPurchaseDaysAgo,
      priceUpdatedDaysAgo,
      avgCost,
      bonifications,
      tags,
      ...productCore
    } = productSeed

    const { sku, isActive, ...nonUniqueFields } = productCore
    const inventoryData = buildInventoryData(inventory)
    const lastPurchaseAt = daysAgo(lastPurchaseDaysAgo)
    const priceLastUpdatedAt = daysAgo(priceUpdatedDaysAgo)

    const baseProductData = {
      ...nonUniqueFields,
      tags,
      bonifications,
      isBonified: bonifications > 0,
      isActive: isActive ?? true,
      lastPurchaseCost: productSeed.cost,
      lastPurchaseAt,
      avgCost: avgCost ?? productSeed.cost,
      priceLastUpdatedAt,
    }

    const upsertedProduct = await prisma.product.upsert({
      where: { sku },
      update: {
        ...baseProductData,
        inventory: {
          upsert: {
            update: inventoryData,
            create: inventoryData,
          },
        },
      },
      create: {
        sku,
        ...baseProductData,
        inventory: {
          create: inventoryData,
        },
      },
    })

    const allowedPointIds = new Set<string>()

    for (const allocation of pointAllocations) {
      const point = pointMap.get(allocation.pointCode)
      if (!point) {
        console.warn(`⚠️  Ponto de venda ${allocation.pointCode} não encontrado. Pulando alocação para ${productSeed.name}.`)
        continue
      }

      allowedPointIds.add(point.id)

      await prisma.productPointOfSale.upsert({
        where: {
          productId_pointOfSaleId: {
            productId: upsertedProduct.id,
            pointOfSaleId: point.id,
          },
        },
        update: {
          quantity: allocation.quantity,
          minStock: allocation.minStock,
        },
        create: {
          productId: upsertedProduct.id,
          pointOfSaleId: point.id,
          quantity: allocation.quantity,
          minStock: allocation.minStock,
        },
      })
    }

    if (allowedPointIds.size > 0) {
      await prisma.productPointOfSale.deleteMany({
        where: {
          productId: upsertedProduct.id,
          pointOfSaleId: { notIn: Array.from(allowedPointIds) },
        },
      })
    } else {
      await prisma.productPointOfSale.deleteMany({
        where: { productId: upsertedProduct.id },
      })
    }

    console.log(`✅ Produto sincronizado: ${productSeed.name} (${productSeed.sku})`)
  }
}

async function main() {
  console.time('seed')
  console.log('🌱 Iniciando processo de seed...')
  const pointsMap = await seedPointsOfSale()
  await seedProducts(pointsMap)
  console.log('🌿 Seed finalizado com sucesso!')
  console.timeEnd('seed')
}

main()
  .catch((error) => {
    console.error('❌ Seed falhou', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })