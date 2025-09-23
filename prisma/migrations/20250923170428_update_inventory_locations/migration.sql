/*
  Warnings:

  - You are about to drop the column `minStock` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Inventory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Inventory" DROP COLUMN "minStock",
DROP COLUMN "quantity",
ADD COLUMN     "coldRoomMinStock" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "coldRoomQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "houseMinStock" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "houseQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salePointMinStock" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "salePointQuantity" INTEGER NOT NULL DEFAULT 0;
