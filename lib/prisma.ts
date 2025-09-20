// Prisma client setup with robust error handling
const globalForPrisma = globalThis as unknown as {
  prisma: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

let prismaClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Initialize Prisma client with proper error handling
function initializePrisma() {
  try {
    console.log('Initializing Prisma client...');

    // Try to import the real PrismaClient
    const { PrismaClient } = require('@prisma/client'); // eslint-disable-line @typescript-eslint/no-require-imports

    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    console.log('Prisma client initialized successfully');
    return prismaClient;
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);

    // Create a minimal fallback that throws meaningful errors
    const createErrorMethod = (methodName: string) => {
      return () => {
        throw new Error(`Prisma client not available. Method: ${methodName}. Please ensure DATABASE_URL is set and Prisma client is generated.`);
      };
    };

    prismaClient = {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      $transaction: (fn: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.warn('Using fallback transaction - this may not work correctly');
        return fn(prismaClient);
      },
      product: {
        findMany: createErrorMethod('product.findMany'),
        findUnique: createErrorMethod('product.findUnique'),
        create: createErrorMethod('product.create'),
        createMany: createErrorMethod('product.createMany'),
        update: createErrorMethod('product.update'),
        delete: createErrorMethod('product.delete'),
      },
      sale: {
        findMany: createErrorMethod('sale.findMany'),
        findUnique: createErrorMethod('sale.findUnique'),
        create: createErrorMethod('sale.create'),
        update: createErrorMethod('sale.update'),
        delete: createErrorMethod('sale.delete'),
      },
      saleItem: {
        findMany: createErrorMethod('saleItem.findMany'),
        create: createErrorMethod('saleItem.create'),
        deleteMany: createErrorMethod('saleItem.deleteMany'),
      },
      stockLevel: {
        findMany: createErrorMethod('stockLevel.findMany'),
        findUnique: createErrorMethod('stockLevel.findUnique'),
        create: createErrorMethod('stockLevel.create'),
        update: createErrorMethod('stockLevel.update'),
        upsert: createErrorMethod('stockLevel.upsert'),
      },
      stockMovement: {
        findMany: createErrorMethod('stockMovement.findMany'),
        create: createErrorMethod('stockMovement.create'),
      },
      inventoryAlert: {
        findMany: createErrorMethod('inventoryAlert.findMany'),
        findFirst: createErrorMethod('inventoryAlert.findFirst'),
        create: createErrorMethod('inventoryAlert.create'),
        updateMany: createErrorMethod('inventoryAlert.updateMany'),
      },
    };

    console.log('Using fallback Prisma client');
    return prismaClient;
  }
}

// Initialize the client
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = initializePrisma();
}

export const prisma = globalForPrisma.prisma;

// Test the connection
if (typeof window === 'undefined') { // Only run on server
  prisma.$connect()
    .then(() => console.log('Database connected successfully'))
    .catch((error: any) => console.error('Database connection failed:', error)); // eslint-disable-line @typescript-eslint/no-explicit-any
}