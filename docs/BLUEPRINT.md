# BLUEPRINT — Web Marketplace Single-Seller + CMS Artikel + Template Reusable
Terakhir diupdate: 2026-09-18 (Sesi #36 — Audit Total Final & Remediasi Komprehensif)

---

## 1. Overview
Website marketplace **single-seller** yang dirancang untuk satu penjual/pemilik web (Superadmin). Fitur utama mencakup:
- Katalog produk komoditas/barang dengan taksonomi multi-dimensi (Kategori utama, Peruntukan/Usage terkontrol, dan Hashtags/Tags bebas).
- Guest checkout cepat tanpa wajib registrasi akun, validasi stok sisi server realtime (`/api/validate-cart`), MOQ & increment step kuantitas.
- Pelacakan status pesanan real-time via `orderCode` unik + nomor HP/WA pembeli.
- Pembayaran transfer manual bank dan QRIS dinamis (`type: 'BANK' | 'QRIS'`) dengan modal instruksi pembayaran, upload bukti transfer terproteksi magic bytes, toleransi selisih nominal, dan verifikasi faktur resmi.
- Mini-CRM B2B terintegrasi: penangkapan leads RFQ publik, manajemen direktori prospek & pelanggan, riwayat nilai transaksi (LTV), timeline interaksi pelanggan, dan ekspor CSV aman dari formula injection.
- Formulir Penawaran Jual Komoditas (`/jual`) untuk akuisisi mitra/supplier tambang baru dengan sinkronisasi CRM prospek.
- Generator Dokumen Resmi: Katalog Penawaran PDF dan Faktur Komersial / Proforma Invoice B2B PDF (`@react-pdf/renderer`).
- CMS Artikel berbasis HTML terintegrasi dengan sanitasi XSS yang ketat.
- CMS Teks Web (`ContentBlock`) untuk mengelola headline hero, tentang kami, syarat & ketentuan, dsb.
- Modul FAQ interaktif dengan kontrol urutan dan status aktif.
- Site Settings & CS WhatsApp terintegrasi (tombol chat mengambang dengan template pesan otomatis).
- Desain arsitektur **config-driven / 100% whitelabel starter template** dengan 0 hardcoded brand literals di `src/`, siap di-deploy ulang untuk unit bisnis/proyek berikutnya hanya dengan mengganti variabel lingkungan dan database setting.
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
│   ├── schema.prisma         # Definisi 15 model database & 6 enum (SellOffer ditambah Sesi #21)
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
│   ├── backfill-order-grandtotal.ts # Backfill grandTotal & financial fields pesanan lama (Sesi #36)
│   ├── purge-audit-log.ts        # CLI pembersihan audit log sesuai retensi hari (Sesi #36)
│   ├── test-audit-p0-p1.ts       # Pengujian 23 assertions kepatuhan P0, P1, dan gap bisnis
│   ├── test-crm-http.ts          # Pengujian HTTP endpoint CRM & otorisasi admin (401 & 200)
│   ├── test-crm-module.ts        # Pengujian modul CRM B2B & kalkulasi LTV (42 assertions)
│   ├── test-csv-injection.ts     # Pengujian mitigasi formula injection CSV
│   ├── test-order-state-machine.ts # Pengujian 23 skenario transisi state machine pesanan
│   ├── test-phase7-e2e.ts        # Pengujian menyeluruh SEO, PWA, dan data store
│   ├── test-uom.ts               # Pengujian validasi UOM & konversi satuan
│   ├── verify-api-matrix.ts      # Verifikasi sinkronisasi 100% kode route ↔ BLUEPRINT §7
│   └── verify-env-docs.ts        # Verifikasi kelengkapan dokumentasi variabel lingkungan
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
│   │   │   ├── katalog-pdf/page.tsx   # Sesi #28: Generator & download PDF katalog produk B2B
│   │   │   ├── konten/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── pelanggan/
│   │   │   │   ├── [id]/page.tsx      # Detail CRM, LTV, PIC assignedTo, follow-up & timeline interaksi (Sesi #20)
│   │   │   │   └── page.tsx
│   │   │   ├── penawaran-jual/        # Sesi #21: Daftar penawaran jual dari supplier
│   │   │   │   ├── [id]/page.tsx      # Detail + update status penawaran
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
│   │   │   │   ├── katalog-pdf/
│   │   │   │   │   └── route.ts       # Sesi #28: GET streaming PDF katalog produk B2B
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
│   │   │   ├── health/route.ts         # Sesi #33: GET status kesehatan server & database circuit breaker
│   │   │   ├── jual/route.ts           # Sesi #21: POST publik — submit penawaran jual komoditas (rate limited 3/jam)
│   │   │   ├── lacak-pesanan/route.ts
│   │   │   ├── leads/route.ts
│   │   │   ├── pesanan/
│   │   │   │   └── [orderCode]/
│   │   │   │       ├── bukti/route.ts
│   │   │   │       ├── invoice/route.ts # Sesi #36: GET unduh invoice / proforma PDF B2B resmi
│   │   │   │       └── route.ts
│   │   │   ├── public/
│   │   │   │   └── settings/route.ts   # Sesi #36: GET pengaturan publik & metode pembayaran aktif
│   │   │   ├── upload/route.ts         # Upload berkas publik (bukti transfer) dengan rate limit & magic bytes
│   │   │   └── validate-cart/route.ts  # Sesi #36: POST validasi realtime keranjang belanja & MOQ B2B
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
│   │   ├── jual/
│   │   │   └── page.tsx               # Sesi #21: Form multi-step penawaran jual komoditas (publik)
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
│   │   ├── cart-context.tsx  # React context state keranjang dengan TTL & validasi realtime
│   │   ├── config.ts         # Konfigurasi aplikasi terpusat, cookie name, branding defaults (Sesi #36)
│   │   ├── csv.ts            # Builder CSV aman dari formula injection (=, +, -, @) (Sesi #30)
│   │   ├── data-store.ts     # Data access layer (Prisma + local dev fallback, retry collision, status gate)
│   │   ├── db-errors.ts      # Klasifikasi error Prisma (CONSTRAINT, UNREACHABLE) (Sesi #33)
│   │   ├── db.ts             # Prisma Client instance & circuit-breaker proxy
│   │   ├── env.ts            # Validasi fail-fast variabel lingkungan (Sesi #33, #36)
│   │   ├── invoice-pdf.tsx   # Template invoice / proforma PDF resmi (@react-pdf/renderer) (Sesi #36)
│   │   ├── json-ld.ts        # Sanitizer aman JSON-LD anti-XSS injection (Sesi #36)
│   │   ├── order-security.ts # PII masking, pencocokan nomor HP (min 8 digit), transisi status pesanan strict
│   │   ├── order-total.ts    # Kalkulasi sentral grandTotal, subtotal, taxAmount, shippingCost (Sesi #36)
│   │   ├── pdf/
│   │   │   └── catalog-template.tsx # Sesi #28: Template dokumen PDF (@react-pdf/renderer)
│   │   ├── rate-limit.ts     # In-memory rate limiting per-IP terpusat dengan preset endpoint (LOGIN, API publik)
│   │   ├── sanitize.ts       # HTML sanitizer (sanitize-html, digunakan di semua preview & render HTML publik)
│   │   ├── storage.ts        # Storage driver modular (local, S3/R2 SigV4, Cloudinary signed upload, deleteMedia)
│   │   ├── uom.ts            # Helper unit of measure & konversi satuan (Sesi #33)
│   │   ├── upload-url.ts     # Validasi anti-SSRF untuk URL gambar/media eksternal (Sesi #33)
│   │   ├── upload-validate.ts # Shared helper magic bytes validation & allowed MIME types (Sesi #19)
│   │   ├── utils.ts          # Format rupiah, slugify, generateOrderCode (kriptografis 8-char hex)
│   │   └── wa-notify.ts      # WA message template builder zero-dependency siap-copy (Sesi #19, #22)
│   └── proxy.ts              # Defense-in-depth auth guard (/admin/* & /api/admin/*) konvensi resmi Next.js 16 (Sesi #26)
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

## 4. Database Schema (16 Model, 6 Enum — Identik 100% dengan `prisma/schema.prisma`)

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

// Status alur kerja pesanan (State Machine). Status REJECTED telah dihapus resmi di Sesi #33 (gunakan CANCELLED).
enum OrderStatus {
  PENDING_PAYMENT
  PENDING_VERIFICATION
  PAID
  PROCESSING
  SHIPPED
  COMPLETED
  CANCELLED
}

model User {
  id                 String   @id @default(cuid())
  name               String
  email              String   @unique
  password           String   // bcrypt hash
  role               Role     @default(SUPERADMIN)
  isActive           Boolean  @default(true)
  // P2-07: invalidasi sesi setelah reset password
  passwordChangedAt  DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  verifiedProofs       PaymentProof[]         @relation("VerifiedBy")
  auditLogs            AuditLog[]
  assignedCustomers    Customer[]             @relation("AssignedCustomers")
  customerInteractions CustomerInteraction[]
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
  lowStockAlertThreshold  Int?     @default(50)
  // P1-11: Konfigurasi finansial B2B
  paymentToleranceAmount  Int      @default(0)   // toleransi selisih pembayaran dalam rupiah
  defaultTaxRate          Int      @default(0)   // dalam basis poin: 1100 = 11%
  taxEnabled              Boolean  @default(false)
  shippingPolicy          String?                // deskripsi kebijakan ongkir
  // P2-12: Retensi audit log
  auditRetentionDays      Int      @default(365)
  updatedAt               DateTime @updatedAt
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
  unit        String         @default("kg")
  minStock    Int            @default(50)
  // P1-11: Minimum Order Quantity dan increment step
  minOrderQty  Int           @default(1)
  incrementQty Int           @default(1)
  images      Json
  tags        Json
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  usages      ProductUsage[]
  // P1-07: Opposite relation field wajib oleh Prisma
  orderItems  OrderItem[]
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())

  @@index([categoryId])
  @@index([isActive])
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
  orderCode      String        @unique
  buyerName      String
  buyerPhone     String
  buyerEmail     String?
  buyerAddress   String        @db.Text
  notes          String?       @db.Text  // Catatan pembeli — read-only setelah checkout
  // P1-06: Catatan internal admin (terpisah dari notes pembeli)
  adminNotes     String?       @db.Text
  trackingNumber String?
  status         OrderStatus   @default(PENDING_PAYMENT)
  // P1-11: Rincian finansial B2B
  subtotal       Int           @default(0)
  shippingCost   Int           @default(0)
  taxRate        Int           @default(0)  // basis poin
  taxAmount      Int           @default(0)
  discountAmount Int           @default(0)
  grandTotal     Int           @default(0)
  total          Int           // alias grandTotal untuk kompatibilitas mundur
  items          OrderItem[]
  proof          PaymentProof?
  customerId     String?
  customer       Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  createdAt      DateTime      @default(now())

  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  // P1-07: nullable agar produk yang dihapus tidak merusak riwayat (onDelete: SetNull)
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  qty       Int
  price     Int      // harga saat transaksi
  // P1-07: Snapshot data produk saat transaksi — immutable
  productName String  @default("")
  productSlug String?
  productUnit String  @default("kg")

  @@index([productId])
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
  status          String    @default("PENDING")
  rejectionReason String?
  uploadedAt      DateTime  @default(now())
  verifiedBy      String?
  verifiedById    String?
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

  @@index([isPublished])
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
  notes              String?       // Catatan bebas manual staf — bukan log kronologis
  totalOrders        Int           @default(0)
  totalSpent         Int           @default(0)
  lastContactAt      DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  assignedToId       String?
  assignedTo         User?         @relation("AssignedCustomers", fields: [assignedToId], references: [id], onDelete: SetNull)
  nextFollowUpAt     DateTime?
  tags               Json?
  orders             Order[]
  interactions       CustomerInteraction[]

  @@index([phone])
  @@index([type])
  @@index([status])
  @@index([assignedToId])
  @@index([nextFollowUpAt])
}

enum InteractionType {
  CALL
  WHATSAPP
  EMAIL
  MEETING
  SITE_VISIT
  NOTE
  SYSTEM
}

model CustomerInteraction {
  id             String          @id @default(cuid())
  customerId     String
  customer       Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type           InteractionType
  summary        String          @db.Text
  actorId        String?
  actor          User?           @relation(fields: [actorId], references: [id], onDelete: SetNull)
  actorName      String
  relatedOrderId String?
  createdAt      DateTime        @default(now())

  @@index([customerId])
  @@index([createdAt])
}

model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?
  actor       User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
  actorName   String
  actorRole   String
  action      String
  targetType  String?
  targetId    String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([actorId])
  @@index([action])
  @@index([createdAt])
}

enum SellOfferStatus {
  BARU
  DIHUBUNGI
  DIVERIFIKASI
  DITOLAK
}

model SellOffer {
  id              String          @id @default(cuid())
  name            String
  company         String?
  phone           String
  email           String?
  province        String?
  commodityName   String
  commoditySpec   String?         @db.Text
  estimatedVolume String?
  priceExpected   String?
  photoUrls       Json?
  status          SellOfferStatus @default(BARU)
  adminNotes      String?         @db.Text
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

---

## 5. Role & Permission

| Role | Hak Akses | Catatan Keamanan |
|---|---|---|
| **Superadmin** | Full akses: Pengaturan finansial situs (`bankAccounts`, `defaultTaxRate`, `taxEnabled`, `paymentToleranceAmount`, `auditRetentionDays`), manajemen akun staf/admin (`/admin/pengguna`), halaman Audit Log (`/admin/audit-log`), kelola produk/kategori/peruntukan, verifikasi pembayaran, CMS artikel/konten/FAQ, CRM Database Pelanggan & Prospek Leads. | Seluruh endpoint admin diproteksi ganda via proxy guard (`src/proxy.ts`) + `getAdminSession()` dengan re-check `isActive` per request. Mutasi pengaturan finansial sensitif, user management, dan akses Audit Log dikunci khusus `SUPERADMIN` via `requireSuperAdminSession()`. Sesi via HTTP-only cookie aman. |
| **Admin (Staf)** | Operasional harian: Katalog produk, kategori, peruntukan, pengelolaan pesanan, verifikasi pembayaran bukti transfer, database CRM pelanggan/prospek, penawaran jual supplier, CMS artikel, FAQ, dan blok konten web. Pada pengaturan toko, Admin dapat mengedit identitas brand umum dan kontak CS, namun dilarang memutasi rekening bank atau parameter finansial (HTTP 403). Dibatasi dari manajemen staf dan Audit Log. | Terotentikasi sesi JWT admin dengan re-check `isActive` per request (penonaktifan seketika). Diproteksi guard RBAC `isAdmin` & `isSuperAdmin`. Upaya mutasi field finansial di `/api/admin/pengaturan` ditolak dengan `403 Forbidden`. |
| **Buyer / Publik** | Browse katalog, pencarian & filter, guest checkout dengan validasi MOQ & realtime cart check, request penawaran resmi (RFQ), upload bukti transfer (JPG/PNG/WEBP/PDF max 5MB rate limited), unduh invoice/proforma PDF resmi, lacak pesanan via `orderCode` + HP, membaca artikel & FAQ, klik-chat CS WhatsApp, kirim penawaran jual komoditas (`/jual`). | Tanpa wajib login / registrasi akun. Seluruh endpoint publik dilindungi rate-limiting per-IP dan sanitasi input. |

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
| Shared Admin Layout (Sidebar + Mobile Nav) | Selesai | Sesi #17 & Sesi #24: `src/app/admin/layout.tsx` — sidebar desktop, fixed mobile header `h-14` + drawer slide-in, tombol logout persisten, RBAC-aware nav. Terisolasi total via `StorefrontShell` (elemen toko tidak bocor ke panel admin). Seluruh header halaman admin responsif `relative z-10 md:sticky md:top-0 md:z-30`. |
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
| Restock Pembatalan Pesanan | Selesai (Terverifikasi) | Sesi #10 & #33: Pengembalian stok otomatis saat status pesanan menjadi `CANCELLED` (status REJECTED dihapus permanen) |
| Verifikasi Pembayaran Admin | Selesai | Fase 4: Persetujuan/penolakan bukti transfer, `verifiedById` FK, audit log, kontrol nomor resi |
| Pelacakan Pesanan Publik | Selesai | Fase 4: /lacak-pesanan verifikasi orderCode + no WA pembeli (min 8 digit), visual stepper progress |
| CMS Artikel (HTML Sanitizer, Slug Generator) | Selesai | Fase 5: Editor HTML live preview, sanitasi XSS, listing & detail artikel |
| CMS Konten Teks Web (`ContentBlock`) | Selesai | Fase 6: Editor tabbed /admin/konten untuk 6 blok teks |
| Modul FAQ Dinamis | Selesai | Fase 6: CRUD /admin/faq, urutan tampil, toggle status aktif |
| Site Settings & WhatsApp Click-to-Chat | Selesai | Fase 6: Form /admin/pengaturan 3 tab, floating WhatsAppButton. `bankAccounts` hanya SUPERADMIN |
| Dashboard Ringkasan Superadmin | Selesai | Fase 6: /admin/dashboard metrik live omset terverifikasi, pending verifikasi |
| Polish: SEO, PWA/Mobile Bottom Nav, End-to-End | Selesai (Terverifikasi Sesi #18) | Aset ikon PWA (192px, 512px, svg, apple-touch) valid PNG (magic bytes `89 50 4E 47`) & >0 byte |
| Database Pelanggan & CRM Prospek/Leads (B2B) | Selesai (Siklus Benar) | Sesi #10: Checkout mencatat PROSPECT (belum lunas), promosi DEAL & akumulasi LTV hanya saat PAID |
| Penawaran Jual Komoditas (Supplier B2B) | Selesai | Sesi #21: Form publik /jual + manajemen admin /admin/penawaran-jual |
| Galeri Multi-Gambar & Touch Swipe PWA | Selesai | Sesi #27: ProductGallery Shopee-style dengan swipe & multi-upload |
| Generator PDF Katalog Produk & Sales Offer (B2B) | Selesai | Sesi #28: Halaman /admin/katalog-pdf & endpoint streaming /api/admin/katalog-pdf dengan @react-pdf/renderer. Filter kategori/peruntukan/search, toggle harga, & personalisasi nama/perusahaan pembeli |
| UX Transaksi B2B (KG ↔ TON, Input Angka, Layout Reposisi) & Multi-Page PDF Fix | Selesai | Sesi #32: Input kuantitas interaktif bisa diketik keyboard, fitur toggle KG ↔ TON dengan konversi harga & stok instan, reposisi layout blok transaksi di atas deskripsi produk, serta perbaikan multi-page PDF katalog via row-based paired chunking (wrap={false}) |
| Kalkulasi Finansial B2B & Snapshot OrderItem (P0-A, P0-B) | Selesai | Sesi #36: Centralized order calculation via `computeOrderTotals`, snapshot `grandTotal`, `subtotal`, `taxAmount`, `taxRate`, `shippingCost`. Snapshot `productName`, `productSlug`, `productUnit` tersimpan permanen di `OrderItem` |
| Whitelabel & Nol Hardcoded Brand (P2-B) | Selesai | Sesi #36: 0 literal brand hardcoded di `src/`. Seluruh nama brand, URL, dan slug berbasis config-driven runtime (`SiteSetting` & env vars) |
| Faktur Komersial & Proforma Invoice B2B PDF (ADD-01) | Selesai | Sesi #36: Endpoint `GET /api/pesanan/[orderCode]/invoice` & template `invoice-pdf.tsx` via `@react-pdf/renderer` |
| Negosiasi Ongkir Manual & Sinkronisasi Total (ADD-02) | Selesai | Sesi #36: Input `shippingCost` hasil negosiasi manual di admin detail pesanan otomatis menghitung ulang `grandTotal` |
| Notifikasi Badge Real-time Admin (ADD-03) | Selesai | Sesi #36: Badge realtime untuk penawaran jual baru (`newSellOffers`) dan pesanan menunggu tindakan (`pendingOrders`) di sidebar admin |
| Validasi Sisi Server Keranjang & MOQ (P1-A, P1-B) | Selesai | Sesi #36: Endpoint `/api/validate-cart` memeriksa ketersediaan stok, MOQ (`minOrderQty`), dan kelipatan (`incrementQty`) sisi server |
| Endpoint Pemeriksaan Kesehatan & Circuit Breaker | Selesai | Sesi #33: Endpoint `GET /api/health` memeriksa status konektivitas database dan kesiapan server |
| Pembersihan Media Otomatis / Anti-Orphan (P2-E) | Selesai | Sesi #36: Penghapusan produk, artikel, dan kategori otomatis memicu `deleteMedia` di storage driver |
| CSV Export Aman Anti-Formula Injection | Selesai | Sesi #30: Utilitas `buildCsv` mengamankan karakter berbahaya (`=`, `+`, `-`, `@`) pada seluruh ekspor data CSV |
| Retensi & Purge Audit Log CLI (P1-C) | Selesai | Sesi #36: Script `purge-audit-log.ts` dengan flag `--dry-run` dan `--apply` sesuai setting `auditRetentionDays` |
| Sanitasi Skema JSON-LD Anti-XSS (P1-N) | Selesai | Sesi #36: Utilitas `safeJsonLd()` mengamankan seluruh 11 titik injeksi structured data dari bahaya Stored XSS |

---

## 7. Matriks Endpoint API Lengkap (44 Route File — 67 Method Handler)

> **Catatan:** Blueprint ini mencakup seluruh **44 file route** dan **67 method handler** aktual di aplikasi. Setiap baris tabel di bawah mewakili satu method handler unik yang terverifikasi secara otomatis oleh `scripts/verify-api-matrix.ts`.

| Method | Endpoint | Tipe Akses | Deskripsi & Proteksi |
|---|---|---|---|
| `GET` | `/uploads/[...path]` | Publik | Melayani berkas fisik yang diunggah saat runtime di container Docker/standalone Next.js (proteksi path traversal, Content-Type dinamis, Cache-Control immutable 1 tahun) (Sesi #23) |
| `GET` | `/api/health` | Publik | Endpoint pemeriksaan status kesehatan sistem dan konektivitas database (Sesi #33) |
| `GET` | `/api/public/settings` | Publik | Mengambil konfigurasi toko publik dan daftar metode transfer/QRIS aktif tanpa membocorkan rekening (Sesi #36) |
| `POST` | `/api/validate-cart` | Publik | Validasi realtime harga, stok, kuantitas minimum (MOQ), dan kelipatan kuantitas keranjang belanja (Sesi #36) |
| `POST` | `/api/checkout` | Publik | Formulir guest checkout (Rate limit 10x/5m, transaksi atomik potong stok & catat lead) |
| `GET` | `/api/pesanan/[orderCode]` | Publik | Detail pesanan untuk upload bukti bayar (Rate limit 30x/1m, verifikasi no HP 8-digit, PII masking) |
| `GET` | `/api/pesanan/[orderCode]/invoice` | Publik | Unduh faktur komersial / proforma invoice resmi B2B dalam format PDF (Sesi #36) |
| `POST` | `/api/pesanan/[orderCode]/bukti` | Publik | Simpan informasi bukti transfer pembayaran (Rate limit 10x/5m, status gate) |
| `POST` | `/api/lacak-pesanan` | Publik | Pelacakan pesanan publik (Rate limit 30x/1m, verifikasi orderCode + no HP fleksibel, PII masking) |
| `POST` | `/api/leads` | Publik | Penangkapan lead prospek dari formulir RFQ storefront (Rate limit 10x/5m, proteksi kebocoran customer) |
| `POST` | `/api/upload` | Publik | Upload media bukti bayar (Rate limit 10x/5m, Magic Bytes valid, no SVG, max 5MB) |
| `POST` | `/api/admin/auth/login` | Publik (Admin) | Login superadmin/staf (Rate limit LOGIN preset via `rate-limit.ts`, isActive check, audit log) |
| `POST` | `/api/admin/auth/logout` | Publik / Admin | Menghapus session cookie admin (`getAdminCookieName()` via `config.ts`) |
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
| `POST` | `/api/jual` | **Publik** (rate limit 3/jam/IP) | Submit form penawaran jual komoditas dari supplier; simpan ke `SellOffer`, generate teks notif WA ke CS (Sesi #21) |
| `GET` | `/api/admin/penawaran-jual` | Admin Wajib | Daftar penawaran jual masuk, filter by status, paginasi (Sesi #21) |
| `GET` | `/api/admin/penawaran-jual/[id]` | Admin Wajib | Detail satu penawaran jual (Sesi #21) |
| `PATCH` | `/api/admin/penawaran-jual/[id]` | Admin Wajib | Update status (`BARU`→`DIHUBUNGI`→`DIVERIFIKASI`\|`DITOLAK`) & catatan admin (Sesi #21) |
| `GET` | `/api/admin/katalog-pdf` | Admin Wajib | Stream berkas PDF katalog produk komoditas terfilter dengan personalisasi buyer & opsi sembunyikan harga (Sesi #28) |

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
   - Menghindari ketergantungan semata pada disiplin manual penulisan guard di setiap file route. `src/proxy.ts` (konvensi resmi Next.js 16) secara proaktif menyaring rute `/admin/*` dan `/api/admin/*` dan memblokir permintaan tanpa token sah dengan HTTP 401 sebelum menyentuh route handler.
2. **Ketiadaan Secret Hardcode & Fail-Fast Startup**:
   - Menghilangkan fallback default token JWT yang rentan dipalsukan (*token forgery*). Aplikasi langsung melempar exception saat inisialisasi jika secret tidak memadai.
3. **Pemberantasan Backdoor Kredensial**:
   - Menghapus total akun default hardcode dari jalur runtime produksi. Resilience mode offline lokal hanya dapat dibuka melalui flag eksplisit `ALLOW_DEV_FALLBACK_LOGIN=true` pada `NODE_ENV=development`.
4. **Isolasi Dual Persistence & Penolakan Silent-Fallback**:
   - Pada server produksi, kegagalan database Postgres tidak disembunyikan sebagai "berhasil" ke file JSON lokal `.local-store.json` yang bersifat *ephemeral*. Sistem melempar error keras termonitor (*fail-loud*).
5. **Pemberantasan Race Condition Stok Checkout**:
   - Pemotongan stok dilakukan di dalam transaksi atomik `prisma.$transaction` dengan syarat kondisional `stock: { gte: qty }`. Jika dua pembeli checkout barang terakhir secara bersamaan, transaksi kedua dibatalkan dan mengembalikan pesan stok tidak cukup.
6. **Restock Otomatis pada Pembatalan Pesanan**:
   - Perubahan status pesanan menjadi `CANCELLED` secara otomatis mengembalikan jumlah barang ke inventori stok komoditas (status `REJECTED` telah dihapus resmi dari skema).
7. **Siklus Data CRM & Metrik LTV Berbasis Pembayaran Sah**:
   - Formulir checkout hanya mencatat kontak sebagai prospek (`PROSPECT`) dengan status `BARU` tanpa menaikkan akumulasi omset `totalSpent` atau `totalOrders`. Akumulasi LTV dan promosi status ke `CUSTOMER` / `DEAL` hanya terjadi saat pembayaran diverifikasi lunas (`PAID`).
8. **Sanitasi Upload & Pencegahan Stored XSS**:
   - Format `image/svg+xml` dilarang untuk upload publik bukti transfer. Berkas diverifikasi berdasarkan Magic Bytes buffer biner sesungguhnya, dilengkapi pembatasan laju IP (10 upload per 5 menit).
9. **Rate Limiting Terpusat & Anti-Brute Force**:
   - Modul `src/lib/rate-limit.ts` memproteksi endpoint publik (`/api/lacak-pesanan`, `/api/pesanan/[orderCode]`, `/api/checkout`, `/api/leads`, `/api/upload`, `/api/validate-cart`) dari serangan denial of service dan enumerasi nomor pesanan.
10. **Proteksi PII & State Machine Pesanan Strict**:
    - Endpoint pelacakan publik menerapkan sensor data PII (`maskOrderPII`) pada nama pembeli, nomor telepon (min 8 digit), dan alamat. Mutasi status pesanan divalidasi ketat terhadap state machine (`ALLOWED_ORDER_TRANSITIONS`), dan status `PAID` hanya boleh dicapai secara eksklusif melalui `POST /api/admin/pesanan/[id]/verifikasi` demi integritas data keuangan dan CRM.
11. **Keputusan Arsitektur: Audit Log Route — Direct Prisma tanpa data-store.ts**:
    - `GET /api/admin/audit-log` memanggil `prisma` secara langsung (tidak melalui `src/lib/data-store.ts`). Ini adalah **pengecualian yang disengaja** dengan alasan berikut: (a) Endpoint ini membaca data audit log yang secara inheren hanya eksis di database — tidak ada fallback lokal yang bermakna; (b) Jika database mati, audit log endpoint harus **fail-loud** (HTTP 500) agar SUPERADMIN mengetahui kondisi darurat, bukan mengembalikan data kosong yang menyesatkan. Pengecualian ini tidak melanggar prinsip "Isolasi Dual Persistence" (Bagian 9 poin 4) karena prinsip tersebut khusus untuk operasi bisnis yang membutuhkan resilience, bukan untuk endpoint monitoring administratif.
12. **Keputusan Arsitektur: Cakupan Audit Log Menyeluruh**:
    - 31 `AUDIT_ACTIONS` aktif terhubung ke seluruh endpoint sensitif: otentikasi login/logout, user management, mutasi produk, perubahan harga/stok, kategori, peruntukan, pesanan, verifikasi bayar, pengaturan, artikel, FAQ, konten teks, retensi data, hingga ekspor data PII.
13. **Arsitektur Notifikasi WhatsApp (`src/lib/wa-notify.ts`) — Zero-Dependency Manual-Copy**:
    - Modul `wa-notify.ts` membangun teks pesan WhatsApp siap-copy untuk siklus event pesanan (`checkout_success`, `payment_verified`, `order_shipped`, `order_completed`). Tidak ada HTTP call keluar, tidak ada biaya API gateway WA. Teks pesan disisipkan di JSON response API yang relevan (`wa_message` + `wa_phone`) agar admin/CS dapat menyalin teks dan mengirim secara manual ke WhatsApp pembeli.
14. **Deduplikasi Upload Validation (`src/lib/upload-validate.ts`)**:
    - Helper terpusat yang mengekspos `detectFileTypeFromMagicBytes()` dan konstanta `UPLOAD_ALLOWED_TYPES`. Menghilangkan duplikasi identik antara `/api/upload` (publik, 5MB) dan `/api/admin/upload` (admin, 10MB).
15. **Negosiasi Ongkir Manual & Sinkronisasi Finansial (ADD-02)**:
    - Kolom `Order.shippingCost` terintegrasi dengan kalkulasi `grandTotal = subtotal + taxAmount + shippingCost`. Karena transaksi komoditas tambang bervariasi tergantung jarak tambang/gudang dan tonase armada, ongkir dinegosiasikan secara manual via WhatsApp. Admin menginput nominal ongkir pada detail pesanan di panel admin, yang secara otomatis memicu rekalkulasi `grandTotal`, pembaruan database, dan pencatatan audit log.
16. **Notifikasi Email Transaksional ke Pembeli (Out-of-Scope v1.0)**:
    - Tidak ada email transaksional otomatis. Platform menggunakan WhatsApp sebagai kanal komunikasi utama (template manual via `wa-notify.ts`). Integrasi SMTP/Resend dapat ditambahkan sebagai ekstensi di masa depan.
17. **Notifikasi Admin Real-time (ADD-03)**:
    - Sidebar panel admin dilengkapi badge hitungan real-time untuk penawaran jual masuk (`newSellOffers`) dan pesanan menunggu tindakan (`pendingOrders`), memastikan admin/CS tidak melewatkan prospek baru.
18. **Reset Password Self-Service (Out-of-Scope v1.0)**:
    - Reset password dilakukan oleh SUPERADMIN melalui halaman `/admin/pengguna` → `PATCH /api/admin/users/[id]` dengan payload `{ password: "newpass" }`. Ini memadai untuk marketplace single-seller dengan staf terpusat.
19. **Rate Limiting Terdistribusi (Evaluasi ADD-08)**:
    - `src/lib/rate-limit.ts` menggunakan in-memory map untuk deployment single-container (VPS/Coolify). Untuk skala multi-node horizontal di masa depan, interface `RateLimitResult` dapat dialihkan ke adapter Redis/Upstash KV.
20. **Sistem Diskon / Kupon / Promo (Out-of-Scope v1.0)**:
    - Harga komoditas industri dinegosiasikan langsung via RFQ/WhatsApp sesuai volume order, bukan diskon e-commerce ritel.
21. **Quotation Formal Terstruktur (Evaluasi ADD-05)**:
    - Untuk single-seller v1.0, alur negosiasi dicatat via Lead Notes dan `CustomerInteraction`. Pembuatan modul Quotation multi-tier dijadwalkan untuk roadmap v2.0.
22. **Faktur Komersial & Proforma Invoice B2B PDF Otomatis (ADD-01)**:
    - Dokumen resmi proforma invoice (`PENDING_PAYMENT`) dan invoice lunas komersial (`PAID`) di-generate secara instan sisi server dalam format PDF via library `@react-pdf/renderer` melalui endpoint publik aman `GET /api/pesanan/[orderCode]/invoice`. Menyajikan kop surat resmi, rincian barang, pajak PPN 11%, ongkos kirim ternegosiasi, instruksi transfer, dan QR verifikasi.
23. **Ulasan / Rating Publik (Out-of-Scope v1.0)**:
    - B2B komoditas mineral mengutamakan uji lab sampel, spesifikasi fisik transparan, dan hubungan kontrak jangka panjang, bukan review bintang ritel.
24. **Produk Terkait / Rekomendasi**:
    - Halaman artikel menyertakan tautan rekomendasi komoditas relevan.
25. **Structured Data JSON-LD Aman Anti-XSS (P1-N)**:
    - Seluruh 11 sink JSON-LD disanitasi menggunakan `safeJsonLd()` untuk mencegah eksploitasi Stored XSS via tag penutup `</script>`.
26. **Riwayat Perubahan Harga (ADD-06)**:
    - `AuditLog` merekam `UPDATE_PRODUCT_PRICE` dan `UPDATE_PRODUCT_STOCK` (nilai lama/baru di `metadata`), dapat ditelusuri di `/admin/audit-log`.
27. **Multi-Warehouse / Multi-Gudang (Out-of-Scope v1.0)**:
    - Stok komoditas bersifat single-origin per spesifikasi tambang/gudang pusat.
28. **Arsitektur Whitelabel & 0 Hardcoded Brand Literals (P2-B)**:
    - Seluruh komponen storefront dan panel admin bersih 100% dari string literal brand hardcoded. Variabel branding, domain, cookie name, dan kontak CS diambil dinamis dari `SiteSetting` database atau variabel lingkungan (`APP_BRAND_NAME`, `APP_DOMAIN`, `NEXT_PUBLIC_SITE_NAME`), menjamin kesiapan platform sebagai reusable starter template.
29. **Prosedur Backup & Restore (ADD-09) & Kebijakan Privasi CRM (ADD-10)**:
    - Prosedur pemeliharaan data mencakup backup berkala basis data PostgreSQL via `pg_dump -Fc` dan sinkronisasi direktori media upload (`public/uploads`). Kebijakan privasi PII CRM dilindungi dengan endpoint penghapusan kontak terotorisasi `DELETE /api/admin/pelanggan/[id]` yang mencatat aksi ke `AuditLog`.
30. **Standarisasi Jalur Deployment Migrasi Database (D-16)**:
    - Ditetapkan satu jalur resmi tunggal untuk migrasi skema database: di lingkungan produksi CI/CD, perintah yang digunakan adalah `npx prisma migrate deploy` dengan direktori `prisma/migrations` sebagai Single Source of Truth, mengeliminasi risiko desinkronisasi skema (*drift*). Di lingkungan dev lokal, gunakan `npx prisma migrate dev`.

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
Seluruh 5 tahap audit total telah dijalankan terhadap kodebase di Sesi #22. Hasil: **LULUS** — tidak ada bug kritis, tidak ada orphan code yang tidak terselesaikan, tidak ada gap dokumen yang tidak terdokumentasi, tidak ada duplikasi yang tidak teratasi.

### Orphan Code yang Diperbaiki (KRITIS)
`src/lib/wa-notify.ts` mendefinisikan 5 event tapi sebelumnya hanya 2 yang dipanggil. Sesi #22 menghubungkan 3 event yang orphan:
- **`checkout_success`** → `POST /api/checkout` — setelah `createOrder` berhasil, `wa_message` + `wa_phone` disisipkan di JSON response (non-critical try/catch)
- **`order_shipped`** → `PATCH /api/admin/pesanan/[id]` — saat status berubah ke `SHIPPED`, teks WA dengan nomor resi disisipkan di response
- **`order_completed`** → `PATCH /api/admin/pesanan/[id]` — saat status berubah ke `COMPLETED`, teks WA penutup disisipkan di response
- `payment_verified` + `payment_rejected` sudah terhubung sejak Sesi #19 via `POST /api/admin/pesanan/[id]/verifikasi`

### Gap Dokumentasi yang Diperbaiki
- Bagian 3 (Struktur Folder): ditambahkan `wa-notify.ts` dan `upload-validate.ts`
- Bagian 7 (Matriks API): Rate limit `ORDER_DETAIL` dikoreksi 60x/1m → **30x/1m** (sesuai kode aktual `rate-limit.ts`)
- Bagian 9: Ditambahkan poin 13–27 mencakup keputusan arsitektur wa-notify, upload-validate, dan 14 item Tahap 4 kelengkapan bisnis

---

## Sesi #23 Update — Perbaikan Next.js Image 400 Bad Request & PUT Pengaturan 500 Error

### 1. Handler Runtime Media Upload (`/uploads/[...path]`)
- Menambahkan route handler `src/app/uploads/[...path]/route.ts` untuk melayani berkas fisik yang diunggah secara runtime di container Docker/standalone Next.js.
- Dilengkapi proteksi path traversal, deteksi Content-Type dinamis berdasarkan ekstensi file, dan header `Cache-Control: public, max-age=31536000, immutable`.
- Mengeliminasi error 400 Bad Request dari Next.js Image Optimization saat me-render media lokal.

### 2. Hardening Form & Route Pengaturan Toko
- Memperbaiki parsing angka dan boolean pada `PUT /api/admin/pengaturan` agar field `paymentToleranceAmount`, `defaultTaxRate`, `taxEnabled`, `auditRetentionDays`, dan `lowStockAlertThreshold` tidak memicu HTTP 500 saat dikirim dalam format string form.

---

## Sesi #24 Update — Isolasi StorefrontShell & Eliminasi Overlap Header Admin PWA/Mobile

### 1. Komponen Pembungkus `StorefrontShell`
- Membuat `src/components/layout/StorefrontShell.tsx` untuk membungkus elemen navigasi toko publik (`Navbar`, `BottomNav`, `Footer`, `WhatsAppButton`).
- Memastikan elemen storefront tidak bocor atau tumpang tindih dengan UI/UX panel admin (`/admin/*`).

### 2. Standardisasi Layout Mobile Panel Admin
- Menyelaraskan header mobile panel admin (`h-14`, fixed, `z-30`) dengan sidebar desktop, slide-in navigation drawer, dan tombol logout persisten.
- Mengubah posisi header halaman admin dari `sticky top-0` menjadi `relative z-10 md:sticky md:top-0 md:z-30` untuk mengeliminasi tumpang tindih dengan navbar mobile PWA.

---

## Sesi #25 Update — Penanganan Web Vitals, Link Preload, Hydration Keranjang & PWA Prompt

### 1. Isolasi Error Ekstensi Web Vitals
- Membungkus pelaporan Web Vitals di `src/app/layout.tsx` dalam blok try/catch untuk mencegah crash akibat intervensi ekstensi browser pihak ketiga (`reportAllChanges` / `startTime` undefined).

### 2. Optimasi Preload & Hydration Safety
- Menghapus tag link preload yang memicu warning konsol di Chrome.
- Menyelaraskan inisialisasi state keranjang di `CartProvider` dan `PwaPrompt` agar bebas dari peringatan SSR/CSR hydration mismatch.

---

## Sesi #25B Update — Fitur Penawaran Jual Komoditas (/jual & SellOffer) + Fix Validasi Harga Produk

### 1. Modul Penawaran Jual Supplier Tambang
- **Halaman Formulir Publik (`/jual`)**: Form multi-step intuitif untuk pemilik tambang / supplier yang ingin memasok komoditas ke platform (Info Kontak → Info Komoditas & Volume → Foto & Konfirmasi).
- **Skema Database & Migrasi**: Penambahan model `SellOffer` dan enum `SellOfferStatus` (`BARU`, `DIHUBUNGI`, `DIVERIFIKASI`, `DITOLAK`) di `prisma/schema.prisma`.
- **Panel Admin (`/admin/penawaran-jual`)**: Tabel daftar penawaran masuk terfilter status, detail penawaran, serta formulir pembaruan status dan catatan admin.
- **Endpoint API**: `POST /api/jual` (publik, rate limit 3/jam/IP), `GET /api/admin/penawaran-jual`, `GET /api/admin/penawaran-jual/[id]`, dan `PATCH /api/admin/penawaran-jual/[id]`.

### 2. Fix Validasi Harga Produk Admin
- Mengubah atribut input harga produk dari `step={1000}` menjadi `step={1}` dan validasi minimum dari `min={0}` menjadi `min={1}` di form admin produk baru dan edit.

---

## Sesi #26 Update — Tiptap Rich Text Editor, Tailwind Typography & Migrasi Next.js 16 Proxy

### 1. Tiptap WYSIWYG Rich Text Suite
- **`RichTextEditor.tsx`**: Editor WYSIWYG multi-fitur berbasis Tiptap modern (`@tiptap/react`, `@tiptap/starter-kit`, text-align, link, image, underline, text-color). Mendukung tema adaptif (`dark` untuk form produk, `light` untuk form artikel & CMS).
- **`RichTextRenderer.tsx`**: Komponen render HTML tersanitasi yang terintegrasi dengan plugin `@tailwindcss/typography` (`prose`, `prose-invert`).
- **Sanitizer Whitelist**: `src/lib/sanitize.ts` diperluas untuk memperbolehkan style Tiptap spesifik dengan regex ketat, menjamin keamanan mutlak dari Stored XSS.

### 2. Migrasi Konvensi Resmi Next.js 16 (Middleware ke Proxy)
- Menggantikan `src/middleware.ts` dengan `src/proxy.ts` (`export async function proxy(req: NextRequest)`) sesuai konvensi resmi Next.js 16.
- Mengeliminasi warning deprecation build Next.js 16. Proteksi otentikasi admin dua lapis tetap terjaga penuh.

### 3. Standardisasi Tampilan Storefront & CMS
- Mengintegrasikan `RichTextRenderer` pada artikel, tentang kami, syarat ketentuan, dan deskripsi detail produk, mengeliminasi bug layout whitespace.

---

## Sesi #27 Update — Shopee-Style Multi-Image Gallery, PWA Touch Swipe & Integrasi Hero CTA Penawaran Jual ke CMS

### 1. Galeri Multi-Gambar Interaktif Shopee-Style (`ProductGallery.tsx`)
- **Komponen Galeri Khusus**: Display gambar resolusi tinggi (4:3), fade transition, slide badge, desktop navigation buttons, dan thumbnail row dengan emerald active border.
- **PWA Touch Swipe**: Handler `onTouchStart`, `onTouchMove`, `onTouchEnd` dengan threshold 45px untuk swipe horizontal intuitif di layar sentuh tanpa mengganggu scroll vertikal.
- **Batch Multi-Image Uploader**: Penyempurnaan `ImageUploader.tsx` dengan multi-file upload serentak.

### 2. Relokasi Card Penawaran Jual ke Hero Gelap & CMS
- Memindahkan CTA penawaran jual supplier ke dalam section Hero gelap di beranda (`src/app/page.tsx`) dengan estetika glassmorphism emerald gelap.
- Mendaftarkan ContentBlock key `'supplier_cta'` di `/admin/konten` agar headline dan copy dapat diedit secara dinamis dari CMS.

---

## Sesi #28 Update — Generator PDF Katalog Produk & B2B Sales Offer dengan Filter & Personalisasi Buyer

### 1. Modul Generator Katalog PDF Resmi
- Mengintegrasikan library `@react-pdf/renderer` dengan template dokumen profesional di `src/lib/pdf/catalog-template.tsx`.
- Halaman admin `/admin/katalog-pdf` dan endpoint streaming `GET /api/admin/katalog-pdf`.
- Menyediakan filter katalog berdasarkan kategori komoditas, taksonomi peruntukan, pencarian nama, opsi sembunyikan harga, serta personalisasi nama pembeli dan nama perusahaan klien.

---

## Sesi #29 Update — Hotfix Deployment Coolify: Resolusi Peer Dependency @react-pdf/renderer & React 19

### 1. Resolusi Dependency Kontainer
- Menyelaraskan peer dependencies antara React 19, Next.js 16, dan `@react-pdf/renderer` pada skrip instalasi container Coolify.
- Menjamin stabilitas build di lingkungan Nixpacks dan Dockerfile standalone.

---

## Sesi #30 Update — Bugfix Runtime: Resolusi TypeError A.map & Proteksi Formula Injection CSV

### 1. Defensive Array Checking
- Memperbaiki potensi TypeError `A.map is not a function` pada halaman admin katalog PDF dan dashboard saat data komoditas kosong atau bernilai null.

### 2. Proteksi CSV Formula Injection
- Membuat utilitas terpusat `src/lib/csv.ts` (`buildCsv`) yang meng-escape karakter berisiko formula injection (`=`, `+`, `-`, `@`) pada seluruh fitur ekspor CSV pesanan dan pelanggan CRM.

---

## Sesi #31 Update — Polish Dokumen PDF: Stripping Tag HTML Tiptap & Resolusi Gambar Lokal Base64

### 1. Pembersihan Konten HTML di Canvas PDF
- Menambahkan regex stripping untuk membersihkan tag HTML Tiptap dari teks deskripsi produk sebelum diterjemahkan ke elemen teks primitif React-PDF.

### 2. Penanganan Media Gambar Lokal
- Mengonversi path gambar lokal ke buffer base64 inline saat rendering PDF, memastikan logo dan thumbnail produk ter-render sempurna tanpa bergantung pada fetch HTTP internal container.

---

## Sesi #32 Update — UX Transaksi Storefront (Input Kuantitas & KG ↔ TON), Reposisi Layout, & Multi-Page PDF Fix

### 1. Penyempurnaan UX Transaksi B2B
- Input kuantitas pesanan interaktif yang dapat diketik langsung via keyboard di samping tombol stepper plus/minus.
- Tombol toggle satuan KG ↔ TON dengan konversi harga dan kalkulasi stok instan.
- Reposisi layout blok transaksi ke atas deskripsi produk untuk mengoptimalkan konversi transaksi B2B.

### 2. Perbaikan Multi-Page PDF Katalog
- Mengimplementasikan chunking berpasangan berbasis baris (`wrap={false}`) pada template katalog PDF, mencegah pemotongan kartu produk di antara pergantian halaman dokumen.

---

## Sesi #33 Update — Hardening Pass Final: P0+P1+P2 Security, UOM Module & Health Check Endpoint

### 1. Endpoint Health Check & Circuit Breaker
- Menambahkan endpoint publik `GET /api/health` untuk memonitor kesiapan server dan status konektivitas database PostgreSQL.

### 2. Modul UOM & Standarisasi Satuan
- Menambahkan `src/lib/uom.ts` untuk validasi satuan komoditas B2B dan pencegahan input satuan liar.

### 3. Eliminasi Status Zombi REJECTED
- Menghapus nilai `REJECTED` dari enum `OrderStatus` di skema database (menggunakan `CANCELLED` secara terstandarisasi).

### 4. Security Headers & Error Classification
- Mengonfigurasi header keamanan ketat di `next.config.mjs` (CSP, X-Frame-Options, HSTS).
- Menambahkan `src/lib/db-errors.ts` untuk mengklasifikasi kegagalan database secara presisi (`CONSTRAINT` vs `UNREACHABLE`).

---

## Sesi #34 Update — Hotfix Deployment Coolify & Build Stabilization

### 1. Stabilisasi Alokasi Memori Build
- Menyesuaikan batas heap memory Node.js pada pipeline CI/CD Coolify untuk mencegah pemutusan build saat kompilasi static pages.

---

## Sesi #35 Update — Infrastruktur Deployment Coolify, .dockerignore, Multi-Stage Dockerfile & nixpacks.toml

### 1. Diagnosa Deployment Coolify (Exit Code 255)
- Evaluasi build log: Seluruh tahapan `prisma generate`, `next build`, dan 56 static pages berhasil.
- Titik kegagalan: Nixpacks default menghasilkan image raksasa (3.5GB+) yang memicu Linux OOM-killer saat exporting layers (`exit code 255`).

### 2. Standarisasi Kontainerisasi & Hardening
- **`.dockerignore`**: Dibuat komprehensif sehingga context build ringkas (< 1 MB).
- **`Dockerfile` (Multi-Stage Next.js Standalone)**: Base `node:22-alpine`, runner standalone non-root user `nextjs:nodejs`, ukuran image turun drastis ke ~150 MB (efisiensi 95%).
- **`nixpacks.toml`**: Disediakan sebagai konfigurasi fallback jika operator memilih Nixpacks, menjamin flag `--include=dev`.

---

## Sesi #36 Update — Audit Total Final & Remediasi Komprehensif (P0, P1, P2, Whitelabel, & B2B Invoicing)

### 1. Penutupan Blocker Kritis (P0)
- **P0-A (Kalkulasi Finansial)**: Sentralisasi kalkulasi pesanan via `src/lib/order-total.ts` (`computeOrderTotals`). Kolom `grandTotal`, `subtotal`, `taxRate`, `taxAmount`, dan `shippingCost` terhitung dan tersimpan akurat pada setiap transaksi checkout. Disediakan skrip `scripts/backfill-order-grandtotal.ts` untuk pesanan lama.
- **P0-B (Snapshot OrderItem)**: Snapshot data produk (`productName`, `productSlug`, `productUnit`) ditulis permanen pada `createOrder`. Riwayat pesanan tetap utuh dan informatif meski produk komoditas dihapus.
- **P0-C (Fail-Fast Environment)**: Validasi fail-fast `validateEnv()` dipanggil pada inisialisasi database di `src/lib/db.ts`, mencegah server berjalan dengan konfigurasi cacat.
- **P0-D (Keamanan Fallback Produksi)**: Menyatukan logika fallback ke `isLocalFallbackAllowed()` yang mutlak bernilai `false` di lingkungan produksi (`NODE_ENV=production`).
- **P0-E (Audit Naked Catches)**: Seluruh blok try/catch di `src/lib/data-store.ts` diaudit; mutasi dialihkan ke `handleDbFallback` dan error constraint dipisahkan dengan `classifyDbError`.
- **P0-F (Pemisahan Pengaturan Publik & Rekening Asli)**: Endpoint publik `/api/public/settings` menyajikan daftar metode pembayaran aktif (tipe, bank) tanpa membocorkan nomor rekening penuh sebelum pesanan dibuat, mengeliminasi badge palsu di checkout.
- **P0-G & P2-G (Pembersihan Tuntas REJECTED)**: Seluruh residu enum zombie `REJECTED` di skema Prisma, dropdown admin pesanan, dan pelacakan publik dibersihkan total.
- **P0-H (Integritas Catatan Pembeli)**: Kolom `Order.adminNotes` dipisahkan dari `Order.notes` (catatan pembeli bersifat read-only setelah checkout).

### 2. Penyempurnaan Logika Bisnis & Workflow (P1)
- **P1-A & P1-B (Validasi MOQ & Step Kuantitas B2B)**: Enforcing kuantitas minimum (`minOrderQty`) dan kelipatan pemesanan (`incrementQty`) sisi server pada `createOrder` dan endpoint validasi realtime `POST /api/validate-cart`. Input B2B terintegrasi di form produk dan pengaturan admin dengan proteksi whitelist payload.
- **P1-C (Retensi Audit Log)**: Dibuat script CLI `scripts/purge-audit-log.ts` dengan opsi `--dry-run` dan `--apply` sesuai konfigurasi `SiteSetting.auditRetentionDays`.
- **P1-D (Atomic Restock & Failure Audit)**: Restock pembatalan pesanan diikat dalam transaksi atomik `prisma.$transaction`, mencatat `AUDIT_ACTIONS.RESTOCK_FAILED` jika terjadi kegagalan.
- **P1-E (State Machine Pesanan)**: Validasi transisi pesanan strict (`ALLOWED_ORDER_TRANSITIONS`); status `PAID` hanya dapat dicapai melalui verifikasi bukti bayar, dan pesanan `PAID` diizinkan langsung beralih ke `COMPLETED` untuk model pengambilan mandiri (loco).
- **P1-F & P1-G (Integrasi Supplier ke CRM)**: Formulir penawaran jual (`SellOffer`) otomatis menyinkronkan data supplier ke direktori CRM `Customer` (`source: 'SELL_OFFER'`) dan mencatat timeline `CustomerInteraction`. Foto penawaran divalidasi anti-SSRF via `validateUploadUrl` / `validateLocalUploadPath`.
- **P1-I (Validasi Kontak Ketat)**: Validasi format nomor telepon (8–16 digit numerik) dan format email RFC di checkout; error validasi mengembalikan HTTP 400 terstandarisasi.
- **P1-J (Harmonisasi RBAC Pengaturan)**: Superadmin memegang wewenang eksklusif mutasi finansial (`bankAccounts`, pajak, retensi), sedangkan Admin diizinkan mengelola identitas toko dan kontak operasional.
- **P1-L & P1-M (Peringatan Stok Rendah)**: Statistik dashboard admin mengevaluasi ambang batas per-produk (`stock < (minStock ?? threshold)`) dan melempar error keras (fail-loud) jika database tidak dapat dijangkau di produksi.
- **P1-N (Sanitasi Skema JSON-LD Anti-XSS)**: Dibuat modul `src/lib/json-ld.ts` (`safeJsonLd`) dan diterapkan pada seluruh 11 sink structured data (Beranda, Produk, Artikel, FAQ, Breadcrumbs).
- **P1-O & P1-P (Arsitektur Keranjang Belanja)**: `CartProvider` diperbarui dengan masa retensi TTL 30 hari, key storage terisolasi via `getCartStorageKey()`, sinkronisasi revalidasi harga/stok sisi server, dan mutasi state yang immutable.
- **P1-Q (Proteksi Enumerasi Kontak RFQ)**: Endpoint `/api/leads` mengembalikan respons sukses seragam untuk mencegah kebocoran informasi pendaftaran kontak pelanggan (*oracle attack*).
- **P1-R (Gating Detail Rekening Bank)**: Detail nomor rekening dan QRIS diproteksi ganda, hanya tampil saat pesanan berada dalam status `PENDING_PAYMENT` atau `PENDING_VERIFICATION`.
- **P1-S (Standarisasi Basis Poin Pajak)**: Nilai default tax rate di seed database diselaraskan menjadi 1100 basis poin (11%).

### 3. Pembersihan Orphan, Duplikasi & Whitelabel Template (P2)
- **P2-A (Integrasi Penuh Audit Actions)**: Seluruh 31 aksi di `AUDIT_ACTIONS` terhubung aktif ke handler produksi (0 orphan actions).
- **P2-B (100% Whitelabel Template)**: Menghapus 125 kemunculan literal brand hardcoded ("Adably") di direktori `src/` hingga mencapai **tepat 0**. Seluruh teks brand, domain, dan cookie dikendalikan secara dinamis via `config.ts`, `SiteSetting`, dan env vars.
- **P2-D (Scanner Matriks API Fail-Loud)**: Menulis ulang `scripts/verify-api-matrix.ts` untuk membaca tabel BLUEPRINT §7 secara aktif, membandingkan seluruh 44 route file dan 67 method handler, serta keluar dengan `process.exit(1)` saat ditemukan selisih.
- **P2-E (Pembersihan Media Otomatis)**: Menghubungkan fungsi `deleteMedia` pada penghapusan produk, artikel, dan kategori untuk mencegah timbulan berkas yatim di storage.
- **P2-I (Whitelist Gambar Produksi)**: Membatasi remote image patterns di produksi hanya pada domain resmi, S3, atau Cloudinary; melarang `localhost` dan placeholder eksternal.

### 4. Fitur Tambahan Pemantapan Bisnis (Fase 4 ADD)
- **ADD-01 (Faktur Komersial & Proforma Invoice B2B PDF)**: Menghadirkan template PDF resmi di `src/lib/invoice-pdf.tsx` dan endpoint publik terproteksi `GET /api/pesanan/[orderCode]/invoice` berbasis `@react-pdf/renderer`.
- **ADD-02 (Negosiasi Ongkir Manual & Rekalkulasi Total)**: Admin dapat memasukkan nominal ongkir hasil koordinasi kargo/WA pada detail pesanan, yang secara otomatis menghitung ulang `grandTotal` pesanan.
- **ADD-03 (Badge Notifikasi Realtime Sidebar Admin)**: Menambahkan badge counter real-time pada sidebar admin layout untuk penawaran jual masuk (`newSellOffers`) dan pesanan menunggu tindakan (`pendingOrders`).
- **ADD-04 (Pendaftaran Sitemap Supplier)**: Mendaftarkan rute akuisisi supplier `/jual` ke `src/app/sitemap.ts` dengan priority 0.8.

### 5. Sinkronisasi Dokumen & Gate Mutu
- Menuntaskan 16 butir sinkronisasi dokumen (D-1 s/d D-16) di `docs/BLUEPRINT.md` dan `docs/NOTEPATCH.md`.
- Memperbaiki penomoran duplikat Sesi #21 di NOTEPATCH menjadi Sesi #25B.
- Seluruh 7 pemeriksaan otomatis gate mutu berhasil dengan Exit Code 0.
