-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION');

-- CreateEnum
CREATE TYPE "public"."PermissionKey" AS ENUM ('VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_REPORTS', 'CREATE_SALES', 'VIEW_ALL_SALES', 'VIEW_OWN_SALES', 'EDIT_SALES', 'DELETE_SALES', 'APPLY_DISCOUNTS', 'VIEW_PRODUCTS', 'CREATE_PRODUCTS', 'EDIT_PRODUCTS', 'DELETE_PRODUCTS', 'MANAGE_PRICES', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'TRANSFER_STOCK', 'ADJUST_STOCK', 'VIEW_STOCK_MOVEMENTS', 'VIEW_CUSTOMERS', 'CREATE_CUSTOMERS', 'EDIT_CUSTOMERS', 'DELETE_CUSTOMERS', 'VIEW_CUSTOMER_HISTORY', 'OPEN_CASH_SESSION', 'CLOSE_CASH_SESSION', 'MANAGE_CASH_TRANSACTIONS', 'FORCE_CLOSE_CASH', 'VIEW_CASH_REPORTS', 'VIEW_ORDERS', 'CREATE_ORDERS', 'EDIT_ORDERS', 'DELETE_ORDERS', 'MANAGE_ORDER_STATUS', 'VIEW_POINTS_OF_SALE', 'MANAGE_POINTS_OF_SALE', 'MANAGE_USERS', 'VIEW_USERS', 'ASSIGN_PERMISSIONS', 'CREATE_BONIFICATIONS', 'APPROVE_BONIFICATIONS', 'VIEW_BONIFICATIONS', 'VIEW_SETTINGS', 'MANAGE_SETTINGS');

-- CreateEnum
CREATE TYPE "public"."PersonType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PendingCartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."BonificationCategory" AS ENUM ('BONIFICATION', 'DEGUSTATION');

-- CreateEnum
CREATE TYPE "public"."DailyReportStatus" AS ENUM ('PENDING', 'GENERATED', 'SENT', 'RESENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('ACTIVE', 'DEPLETED', 'EXPIRED', 'RECALLED');

-- CreateEnum
CREATE TYPE "public"."AuditStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('RECEIPT', 'TRANSFER', 'SALE', 'ADJUSTMENT', 'LOSS', 'RETURN');

-- CreateEnum
CREATE TYPE "public"."InventoryLocation" AS ENUM ('COLD_ROOM', 'HOUSE', 'SALE_POINT', 'SUPPLIER', 'TRANSIT', 'EVENT');

-- CreateEnum
CREATE TYPE "public"."CashSessionStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."CashTransactionType" AS ENUM ('OPENING', 'SUPPLY', 'WITHDRAWAL', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "avatarUrl" TEXT,
    "name" TEXT,
    "password" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "public"."PermissionKey" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPointOfSale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointOfSaleId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "UserPointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "isBonified" BOOLEAN NOT NULL DEFAULT false,
    "bonifications" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "supplier" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "brand" TEXT,
    "origin" TEXT,
    "packaging" TEXT,
    "abv" DOUBLE PRECISION,
    "ibu" DOUBLE PRECISION,
    "shelfLifeDays" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastPurchaseCost" DOUBLE PRECISION,
    "lastPurchaseAt" TIMESTAMP(3),
    "avgCost" DOUBLE PRECISION,
    "priceLastUpdatedAt" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "supplierProductCode" TEXT,
    "barcode" TEXT,
    "weight" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "image" TEXT,
    "description" TEXT,
    "nutritionalInfo" JSONB,
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storageInstructions" TEXT,
    "isOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeDays" INTEGER,
    "minOrderQuantity" INTEGER,
    "maxOrderQuantity" INTEGER,
    "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositPercentage" DOUBLE PRECISION,
    "availableForOrder" BOOLEAN NOT NULL DEFAULT true,
    "orderInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "coldRoomQuantity" INTEGER NOT NULL DEFAULT 0,
    "houseQuantity" INTEGER NOT NULL DEFAULT 0,
    "salePointQuantity" INTEGER NOT NULL DEFAULT 0,
    "coldRoomMinStock" INTEGER NOT NULL DEFAULT 10,
    "houseMinStock" INTEGER NOT NULL DEFAULT 5,
    "salePointMinStock" INTEGER NOT NULL DEFAULT 2,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "inTransitQuantity" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER,
    "reorderLeadTimeDays" INTEGER,
    "lastRestockedAt" TIMESTAMP(3),
    "lastAuditedAt" TIMESTAMP(3),
    "averageDailyConsumption" DOUBLE PRECISION,
    "turnoverDays" DOUBLE PRECISION,
    "reorderPoint" INTEGER,
    "economicOrderQuantity" INTEGER,
    "abcClass" TEXT,
    "revenueContribution" DOUBLE PRECISION,
    "lastSoldAt" TIMESTAMP(3),
    "stockoutCount" INTEGER NOT NULL DEFAULT 0,
    "lastStockoutAt" TIMESTAMP(3),
    "stockValue" DOUBLE PRECISION,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPointOfSale" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pointOfSaleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "ProductPointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "paymentMethod" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerDocument" TEXT,
    "customerAddress" TEXT,
    "customerId" TEXT,
    "channel" TEXT,
    "subtotal" DOUBLE PRECISION,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costOfGoods" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointOfSaleId" TEXT,
    "cashSessionId" TEXT,
    "notes" TEXT,
    "pendingCartId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PersonType" NOT NULL DEFAULT 'INDIVIDUAL',
    "document" TEXT,
    "phone" TEXT,
    "secondaryPhone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "preferredPaymentMethod" TEXT,
    "paymentTerms" TEXT,
    "creditLimit" DOUBLE PRECISION,
    "creditUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "birthDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDelinquent" BOOLEAN NOT NULL DEFAULT false,
    "lastPurchaseAt" TIMESTAMP(3),
    "averageTicket" DOUBLE PRECISION,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerBonification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "givenBy" TEXT NOT NULL,
    "observation" TEXT,
    "products" JSONB,
    "category" "public"."BonificationCategory" NOT NULL DEFAULT 'BONIFICATION',
    "bonifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerBonification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PointOfSale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "code" TEXT,
    "channel" TEXT,
    "managerName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3),
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reference" TEXT,
    "notes" TEXT,
    "cashSessionId" TEXT,
    "installmentNumber" INTEGER,
    "installmentsTotal" INTEGER,
    "customerId" TEXT,
    "overdueNotifiedAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "metadata" JSONB,

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
    "pdfData" BYTEA,
    "csvData" BYTEA,
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

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "pointOfSaleId" TEXT,
    "batchId" TEXT,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "fromLocation" "public"."InventoryLocation",
    "toLocation" "public"."InventoryLocation",
    "adjustmentReason" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "performedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Batch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "supplier" TEXT,
    "productionDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "location" "public"."InventoryLocation" NOT NULL,
    "notes" TEXT,
    "qrCode" TEXT,
    "status" "public"."BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryAudit" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "public"."AuditStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "location" "public"."InventoryLocation",
    "performedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "itemsWithDifference" INTEGER NOT NULL DEFAULT 0,
    "accuracyRate" DOUBLE PRECISION,
    "totalValueDifference" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryAuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "expectedQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "countedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAuditItem_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerAddress" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."OrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "promisedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "depositPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "internalNotes" TEXT,
    "specialRequests" TEXT,
    "statusHistory" JSONB,
    "notifications" JSONB,
    "createdBy" TEXT,
    "assignedTo" TEXT,
    "source" TEXT,
    "pointOfSaleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "customizations" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "public"."User"("cpf");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "public"."User"("isAdmin");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "public"."User"("tenantId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "public"."UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permission_idx" ON "public"."UserPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "public"."UserPermission"("userId", "permission");

-- CreateIndex
CREATE INDEX "UserPointOfSale_userId_idx" ON "public"."UserPointOfSale"("userId");

-- CreateIndex
CREATE INDEX "UserPointOfSale_pointOfSaleId_idx" ON "public"."UserPointOfSale"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "UserPointOfSale_isPrimary_idx" ON "public"."UserPointOfSale"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserPointOfSale_userId_pointOfSaleId_key" ON "public"."UserPointOfSale"("userId", "pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "public"."Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "public"."Product"("category");

-- CreateIndex
CREATE INDEX "Product_updatedAt_idx" ON "public"."Product"("updatedAt");

-- CreateIndex
CREATE INDEX "Product_lastPurchaseAt_idx" ON "public"."Product"("lastPurchaseAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "public"."Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "public"."Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_abcClass_idx" ON "public"."Inventory"("abcClass");

-- CreateIndex
CREATE INDEX "Inventory_lastSoldAt_idx" ON "public"."Inventory"("lastSoldAt");

-- CreateIndex
CREATE INDEX "Inventory_lastAuditedAt_idx" ON "public"."Inventory"("lastAuditedAt");

-- CreateIndex
CREATE INDEX "ProductPointOfSale_productId_idx" ON "public"."ProductPointOfSale"("productId");

-- CreateIndex
CREATE INDEX "ProductPointOfSale_pointOfSaleId_idx" ON "public"."ProductPointOfSale"("pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPointOfSale_productId_pointOfSaleId_key" ON "public"."ProductPointOfSale"("productId", "pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_pendingCartId_key" ON "public"."Sale"("pendingCartId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "public"."Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_cashSessionId_idx" ON "public"."Sale"("cashSessionId");

-- CreateIndex
CREATE INDEX "Sale_createdById_idx" ON "public"."Sale"("createdById");

-- CreateIndex
CREATE INDEX "Sale_date_pointOfSaleId_idx" ON "public"."Sale"("date", "pointOfSaleId");

-- CreateIndex
CREATE INDEX "Sale_date_status_idx" ON "public"."Sale"("date", "status");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "public"."Sale"("date");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "public"."Sale"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_document_key" ON "public"."Customer"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "public"."Customer"("phone");

-- CreateIndex
CREATE INDEX "CustomerBonification_customerId_bonifiedAt_idx" ON "public"."CustomerBonification"("customerId", "bonifiedAt");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "public"."SaleItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_saleId_productId_key" ON "public"."SaleItem"("saleId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_name_key" ON "public"."PointOfSale"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_code_key" ON "public"."PointOfSale"("code");

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "public"."SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "SalePayment_cashSessionId_idx" ON "public"."SalePayment"("cashSessionId");

-- CreateIndex
CREATE INDEX "SalePayment_customerId_status_idx" ON "public"."SalePayment"("customerId", "status");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_effectiveAt_idx" ON "public"."ProductPriceHistory"("productId", "effectiveAt");

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
CREATE INDEX "InventoryMovement_productId_occurredAt_idx" ON "public"."InventoryMovement"("productId", "occurredAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_saleId_idx" ON "public"."InventoryMovement"("saleId");

-- CreateIndex
CREATE INDEX "InventoryMovement_pointOfSaleId_idx" ON "public"."InventoryMovement"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "InventoryMovement_batchId_idx" ON "public"."InventoryMovement"("batchId");

-- CreateIndex
CREATE INDEX "InventoryMovement_performedById_idx" ON "public"."InventoryMovement"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "public"."Batch"("batchNumber");

-- CreateIndex
CREATE INDEX "Batch_productId_idx" ON "public"."Batch"("productId");

-- CreateIndex
CREATE INDEX "Batch_expirationDate_idx" ON "public"."Batch"("expirationDate");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "public"."Batch"("status");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_auditId_idx" ON "public"."InventoryAuditItem"("auditId");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_productId_idx" ON "public"."InventoryAuditItem"("productId");

-- CreateIndex
CREATE INDEX "CashSession_userId_status_idx" ON "public"."CashSession"("userId", "status");

-- CreateIndex
CREATE INDEX "CashSession_pointOfSaleId_status_idx" ON "public"."CashSession"("pointOfSaleId", "status");

-- CreateIndex
CREATE INDEX "CashTransaction_cashSessionId_idx" ON "public"."CashTransaction"("cashSessionId");

-- CreateIndex
CREATE INDEX "CashTransaction_performedById_idx" ON "public"."CashTransaction"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "public"."Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "Order_promisedAt_idx" ON "public"."Order"("promisedAt");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_createdBy_idx" ON "public"."Order"("createdBy");

-- CreateIndex
CREATE INDEX "Order_assignedTo_idx" ON "public"."Order"("assignedTo");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- AddForeignKey
ALTER TABLE "public"."UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPointOfSale" ADD CONSTRAINT "UserPointOfSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPointOfSale" ADD CONSTRAINT "UserPointOfSale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPointOfSale" ADD CONSTRAINT "ProductPointOfSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPointOfSale" ADD CONSTRAINT "ProductPointOfSale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_pendingCartId_fkey" FOREIGN KEY ("pendingCartId") REFERENCES "public"."PendingCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerBonification" ADD CONSTRAINT "CustomerBonification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalePayment" ADD CONSTRAINT "SalePayment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalePayment" ADD CONSTRAINT "SalePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Batch" ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."InventoryAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashSession" ADD CONSTRAINT "CashSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashSession" ADD CONSTRAINT "CashSession_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashTransaction" ADD CONSTRAINT "CashTransaction_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashTransaction" ADD CONSTRAINT "CashTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
