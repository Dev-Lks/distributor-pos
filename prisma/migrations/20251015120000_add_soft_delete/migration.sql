-- Add soft delete columns to core tables

ALTER TABLE "public"."User"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "User_deletedAt_idx" ON "public"."User" ("deletedAt");

ALTER TABLE "public"."Product"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Product_deletedAt_idx" ON "public"."Product" ("deletedAt");

ALTER TABLE "public"."Customer"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Customer_deletedAt_idx" ON "public"."Customer" ("deletedAt");

ALTER TABLE "public"."Sale"
	ADD COLUMN "voidReason" TEXT,
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Sale_deletedAt_idx" ON "public"."Sale" ("deletedAt");

ALTER TABLE "public"."PointOfSale"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "PointOfSale_deletedAt_idx" ON "public"."PointOfSale" ("deletedAt");

ALTER TABLE "public"."Batch"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Batch_deletedAt_idx" ON "public"."Batch" ("deletedAt");

ALTER TABLE "public"."Order"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Order_deletedAt_idx" ON "public"."Order" ("deletedAt");

ALTER TABLE "public"."Delivery"
	ADD COLUMN "deletedAt" TIMESTAMP(3),
	ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Delivery_deletedAt_idx" ON "public"."Delivery" ("deletedAt");
 WARN  allowNonAppliedPatches is deprecated, use allowUnusedPatches instead.
