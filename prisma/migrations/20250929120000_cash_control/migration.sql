-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('RECEIPT', 'TRANSFER', 'SALE', 'ADJUSTMENT', 'LOSS', 'RETURN');

-- CreateEnum
CREATE TYPE "public"."InventoryLocation" AS ENUM ('COLD_ROOM', 'HOUSE', 'SALE_POINT', 'SUPPLIER', 'TRANSIT', 'EVENT');

-- CreateEnum
CREATE TYPE "public"."CashSessionStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."CashTransactionType" AS ENUM ('OPENING', 'SUPPLY', 'WITHDRAWAL', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "public"."Inventory" ADD COLUMN     "averageDailyConsumption" DOUBLE PRECISION,
ADD COLUMN     "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inTransitQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAuditedAt" TIMESTAMP(3),
ADD COLUMN     "lastRestockedAt" TIMESTAMP(3),
ADD COLUMN     "reorderLeadTimeDays" INTEGER,
ADD COLUMN     "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "safetyStock" INTEGER,
ADD COLUMN     "turnoverDays" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."PointOfSale" ADD COLUMN     "address" TEXT,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "abv" DOUBLE PRECISION,
ADD COLUMN     "avgCost" DOUBLE PRECISION,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "ibu" DOUBLE PRECISION,
ADD COLUMN     "lastPurchaseAt" TIMESTAMP(3),
ADD COLUMN     "lastPurchaseCost" DOUBLE PRECISION,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "packaging" TEXT,
ADD COLUMN     "priceLastUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "shelfLifeDays" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "cashSessionId" TEXT,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "costOfGoods" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customerDocument" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grossMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pointOfSaleId" TEXT,
ADD COLUMN     "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DOUBLE PRECISION,
ADD COLUMN     "taxValue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SaleItem" ADD COLUMN     "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "unitCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "cashSessionId" TEXT,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "notes" TEXT,

    CONSTRAINT "ProductPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "pointOfSaleId" TEXT,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "fromLocation" "public"."InventoryLocation",
    "toLocation" "public"."InventoryLocation",
    "adjustmentReason" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointOfSaleId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingAmount" DOUBLE PRECISION,
    "expectedClosingAmount" DOUBLE PRECISION,
    "differenceAmount" DOUBLE PRECISION,
    "status" "public"."CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "hardwareEventReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashTransaction" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "type" "public"."CashTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "performedById" TEXT,
    "paymentMethod" TEXT,
    "hardwareEventReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "public"."SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "SalePayment_cashSessionId_idx" ON "public"."SalePayment"("cashSessionId");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_effectiveAt_idx" ON "public"."ProductPriceHistory"("productId", "effectiveAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_occurredAt_idx" ON "public"."InventoryMovement"("productId", "occurredAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_saleId_idx" ON "public"."InventoryMovement"("saleId");

-- CreateIndex
CREATE INDEX "InventoryMovement_pointOfSaleId_idx" ON "public"."InventoryMovement"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "CashSession_userId_status_idx" ON "public"."CashSession"("userId", "status");

-- CreateIndex
CREATE INDEX "CashSession_pointOfSaleId_status_idx" ON "public"."CashSession"("pointOfSaleId", "status");

-- CreateIndex
CREATE INDEX "CashTransaction_cashSessionId_idx" ON "public"."CashTransaction"("cashSessionId");

-- CreateIndex
CREATE INDEX "CashTransaction_performedById_idx" ON "public"."CashTransaction"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_code_key" ON "public"."PointOfSale"("code");

-- CreateIndex
CREATE INDEX "Sale_cashSessionId_idx" ON "public"."Sale"("cashSessionId");

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalePayment" ADD CONSTRAINT "SalePayment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashSession" ADD CONSTRAINT "CashSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashSession" ADD CONSTRAINT "CashSession_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashTransaction" ADD CONSTRAINT "CashTransaction_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashTransaction" ADD CONSTRAINT "CashTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
