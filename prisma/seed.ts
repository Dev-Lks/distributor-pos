import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type ProductDefinition = {
  key: string
  category: string
  volume: string
  salePrice: number
  cost: number
  name?: string
  packaging?: string
}

const productDefinitions: ProductDefinition[] = [
  {
    key: 'american-lager-1500',
    category: 'American lager',
    volume: '1,5L',
    salePrice: 20.0,
    cost: 11.4,
    packaging: 'Growler PET 1,5L',
  },
  {
    key: 'doppel-bock-1500',
    category: 'Doppel Bock',
    volume: '1,5L',
    salePrice: 25.0,
    cost: 16.95,
    packaging: 'Growler PET 1,5L',
  },
  {
    key: 'ipa-1500',
    category: 'IPA',
    volume: '1,5L',
    salePrice: 23.0,
    cost: 15.95,
    packaging: 'Growler PET 1,5L',
  },
  {
    key: 'pilsen-premium-1500',
    category: 'Pilsen Premium',
    volume: '1,5L',
    salePrice: 18.0,
    cost: 9.4,
    packaging: 'Growler PET 1,5L',
  },
  {
    key: 'vinho-1500',
    category: 'Vinho',
    volume: '1,5L',
    salePrice: 22.0,
    cost: 12.4,
    packaging: 'Garrafa 1,5L',
  },
  {
    key: 'weiss-1500',
    category: 'Weiss',
    volume: '1,5L',
    salePrice: 23.0,
    cost: 13.4,
    packaging: 'Growler PET 1,5L',
  },
  {
    key: 'american-lager-600',
    category: 'American lager',
    volume: '600ml',
    salePrice: 14.0,
    cost: 7.9,
    packaging: 'Garrafa 600ml',
  },
  {
    key: 'doppel-bock-600',
    category: 'Doppel Bock',
    volume: '600ml',
    salePrice: 15.0,
    cost: 7.9,
    packaging: 'Garrafa 600ml',
  },
  {
    key: 'ipa-600',
    category: 'IPA',
    volume: '600ml',
    salePrice: 15.0,
    cost: 7.9,
    packaging: 'Garrafa 600ml',
  },
  {
    key: 'pilsen-premium-600',
    category: 'Pilsen Premium',
    volume: '600ml',
    salePrice: 11.0,
    cost: 6.9,
    packaging: 'Garrafa 600ml',
  },
  {
    key: 'vinho-600',
    category: 'Vinho',
    volume: '600ml',
    salePrice: 15.0,
    cost: 7.9,
    packaging: 'Garrafa 600ml',
  },
  {
    key: 'weiss-600',
    category: 'Weiss',
    volume: '600ml',
    salePrice: 15.0,
    cost: 7.9,
    packaging: 'Garrafa 600ml',
  },
  {
    key: 'american-lager-chopp',
    category: 'American lager',
    volume: 'Chopp (L)',
    salePrice: 17.5,
    cost: 8.0,
    packaging: 'Chope por litro',
  },
  {
    key: 'pilsen-lager-chopp',
    category: 'Pilsen Lager',
    volume: 'Chopp (L)',
    salePrice: 12.6,
    cost: 5.6,
    packaging: 'Chope por litro',
  },
  {
    key: 'pilsen-premium-chopp',
    category: 'Pilsen Premium',
    volume: 'Chopp (L)',
    salePrice: 12.6,
    cost: 5.6,
    packaging: 'Chope por litro',
  },
  {
    key: 'pilsen-tradicional-chopp',
    category: 'Pilsen Tradicional',
    volume: 'Chopp (L)',
    salePrice: 11.5,
    cost: 5.1,
    packaging: 'Chope por litro',
  },
  {
    key: 'copo-500ml',
    category: 'Copo 500ML',
    volume: '500ml',
    salePrice: 15.0,
    cost: 2.8,
    packaging: 'Copo descartável 500ml',
  },
  {
    key: 'copo-300ml',
    category: 'Copo 300ML',
    volume: '300ml',
    salePrice: 12.0,
    cost: 0,
    packaging: 'Copo descartável 300ml',
  },
]

const defaultInventory = {
  coldRoomQuantity: 0,
  houseQuantity: 0,
  salePointQuantity: 0,
  coldRoomMinStock: 0,
  houseMinStock: 0,
  salePointMinStock: 0,
  reservedQuantity: 0,
  damagedQuantity: 0,
  inTransitQuantity: 0,
  safetyStock: 0,
}

const buildName = (definition: ProductDefinition) => definition.category

const buildSku = (definition: ProductDefinition) => {
  const sanitize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .toUpperCase()

  return `NB-${sanitize(definition.category)}-${sanitize(definition.volume)}`
}

async function seedProducts() {
  console.log('🍻 Sincronizando catálogo de produtos...')

  for (const definition of productDefinitions) {
    const sku = buildSku(definition)
    const name = buildName(definition)
    const packaging = definition.packaging ?? 'Embalagem padrão'

    await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        size: definition.volume,
        cost: definition.cost,
        salePrice: definition.salePrice,
        category: definition.category,
        packaging,
        isActive: true,
        isBonified: false,
        bonifications: 0,
        inventory: {
          upsert: {
            update: defaultInventory,
            create: defaultInventory,
          },
        },
      },
      create: {
        sku,
        name,
        size: definition.volume,
        cost: definition.cost,
        salePrice: definition.salePrice,
        category: definition.category,
        packaging,
        isActive: true,
        isBonified: false,
        bonifications: 0,
        inventory: {
          create: defaultInventory,
        },
      },
    })

    console.log(`✅ Produto sincronizado: ${name} (${sku})`)
  }
}

async function seedUsers() {
  console.log('🔐 Garantindo usuário administrador...')

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@nitrobeer.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Administrador NitroBeer'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Buscar primeiro ponto de venda para vincular
    const firstPointOfSale = await prisma.pointOfSale.findFirst()

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        fullName: adminName,
        password: hashedPassword,
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        status: 'ACTIVE',
        isActive: true,
      },
    })

    // Vincular ao ponto de venda se existir
    if (firstPointOfSale) {
      await prisma.userPointOfSale.create({
        data: {
          userId: admin.id,
          pointOfSaleId: firstPointOfSale.id,
          roleInPOS: 'MANAGER',
          isPrimary: true,
        },
      })
    }

    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.log('⚠️ Usuário admin criado com a senha padrão "admin123". Atualize após o primeiro login!')
    } else {
      console.log('✅ Usuário admin criado com as credenciais fornecidas nas variáveis SEED_ADMIN_*')
    }
  } else {
    console.log('ℹ️ Usuário administrador padrão já existe, nenhuma alteração aplicada.')
  }
}

async function main() {
  console.time('seed')
  console.log('🌱 Iniciando seed de produtos...')
  await seedProducts()
  await seedUsers()
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