-- Sesi #33 | P1-11 (sebagian): Tambah kolom finansial B2B pada Product dan Order
-- P1-11: minOrderQty, incrementQty di Product
-- P1-11: subtotal, shippingCost, taxRate, taxAmount, discountAmount, grandTotal di Order
-- P1-11: paymentToleranceAmount, defaultTaxRate, taxEnabled, shippingPolicy di SiteSetting
-- P2-07: passwordChangedAt di User

-- Product: MOQ dan increment
ALTER TABLE "Product"
    ADD COLUMN "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "incrementQty" INTEGER NOT NULL DEFAULT 1;

-- Index performa Product
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- Order: kolom finansial B2B
ALTER TABLE "Order"
    ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "shippingCost" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "taxRate" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "taxAmount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "grandTotal" INTEGER NOT NULL DEFAULT 0;

-- Backfill: set grandTotal = total untuk pesanan lama (total sudah benar)
UPDATE "Order" SET
    "subtotal" = "total",
    "grandTotal" = "total"
WHERE "grandTotal" = 0;

-- SiteSetting: konfigurasi pajak dan toleransi pembayaran
ALTER TABLE "SiteSetting"
    ADD COLUMN "paymentToleranceAmount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "defaultTaxRate" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "shippingPolicy" TEXT,
    ADD COLUMN "auditRetentionDays" INTEGER NOT NULL DEFAULT 365;

-- User: passwordChangedAt untuk invalidasi sesi
ALTER TABLE "User"
    ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- Article: index untuk query umum
CREATE INDEX "Article_isPublished_idx" ON "Article"("isPublished");
