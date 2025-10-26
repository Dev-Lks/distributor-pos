-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_REPORTS', 'CREATE_SALES', 'VIEW_ALL_SALES', 'VIEW_OWN_SALES', 'EDIT_SALES', 'DELETE_SALES', 'APPLY_DISCOUNTS', 'VIEW_PRODUCTS', 'CREATE_PRODUCTS', 'EDIT_PRODUCTS', 'DELETE_PRODUCTS', 'MANAGE_PRICES', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'TRANSFER_STOCK', 'ADJUST_STOCK', 'VIEW_STOCK_MOVEMENTS', 'VIEW_CUSTOMERS', 'CREATE_CUSTOMERS', 'EDIT_CUSTOMERS', 'DELETE_CUSTOMERS', 'VIEW_CUSTOMER_HISTORY', 'OPEN_CASH_SESSION', 'CLOSE_CASH_SESSION', 'MANAGE_CASH_TRANSACTIONS', 'FORCE_CLOSE_CASH', 'VIEW_CASH_REPORTS', 'VIEW_ORDERS', 'CREATE_ORDERS', 'EDIT_ORDERS', 'DELETE_ORDERS', 'MANAGE_ORDER_STATUS', 'VIEW_DELIVERIES', 'CREATE_DELIVERIES', 'EDIT_DELIVERIES', 'DELETE_DELIVERIES', 'MANAGE_DELIVERY_STATUS', 'ASSIGN_DELIVERY_DRIVER', 'VIEW_POINTS_OF_SALE', 'MANAGE_POINTS_OF_SALE', 'MANAGE_USERS', 'VIEW_USERS', 'ASSIGN_PERMISSIONS', 'CREATE_BONIFICATIONS', 'APPROVE_BONIFICATIONS', 'VIEW_BONIFICATIONS', 'VIEW_SETTINGS', 'MANAGE_SETTINGS');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PendingCartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BonificationCategory" AS ENUM ('BONIFICATION', 'DEGUSTATION', 'FREE_SAMPLE', 'PROMOTIONAL_GIFT', 'COURTESY');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('CUSTOMER', 'COMPANY');

-- CreateEnum
CREATE TYPE "DailyReportStatus" AS ENUM ('PENDING', 'GENERATED', 'SENT', 'RESENT', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'DEPLETED', 'EXPIRED', 'RECALLED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'TRANSFER', 'SALE', 'ADJUSTMENT', 'LOSS', 'RETURN');

-- CreateEnum
CREATE TYPE "InventoryLocation" AS ENUM ('COLD_ROOM', 'HOUSE', 'SALE_POINT', 'SUPPLIER', 'TRANSIT', 'EVENT');

-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashTransactionType" AS ENUM ('OPENING', 'SUPPLY', 'WITHDRAWAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'CAR', 'BICYCLE', 'FOOT');

-- CreateTable
CREATE TABLE "User" (
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
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "PermissionKey" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPointOfSale" (
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
CREATE TABLE "Product" (
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
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
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
CREATE TABLE "ProductPointOfSale" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pointOfSaleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "ProductPointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
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
    "voidReason" TEXT,
    "pendingCartId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "printedAt" TIMESTAMP(3),
    "printJobId" TEXT,
    "printStatus" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PersonType" NOT NULL DEFAULT 'INDIVIDUAL',
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
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerBonification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "recipientType" "RecipientType" NOT NULL DEFAULT 'CUSTOMER',
    "companyName" TEXT,
    "givenBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "observation" TEXT,
    "products" JSONB,
    "itemsValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "category" "BonificationCategory" NOT NULL DEFAULT 'BONIFICATION',
    "bonifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerBonification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
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
CREATE TABLE "PointOfSale" (
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
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "PointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "ProductPriceHistory" (
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
CREATE TABLE "PendingCart" (
    "id" TEXT NOT NULL,
    "status" "PendingCartStatus" NOT NULL DEFAULT 'ACTIVE',
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
CREATE TABLE "PendingCartItem" (
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
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "DailyReportStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "pointOfSaleId" TEXT,
    "batchId" TEXT,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "fromLocation" "InventoryLocation",
    "toLocation" "InventoryLocation",
    "adjustmentReason" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "performedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
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
    "location" "InventoryLocation" NOT NULL,
    "notes" TEXT,
    "qrCode" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAudit" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "AuditStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "location" "InventoryLocation",
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
CREATE TABLE "InventoryAuditItem" (
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
CREATE TABLE "CashSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointOfSaleId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingAmount" DOUBLE PRECISION,
    "expectedClosingAmount" DOUBLE PRECISION,
    "differenceAmount" DOUBLE PRECISION,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "hardwareEventReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "type" "CashTransactionType" NOT NULL,
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
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerAddress" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "OrderPriority" NOT NULL DEFAULT 'MEDIUM',
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
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
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
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
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

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareConfig" (
    "id" TEXT NOT NULL,
    "pointOfSaleId" TEXT NOT NULL,
    "scannerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scannerAutoAdd" BOOLEAN NOT NULL DEFAULT true,
    "scannerPrefix" TEXT,
    "scannerSuffix" TEXT,
    "printerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "printerType" TEXT NOT NULL DEFAULT 'USB',
    "printerConnection" TEXT,
    "printerWidth" INTEGER NOT NULL DEFAULT 48,
    "printerEncoding" TEXT NOT NULL DEFAULT 'UTF-8',
    "autoPrint" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "footerMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseDeliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeDeliveryAbove" DOUBLE PRECISION,
    "estimatedTime" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxDistance" DOUBLE PRECISION,
    "postalCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "neighborhoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "centerLat" DOUBLE PRECISION,
    "centerLng" DOUBLE PRECISION,
    "radius" DOUBLE PRECISION,
    "motorcycleFee" DOUBLE PRECISION,
    "carFee" DOUBLE PRECISION,
    "bicycleFee" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryDriver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "document" TEXT,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'MOTORCYCLE',
    "vehiclePlate" TEXT,
    "vehicleModel" TEXT,
    "vehicleColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "successfulDeliveries" INTEGER NOT NULL DEFAULT 0,
    "failedDeliveries" INTEGER NOT NULL DEFAULT 0,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "notes" TEXT,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "saleId" TEXT,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "zoneId" TEXT,
    "driverId" TEXT,
    "pointOfSaleId" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "referencePoint" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "preparedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION,
    "vehicleUsed" "VehicleType",
    "estimatedTime" INTEGER,
    "actualDeliveryTime" INTEGER,
    "notes" TEXT,
    "deliveryInstructions" TEXT,
    "internalNotes" TEXT,
    "paymentMethod" TEXT,
    "paidInAdvance" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "changeFor" DOUBLE PRECISION,
    "rating" INTEGER,
    "ratingComment" TEXT,
    "statusHistory" JSONB,
    "driverLocation" JSONB,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT 'Minha Empresa',
    "cnpj" TEXT,
    "address" TEXT,
    "addressNumber" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "receiptFooterMessage" TEXT DEFAULT 'Obrigado pela preferência!',
    "receiptLogoUrl" TEXT,
    "receiptShowQRCode" BOOLEAN NOT NULL DEFAULT true,
    "receiptWidth" INTEGER NOT NULL DEFAULT 48,
    "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificationPush" BOOLEAN NOT NULL DEFAULT true,
    "notificationDesktop" BOOLEAN NOT NULL DEFAULT false,
    "alertLowStock" BOOLEAN NOT NULL DEFAULT true,
    "alertAutoReceipt" BOOLEAN NOT NULL DEFAULT false,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 5,
    "defaultPointOfSaleId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationDeliveries" BOOLEAN NOT NULL DEFAULT true,
    "notificationStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "notificationSales" BOOLEAN NOT NULL DEFAULT true,
    "notificationDesktop" BOOLEAN NOT NULL DEFAULT true,
    "notificationSound" BOOLEAN NOT NULL DEFAULT true,
    "notificationVibration" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permission_idx" ON "UserPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE INDEX "UserPointOfSale_userId_idx" ON "UserPointOfSale"("userId");

-- CreateIndex
CREATE INDEX "UserPointOfSale_pointOfSaleId_idx" ON "UserPointOfSale"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "UserPointOfSale_isPrimary_idx" ON "UserPointOfSale"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserPointOfSale_userId_pointOfSaleId_key" ON "UserPointOfSale"("userId", "pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_updatedAt_idx" ON "Product"("updatedAt");

-- CreateIndex
CREATE INDEX "Product_lastPurchaseAt_idx" ON "Product"("lastPurchaseAt");

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_abcClass_idx" ON "Inventory"("abcClass");

-- CreateIndex
CREATE INDEX "Inventory_lastSoldAt_idx" ON "Inventory"("lastSoldAt");

-- CreateIndex
CREATE INDEX "Inventory_lastAuditedAt_idx" ON "Inventory"("lastAuditedAt");

-- CreateIndex
CREATE INDEX "ProductPointOfSale_productId_idx" ON "ProductPointOfSale"("productId");

-- CreateIndex
CREATE INDEX "ProductPointOfSale_pointOfSaleId_idx" ON "ProductPointOfSale"("pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPointOfSale_productId_pointOfSaleId_key" ON "ProductPointOfSale"("productId", "pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_pendingCartId_key" ON "Sale"("pendingCartId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_cashSessionId_idx" ON "Sale"("cashSessionId");

-- CreateIndex
CREATE INDEX "Sale_createdById_idx" ON "Sale"("createdById");

-- CreateIndex
CREATE INDEX "Sale_date_pointOfSaleId_idx" ON "Sale"("date", "pointOfSaleId");

-- CreateIndex
CREATE INDEX "Sale_date_status_idx" ON "Sale"("date", "status");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "Sale"("date");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_printStatus_idx" ON "Sale"("printStatus");

-- CreateIndex
CREATE INDEX "Sale_deletedAt_idx" ON "Sale"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_document_key" ON "Customer"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- CreateIndex
CREATE INDEX "CustomerBonification_customerId_bonifiedAt_idx" ON "CustomerBonification"("customerId", "bonifiedAt");

-- CreateIndex
CREATE INDEX "CustomerBonification_recipientType_bonifiedAt_idx" ON "CustomerBonification"("recipientType", "bonifiedAt");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_saleId_productId_key" ON "SaleItem"("saleId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_name_key" ON "PointOfSale"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_code_key" ON "PointOfSale"("code");

-- CreateIndex
CREATE INDEX "PointOfSale_deletedAt_idx" ON "PointOfSale"("deletedAt");

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "SalePayment_cashSessionId_idx" ON "SalePayment"("cashSessionId");

-- CreateIndex
CREATE INDEX "SalePayment_customerId_status_idx" ON "SalePayment"("customerId", "status");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_effectiveAt_idx" ON "ProductPriceHistory"("productId", "effectiveAt");

-- CreateIndex
CREATE INDEX "PendingCart_pointOfSaleId_status_idx" ON "PendingCart"("pointOfSaleId", "status");

-- CreateIndex
CREATE INDEX "PendingCart_customerId_idx" ON "PendingCart"("customerId");

-- CreateIndex
CREATE INDEX "PendingCart_createdById_idx" ON "PendingCart"("createdById");

-- CreateIndex
CREATE INDEX "PendingCartItem_cartId_idx" ON "PendingCartItem"("cartId");

-- CreateIndex
CREATE INDEX "PendingCartItem_productId_idx" ON "PendingCartItem"("productId");

-- CreateIndex
CREATE INDEX "DailyReport_cashSessionId_idx" ON "DailyReport"("cashSessionId");

-- CreateIndex
CREATE INDEX "DailyReport_status_idx" ON "DailyReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportDate_pointOfSaleId_key" ON "DailyReport"("reportDate", "pointOfSaleId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_occurredAt_idx" ON "InventoryMovement"("productId", "occurredAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_saleId_idx" ON "InventoryMovement"("saleId");

-- CreateIndex
CREATE INDEX "InventoryMovement_pointOfSaleId_idx" ON "InventoryMovement"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "InventoryMovement_batchId_idx" ON "InventoryMovement"("batchId");

-- CreateIndex
CREATE INDEX "InventoryMovement_performedById_idx" ON "InventoryMovement"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- CreateIndex
CREATE INDEX "Batch_productId_idx" ON "Batch"("productId");

-- CreateIndex
CREATE INDEX "Batch_expirationDate_idx" ON "Batch"("expirationDate");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_deletedAt_idx" ON "Batch"("deletedAt");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_auditId_idx" ON "InventoryAuditItem"("auditId");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_productId_idx" ON "InventoryAuditItem"("productId");

-- CreateIndex
CREATE INDEX "CashSession_userId_status_idx" ON "CashSession"("userId", "status");

-- CreateIndex
CREATE INDEX "CashSession_pointOfSaleId_status_idx" ON "CashSession"("pointOfSaleId", "status");

-- CreateIndex
CREATE INDEX "CashTransaction_cashSessionId_idx" ON "CashTransaction"("cashSessionId");

-- CreateIndex
CREATE INDEX "CashTransaction_performedById_idx" ON "CashTransaction"("performedById");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_promisedAt_idx" ON "Order"("promisedAt");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_createdBy_idx" ON "Order"("createdBy");

-- CreateIndex
CREATE INDEX "Order_assignedTo_idx" ON "Order"("assignedTo");

-- CreateIndex
CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "PrintJob_status_idx" ON "PrintJob"("status");

-- CreateIndex
CREATE INDEX "PrintJob_createdAt_idx" ON "PrintJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareConfig_pointOfSaleId_key" ON "HardwareConfig"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "HardwareConfig_pointOfSaleId_idx" ON "HardwareConfig"("pointOfSaleId");

-- CreateIndex
CREATE INDEX "DeliveryZone_isActive_idx" ON "DeliveryZone"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryDriver_phone_key" ON "DeliveryDriver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryDriver_document_key" ON "DeliveryDriver"("document");

-- CreateIndex
CREATE INDEX "DeliveryDriver_phone_idx" ON "DeliveryDriver"("phone");

-- CreateIndex
CREATE INDEX "DeliveryDriver_isActive_idx" ON "DeliveryDriver"("isActive");

-- CreateIndex
CREATE INDEX "DeliveryDriver_isAvailable_idx" ON "DeliveryDriver"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_deliveryNumber_key" ON "Delivery"("deliveryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_saleId_key" ON "Delivery"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_customerId_idx" ON "Delivery"("customerId");

-- CreateIndex
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");

-- CreateIndex
CREATE INDEX "Delivery_scheduledFor_idx" ON "Delivery"("scheduledFor");

-- CreateIndex
CREATE INDEX "Delivery_driverId_idx" ON "Delivery"("driverId");

-- CreateIndex
CREATE INDEX "Delivery_zoneId_idx" ON "Delivery"("zoneId");

-- CreateIndex
CREATE INDEX "Delivery_deliveryNumber_idx" ON "Delivery"("deliveryNumber");

-- CreateIndex
CREATE INDEX "Delivery_createdAt_idx" ON "Delivery"("createdAt");

-- CreateIndex
CREATE INDEX "Delivery_deletedAt_idx" ON "Delivery"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointOfSale" ADD CONSTRAINT "UserPointOfSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointOfSale" ADD CONSTRAINT "UserPointOfSale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPointOfSale" ADD CONSTRAINT "ProductPointOfSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPointOfSale" ADD CONSTRAINT "ProductPointOfSale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_pendingCartId_fkey" FOREIGN KEY ("pendingCartId") REFERENCES "PendingCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBonification" ADD CONSTRAINT "CustomerBonification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingCart" ADD CONSTRAINT "PendingCart_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingCart" ADD CONSTRAINT "PendingCart_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingCart" ADD CONSTRAINT "PendingCart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingCartItem" ADD CONSTRAINT "PendingCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "PendingCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingCartItem" ADD CONSTRAINT "PendingCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "InventoryAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareConfig" ADD CONSTRAINT "HardwareConfig_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DeliveryDriver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
