-- Sesi #33 | P0-01: Tambah tabel SellOffer dan enum SellOfferStatus
-- Dibuat karena model ditambahkan di Sesi #21 tanpa migrasi yang sesuai

-- CreateEnum
CREATE TYPE "SellOfferStatus" AS ENUM ('BARU', 'DIHUBUNGI', 'DIVERIFIKASI', 'DITOLAK');

-- CreateTable
CREATE TABLE "SellOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "province" TEXT,
    "commodityName" TEXT NOT NULL,
    "commoditySpec" TEXT,
    "estimatedVolume" TEXT,
    "priceExpected" TEXT,
    "photoUrls" JSONB,
    "status" "SellOfferStatus" NOT NULL DEFAULT 'BARU',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellOffer_status_idx" ON "SellOffer"("status");

-- CreateIndex
CREATE INDEX "SellOffer_createdAt_idx" ON "SellOffer"("createdAt");
