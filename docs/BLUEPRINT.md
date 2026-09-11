# BLUEPRINT — Web Marketplace Single-Seller + CMS Artikel + Template Reusable
Terakhir diupdate: 2026-09-11 (Sesi #14 — Rebranding Global: MineralHub → Adably, Penyelarasan URL & Domain adably.id)

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
mineral/
├── docs/
│   ├── BLUEPRINT.md          # Single Source of Truth proyek (sinkron 100%)
│   └── NOTEPATCH.md          # Log perubahan historis per sesi
├── prisma/
│   ├── schema.prisma         # Definisi 13 model database & enum
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
│   ├── manifest.json
│   ├── offline.html
│   └── sw.js
├── scripts/
│   ├── test-audit-p0-p1.ts   # Pengujian 23 assertions kepatuhan P0, P1, dan gap bisnis
│   ├── test-crm-http.ts      # Pengujian HTTP endpoint CRM & otorisasi admin (401 & 200)
│   ├── test-crm-module.ts    # Pengujian modul CRM B2B & kalkulasi LTV
│   └── test-phase7-e2e.ts    # Pengujian menyeluruh SEO, PWA, dan data store
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── artikel/
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── baru/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── kategori/page.tsx
│   │   │   ├── konten/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── pelanggan/page.tsx
│   │   │   ├── pengaturan/page.tsx
│   │   │   ├── pengguna/page.tsx      # Manajemen Staf/Admin RBAC (khusus SUPERADMIN)
│   │   │   ├── peruntukan/page.tsx
│   │   │   ├── pesanan/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── AdminOrderDetailClient.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── produk/
│   │   │       ├── [id]/page.tsx
│   │   │       ├── baru/page.tsx
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── artikel/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
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
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   ├── export/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pengaturan/route.ts
│   │   │   │   ├── peruntukan/
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pesanan/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── verifikasi/route.ts
│   │   │   │   │   │   └── route.ts
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
│   │   ├── auth.ts           # Token verification, JWT fail-fast, session helpers, RBAC (SUPERADMIN / ADMIN)
│   │   ├── cart-context.tsx   # React context state keranjang
│   │   ├── data-store.ts     # Data access layer (Prisma + local dev fallback, retry collision, status gate)
│   │   ├── db.ts             # Prisma Client instance
│   │   ├── sanitize.ts       # HTML sanitizer
│   │   ├── storage.ts        # Storage driver modular (local, s3/r2, cloudinary)
│   │   └── utils.ts          # Format rupiah, slugify, generateOrderCode (kriptografis 8-char hex)
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
  createdAt DateTime @default(now())
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
  verifiedBy      String?
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
```

---

## 5. Role & Permission

| Role | Hak Akses | Catatan Keamanan |
|---|---|---|
| **Superadmin** | Full akses: Pengaturan situs & rekening, manajemen akun staf/admin (`/admin/pengguna`), kelola produk, kategori, peruntukan, verifikasi pembayaran pesanan, CMS artikel, CMS teks & FAQ, serta CRM Database Pelanggan & Prospek Leads. | Seluruh endpoint admin diproteksi ganda via middleware dan `getAdminSession()`. Operasi mutasi pengaturan dan manajemen pengguna dikunci khusus role `SUPERADMIN` via `requireSuperAdminSession()`. Sesi via HTTP-only cookie. |
| **Admin (Staf)** | Operasional harian: Katalog produk, kategori, peruntukan, pengelolaan pesanan, verifikasi pembayaran bukti transfer, database CRM pelanggan/prospek, CMS artikel, FAQ, dan blok konten web. Dibatasi dari pengaturan global sistem dan manajemen akun staf. | Terotentikasi sesi JWT admin. Diproteksi guard RBAC `isAdmin` & `isSuperAdmin`. |
| **Buyer / Publik** | Browse katalog, pencarian & filter, guest checkout, request penawaran resmi (RFQ), upload bukti transfer (JPG/PNG/WEBP/PDF max 5MB rate limited), lacak pesanan via `orderCode` + HP, membaca artikel & FAQ, klik-chat CS WhatsApp. | Tanpa wajib login / registrasi akun. |

---

## 6. Daftar Fitur & Status

| Fitur | Status | Catatan |
|---|---|---|
| Inisialisasi Project (Next.js + Tailwind + TS) | Selesai | Fase 1: Next.js 16 (App Router) + TS + Tailwind v3 + Lucide Icons |
| Setup Schema Prisma & Migrasi | Selesai | Fase 1: 13 model Prisma lengkap, validasi & Prisma Client generated |
| Seed Data Awal (Komoditas Mineral) | Selesai | Fase 1: Script seed (Zeolite, Bentonite, Timah, Gaharu, dsb.) |
| Auth Superadmin (Login, Logout, Middleware) | Selesai (Hardened) | Sesi #10-11: Fail-fast JWT Secret (>= 32 chars), backdoor dihapus di produksi, middleware defense-in-depth, logout whitelist untuk mitigasi token expired |
| Otorisasi Admin API 100% Terlindungi | Selesai (Hardened) | Sesi #10: Seluruh endpoint `/api/admin/**` menolak akses tanpa sesi dengan HTTP 401 |
| Role-Based Access Control (RBAC) & Manajemen Staf | Selesai (Terverifikasi) | Sesi #10-11: Rute `/admin/pengguna` dan API `/api/admin/users`, kontrol level akun `SUPERADMIN` vs `ADMIN`, proteksi restriksi mutasi pengaturan situs |
| Satuan Komoditas Dinamis (UoM) & Ambang Stok Rendah | Selesai (Terverifikasi) | Sesi #10-11: Multi-unit (`kg`, `ton`, `sak`, `m³`), atribut `minStock` pada produk & `lowStockAlertThreshold` pada pengaturan situs, badge visual stok menipis |
| Upload Berkas Publik Terlindungi | Selesai (Hardened) | Sesi #10: Rate limiting per-IP (10x/5m), verifikasi Magic Bytes fisik, disallow format SVG |
| Admin Media Upload Berkas Terlindungi | Selesai (Hardened) | Sesi #10: Endpoint `/api/admin/upload` khusus CMS admin (limit 10MB, rate-limiting, validasi Magic Bytes fisik, disallow SVG) |
| CRUD Kategori & Peruntukan | Selesai (Terproteksi) | Sesi #10: Endpoint & UI Admin terlindungi otorisasi penuh, relasi integritas pencegah orphan data |
| CRUD Produk (Galeri, Tags, Peruntukan, Satuan) | Selesai (Terproteksi) | Sesi #10: Endpoint & UI Admin terlindungi otorisasi penuh, proteksi hapus jika ada riwayat pesanan |
| Storefront Publik & Keranjang Belanja | Selesai | Fase 2: /produk, /produk/[slug], /keranjang + CartContext localStorage |
| Pencarian & Filter Multi-Dimensi (URL Query) | Selesai | Fase 3: FilterSidebar desktop sticky + mobile bottom drawer, SortSelect, ActiveFilterChips |
| Checkout & Transaksi Stok Atomik | Selesai (Anti-Overselling) | Sesi #10: `prisma.$transaction` dengan validasi kondisional `stock >= qty` |
| Restock Pembatalan Pesanan | Selesai (Terverifikasi) | Sesi #10: Pengembalian stok otomatis saat status pesanan menjadi `CANCELLED`/`REJECTED` |
| Verifikasi Pembayaran Superadmin | Selesai | Fase 4: Persetujuan/penolakan bukti transfer, kontrol nomor resi |
| Pelacakan Pesanan Publik | Selesai | Fase 4: /lacak-pesanan verifikasi orderCode + no WA pembeli, visual stepper progress |
| CMS Artikel (HTML Sanitizer, Slug Generator) | Selesai | Fase 5: Editor HTML live preview, sanitasi XSS, listing & detail artikel |
| CMS Konten Teks Web (`ContentBlock`) | Selesai | Fase 6: Editor tabbed /admin/konten untuk 6 blok teks |
| Modul FAQ Dinamis | Selesai | Fase 6: CRUD /admin/faq, urutan tampil, toggle status aktif |
| Site Settings & WhatsApp Click-to-Chat | Selesai | Fase 6: Form /admin/pengaturan 3 tab, floating WhatsAppButton |
| Dashboard Ringkasan Superadmin | Selesai | Fase 6: /admin/dashboard metrik live omset terverifikasi, pending verifikasi |
| Polish: SEO, PWA/Mobile Bottom Nav, End-to-End | Selesai (Aset Valid) | Sesi #10: Seluruh aset ikon PWA (192px, 512px, svg, apple-touch) valid dan HTTP 200 |
| Database Pelanggan & CRM Prospek/Leads (B2B) | Selesai (Siklus Benar) | Sesi #10: Checkout mencatat status PROSPECT (belum lunas), promosi DEAL & akumulasi LTV hanya saat pembayaran terverifikasi sah |

---

## 7. Matriks Endpoint API Lengkap (31 Route)

| Method | Endpoint | Tipe Akses | Deskripsi & Proteksi |
|---|---|---|---|
| `POST` | `/api/checkout` | Publik | Formulir guest checkout (transaksi atomik potong stok & catat lead) |
| `GET` | `/api/pesanan/[orderCode]` | Publik | Detail pesanan untuk verifikasi nomor rekening & upload bukti |
| `POST` | `/api/pesanan/[orderCode]/bukti` | Publik | Simpan informasi bukti transfer pembayaran (dengan status gate) |
| `POST` | `/api/lacak-pesanan` | Publik | Pelacakan pesanan publik (verifikasi orderCode + 4 digit no WA) |
| `POST` | `/api/leads` | Publik | Penangkapan lead prospek dari formulir RFQ storefront |
| `POST` | `/api/upload` | Publik | Upload media bukti bayar (Rate limited 10x/5m, Magic Bytes valid, no SVG, max 5MB) |
| `POST` | `/api/admin/auth/login` | Publik (Admin) | Login superadmin/staf dengan rate limit brute-force & audit log |
| `POST` | `/api/admin/auth/logout` | Publik / Admin | Menghapus session cookie admin (`mineral_admin_token`, bebas blokir expired token) |
| `GET` | `/api/admin/auth/me` | Admin Wajib | Cek profil sesi superadmin/staf yang sedang aktif |
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
| `PUT` | `/api/admin/produk/[id]` | Admin Wajib | Perbarui data produk, harga, galeri, stok, satuan, dan minStock |
| `DELETE` | `/api/admin/produk/[id]` | Admin Wajib | Hapus produk (dicek riwayat pesanan untuk mencegah orphan) |
| `POST` | `/api/admin/upload` | Admin Wajib | Upload media CMS admin (10 MB, Magic Bytes fisik, rate limited, no SVG) |
| `GET` | `/api/admin/users` | Admin Wajib (SUPERADMIN) | Ambil daftar akun staf & admin aktif |
| `POST` | `/api/admin/users` | Admin Wajib (SUPERADMIN) | Buat akun staf/admin baru dengan enkripsi password bcrypt |
| `PATCH` | `/api/admin/users/[id]` | Admin Wajib (SUPERADMIN) | Perbarui role (ADMIN/SUPERADMIN), status aktif, atau reset password staf |
| `DELETE` | `/api/admin/users/[id]` | Admin Wajib (SUPERADMIN) | Hapus akun staf (proteksi: dilarang menghapus akun sendiri) |
| `GET` | `/api/admin/pesanan` | Admin Wajib | Daftar seluruh transaksi pesanan pembeli |
| `GET` | `/api/admin/pesanan/[id]` | Admin Wajib | Detail pesanan spesifik beserta item & bukti bayar |
| `PATCH` | `/api/admin/pesanan/[id]` | Admin Wajib | Update status pesanan (dengan restock otomatis jika dibatalkan/ditolak) |
| `POST` | `/api/admin/pesanan/[id]/verifikasi` | Admin Wajib | Setujui bukti bayar (PAID + trigger DEAL CRM) / Tolak |
| `GET` | `/api/admin/pelanggan` | Admin Wajib | Direktori CRM database kontak (prospek & customer) |
| `POST` | `/api/admin/pelanggan` | Admin Wajib | Tambah data kontak pelanggan/prospek manual |
| `GET` | `/api/admin/pelanggan/[id]` | Admin Wajib | Detail kontak pelanggan, riwayat transaksi & estimasi kebutuhan |
| `PUT` | `/api/admin/pelanggan/[id]` | Admin Wajib | Perbarui kontak, status prospek (BARU, NEGOSIASI, DEAL, LOSS), & catatan |
| `DELETE` | `/api/admin/pelanggan/[id]` | Admin Wajib | Hapus kontak dari database pelanggan |
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
| `PUT` | `/api/admin/pengaturan` | Admin Wajib (SUPERADMIN) | Perbarui identitas, kontak CS, ambang stok, dan rekening bank |

---

## 8. Environment Variables
Daftar variabel lingkungan resmi (`.env.example`):

```env
# Database PostgreSQL URL (Wajib diisi untuk lingkungan produksi)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mineral_db?schema=public"

# Auth Secret untuk signing JWT session Superadmin (WAJIB diisi acak >= 32 karakter)
# Sistem akan fail-fast (menolak start) jika variabel ini tidak diset atau kurang dari 32 karakter.
AUTH_SECRET="kunci_rahasia_acak_minimal_32_karakter_produksi!"

# Base URL Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Opsi Development Resilience (HANYA untuk dev mode lokal tanpa PostgreSQL)
ALLOW_DEV_FALLBACK_LOGIN="false"
ALLOW_LOCAL_FALLBACK="false"
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
