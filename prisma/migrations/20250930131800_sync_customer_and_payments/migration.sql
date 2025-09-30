-- CreateEnum
CREATE TYPE "public"."PersonType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PendingCartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DailyReportStatus" AS ENUM ('PENDING', 'GENERATED', 'SENT', 'RESENT', 'FAILED');

-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "addressComplement" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "averageTicket" DOUBLE PRECISION,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "creditLimit" DOUBLE PRECISION,
ADD COLUMN     "creditUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDelinquent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPurchaseAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "preferredPaymentMethod" TEXT,
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "type" "public"."PersonType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pendingCartId" TEXT;

-- AlterTable
ALTER TABLE "public"."SalePayment" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "externalReference" TEXT,
ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "installmentsTotal" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "overdueNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."PendingCart" (
    "id" TEXT NOT NULL,
    "status" "public"."PendingCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "pointOfSaleId" TEXT,
    "createdById" TEXT NOT NULL,
    "customerId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PendingCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "public"."DailyReportStatus" NOT NULL DEFAULT 'PENDING',
    "pointOfSaleId" TEXT,
    "cashSessionId" TEXT,
    "totalsByMethod" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceChargeTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "storageKey" TEXT,
    "sentAt" TIMESTAMP(3),
    "resentCount" INTEGER NOT NULL DEFAULT 0,
    "lastResentAt" TIMESTAMP(3),
    "deliveryMetadata" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingCart_pointOfSaleId_status_idx" ON "public"."PendingCart"("pointOfSaleId", "status");

-- CreateIndex
CREATE INDEX "PendingCart_customerId_idx" ON "public"."PendingCart"("customerId");

-- CreateIndex
CREATE INDEX "PendingCart_createdById_idx" ON "public"."PendingCart"("createdById");

-- CreateIndex
CREATE INDEX "PendingCartItem_cartId_idx" ON "public"."PendingCartItem"("cartId");

-- CreateIndex
CREATE INDEX "PendingCartItem_productId_idx" ON "public"."PendingCartItem"("productId");

-- CreateIndex
CREATE INDEX "DailyReport_cashSessionId_idx" ON "public"."DailyReport"("cashSessionId");

-- CreateIndex
CREATE INDEX "DailyReport_status_idx" ON "public"."DailyReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportDate_pointOfSaleId_key" ON "public"."DailyReport"("reportDate", "pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_document_key" ON "public"."Customer"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_pendingCartId_key" ON "public"."Sale"("pendingCartId");

-- CreateIndex
CREATE INDEX "SalePayment_customerId_status_idx" ON "public"."SalePayment"("customerId", "status");

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_pendingCartId_fkey" FOREIGN KEY ("pendingCartId") REFERENCES "public"."PendingCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalePayment" ADD CONSTRAINT "SalePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingCart" ADD CONSTRAINT "PendingCart_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingCart" ADD CONSTRAINT "PendingCart_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingCart" ADD CONSTRAINT "PendingCart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingCartItem" ADD CONSTRAINT "PendingCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."PendingCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingCartItem" ADD CONSTRAINT "PendingCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
