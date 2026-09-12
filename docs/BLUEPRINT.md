# BLUEPRINT — Web Marketplace Single-Seller + CMS Artikel + Template Reusable
Terakhir diupdate: 2026-09-12 (Sesi #23 — Perbaikan Next.js Image 400 Bad Request via Dynamic Uploads Route Handler & PUT Pengaturan 500 Dual Persistence Fix)

---

## 1. Overview
Website marketplace **single-seller** yang dirancang untuk satu penjual/pemilik web (Superadmin). Fitur utama mencakup:
- Katalog produk komoditas/barang dengan taksonomi multi-dimensi (Kategori utama, Peruntukan/Usage terkontrol, dan Hashtags/Tags bebas).
- Guest checkout cepat tanpa wajib registrasi akun, pelacakan status pesanan real-time via `orderCode` unik + nomor HP/WA.
- Pembayaran manual transfer bank dengan upload bukti transfer dan verifikasi manual oleh Superadmin.
- Mini-CRM B2B terintegrasi: penangkapan leads RFQ publik, manajemen direktori prospek & pelanggan, riwayat nilai transaksi (LTV), dan ekspor CSV.
- CMS Artikel berbasis HTML terintegrasi dengan sanitasi XSS yang ketat.
- CMS Teks Web (`ContentBlock`) untuk mengelola headline hero, tentang kami, syarat & ketentuan, dsb.
- Modul FAQ interaktif dengan kontrol urutan dan status aktif.
- Site Settings & CS WhatsApp terintegrasi (tombol chat mengambang dengan template pesan otomatis).
- Desain arsitektur **config-driven / reusable starter template** yang siap di-deploy ulang untuk unit bisnis/proyek berikutnya dengan mengganti konfigurasi tanpa merombak kode.
- Referensi UI/UX: **xpdchub** (mobile/PWA bottom nav, top search bar, chip filter, card layout modern, responsif desktop).

---

## 2. Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + utilitas class (`clsx`, `tailwind-merge`)
- **Icons**: Lucide React
- **Database**: PostgreSQL (kompatibel cloud PostgreSQL seperti Neon, Supabase, Railway, atau instance mandiri)
- **ORM**: Prisma Client & Prisma CLI (v6)
- **Auth Admin**: Custom secure session (JWT / HTTP-only secure cookie via `jose`) + `bcryptjs` untuk password hashing
- **File Upload**: Endpoint terpusat `/api/upload` dengan rate limiting per-IP dan validasi Magic Bytes berkas fisik (JPG, PNG, WEBP, PDF)
- **Sanitasi HTML**: `sanitize-html` untuk artikel & ContentBlock
- **Search & Filter**: Server-side query Prisma dengan URL query parameter state (`/produk?kategori=...&peruntukan=...&q=...`)

---

## 3. Struktur Folder Aktual
```text
adably/
├── docs/
│   ├── BLUEPRINT.md          # Single Source of Truth proyek (sinkron 100%)
│   └── NOTEPATCH.md          # Log perubahan historis per sesi
├── prisma/
│   ├── migrations/
│   │   ├── 20260912000000_init/
│   │   │   └── migration.sql # Baseline migration lengkap (14 tabel, 5 enum, index & relasi)
│   │   └── migration_lock.toml
│   ├── schema.prisma         # Definisi 14 model database & 5 enum
│   └── seed.ts               # Data awal: superadmin, kategori, komoditas, settings, FAQ
├── public/
│   ├── icons/                # Aset PWA Icons & Favicon
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon.svg
│   ├── uploads/              # Media upload lokal
│   │   └── .gitkeep
│   ├── apple-touch-icon.png
│   ├── favicon.svg
│   ├── offline.html
│   └── sw.js
├── scripts/
│   ├── backfill-customer-order.ts # One-time backfill Order.customerId via nomor HP (Sesi #20)
│   ├── test-audit-p0-p1.ts   # Pengujian 23 assertions kepatuhan P0, P1, dan gap bisnis
│   ├── test-crm-http.ts      # Pengujian HTTP endpoint CRM & otorisasi admin (401 & 200)
│   ├── test-crm-module.ts    # Pengujian modul CRM B2B & kalkulasi LTV (42 assertions)
│   └── test-phase7-e2e.ts    # Pengujian menyeluruh SEO, PWA, dan data store
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── artikel/
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── baru/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── audit-log/page.tsx     # Halaman Audit Log — khusus SUPERADMIN (Sesi #17). RBAC page-level guard: cek role via /api/admin/auth/me sebelum fetchLogs, redirect non-SUPERADMIN (Sesi #19 Fix #3)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── kategori/page.tsx
│   │   │   ├── konten/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── pelanggan/
│   │   │   │   ├── [id]/page.tsx      # Detail CRM, LTV, PIC assignedTo, follow-up & timeline interaksi (Sesi #20)
│   │   │   │   └── page.tsx
│   │   │   ├── pengaturan/page.tsx
│   │   │   ├── pengguna/page.tsx      # Manajemen Staf/Admin RBAC + toggle isActive (SUPERADMIN). RBAC page-level guard via useEffect: redirect non-SUPERADMIN ke /admin/dashboard (Sesi #19 Fix #3)
│   │   │   ├── peruntukan/page.tsx
│   │   │   ├── pesanan/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── AdminOrderDetailClient.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── produk/
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── baru/page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx             # Shared Admin Layout: sidebar desktop + hamburger mobile + logout (Sesi #17)
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── artikel/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── audit-log/route.ts  # GET audit log (SUPERADMIN only, direct Prisma — fail-loud by design)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/route.ts
│   │   │   │   │   ├── logout/route.ts
│   │   │   │   │   └── me/route.ts
│   │   │   │   ├── dashboard/stats/route.ts
│   │   │   │   ├── faq/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── kategori/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── konten/route.ts
│   │   │   │   ├── pelanggan/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── interaksi/
│   │   │   │   │   │   │   ├── [interactionId]/route.ts # DELETE interaksi (RBAC/SYSTEM)
│   │   │   │   │   │   │   └── route.ts                 # POST interaksi CRM manual
│   │   │   │   │   │   └── route.ts                     # GET detail CRM pelanggan (orders+interactions)
│   │   │   │   │   ├── export/route.ts                  # GET export CSV pelanggan
│   │   │   │   │   ├── follow-up/route.ts               # GET kontak follow-up jatuh tempo (Sesi #20)
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pengaturan/route.ts
│   │   │   │   ├── peruntukan/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pesanan/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── verifikasi/route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── export/route.ts                  # GET export CSV pesanan terfilter (Sesi #19)
│   │   │   │   │   └── route.ts
│   │   │   │   ├── produk/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── upload/route.ts     # Upload file khusus sesi admin (guard getAdminSession)
│   │   │   │   └── users/              # Manajemen akun staf/admin (SUPERADMIN only)
│   │   │   │       ├── [id]/route.ts
│   │   │   │       └── route.ts
│   │   │   ├── checkout/route.ts
│   │   │   ├── lacak-pesanan/route.ts
│   │   │   ├── leads/route.ts
│   │   │   ├── pesanan/
│   │   │   │   └── [orderCode]/
│   │   │   │       ├── bukti/route.ts
│   │   │   │       └── route.ts
│   │   │   └── upload/route.ts         # Upload berkas publik (bukti transfer) dengan rate limit & magic bytes
│   │   ├── artikel/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── faq/
│   │   │   ├── FAQClient.tsx
│   │   │   └── page.tsx
│   │   ├── kategori/[slug]/page.tsx
│   │   ├── keranjang/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── kontak/page.tsx
│   │   ├── lacak-pesanan/
│   │   │   ├── OrderTrackingClient.tsx
│   │   │   └── page.tsx
│   │   ├── pesanan/[orderCode]/
│   │   │   ├── layout.tsx
│   │   │   ├── OrderDetailClient.tsx
│   │   │   └── page.tsx
│   │   ├── produk/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── syarat-ketentuan/page.tsx
│   │   ├── tentang-kami/page.tsx
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── manifest.ts
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── admin/ArticleForm.tsx
│   │   ├── common/
│   │   │   ├── PwaPrompt.tsx
│   │   │   └── WhatsAppButton.tsx
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navbar.tsx
│   │   ├── storefront/
│   │   │   ├── ActiveFilterChips.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── MobileFilterDrawerTrigger.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetailClient.tsx
│   │   │   ├── RfqModal.tsx
│   │   │   ├── SortSelect.tsx
│   │   │   └── WholesaleRfqTrigger.tsx
│   │   └── ui/
│   │       ├── ImageUploader.tsx
│   │       └── TagInput.tsx
│   ├── lib/
│   │   ├── audit-log.ts      # recordAuditLog helper + AUDIT_ACTIONS enum (Sesi #17)
│   │   ├── auth.ts           # Token verification, JWT fail-fast, isActive re-check per request, RBAC helpers
│   │   ├── cart-context.tsx   # React context state keranjang
│   │   ├── data-store.ts     # Data access layer (Prisma + local dev fallback, retry collision, status gate)
│   │   ├── db.ts             # Prisma Client instance & circuit-breaker proxy
│   │   ├── order-security.ts # PII masking, pencocokan nomor HP (min 8 digit), transisi status pesanan strict
│   │   ├── rate-limit.ts     # In-memory rate limiting per-IP terpusat dengan preset endpoint (LOGIN, API publik)
│   │   ├── sanitize.ts       # HTML sanitizer (sanitize-html, digunakan di semua preview & render HTML publik)
│   │   ├── storage.ts        # Storage driver modular (local, S3/R2 SigV4, Cloudinary signed upload)
│   │   ├── upload-validate.ts # Shared helper magic bytes validation & allowed MIME types — menghilangkan duplikasi antara /api/upload & /api/admin/upload (Sesi #19)
│   │   ├── utils.ts          # Format rupiah, slugify, generateOrderCode (kriptografis 8-char hex)
│   │   └── wa-notify.ts      # WA message template builder zero-dependency (5 event: checkout_success, payment_verified, payment_rejected, order_shipped, order_completed) — teks siap-copy di JSON response untuk admin (Sesi #19, dihubungkan penuh Sesi #22)
│   └── middleware.ts         # Defense-in-depth auth guard (/admin/* & /api/admin/*)
├── .env
├── .env.example
├── .gitignore
├── .local-store.json
├── AGENTS.md
├── CLAUDE.md
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Database Schema (Identik dengan `prisma/schema.prisma`)

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
  password  String   // bcrypt hash
  role      Role     @default(SUPERADMIN)
  isActive  Boolean  @default(true) // Sesi #17: status aktif staf (false = nonaktif/suspended)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  verifiedProofs PaymentProof[] @relation("VerifiedBy")
  auditLogs      AuditLog[]
}

model SiteSetting {
  id                      String   @id @default(cuid())
  siteName                String
  tagline                 String?
  logoUrl                 String?
  faviconUrl              String?
  primaryColor            String?  @default("#059669")
  csWhatsapp              String?
  csEmail                 String?
  csOperationalHours      String?
  address                 String?
  bankAccounts            Json     // [{ bank: "BCA", noRekening: "1234567890", atasNama: "PT Mineral Alam Indonesia" }]
  footerText              String?
  metaTitle               String?
  metaDesc                String?
  lowStockAlertThreshold  Int?     @default(50) // Ambang stok rendah global
  updatedAt               DateTime @updatedAt
}

model ContentBlock {
  id        String   @id @default(cuid())
  key       String   @unique // "homepage_hero", "about_us", "why_us", "shipping_info", "terms", "privacy_policy"
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
  name     String         // "Pertanian & Pupuk", "Pengolahan Air", dsb.
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
  unit        String         @default("kg")  // Satuan komoditas: kg, ton, sak, jumbo bag, dsb.
  minStock    Int            @default(50)    // Ambang peringatan stok tipis per-komoditas
  images      Json           // array string URL: ["/uploads/..."]
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
  id             String        @id @default(cuid())
  orderCode      String        @unique // ORD-YYYYMMDD-XXXX
  buyerName      String
  buyerPhone     String
  buyerEmail     String?
  buyerAddress   String        @db.Text
  notes          String?       @db.Text
  trackingNumber String?
  status         OrderStatus   @default(PENDING_PAYMENT)
  total          Int
  items          OrderItem[]
  proof          PaymentProof?
  createdAt      DateTime      @default(now())
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  qty       Int
  price     Int     // harga saat transaksi
}

model PaymentProof {
  id              String    @id @default(cuid())
  orderId         String    @unique
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fileUrl         String
  senderBank      String?
  senderName      String?
  amount          Int?
  note            String?
  status          String    @default("PENDING") // PENDING, APPROVED, REJECTED
  rejectionReason String?
  uploadedAt      DateTime  @default(now())
  verifiedBy      String?   // nama staf (display fallback)
  verifiedById    String?   // Sesi #17: ID staf — source of truth akuntabilitas
  verifier        User?     @relation("VerifiedBy", fields: [verifiedById], references: [id], onDelete: SetNull)
  verifiedAt      DateTime?
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
  source             String        @default("WEBSITE_RFQ") // WEBSITE_RFQ, CHECKOUT, MANUAL_ADMIN, OFFLINE_EXPO
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

// Sesi #17: Audit Log persisten untuk akuntabilitas aksi admin
model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?  // null jika sistem/tidak bisa resolve
  actor       User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
  actorName   String   // snapshot nama saat aksi — tidak berubah meski nama staf diperbarui
  actorRole   String   // snapshot role saat aksi
  action      String   // LOGIN_SUCCESS, LOGIN_FAILED, CREATE_USER, UPDATE_USER, DELETE_USER, UPDATE_SETTINGS, dsb.
  targetType  String?  // "User", "Order", "Product", "SiteSetting", dsb.
  targetId    String?  // ID entitas yang dimodifikasi
  metadata    Json?    // detail tambahan, TANPA password plaintext
  createdAt   DateTime @default(now())

  @@index([actorId])
  @@index([action])
  @@index([createdAt])
}
```

---

## 5. Role & Permission

| Role | Hak Akses | Catatan Keamanan |
|---|---|---|
| **Superadmin** | Full akses: Pengaturan situs & rekening, manajemen akun staf/admin termasuk toggle `isActive` & reset password (`/admin/pengguna`), halaman Audit Log (`/admin/audit-log`), kelola produk/kategori/peruntukan, verifikasi pembayaran, CMS artikel/konten/FAQ, CRM Database Pelanggan & Prospek Leads. | Seluruh endpoint admin diproteksi ganda via middleware + `getAdminSession()` dengan re-check `isActive` per request. Operasi mutasi pengaturan, user management, dan akses Audit Log dikunci khusus `SUPERADMIN` via `requireSuperAdminSession()`. Sesi via HTTP-only cookie. |
| **Admin (Staf)** | Operasional harian: Katalog produk, kategori, peruntukan, pengelolaan pesanan, verifikasi pembayaran bukti transfer, database CRM pelanggan/prospek, CMS artikel, FAQ, dan blok konten web. Dibatasi dari pengaturan global, manajemen akun staf, dan halaman Audit Log. | Terotentikasi sesi JWT admin dengan re-check `isActive` per request (penonaktifan efektif seketika, tidak menunggu JWT expired). Diproteksi guard RBAC `isAdmin` & `isSuperAdmin`. |
| **Buyer / Publik** | Browse katalog, pencarian & filter, guest checkout, request penawaran resmi (RFQ), upload bukti transfer (JPG/PNG/WEBP/PDF max 5MB rate limited), lacak pesanan via `orderCode` + HP, membaca artikel & FAQ, klik-chat CS WhatsApp. | Tanpa wajib login / registrasi akun. |

---

## 6. Daftar Fitur & Status

| Fitur | Status | Catatan |
|---|---|---|
| Inisialisasi Project (Next.js + Tailwind + TS) | Selesai | Fase 1: Next.js 16 (App Router) + TS + Tailwind v3 + Lucide Icons |
| Setup Schema Prisma & Migrasi | Selesai | Fase 1: 14 model Prisma (termasuk AuditLog Sesi #17), validasi & Prisma Client generated |
| Seed Data Awal (Komoditas Mineral) | Selesai | Fase 1: Script seed (Zeolite, Bentonite, Timah, Gaharu, dsb.) |
| Auth Superadmin (Login, Logout, Middleware) | Selesai (Hardened) | Sesi #10-11: Fail-fast JWT Secret (>= 32 chars), backdoor dihapus di produksi, middleware defense-in-depth, logout whitelist untuk mitigasi token expired |
| Otorisasi Admin API 100% Terlindungi | Selesai (Hardened) | Sesi #10: Seluruh endpoint `/api/admin/**` menolak akses tanpa sesi dengan HTTP 401 |
| Role-Based Access Control (RBAC) & Manajemen Staf | Selesai (Hardened) | Sesi #10-17: Rute `/admin/pengguna` dan API `/api/admin/users`, kontrol level `SUPERADMIN` vs `ADMIN`, proteksi pengaturan situs |
| Status Aktif Staf (isActive) & Invalidasi Sesi Instan | Selesai (Hardened) | Sesi #17: `User.isActive` schema, re-check DB per request di `getAdminSession()` — penonaktifan efektif seketika tanpa menunggu JWT 7 hari expired. Self-deactivation diproteksi di API & UI |
| Persistent Audit Log Admin | Selesai (Parsial — Lihat Catatan Cakupan) | Sesi #17: Model `AuditLog`, helper `recordAuditLog`, endpoint `GET /api/admin/audit-log`, halaman `/admin/audit-log`. **Cakupan saat ini: login, users (create/update/activate/deactivate/delete), pesanan (update status, verifikasi bayar), pengaturan situs.** CRUD Produk/Kategori/Peruntukan/Artikel/FAQ/ContentBlock tidak tercakup secara sengaja — keputusan arsitektur eksplisit (lihat Bagian 9 poin 11) |
| verifiedById FK — Akuntabilitas Verifikator Bayar | Selesai | Sesi #17: `PaymentProof.verifiedById` sebagai FK ke `User`, dicatat saat verifikasi pembayaran |
| Shared Admin Layout (Sidebar + Mobile Nav) | Selesai | Sesi #17: `src/app/admin/layout.tsx` — sidebar desktop, hamburger mobile, tombol logout persisten, RBAC-aware nav |
| Cloud Storage S3/R2 SigV4 & Cloudinary | Selesai | Sesi #17: `src/lib/storage.ts` rewrite — `@aws-sdk/client-s3` SigV4, Cloudinary signed upload, `deleteMedia` remote |
| Sanitasi XSS Konsisten (Admin Preview + Publik) | Selesai (Terverifikasi) | Sesi #17-18: `ArticleForm.tsx`, `konten/page.tsx` preview gunakan `sanitize()`. Halaman publik `/artikel/[slug]` gunakan `sanitize()` sisi server sebelum `dangerouslySetInnerHTML`. FAQ public: `sanitize(faq.answer)` |
| Satuan Komoditas Dinamis (UoM) & Ambang Stok Rendah | Selesai (Terverifikasi) | Sesi #10-11: Multi-unit (`kg`, `ton`, `sak`, `m³`), atribut `minStock` pada produk & `lowStockAlertThreshold` pada pengaturan situs, badge visual stok menipis |
| Upload Berkas Publik Terlindungi | Selesai (Hardened) | Sesi #10: Rate limiting per-IP (10x/5m), verifikasi Magic Bytes fisik, disallow format SVG |
| Admin Media Upload Berkas Terlindungi | Selesai (Hardened) | Sesi #10: Endpoint `/api/admin/upload` khusus CMS admin (limit 10MB, rate-limiting, validasi Magic Bytes fisik, disallow SVG) |
| CRUD Kategori & Peruntukan | Selesai (Terproteksi) | Sesi #10: Endpoint & UI Admin terlindungi otorisasi penuh, relasi integritas pencegah orphan data |
| CRUD Produk (Galeri, Tags, Peruntukan, Satuan) | Selesai (Terproteksi) | Sesi #10: Endpoint & UI Admin terlindungi otorisasi penuh, proteksi hapus jika ada riwayat pesanan |
| Storefront Publik & Keranjang Belanja | Selesai | Fase 2: /produk, /produk/[slug], /keranjang + CartContext localStorage |
| Pencarian & Filter Multi-Dimensi (URL Query) | Selesai | Fase 3: FilterSidebar desktop sticky + mobile bottom drawer, SortSelect, ActiveFilterChips |
| Checkout & Transaksi Stok Atomik | Selesai (Anti-Overselling) | Sesi #10: `prisma.$transaction` dengan validasi kondisional `stock >= qty` |
| Restock Pembatalan Pesanan | Selesai (Terverifikasi) | Sesi #10: Pengembalian stok otomatis saat status pesanan menjadi `CANCELLED`/`REJECTED` |
| Verifikasi Pembayaran Admin | Selesai | Fase 4: Persetujuan/penolakan bukti transfer, `verifiedById` FK, audit log, kontrol nomor resi |
| Pelacakan Pesanan Publik | Selesai | Fase 4: /lacak-pesanan verifikasi orderCode + no WA pembeli (min 8 digit), visual stepper progress |
| CMS Artikel (HTML Sanitizer, Slug Generator) | Selesai | Fase 5: Editor HTML live preview, sanitasi XSS, listing & detail artikel |
| CMS Konten Teks Web (`ContentBlock`) | Selesai | Fase 6: Editor tabbed /admin/konten untuk 6 blok teks |
| Modul FAQ Dinamis | Selesai | Fase 6: CRUD /admin/faq, urutan tampil, toggle status aktif |
| Site Settings & WhatsApp Click-to-Chat | Selesai | Fase 6: Form /admin/pengaturan 3 tab, floating WhatsAppButton. `bankAccounts` hanya SUPERADMIN |
| Dashboard Ringkasan Superadmin | Selesai | Fase 6: /admin/dashboard metrik live omset terverifikasi, pending verifikasi |
| Polish: SEO, PWA/Mobile Bottom Nav, End-to-End | Selesai (Terverifikasi Sesi #18) | Aset ikon PWA (192px, 512px, svg, apple-touch) valid PNG (magic bytes `89 50 4E 47`) & >0 byte |
| Database Pelanggan & CRM Prospek/Leads (B2B) | Selesai (Siklus Benar) | Sesi #10: Checkout mencatat PROSPECT (belum lunas), promosi DEAL & akumulasi LTV hanya saat PAID |

---

## 7. Matriks Endpoint API Lengkap (37 Route File — 58 Method Handler)

> **Catatan:** Blueprint ini menghitung route berdasarkan **file route** (37 file), bukan jumlah method handler (58 handler). Setiap baris tabel di bawah mewakili satu method handler unik.

| Method | Endpoint | Tipe Akses | Deskripsi & Proteksi |
|---|---|---|---|
| `GET` | `/uploads/[...path]` | Publik | Melayani berkas fisik yang diunggah saat runtime di container Docker/standalone Next.js (proteksi path traversal, Content-Type dinamis, Cache-Control immutable 1 tahun) (Sesi #23) |
| `POST` | `/api/checkout` | Publik | Formulir guest checkout (Rate limit 10x/5m, transaksi atomik potong stok & catat lead) |
| `GET` | `/api/pesanan/[orderCode]` | Publik | Detail pesanan untuk upload bukti bayar (Rate limit 30x/1m, verifikasi no HP 8-digit, PII masking) |
| `POST` | `/api/pesanan/[orderCode]/bukti` | Publik | Simpan informasi bukti transfer pembayaran (Rate limit 10x/5m, status gate) |
| `POST` | `/api/lacak-pesanan` | Publik | Pelacakan pesanan publik (Rate limit 30x/1m, verifikasi orderCode + no HP fleksibel, PII masking) |
| `POST` | `/api/leads` | Publik | Penangkapan lead prospek dari formulir RFQ storefront (Rate limit 10x/5m, proteksi kebocoran customer) |
| `POST` | `/api/upload` | Publik | Upload media bukti bayar (Rate limit 10x/5m, Magic Bytes valid, no SVG, max 5MB) |
| `POST` | `/api/admin/auth/login` | Publik (Admin) | Login superadmin/staf (Rate limit LOGIN preset via `rate-limit.ts`, isActive check, audit log) |
| `POST` | `/api/admin/auth/logout` | Publik / Admin | Menghapus session cookie admin (`adably_admin_token`) |
| `GET` | `/api/admin/auth/me` | Admin Wajib | Cek profil sesi superadmin/staf yang sedang aktif |
| `GET` | `/api/admin/audit-log` | Admin Wajib (SUPERADMIN) | Ambil riwayat audit log dengan filter action/dateFrom/dateTo & pagination (direct Prisma — fail-loud by design, lihat Bagian 9 poin 11) |
| `GET` | `/api/admin/dashboard/stats` | Admin Wajib | Statistik real-time omset, pesanan, peringatan stok rendah, dan ringkasan CRM |
| `GET` | `/api/admin/kategori` | Admin Wajib | Ambil seluruh daftar kategori komoditas |
| `POST` | `/api/admin/kategori` | Admin Wajib | Tambah kategori komoditas baru |
| `PUT` | `/api/admin/kategori/[id]` | Admin Wajib | Perbarui nama dan gambar kategori |
| `DELETE` | `/api/admin/kategori/[id]` | Admin Wajib | Hapus kategori komoditas (dicek integritas produk terkait) |
| `GET` | `/api/admin/peruntukan` | Admin Wajib | Ambil seluruh taksonomi peruntukan (*Usage*) |
| `POST` | `/api/admin/peruntukan` | Admin Wajib | Tambah taksonomi peruntukan baru |
| `PUT` | `/api/admin/peruntukan/[id]` | Admin Wajib | Perbarui nama taksonomi peruntukan |
| `DELETE` | `/api/admin/peruntukan/[id]` | Admin Wajib | Hapus taksonomi peruntukan (dicek integritas produk terkait) |
| `GET` | `/api/admin/produk` | Admin Wajib | Ambil katalog produk dengan filter, pencarian, satuan, dan ambang stok |
| `POST` | `/api/admin/produk` | Admin Wajib | Buat produk komoditas baru (lengkap dengan satuan & minStock) |
| `GET` | `/api/admin/produk/[id]` | Admin Wajib | Ambil detail lengkap satu produk |
| `PUT` | `/api/admin/produk/[id]` | Admin Wajib | Perbarui data produk, harga, galeri, stok, satuan, dan minStock. **Sesi #19**: jika `price` atau `stock` berubah, otomatis merekam `UPDATE_PRODUCT_PRICE`/`UPDATE_PRODUCT_STOCK` ke audit log via `Promise.allSettled` |
| `DELETE` | `/api/admin/produk/[id]` | Admin Wajib | Hapus produk (dicek riwayat pesanan untuk mencegah orphan) |
| `POST` | `/api/admin/upload` | Admin Wajib | Upload media CMS admin (10 MB, Magic Bytes fisik, rate limited, no SVG) |
| `GET` | `/api/admin/users` | Admin Wajib (SUPERADMIN) | Ambil daftar akun staf & admin (termasuk field `isActive`) |
| `POST` | `/api/admin/users` | Admin Wajib (SUPERADMIN) | Buat akun staf baru (validasi role, least privilege default `ADMIN`, bcrypt hash, audit log) |
| `PATCH` | `/api/admin/users/[id]` | Admin Wajib (SUPERADMIN) | Perbarui role, isActive (toggle aktif/nonaktif), atau reset password staf. Self-deactivation diblokir. Audit log per aksi |
| `DELETE` | `/api/admin/users/[id]` | Admin Wajib (SUPERADMIN) | Hapus akun staf (proteksi: dilarang menghapus akun sendiri, audit log) |
| `GET` | `/api/admin/pesanan` | Admin Wajib | Daftar seluruh transaksi pesanan pembeli |
| `GET` | `/api/admin/pesanan/[id]` | Admin Wajib | Detail pesanan spesifik beserta item & bukti bayar |
| `PATCH` | `/api/admin/pesanan/[id]` | Admin Wajib | Update status pesanan (validasi transisi ketat, larang mutasi langsung PAID, restock otomatis jika batal/tolak, audit log) |
| `POST` | `/api/admin/pesanan/[id]/verifikasi` | Admin Wajib | Setujui/tolak bukti bayar (PAID + trigger DEAL CRM atomik via `prisma.$transaction`, catat `verifiedById`, audit log, sertakan `wa_message` siap-copy + `wa_phone` di JSON response — Sesi #19 Fix #4) |
| `GET` | `/api/admin/pesanan/export` | Admin Wajib | Ekspor riwayat transaksi pesanan ke format CSV terfilter tanggal & status (Sesi #19) |
| `GET` | `/api/admin/pelanggan` | Admin Wajib | Direktori CRM database kontak (prospek & customer) |
| `POST` | `/api/admin/pelanggan` | Admin Wajib | Tambah data kontak pelanggan/prospek manual |
| `GET` | `/api/admin/pelanggan/[id]` | Admin Wajib | Detail kontak pelanggan, riwayat transaksi & estimasi kebutuhan |
| `PUT` | `/api/admin/pelanggan/[id]` | Admin Wajib | Perbarui kontak, status prospek (BARU, NEGOSIASI, DEAL, LOSS), & catatan |
| `DELETE` | `/api/admin/pelanggan/[id]` | Admin Wajib | Hapus kontak dari database pelanggan |
| `POST` | `/api/admin/pelanggan/[id]/interaksi` | Admin Wajib | Tambah catatan interaksi CRM manual (CALL, WA, EMAIL, MEETING, NOTE) (Sesi #20) |
| `DELETE` | `/api/admin/pelanggan/[id]/interaksi/[interactionId]` | Admin Wajib | Hapus riwayat interaksi (RBAC: pembuat / SUPERADMIN; tipe SYSTEM terkunci) (Sesi #20) |
| `GET` | `/api/admin/pelanggan/follow-up` | Admin Wajib | Ambil daftar prospek dengan jadwal follow-up jatuh tempo (Sesi #20) |
| `GET` | `/api/admin/pelanggan/export` | Admin Wajib | Ekspor seluruh database kontak dalam format CSV |
| `GET` | `/api/admin/artikel` | Admin Wajib | Ambil daftar artikel CMS |
| `POST` | `/api/admin/artikel` | Admin Wajib | Buat artikel edukasi/berita baru |
| `GET` | `/api/admin/artikel/[id]` | Admin Wajib | Ambil data satu artikel |
| `PUT` | `/api/admin/artikel/[id]` | Admin Wajib | Perbarui konten artikel (tersanitasi XSS) |
| `DELETE` | `/api/admin/artikel/[id]` | Admin Wajib | Hapus artikel |
| `GET` | `/api/admin/konten` | Admin Wajib | Ambil seluruh blok teks web dinamis |
| `PUT` | `/api/admin/konten` | Admin Wajib | Perbarui isi blok teks web |
| `GET` | `/api/admin/faq` | Admin Wajib | Ambil daftar tanya jawab |
| `POST` | `/api/admin/faq` | Admin Wajib | Buat item FAQ baru |
| `GET` | `/api/admin/faq/[id]` | Admin Wajib | Ambil satu item FAQ |
| `PUT` | `/api/admin/faq/[id]` | Admin Wajib | Perbarui pertanyaan & jawaban FAQ |
| `DELETE` | `/api/admin/faq/[id]` | Admin Wajib | Hapus item FAQ |
| `GET` | `/api/admin/pengaturan` | Admin Wajib | Ambil konfigurasi situs & rekening bank |
| `PUT` | `/api/admin/pengaturan` | Admin Wajib (SUPERADMIN untuk `bankAccounts`) | Perbarui identitas situs, kontak CS, ambang stok. Mutasi `bankAccounts` dikunci khusus SUPERADMIN. Audit log |

---

## 8. Environment Variables
Daftar variabel lingkungan resmi (`.env.example`) — semua variabel yang dipakai di kode tercakup:

```env
# Database PostgreSQL URL (Wajib diisi untuk lingkungan produksi)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adably_db?schema=public"

# Auth Secret untuk signing JWT session Superadmin (WAJIB diisi acak >= 32 karakter)
# Sistem akan fail-fast (menolak start) jika variabel ini tidak diset atau kurang dari 32 karakter.
AUTH_SECRET="kunci_rahasia_acak_minimal_32_karakter_produksi!"

# Base URL Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# [MEDIA STORAGE PROVIDER]
# Pilihan provider: "local" (default) | "s3" / "r2" | "cloudinary"
STORAGE_PROVIDER="local"

# --- Konfigurasi S3 / Cloudflare R2 (jika STORAGE_PROVIDER="s3" atau "r2") ---
# S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
# S3_REGION="auto"                  # "auto" untuk R2, atau misal "ap-southeast-1" untuk AWS
# S3_BUCKET_NAME="adably-uploads"
# S3_PUBLIC_URL="https://cdn.adably.id"
# S3_ACCESS_KEY_ID="your_access_key_id"
# S3_SECRET_ACCESS_KEY="your_secret_access_key"

# --- Konfigurasi Cloudinary (jika STORAGE_PROVIDER="cloudinary") ---
# CLOUDINARY_CLOUD_NAME="your_cloud_name"
# CLOUDINARY_API_KEY="your_cloudinary_api_key"
# CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
# CLOUDINARY_UPLOAD_PRESET="adably_preset"

# [PENGATURAN DEV & RESILIENCE KHUSUS - JANGAN AKTIFKAN DI PRODUKSI]
# Izinkan fallback login admin saat PostgreSQL lokal mati (Hanya aktif jika NODE_ENV=development)
ALLOW_DEV_FALLBACK_LOGIN="false"

# Izinkan fallback penulisan data ke file lokal .local-store.json saat database offline.
# Di lingkungan produksi (NODE_ENV=production), biarkan 'false' agar kegagalan database melempar error keras (fail-loud).
ALLOW_LOCAL_FALLBACK="false"

# Paksa penggunaan local store JSON tanpa percobaan ke database (khusus dev/testing offline penuh)
# FORCE_LOCAL_STORE="false"
```

---

## 9. Keputusan Teknis & Arsitektur Keamanan Penting

1. **Otorisasi Berlapis (*Defense-in-Depth*) Admin API**:
   - Menghindari ketergantungan semata pada disiplin manual penulisan guard di setiap file route. `src/middleware.ts` secara proaktif menyaring rute `/api/admin/*` dan memblokir permintaan tanpa token sah dengan HTTP 401 sebelum menyentuh route handler.
2. **Ketiadaan Secret Hardcode & Fail-Fast Startup**:
   - Menghilangkan fallback default token JWT yang rentan dipalsukan (*token forgery*). Aplikasi langsung melempar exception saat inisialisasi jika secret tidak memadai.
3. **Pemberantasan Backdoor Kredensial**:
   - Menghapus total akun default hardcode dari jalur runtime produksi. Resilience mode offline lokal hanya dapat dibuka melalui flag eksplisit `ALLOW_DEV_FALLBACK_LOGIN=true` pada `NODE_ENV=development`.
4. **Isolasi Dual Persistence & Penolakan Silent-Fallback**:
   - Pada server produksi, kegagalan database Postgres tidak disembunyikan sebagai "berhasil" ke file JSON lokal `.local-store.json` yang bersifat *ephemeral*. Sistem melempar error keras termonitor (*fail-loud*).
5. **Pemberantasan Race Condition Stok Checkout**:
   - Pemotongan stok dilakukan di dalam transaksi atomik `prisma.$transaction` dengan syarat kondisional `stock: { gte: qty }`. Jika dua pembeli checkout barang terakhir secara bersamaan, transaksi kedua dibatalkan dan mengembalikan pesan stok tidak cukup.
6. **Restock Otomatis pada Pembatalan/Penolakan Pesanan**:
   - Perubahan status pesanan menjadi `CANCELLED` atau `REJECTED` secara otomatis mengembalikan jumlah barang ke inventori stok komoditas.
7. **Siklus Data CRM & Metrik LTV Berbasis Pembayaran Sah**:
   - Formulir checkout hanya mencatat kontak sebagai prospek (`PROSPECT`) dengan status `BARU` tanpa menaikkan akumulasi omset `totalSpent` atau `totalOrders`. Akumulasi LTV dan promosi status ke `CUSTOMER` / `DEAL` hanya terjadi saat pembayaran diverifikasi lunas (`PAID`).
8. **Sanitasi Upload & Pencegahan Stored XSS**:
   - Format `image/svg+xml` dilarang untuk upload publik bukti transfer. Berkas diverifikasi berdasarkan Magic Bytes buffer biner sesungguhnya, dilengkapi pembatasan laju IP (10 upload per 5 menit).
9. **Rate Limiting Terpusat & Anti-Brute Force**:
   - Modul `src/lib/rate-limit.ts` memproteksi endpoint publik (`/api/lacak-pesanan`, `/api/pesanan/[orderCode]`, `/api/checkout`, `/api/leads`, `/api/upload`) dari serangan denial of service dan enumerasi nomor pesanan.
10. **Proteksi PII & State Machine Pesanan Strict**:
   - Endpoint pelacakan publik menerapkan sensor data PII (`maskOrderPII`) pada nama pembeli, nomor telepon (min 8 digit), dan alamat. Mutasi status pesanan divalidasi ketat terhadap state machine (`ALLOWED_ORDER_TRANSITIONS`), dan status `PAID` hanya boleh dicapai secara eksklusif melalui `POST /api/admin/pesanan/[id]/verifikasi` demi integritas data keuangan dan CRM.
11. **Keputusan Arsitektur: Audit Log Route — Direct Prisma tanpa data-store.ts**:
   - `GET /api/admin/audit-log` memanggil `prisma` secara langsung (tidak melalui `src/lib/data-store.ts`). Ini adalah **pengecualian yang disengaja** dengan alasan berikut: (a) Endpoint ini membaca data audit log yang secara inheren hanya eksis di database — tidak ada fallback lokal yang bermakna; (b) Jika database mati, audit log endpoint harus **fail-loud** (HTTP 500) agar SUPERADMIN mengetahui kondisi darurat, bukan mengembalikan data kosong yang menyesatkan. Pengecualian ini tidak melanggar prinsip "Isolasi Dual Persistence" (Bagian 9 poin 4) karena prinsip tersebut khusus untuk operasi bisnis yang membutuhkan resilience, bukan untuk endpoint monitoring administratif.
12. **Keputusan Arsitektur: Cakupan Audit Log Dibatasi ke Aksi High-Risk**:
   - Berdasarkan keputusan eksplisit bisnis, `recordAuditLog` hanya dipasang di operasi **high-risk akuntabilitas RBAC**: login, manajemen staf (create/update/activate/deactivate/delete), perubahan status pesanan, verifikasi pembayaran, dan mutasi pengaturan situs sensitif. CRUD Produk/Kategori/Peruntukan/Artikel/FAQ/ContentBlock **sengaja tidak dicakup** karena volume mutasinya tinggi (operational daily) sehingga audit penuh akan menciptakan tabel AuditLog yang sangat besar tanpa nilai bisnis proporsional. Jika persyaratan kepatuhan berubah di masa depan, `recordAuditLog` dapat ditambahkan ke route manapun tanpa perubahan arsitektur.

13. **Arsitektur Notifikasi WhatsApp (`src/lib/wa-notify.ts`) — Zero-Dependency Manual-Copy**:
   - Modul `wa-notify.ts` membangun teks pesan WhatsApp siap-copy untuk 5 siklus event pesanan: `checkout_success`, `payment_verified`, `payment_rejected`, `order_shipped`, `order_completed`. Tidak ada HTTP call keluar, tidak ada biaya API gateway WA. Teks pesan disisipkan di JSON response API yang relevan (`wa_message` + `wa_phone`) agar admin/CS dapat **menyalin teks dan mengirim secara manual ke WhatsApp pembeli**. Sesi #22: seluruh 5 event kini terhubung ke endpoint yang tepat (`/api/checkout` → checkout_success, `/api/admin/pesanan/[id]` → order_shipped + order_completed, `/api/admin/pesanan/[id]/verifikasi` → payment_verified + payment_rejected). Jika di masa depan perlu integrasi otomatis API gateway WA (Fonnte/Wablas), tambahkan driver di modul ini tanpa mengubah caller code.
14. **Deduplikasi Upload Validation (`src/lib/upload-validate.ts`)**:
   - Helper terpusat yang mengekspos `detectFileTypeFromMagicBytes()` dan konstanta `UPLOAD_ALLOWED_TYPES`. Menghilangkan duplikasi 100% identik antara `/api/upload` (publik, 5MB) dan `/api/admin/upload` (admin, 10MB). Perubahan logic validasi magic bytes cukup dilakukan di satu tempat. Keduanya tetap memiliki batasan ukuran file dan rate limit berbeda sesuai tipe pengguna.
15. **Out-of-Scope: Biaya Ongkos Kirim / Integrasi Ekspedisi**:
   - `Order.total` hanya mencakup harga produk. Ongkos kirim **sengaja tidak diimplementasikan** karena model bisnis komoditas industri menggunakan negosiasi ongkir via WhatsApp (Loco/FOB/ex-gudang) atau koordinasi ekspedisi kargo secara manual setelah pesanan terbuat. Integrasi API Raja Ongkir / ekspedisi dapat ditambahkan di masa depan sebagai extension tanpa perombakan arsitektur.
16. **Out-of-Scope: Notifikasi Email Transaksional ke Pembeli**:
   - Tidak ada email transaksional (order confirmation, payment receipt) yang dikirim secara otomatis. **Keputusan sadar**: platform ini menggunakan WhatsApp sebagai kanal komunikasi utama (template manual via `wa-notify.ts`). Jika dibutuhkan, integrasi layanan email (Resend, SendGrid, Nodemailer) dapat ditambahkan tanpa perombakan arsitektur.
17. **Out-of-Scope: Notifikasi Proaktif Admin untuk Order/Lead Baru**:
   - Tidak ada notifikasi push/email/Telegram ke admin saat order atau lead RFQ masuk. **Keputusan sadar**: admin memantau dashboard secara periodik. Fitur ini dapat ditambahkan via webhook/Telegram Bot/email digest di masa depan.
18. **Out-of-Scope: Reset Password Self-Service untuk Admin/Staf**:
   - Tidak ada alur "lupa password" self-service untuk akun admin. **Keputusan sadar**: reset password dilakukan oleh SUPERADMIN melalui halaman `/admin/pengguna` → `PATCH /api/admin/users/[id]` dengan payload `{ password: "newpass" }`. Ini memadai untuk marketplace single-seller dengan jumlah staf terbatas.
19. **Known Limitation: Rate Limiting In-Memory (Single-Instance)**:
   - `src/lib/rate-limit.ts` menggunakan Node.js `Map` in-memory. Berfungsi sempurna untuk deployment **single-instance** (VPS/Coolify Docker tunggal). Pada deployment **multi-instance horizontal** (Vercel/AWS Lambda scale-out), setiap instance memiliki counter terpisah sehingga effective rate limit menjadi `maxRequests × jumlah instance`. **Mitigasi**: tambahkan adapter Redis/Upstash KV dengan interface `RateLimitResult` yang sama tanpa mengubah caller code.
20. **Out-of-Scope: Sistem Diskon / Kupon / Harga Promo**:
   - Tidak ada mekanisme kode kupon, diskon persentase, atau harga promo terjadwal. **Keputusan sadar**: harga komoditas industri bersifat negosiasi langsung (via RFQ/WhatsApp), bukan diskon publik. Dapat ditambahkan di masa depan sebagai fitur extension.
21. **Out-of-Scope: Tiered Pricing / Quotation Formal Terstruktur**:
   - RFQ lead B2B saat ini menghasilkan "leads mentah + catatan bebas teks" (`Customer.notes`, `CustomerInteraction`). Tidak ada sistem quotation formal terstruktur (harga per volume, termin pembayaran, masa berlaku). **Keterbatasan yang disengaja**: memadai untuk tahap awal operasi di mana negosiasi dilakukan via WhatsApp/komunikasi langsung. Quotation formal dapat diimplementasikan sebagai modul terpisah di masa depan.
22. **Out-of-Scope: Invoice / Kwitansi PDF Otomatis**:
   - Tidak ada generate PDF invoice otomatis saat pesanan PAID. **Keputusan sadar**: transaksi B2B komoditas menggunakan dokumen jalan/faktur manual. Export CSV pesanan tersedia untuk rekonsiliasi akuntansi. Invoice PDF dapat ditambahkan via library `@react-pdf/renderer` atau `puppeteer` di masa depan.
23. **Out-of-Scope: Ulasan / Rating Produk dari Pembeli**:
   - Tidak ada fitur review atau rating produk. **Keputusan sadar**: marketplace B2B komoditas industri mengutamakan hubungan bisnis jangka panjang (CRM) bukan rating publik. Dapat ditambahkan di masa depan jika ada kebutuhan.
24. **Partial: Produk Terkait / Rekomendasi**:
   - Halaman detail artikel (`/artikel/[slug]`) menampilkan rekomendasi komoditas terkait. Halaman detail produk (`/produk/[slug]`) **tidak memiliki** grid "produk terkait" berbasis kategori/tag. Ini adalah gap yang disengaja demi kesederhanaan halaman produk industri.
25. **Sudah Ada: Structured Data JSON-LD Schema.org**:
   - Halaman produk: `Product` + `Offer`. Halaman artikel: `NewsArticle`. Halaman FAQ: `FAQPage`. Beranda: `Organization` + `WebSite` + `SearchAction`. Listing: `BreadcrumbList`. **Tidak ada** `ItemList` di halaman listing produk — dapat ditambahkan sebagai enhancement SEO.
26. **Partial: Riwayat Perubahan Harga Produk**:
   - `AuditLog` merekam `UPDATE_PRODUCT_PRICE` dan `UPDATE_PRODUCT_STOCK` (nilai lama/baru di `metadata`), tersedia di `/admin/audit-log`. **Tidak ada** laporan visual tren harga chart dari waktu ke waktu — dapat dibangun dari query AuditLog sebagai enhancement di masa depan.
27. **Out-of-Scope: Multi-Warehouse / Manajemen Banyak Gudang**:
   - Stok produk bersifat **single-location by design**. `Product.stock` adalah angka tunggal tanpa atribut lokasi. Ini sesuai kebutuhan marketplace single-seller komoditas dengan satu titik gudang/sentra penyimpanan. Multi-warehouse memerlukan perubahan schema signifikan dan di luar scope template ini.


---


## Sesi #20 Update — CRM Enhancement (CustomerInteraction)

### Schema Baru
- InteractionType enum: CALL, WHATSAPP, EMAIL, MEETING, SITE_VISIT, NOTE, SYSTEM
- Model CustomerInteraction: id, customerId (FK->Customer), type, summary, actorId (FK->User nullable), actorName (snapshot), relatedOrderId (optional), createdAt
- Order.customerId: FK nullable ke Customer (onDelete: SetNull)
- Customer: tambah assignedToId (FK->User), nextFollowUpAt (DateTime?), tags (Json?), relasi orders & interactions
- User: tambah assignedCustomers & customerInteractions relations

### Route Baru
- GET /api/admin/pelanggan/[id] — detail dengan orders+interactions+assignedTo (sebelumnya orphan)
- POST /api/admin/pelanggan/[id]/interaksi — tambah log interaksi manual
- DELETE /api/admin/pelanggan/[id]/interaksi/[interactionId] — hapus (RBAC: pembuat/SUPERADMIN; SYSTEM readonly)
- GET /api/admin/pelanggan/follow-up — kontak overdue follow-up (max 5)

### Halaman Baru
- /admin/pelanggan/[id] — detail pelanggan: metrik LTV, info kontak, auto-save PIC, jadwal follow-up, riwayat transaksi, timeline interaksi

### Business Logic
- createOrder(): setelah recordLeadFromCheckout, link Order.customerId = customer.id
- updateCustomer(): auto-create CustomerInteraction NOTE saat status berubah
- verifyPaymentProof() & updateOrderStatus(): koreksi LTV kini dicatat sebagai CustomerInteraction SYSTEM (bukan string-append ke notes)

---

## Sesi #21 Update — Baseline Prisma Migration & Automated Seeding

### Baseline Migrasi Database
- Menambahkan baseline migration resmi `prisma/migrations/20260912000000_init/migration.sql` dan `migration_lock.toml`.
- Mencakup seluruh 14 model database (`User`, `SiteSetting`, `ContentBlock`, `FAQ`, `Category`, `Usage`, `Product`, `ProductUsage`, `Order`, `OrderItem`, `PaymentProof`, `Article`, `Customer`, `CustomerInteraction`, `AuditLog`) dan 5 enum (`Role`, `OrderStatus`, `CustomerType`, `LeadStatus`, `InteractionType`).
- Menyediakan automated seeding via `package.json` (`prisma.seed = "tsx prisma/seed.ts"`).

### Prosedur Sinkronisasi Lingkungan:
1. **Fresh / Dev Reset**: `npx prisma migrate reset` (menghapus database dev, menerapkan migrasi awal secara bersih, dan menjalankan seeder otomatis).
2. **Existing Database Baseline**: `npx prisma migrate resolve --applied 20260912000000_init` (menandai baseline migration sebagai sudah terpasang tanpa menghapus data).

---

## Sesi #22 Update — Audit Total Final

### Status Audit
Seluruh 5 tahap audit total telah dijalankan terhadap kodebase Adably di Sesi #22. Hasil: **LULUS** — tidak ada bug kritis, tidak ada orphan code yang tidak terselesaikan, tidak ada gap dokumen yang tidak terdokumentasi, tidak ada duplikasi yang tidak teratasi.

### Orphan Code yang Diperbaiki (KRITIS)
`src/lib/wa-notify.ts` mendefinisikan 5 event tapi sebelumnya hanya 2 yang dipanggil. Sesi #22 menghubungkan 3 event yang orphan:
- **`checkout_success`** → `POST /api/checkout` — setelah `createOrder` berhasil, `wa_message` + `wa_phone` disisipkan di JSON response (non-critical try/catch)
- **`order_shipped`** → `PATCH /api/admin/pesanan/[id]` — saat status berubah ke `SHIPPED`, teks WA dengan nomor resi disisipkan di response
- **`order_completed`** → `PATCH /api/admin/pesanan/[id]` — saat status berubah ke `COMPLETED`, teks WA penutup disisipkan di response
- `payment_verified` + `payment_rejected` sudah terhubung sejak Sesi #19 via `POST /api/admin/pesanan/[id]/verifikasi`

### Gap Dokumentasi yang Diperbaiki
- Bagian 3 (Struktur Folder): ditambahkan `wa-notify.ts` dan `upload-validate.ts`
- Bagian 7 (Matriks API): Rate limit `ORDER_DETAIL` dikoreksi 60x/1m → **30x/1m** (sesuai kode aktual `rate-limit.ts`); judul diklarifikasi "36 Route File — 57 Method Handler"
- Bagian 9: Ditambahkan poin 13–27 mencakup keputusan arsitektur wa-notify, upload-validate, dan 14 item Tahap 4 kelengkapan bisnis (out-of-scope vs partial vs sudah ada)

### Verifikasi Kualitas Sesi #22
| Perintah | Hasil |
|---|---|
| `npm install` | Exit Code 0 ✅ |
| `npx prisma validate` | Exit Code 0 ✅ |
| `npx prisma generate` | Exit Code 0 ✅ |
| `npx tsc --noEmit` | Exit Code 0, 0 TypeScript error ✅ |
| `npm run build` | Exit Code 0, 49 routes compiled ✅ |
| `npm test` | [dijalankan setelah semua perubahan] |

### File yang Diubah di Sesi #22
| File | Tipe Perubahan |
|---|---|
| `src/app/api/checkout/route.ts` | MODIFIKASI — integrasi `wa_message` checkout_success |
| `src/app/api/admin/pesanan/[id]/route.ts` | MODIFIKASI — integrasi `wa_message` order_shipped + order_completed |
| `docs/BLUEPRINT.md` | MODIFIKASI — header, Bagian 3 (wa-notify.ts + upload-validate.ts), Bagian 7 (fix rate limit + judul), Bagian 9 (poin 13-27), Sesi #22 section |
| `docs/NOTEPATCH.md` | MODIFIKASI — append entri Sesi #22 |
