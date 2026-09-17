# Panduan Pengembangan & Aturan Agen (Adably)

Dokumen ini adalah panduan resmi untuk developer dan coding agent yang bekerja pada repositori Adably.

---

## 1. Ikhtisar Proyek
Aplikasi marketplace *single-seller* B2B + Mini-CRM Lead Prospek + CMS Komoditas Tambang & Mineral Industri berbasis:
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database & ORM**: PostgreSQL + Prisma Client
- **Styling**: Tailwind CSS
- **Autentikasi**: Custom JWT Session (`jose`), role Superadmin / Admin

---

## 2. Aturan Keamanan Wajib (Non-Negotiable)
1. **Otorisasi Endpoint Admin**:
   - Seluruh endpoint API di bawah `/api/admin/**` WAJIB terotentikasi menggunakan guard `const session = await getAdminSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`.
   - `src/proxy.ts` (konvensi resmi Next.js 16 — **bukan** `src/middleware.ts`) memproteksi rute `/admin/:path*` (redirect login) dan `/api/admin/:path*` (HTTP 401 instan, kecuali `/api/admin/auth/login` dan `/api/admin/auth/logout`).
   - COOKIE_NAME **wajib** diambil dari `getAdminCookieName()` di `src/lib/config.ts` — dilarang hardcode string `'adably_admin_token'`.
2. **Secret & Kredensial**:
   - Dilarang keras menaruh fallback string rahasia untuk `AUTH_SECRET` di kode. Variabel lingkungan wajib divalidasi fail-fast via `src/lib/env.ts::validateEnv()` (minimal 32 karakter acak).
   - Dilarang memasang backdoor kredensial login default pada runtime produksi.
   - `TRUSTED_PROXY_COUNT` **wajib** diset sesuai infrastruktur deployment untuk mencegah rate limit bypass via XFF palsu.
3. **Integritas Data & Dual Persistence**:
   - Di lingkungan produksi (`NODE_ENV === 'production'`), dilarang silent-fallback ke file lokal `.local-store.json` saat database error. Gunakan `classifyDbError()` dari `src/lib/db-errors.ts` — hanya `UNREACHABLE` yang boleh memicu fallback.
4. **Proteksi Upload Berkas**:
   - Endpoint upload publik wajib: rate limiting per-IP, validasi magic bytes (JPG/PNG/WEBP/PDF saja), validasi URL via `src/lib/upload-url.ts` (whitelist host, tolak IP privat, tolak `http://`).
   - SVG dilarang untuk upload publik (stored XSS).
5. **State Machine Pesanan**:
   - Perubahan status pesanan ke `PAID` **hanya** boleh melalui `POST /api/admin/pesanan/[id]/verifikasi`, tidak via PATCH generik.
   - Selalu gunakan `canVerifyPayment()` dan `canRejectPayment()` dari `src/lib/order-security.ts` sebelum memproses verifikasi.
   - Status `REJECTED` telah **dihapus** dari enum (Sesi #33). Gunakan `CANCELLED` sebagai pengganti.
6. **Rate Limiting**:
   - Gunakan `peekRateLimit()` untuk cek status, `consumeRateLimit()` untuk naikkan counter, `clearRateLimit()` untuk reset setelah sukses.
   - Jangan panggil `checkRateLimit()` ganda untuk event yang sama — counter hanya boleh naik 1× per percobaan.
7. **CSV Export**:
   - Seluruh ekspor CSV **wajib** menggunakan `buildCsv()` dari `src/lib/csv.ts` untuk mencegah formula injection (=, +, -, @).
8. **Audit Log**:
   - Semua operasi PII berisiko (ekspor data, hapus pelanggan, logout) **wajib** dicatat ke `AuditLog` via `recordAuditLog()`.
   - Gunakan konstanta dari `AUDIT_ACTIONS` — dilarang string literal.

---

## 3. Logika Bisnis Inti
1. **Transaksi Stok Atomik**:
   - Pembuatan pesanan checkout (`createOrder`) wajib dibungkus dalam transaksi atomik `prisma.$transaction` dengan pengecekan `stock: { gte: qty }` untuk mencegah *race condition* dan *overselling*.
2. **Restock Otomatis**:
   - Pembatalan pesanan (`CANCELLED` / `REJECTED`) wajib menaikkan kembali stok produk terkait.
3. **Siklus Data CRM Prospek vs Pembeli**:
   - Checkout pesanan mencatat calon pembeli sebagai prospek (`type: 'PROSPECT'`, `status: 'BARU'`) tanpa menaikkan `totalOrders` atau `totalSpent`.
   - Akumulasi LTV (`totalSpent`), `totalOrders`, dan promosi ke `type: 'CUSTOMER'`, `status: 'DEAL'` hanya terjadi setelah pembayaran diverifikasi sah (`PAID`).

---

## 4. Konvensi Dokumentasi & Testing
1. **Kepatuhan Blueprint**:
   - Setiap penambahan rute, tabel database, atau fitur baru WAJIB langsung disinkronkan ke `docs/BLUEPRINT.md`.
2. **Pencatatan Patch**:
   - Setiap sesi kerja WAJIB dicatat di `docs/NOTEPATCH.md` secara kronologis tanpa menghapus riwayat sesi sebelumnya.
3. **Verifikasi Kualitas**:
   - Sebelum commit/push: jalankan `npm test` dan pastikan `npm run build` berhasil dengan Exit Code 0.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
