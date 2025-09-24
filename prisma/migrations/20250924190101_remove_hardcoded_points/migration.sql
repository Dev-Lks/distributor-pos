/*
  Warnings:

  - You are about to drop the column `point1MinStock` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `point1Quantity` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `point2MinStock` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `point2Quantity` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `point3MinStock` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `point3Quantity` on the `Inventory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "point1MinStock",
DROP COLUMN "point1Quantity",
DROP COLUMN "point2MinStock",
DROP COLUMN "point2Quantity",
DROP COLUMN "point3MinStock",
DROP COLUMN "point3Quantity";

-- CreateTable
CREATE TABLE "public"."ProductPointOfSale" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pointOfSaleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "ProductPointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPointOfSale_productId_idx" ON "public"."ProductPointOfSale"("productId");

-- CreateIndex
CREATE INDEX "ProductPointOfSale_pointOfSaleId_idx" ON "public"."ProductPointOfSale"("pointOfSaleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPointOfSale_productId_pointOfSaleId_key" ON "public"."ProductPointOfSale"("productId", "pointOfSaleId");

-- AddForeignKey
ALTER TABLE "public"."ProductPointOfSale" ADD CONSTRAINT "ProductPointOfSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPointOfSale" ADD CONSTRAINT "ProductPointOfSale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "public"."PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
