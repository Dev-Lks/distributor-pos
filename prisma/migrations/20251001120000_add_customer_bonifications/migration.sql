-- CreateEnum
CREATE TYPE "BonificationCategory" AS ENUM ('BONIFICATION', 'DEGUSTATION');

-- CreateTable
CREATE TABLE "CustomerBonification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "givenBy" TEXT NOT NULL,
    "observation" TEXT,
    "products" JSONB,
    "category" "BonificationCategory" NOT NULL DEFAULT 'BONIFICATION',
    "bonifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerBonification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerBonification_customerId_bonifiedAt_idx" ON "CustomerBonification"("customerId", "bonifiedAt");

-- AddForeignKey
ALTER TABLE "CustomerBonification" ADD CONSTRAINT "CustomerBonification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
