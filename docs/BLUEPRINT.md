# BLUEPRINT — Web Marketplace Single-Seller + CMS Artikel + Template Reusable
Terakhir diupdate: 2026-09-08 (Sesi #7 — Fase 7: Final Polish (SEO, PWA, Mobile Bottom Nav, Error Boundaries & End-to-End Verification) — 100% SELESAI LENGKAP)

---

## 1. Overview
Website marketplace **single-seller** yang dirancang untuk satu penjual/pemilik web (Superadmin). Fitur utama mencakup:
- Katalog produk komoditas/barang dengan taksonomi multi-dimensi (Kategori utama, Peruntukan/Usage terkontrol, dan Hashtags/Tags bebas).
- Guest checkout cepat tanpa wajib registrasi akun, pelacakan status pesanan real-time via `orderCode` unik + nomor HP/WA.
- Pembayaran manual transfer bank dengan upload bukti transfer dan verifikasi manual oleh Superadmin.
- CMS Artikel berbasis HTML terintegrasi dengan sanitasi XSS yang ketat.
- CMS Teks Web (`ContentBlock`) untuk mengelola headline hero, tentang kami, syarat & ketentuan, dsb.
- Modul FAQ interaktif dengan kontrol urutan dan status aktif.
- Site Settings & CS WhatsApp terintegrasi (tombol chat mengambang dengan template pesan otomatis).
- Desain arsitektur **config-driven / reusable starter template** yang siap di-deploy ulang untuk unit bisnis/proyek berikutnya dengan mengganti konfigurasi tanpa merombak kode.
- Referensi UI/UX: **xpdchub** (mobile/PWA bottom nav, top search bar, chip filter, card layout modern, responsif desktop).

---

## 2. Tech Stack
- **Framework**: Next.js 14/15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + utilitas class (`clsx`, `tailwind-merge`)
- **Icons**: Lucide React
- **Database**: PostgreSQL (kompatibel cloud PostgreSQL seperti Neon, Supabase, Railway, atau instance mandiri)
- **ORM**: Prisma Client & Prisma CLI
- **Auth Admin**: Custom secure session (JWT / HTTP-only secure cookie) + `bcryptjs` untuk password hashing
- **File Upload**: Endpoint terpusat `/api/upload` (penyimpanan lokal `/public/uploads` untuk MVP, arsitektur modular siap switch ke S3/Cloudflare R2/Supabase Storage)
- **Sanitasi HTML**: `sanitize-html` untuk artikel & ContentBlock
- **Search & Filter**: Server-side query Prisma dengan URL query parameter state (`/produk?kategori=...&peruntukan=...&q=...`)

---

## 3. Struktur Folder
```text
mineral/
├── docs/
│   ├── BLUEPRINT.md          # Single Source of Truth proyek
│   └── NOTEPATCH.md          # Changelog kronologis kerja multi-sesi
├── prisma/
│   ├── schema.prisma         # Definisi 12 model database
│   └── seed.ts               # Data awal: superadmin, mineral, settings, FAQ
├── public/
│   ├── uploads/              # Direktori penyimpanan media lokal (MVP)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (storefront)/     # Halaman publik: Beranda, Produk, Detail, Artikel, FAQ, dsb.
│   │   ├── admin/            # Panel Superadmin (Login, Dashboard, Produk, Pesanan, dsb.)
│   │   ├── api/              # API endpoints (auth, upload, checkout, tracking)
│   │   ├── layout.tsx        # Root layout publik & wrapper tema
│   │   └── globals.css       # Tailwind directives & custom styles
│   ├── components/
│   │   ├── layout/           # Navbar, BottomNav (mobile PWA), Footer, FloatingCS
│   │   ├── ui/               # Reusable atomic UI (Button, Badge, Card, Modal, Input)
│   │   ├── storefront/       # ProductCard, CategoryChips, FilterSidebar, HeroSection
│   │   └── admin/            # AdminSidebar, AdminHeader, StatusBadge, ImageUploader
│   ├── lib/
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── auth.ts           # Helper autentikasi & session JWT admin
│   │   ├── sanitize.ts       # Konfigurasi whitelist sanitize-html
│   │   └── utils.ts          # Helper formatting rupiah, slugify, cn
│   └── middleware.ts         # Proteksi rute /admin/*
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Database Schema
Status: **Direncanakan & Diterapkan pada Fase 1**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPERADMIN
  ADMIN
}

enum OrderStatus {
  PENDING_PAYMENT
  PENDING_VERIFICATION
  PAID
  PROCESSING
  SHIPPED
  COMPLETED
  REJECTED
  CANCELLED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(SUPERADMIN)
  createdAt DateTime @default(now())
}

model SiteSetting {
  id                 String   @id @default(cuid())
  siteName           String
  tagline            String?
  logoUrl            String?
  faviconUrl         String?
  primaryColor       String?
  csWhatsapp         String?
  csEmail            String?
  csOperationalHours String?
  address            String?
  bankAccounts       Json     // [{ bank: "BCA", noRekening: "1234567890", atasNama: "PT Mineral" }]
  footerText         String?
  metaTitle          String?
  metaDesc           String?
  updatedAt          DateTime @updatedAt
}

model ContentBlock {
  id        String   @id @default(cuid())
  key       String   @unique
  title     String?
  content   String   @db.Text
  updatedAt DateTime @updatedAt
}

model FAQ {
  id       String  @id @default(cuid())
  question String
  answer   String  @db.Text
  order    Int     @default(0)
  isActive Boolean @default(true)
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  image    String?
  products Product[]
}

model Usage {
  id       String         @id @default(cuid())
  name     String
  slug     String         @unique
  products ProductUsage[]
}

model Product {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String         @db.Text
  price       Int
  stock       Int            @default(0)
  images      Json           // array string URL
  tags        Json           // array string hashtag: ["zeolite","pupuk-organik"]
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  usages      ProductUsage[]
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
}

model ProductUsage {
  productId String
  usageId   String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  usage     Usage   @relation(fields: [usageId], references: [id], onDelete: Cascade)

  @@id([productId, usageId])
}

model Order {
  id           String        @id @default(cuid())
  orderCode    String        @unique // ORD-YYYYMMDD-XXXX
  buyerName    String
  buyerPhone   String
  buyerAddress String        @db.Text
  status       OrderStatus   @default(PENDING_PAYMENT)
  total        Int
  items        OrderItem[]
  proof        PaymentProof?
  createdAt    DateTime      @default(now())
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  qty       Int
  price     Int
}

model PaymentProof {
  id         String    @id @default(cuid())
  orderId    String    @unique
  order      Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fileUrl    String
  note       String?
  uploadedAt DateTime  @default(now())
  verifiedBy String?
  verifiedAt DateTime?
}

model Article {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  htmlContent String    @db.Text
  thumbnail   String?
  metaDesc    String?
  isPublished Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
}

enum CustomerType {
  PROSPECT
  CUSTOMER
}

enum LeadStatus {
  BARU
  DIHUBUNGI
  SAMPEL_DIKIRIM
  NEGOSIASI
  DEAL
  BATAL
}

model Customer {
  id                 String        @id @default(cuid())
  name               String
  company            String?
  phone              String        @unique
  email              String?
  address            String?
  type               CustomerType  @default(PROSPECT)
  status             LeadStatus    @default(BARU)
  source             String        @default("WEBSITE_RFQ")
  preferredCommodity String?
  estimatedVolume    String?
  notes              String?
  totalOrders        Int           @default(0)
  totalSpent         Int           @default(0)
  lastContactAt      DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([phone])
  @@index([type])
  @@index([status])
}
```

---

## 5. Role & Permission

| Role | Hak Akses | Catatan |
|---|---|---|
| **Superadmin** | Full akses: Pengaturan situs, kelola produk, kategori, peruntukan, verifikasi pesanan & pembayaran, CMS artikel, CMS teks & FAQ, serta CRM Database Pelanggan & Prospek Leads. | Akses via kredensial login `/admin/login`. Sesi aman via HTTP-only cookie. |
| **Admin** | Operasional katalog, pesanan, dan follow-up prospek sales. | Disiapkan strukturnya pada role enum. |
| **Buyer / Publik** | Browse katalog, pencarian & filter, guest checkout, request penawaran resmi (RFQ), upload bukti transfer, lacak pesanan via `orderCode` + HP, membaca artikel & FAQ, klik-chat CS WhatsApp. | Tanpa wajib login / registrasi akun. |

---

## 6. Daftar Fitur & Status

| Fitur | Status | Catatan |
|---|---|---|
| Inisialisasi Project (Next.js + Tailwind + TS) | Selesai | Fase 1: Next.js 16 (App Router) + TS + Tailwind v3 + Lucide Icons |
| Setup Schema Prisma & Migrasi | Selesai | Fase 1: 12 model Prisma lengkap, validasi & Prisma Client generated |
| Seed Data Awal (Komoditas Mineral) | Selesai | Fase 1: Script seed (Zeolite, Bentonite, Timah, Gaharu, dsb.) |
| Auth Superadmin (Login, Logout, Middleware) | Selesai | Fase 1: bcrypt hash, JWT session httpOnly cookie, proteksi /admin/* |
| Upload Gambar (Komponen Bersama: File & URL) | Selesai | Fase 2: Endpoint /api/upload + komponen ImageUploader (file & link) |
| CRUD Kategori & Peruntukan | Selesai | Fase 2: Endpoint & UI Admin /admin/kategori dan /admin/peruntukan |
| CRUD Produk (Galeri, Tags, Peruntukan) | Selesai | Fase 2: Endpoint & UI Admin /admin/produk (tabel, baru, edit) |
| Storefront Publik & Keranjang Belanja | Selesai | Fase 2: /produk, /produk/[slug], /keranjang + CartContext localStorage |
| Pencarian & Filter Multi-Dimensi (URL Query) | Selesai | Fase 3: FilterSidebar desktop sticky + mobile bottom drawer, SortSelect, ActiveFilterChips, data-store multi-select |
| Checkout & Upload Bukti Pembayaran | Selesai | Fase 4: /checkout form guest, /pesanan/[orderCode] rekening resmi & upload bukti bayar, API checkout & bukti |
| Verifikasi Pembayaran Superadmin | Selesai | Fase 4: /admin/pesanan tabel filter status, /admin/pesanan/[id] tinjau bukti, persetujuan/penolakan, kontrol resi |
| Pelacakan Pesanan Publik | Selesai | Fase 4: /lacak-pesanan verifikasi orderCode + no WA pembeli, visual stepper progress 6-tahap |
| CMS Artikel (HTML Sanitizer, Slug Generator) | Selesai | Fase 5: /admin/artikel CRUD, editor HTML live preview, sanitasi XSS, listing /artikel & detail /artikel/[slug] |
| CMS Konten Teks Web (`ContentBlock`) | Selesai | Fase 6: Editor tabbed /admin/konten untuk 6 blok konten, sanitasi HTML, integrasi dinamis ke beranda, tentang-kami, syarat-ketentuan |
| Modul FAQ Dinamis | Selesai | Fase 6: CRUD /admin/faq, urutan tampil, toggle status aktif, etalase publik /faq dengan live search filter & akordeon interaktif |
| Site Settings & WhatsApp Click-to-Chat | Selesai | Fase 6: Form /admin/pengaturan 3 tab (identitas, kontak CS, rekening transfer), floating WhatsAppButton dengan animasi denyut |
| Dashboard Ringkasan Superadmin | Selesai | Fase 6: /admin/dashboard metrik live omset terverifikasi, pending verifikasi, komoditas aktif, alert stok rendah, tabel recent orders |
| Polish: SEO, PWA/Mobile Bottom Nav, End-to-End | Selesai | Fase 7: Manifest PWA, Service Worker offline caching, dynamic sitemap.xml, robots.txt, Schema.org JSON-LD (Organization, Product, NewsArticle, FAQPage, BreadcrumbList), safe-area BottomNav (xpdchub), custom 404/error/loading boundaries, E2E audit 39/39 passed, production build 100% sukses |
| Database Pelanggan & CRM Prospek/Leads (B2B) | Selesai | Sesi #8/9: Model Customer & Enum (LeadStatus, CustomerType), Public RFQ Lead Capture modal di detail produk & homepage, full CRUD admin (/admin/pelanggan), auto-sync dari guest checkout, anti-duplikasi nomor WhatsApp cerdas, 1-Click WhatsApp Direct Chat, ekspor CSV UTF-8 BOM, integrasi kartu metrik dashboard admin. |

---

## 7. API / Route List

### Publik:
- `GET /` — Beranda (Hero, Highlight Kategori, Produk Unggulan, Wholesale RFQ Banner)
- `GET /produk` — Listing produk dengan filter (kategori, peruntukan, harga, stok, sort)
- `GET /produk/[slug]` — Detail produk + tombol Minta Penawaran Industri (RFQ)
- `GET /kategori/[slug]` — Shortcut listing produk per kategori
- `GET /keranjang` — Halaman keranjang belanja
- `GET /checkout` — Formulir checkout pesanan guest
- `GET /lacak-pesanan` — Halaman pelacakan pesanan (input `orderCode` + nomor HP)
- `GET /artikel` — Listing artikel edukasi & komoditas
- `GET /artikel/[slug]` — Detail artikel dengan konten HTML tersanitasi
- `GET /faq` — Tanya jawab umum
- `GET /tentang-kami` — Halaman profil usaha (dari ContentBlock)
- `GET /kontak` — Info kontak & tombol WhatsApp CS
- `POST /api/leads` — Endpoint publik penangkapan prospek RFQ penawaran harga

### Superadmin (`/admin/*`):
- `GET /admin/login` — Halaman login
- `GET /admin/dashboard` — Dashboard metrik & status
- `GET /admin/produk` — Manajemen produk
- `GET /admin/kategori` — Manajemen kategori
- `GET /admin/peruntukan` — Manajemen taksonomi peruntukan
- `GET /admin/pesanan` — Daftar pesanan & verifikasi pembayaran
- `GET /admin/pesanan/[id]` — Detail pesanan & persetujuan bukti transfer
- `GET /admin/pelanggan` — Panel antarmuka CRM Database Pelanggan & Prospek
- `GET /admin/artikel` — Manajemen CMS artikel
- `GET /admin/konten` — CMS blok teks web
- `GET /admin/faq` — Manajemen tanya jawab
- `GET /admin/pengaturan` — Site settings, rekening bank, kontak CS
- `GET, POST /api/admin/pelanggan` — API daftar & tambah kontak pelanggan
- `GET, PUT, DELETE /api/admin/pelanggan/[id]` — API detail, ubah data/status/catatan, & hapus kontak
- `GET /api/admin/pelanggan/export` — API unduh ekspor file CSV database kontak

---

## 8. Environment Variables
Daftar variabel lingkungan yang dibutuhkan (`.env.example`):

```env
# Database PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mineral_db?schema=public"

# Auth Secret (digunakan untuk signing JWT session admin)
AUTH_SECRET="change-this-to-a-super-secret-random-key-at-least-32-chars"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 9. Keputusan Teknis Penting
1. **Pemisahan Peruntukan (`Usage`) vs Tags**:
   - `Usage` dimodelkan sebagai tabel taksonomi terpisah (`Usage` & `ProductUsage`) agar admin dapat mengelola opsi checkbox terstruktur di halaman storefront.
   - `Tags` disimpan sebagai array string (`Json`) untuk kemudahan penambahan kata kunci bebas tanpa batas.
2. **Guest Checkout & Tracking**:
   - Menghilangkan friksi pendaftaran akun bagi pembeli. Verifikasi identitas saat melacak pesanan cukup mencocokkan `orderCode` dan nomor WhatsApp pembeli.
3. **Session Admin via HTTP-only Cookie**:
   - Menggunakan JWT yang disimpan dalam cookie `httpOnly` dengan header `SameSite=Lax` untuk mencegah manipulasi client-side script dan XSS.
4. **Sanitasi HTML Terpusat**:
   - Semua input HTML (artikel dan teks web) wajib melewati sanitizer sebelum dirender ke DOM untuk mencegah celah keamanan injeksi skrip.
5. **Mobile-First ala XPDC Hub**:
   - Desain menyertakan navigasi bawah (*bottom bar*) mengambang saat diakses via ponsel/PWA, serta top bar desktop lengkap saat diakses lewat layar lebar.
