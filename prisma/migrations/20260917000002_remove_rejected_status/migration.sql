-- Sesi #33 | P1-05: Hapus nilai REJECTED dari enum OrderStatus (Opsi A)
-- REJECTED adalah state orphan yang tidak pernah dicapai (0 kode yang menulis status=REJECTED)
-- Penolakan bukti bayar selalu mengembalikan ke PENDING_PAYMENT, bukan REJECTED

-- Buat enum baru tanpa REJECTED
CREATE TYPE "OrderStatus_new" AS ENUM (
    'PENDING_PAYMENT',
    'PENDING_VERIFICATION',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED'
);

-- Migrasi kolom yang ada (konversi REJECTED → CANCELLED sebagai fallback aman)
ALTER TABLE "Order"
    ALTER COLUMN "status" TYPE "OrderStatus_new"
    USING (
        CASE "status"::text
            WHEN 'REJECTED' THEN 'CANCELLED'
            ELSE "status"::text
        END
    )::"OrderStatus_new";

-- Hapus enum lama, rename enum baru
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
