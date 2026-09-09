# MineralHub Indonesia — Single-Seller Marketplace, Mini-CRM B2B & CMS Template

MineralHub Indonesia adalah platform web marketplace *single-seller* modern untuk komoditas industri dan mineral tambang (Zeolite, Bentonite, Pasir Silika, Dolomite, Kaolin, dsb.). Proyek ini dirancang secara *config-driven* sebagai *reusable starter template* berstandar produksi yang dapat di-deploy ulang untuk berbagai unit bisnis komoditas dengan mengganti konfigurasi tanpa merombak arsitektur kode.

---

## 🌟 Fitur Utama

### 1. Storefront & Katalog Komoditas B2B
- **Taksonomi Multi-Dimensi**: Pencarian & pemfilteran produk berdasarkan Kategori Utama, Peruntukan Industri Terkontrol (*Usage*), serta Hashtags bebas.
- **Guest Checkout**: Pembelian cepat tanpa kewajiban registrasi akun pembeli, dilengkapi kode pesanan unik (`orderCode`) dan pelacakan pesanan publik real-time.
- **Pembayaran Transfer Bank & Verifikasi Bukti Transfer**: Pembeli mengunggah bukti struk transfer, diverifikasi langsung oleh Superadmin.
- **Inbound Lead RFQ**: Formulir penawaran skala industri & sampel laboratorium dengan tombol 1-klik terhubung ke WhatsApp sales.

### 2. Panel Superadmin & Mini-CRM B2B
- **Manajemen Katalog**: Kontrol penuh CRUD Kategori, Peruntukan (*Usage*), dan Produk Komoditas.
- **Manajemen Pesanan**: Verifikasi bukti bayar (Lunas / Tolak), pembaruan nomor resi/armada logistik, pembatalan pesanan dengan pengembalian stok otomatis (*restocking*).
- **Database Pelanggan & CRM Leads**:
  - Direktori prospek (*Leads*) & pelanggan (*Customers*) dengan riwayat nilai transaksi (*LTV*).
  - Filter interaktif status follow-up (*Baru, Dihubungi, Sampel Dikirim, Negosiasi, Deal, Batal*).
  - Tombol 1-klik Direct WhatsApp Chat dengan pesan otomatis siap kirim.
  - Ekspor seluruh database kontak ke file CSV.
- **CMS Artikel Edukasi**: Pembuatan konten berita & artikel industri dengan sanitasi XSS yang ketat.
- **CMS Teks Web & FAQ**: Pengelolaan hero banner, tentang kami, dan FAQ interaktif.
- **Pengaturan Situs (*Site Settings*)**: Konfigurasi nama web, warna tema primer, rekening bank tujuan, nomor CS WhatsApp, dan alamat logistik secara terpusat.

### 3. PWA (Progressive Web App) & Mobile Experience
- Dukungan *Installable PWA* dengan Web App Manifest dan Service Worker.
- Mode offline interaktif dengan halaman fallback ramah pengguna (`offline.html`).
- Navigasi bawah mobile (*Mobile Bottom Navigation*) yang responsif dan ergonomis.

---

## 🛠️ Prasyarat Sistem & Teknologi

- **Node.js**: Versi 18.18.0 atau lebih baru (disarankan Node.js 20 LTS)
- **Database**: PostgreSQL 14 atau lebih baru
- **Package Manager**: npm

### Tumpukan Teknologi (*Tech Stack*)
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database ORM**: Prisma ORM (Client v6)
- **Styling**: Tailwind CSS
- **Autentikasi**: JWT Session (`jose`), role Superadmin & Admin
- **Pengujian**: `tsx` automated script test suite

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Kloning Repositori & Instal Dependensi
```bash
git clone https://github.com/dhikoh/mineral.git
cd mineral
npm install
```

### 2. Konfigurasi Variabel Lingkungan (`.env`)
Salin berkas contoh `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka `.env` dan atur nilai yang sesuai:
```env
# URL Koneksi PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mineral_db?schema=public"

# Kunci Rahasia Sesi Admin (Wajib diisi acak >= 32 karakter)
AUTH_SECRET="kunci_rahasia_acak_minimal_32_karakter_produksi_anda_disini"

# URL Publik Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Opsi Development Resilience (Hanya untuk dev mode lokal tanpa PostgreSQL)
ALLOW_DEV_FALLBACK_LOGIN="false"
ALLOW_LOCAL_FALLBACK="false"
```

> [!WARNING]
> Aplikasi akan berhenti (*fail-fast*) saat startup jika `AUTH_SECRET` tidak diisi atau kurang dari 32 karakter demi alasan keamanan.

### 3. Setup Database & Seeding Awal
Jalankan migrasi Prisma dan masukkan data seed awal:
```bash
# Sinkronkan skema Prisma ke PostgreSQL
npx prisma db push

# Atau jalankan migrasi resmi
npx prisma migrate dev --name init

# Masukkan data master seed (Kategori, Peruntukan, Produk, FAQ, Site Settings, Admin)
npx tsx prisma/seed.ts
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui browser:
- **Storefront Publik**: [http://localhost:3000](http://localhost:3000)
- **Panel Admin**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🧪 Menjalankan Skrip Pengujian Otomatis

Proyek ini dilengkapi dengan suite pengujian otomatis yang menguji seluruh endpoint HTTP, otorisasi sesi admin, siklus prospek CRM, serta integritas PWA/SEO:
```bash
npm test
```
Perintah ini mengeksekusi secara berurutan:
1. `test-phase7-e2e.ts`: Pengujian SEO, sitemap, robots, PWA manifest, service worker, sanitasi artikel, dan modul data store.
2. `test-crm-module.ts`: Pengujian logika CRUD database pelanggan, siklus status lead, anti-duplikasi WhatsApp, dan kalkulasi LTV.
3. `test-crm-http.ts`: Pengujian integrasi HTTP endpoint dengan verifikasi negatif (memastikan akses tanpa login mengembalikan `HTTP 401 Unauthorized`) dan verifikasi positif dengan sesi sah (`HTTP 200 OK`).

Untuk memvalidasi kompilasi produksi:
```bash
npm run build
```

---

## 🔒 Standar Keamanan Produksi

1. **Otorisasi Berlapis (*Defense-in-Depth*)**:
   - `src/middleware.ts` memproteksi seluruh rute `/api/admin/*` (HTTP 401) dan `/admin/*` (redirect ke login), kecuali endpoint login publik.
   - Setiap route handler admin memiliki pengecekan `getAdminSession()` eksplisit.
2. **Ketiadaan Backdoor & Secret Hardcode**:
   - Tidak ada kredensial admin default di jalur produksi.
   - Secret key JWT divalidasi fail-fast pada runtime tanpa fallback string terbuka.
3. **Pemberhentian Keras (*Fail-Loud*) Database**:
   - Di lingkungan produksi, kegagalan database tidak dialihkan diam-diam ke file lokal.
4. **Proteksi Upload Berkas**:
   - Endpoint upload menerapkan rate limiting berbasis IP klien dan validasi *Magic Bytes* berkas fisik (hanya menerima JPG, PNG, WEBP, PDF; SVG dilarang untuk upload publik).
5. **Pemberantasan Race Condition Stok**:
   - Checkout menggunakan transaksi atomik `prisma.$transaction` dengan syarat kondisional `stock >= qty` untuk mencegah *overselling*.
6. **Restock Otomatis**:
   - Pembatalan pesanan mengembalikan kuantitas stok produk secara atomik.

---

## 🔄 Cara Menggunakan Template Ini untuk Bisnis Baru

Proyek ini dibangun secara *config-driven* agar dapat dipakai ulang untuk entitas bisnis komoditas lain (misal: pupuk pertanian, batubara, kopi, kayu, dll.):

1. **Ganti Pengaturan Situs di Admin**:
   - Masuk ke menu `/admin/pengaturan`.
   - Ubah Nama Web, Tagline, Warna Tema Primer (Hex), Nomor WhatsApp CS, Email, Alamat Gudang, dan Rekening Bank Tujuan.
2. **Atur Kategori & Peruntukan**:
   - Hapus atau edit data di menu `/admin/kategori` dan `/admin/peruntukan` sesuai spesifikasi komoditas baru.
3. **Perbarui Logo & Favicon**:
   - Letakkan aset logo dan favicon baru di folder `public/icons/` atau unggah via menu Pengaturan Situs.
4. **Sesuaikan Konten Teks**:
   - Masuk ke menu `/admin/konten` untuk menyesuaikan teks banner hero depan (*Headline & Subheadline*) dan halaman *Tentang Kami*.

---

## 📄 Lisensi
Hak Cipta © 2026 MineralHub Indonesia. Dilindungi Undang-Undang.
