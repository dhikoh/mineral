-- Migration: P1-07 Make OrderItem.productId nullable for SetNull cascade
-- Saat produk dihapus, riwayat order tetap tersimpan dengan snapshot

ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
