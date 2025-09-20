// Prisma client setup with fallback for generation issues
const globalForPrisma = globalThis as unknown as {
  prisma: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Try to import PrismaClient, fallback if not available
let PrismaClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let prismaClientAvailable = false;

try {
  const prismaModule = require('@prisma/client'); // eslint-disable-line @typescript-eslint/no-require-imports
  PrismaClient = prismaModule.PrismaClient;
  prismaClientAvailable = true;
} catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
  console.warn('Prisma client not generated, using fallback implementation');
  PrismaClient = class FallbackPrismaClient {
    constructor(options?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('Fallback Prisma client initialized with options:', options);
    }
    $connect() { return Promise.resolve(); }
    $disconnect() { return Promise.resolve(); }
    $transaction(fn: (tx: any) => Promise<any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
      return fn(this);
    }
    product: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    sale: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    saleItem: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    stockLevel: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    stockMovement: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    inventoryAlert: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaClientAvailable ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma