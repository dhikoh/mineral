-- Sesi #33 | P1-06 + P1-07: Tambah Order.adminNotes dan snapshot OrderItem
-- P1-06: adminNotes untuk catatan internal admin (terpisah dari notes pembeli)
-- P1-07: snapshot productName/productSlug/productUnit agar riwayat pesanan immutable

-- P1-06: adminNotes di Order
ALTER TABLE "Order" ADD COLUMN "adminNotes" TEXT;

-- P1-07: Snapshot kolom di OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "productName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrderItem" ADD COLUMN "productSlug" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productUnit" TEXT NOT NULL DEFAULT 'kg';

-- P1-07: Index pada productId untuk performa lookup
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- P1-07: Index pada Order untuk query umum
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
