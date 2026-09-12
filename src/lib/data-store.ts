import { prisma, markDbUnavailable } from '@/lib/db';
import { slugify, generateOrderCode } from '@/lib/utils';
import { sanitize } from '@/lib/sanitize';
import { isValidOrderTransition } from '@/lib/order-security';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const STORE_FILE = path.join(process.cwd(), '.local-store.json');

export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  htmlContent: string;
  thumbnail: string | null;
  metaDesc: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export interface UsageItem {
  id: string;
  name: string;
  slug: string;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  unit?: string; // kg, ton, sak 25kg, jumbo bag 1 ton, ingot, dll
  minStock?: number; // ambang peringatan stok tipis
  images: string[];
  tags: string[];
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  usageIds?: string[];
  usages?: { usage: UsageItem }[];
  isActive?: boolean;
  createdAt?: string;
}

export interface OrderItemData {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  price: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    unit?: string;
  };
}

export interface PaymentProofData {
  id: string;
  orderId: string;
  fileUrl: string;
  senderBank?: string | null;
  senderName?: string | null;
  amount?: number | null;
  note?: string | null;
  status: string; // PENDING, APPROVED, REJECTED
  rejectionReason?: string | null;
  uploadedAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export interface OrderData {
  id: string;
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerAddress: string;
  notes?: string | null;
  trackingNumber?: string | null;
  status:
    | 'PENDING_PAYMENT'
    | 'PENDING_VERIFICATION'
    | 'PAID'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
  total: number;
  items: OrderItemData[];
  proof?: PaymentProofData | null;
  createdAt: string;
}

export interface BankAccount {
  bank: string;
  noRekening: string;
  atasNama: string;
}

export interface SiteSettingsData {
  siteName: string;
  tagline: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  csWhatsapp: string;
  csEmail: string;
  csOperationalHours: string;
  address: string;
  bankAccounts: BankAccount[];
  footerText?: string | null;
  lowStockAlertThreshold?: number | null;
}

export interface ContentBlockItem {
  id: string;
  key: string;
  title?: string | null;
  content: string;
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export interface CustomerItem {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone: string; // WhatsApp normalized
  address?: string | null;
  type: 'PROSPECT' | 'CUSTOMER';
  status: 'BARU' | 'DIHUBUNGI' | 'SAMPEL_DIKIRIM' | 'NEGOSIASI' | 'DEAL' | 'BATAL';
  source: string;
  preferredCommodity?: string | null;
  estimatedVolume?: string | null;
  notes?: string | null;
  totalOrders: number;
  totalSpent: number;
  lastContactAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function normalizePhone(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export const DEFAULT_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust-1',
    name: 'Ir. Bambang Sudiro',
    company: 'PT Semen Perkasa Nusantara',
    email: 'bambang.procurement@semenperkasa.co.id',
    phone: '6281298765432',
    address: 'Jl. Industri Kimia No. 45, Cilegon, Banten',
    type: 'CUSTOMER',
    status: 'DEAL',
    source: 'CHECKOUT',
    preferredCommodity: 'Zeolite Alam Aktif Mesh 80',
    estimatedVolume: '50 Ton / Bulan',
    notes: 'Kontrak supply Zeolite Aktif 50 ton/bulan. Pengiriman tahap 1 selesai.',
    totalOrders: 3,
    totalSpent: 135000000,
    lastContactAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Hendrik Pratama',
    company: 'CV Agro Makmur Sejahtera',
    email: 'hendrik.agro@gmail.com',
    phone: '6285711223344',
    address: 'Kawasan Agribisnis Blok B-12, Malang, Jawa Timur',
    type: 'CUSTOMER',
    status: 'DEAL',
    source: 'CHECKOUT',
    preferredCommodity: 'Bentonite Sodium Swelling Grade A',
    estimatedVolume: '20 Ton / Bulan',
    notes: 'Kebutuhan Bentonite Na mesh 200 untuk formulasi pakan ternak ayam petelur.',
    totalOrders: 2,
    totalSpent: 45000000,
    lastContactAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Dian Kusuma Wardhani',
    company: 'PT Tirta Chemindo Solusindo',
    email: 'purchasing@tirtachemindo.com',
    phone: '6281355667788',
    address: 'Jl. Rungkut Industri III No. 8, Surabaya, Jawa Timur',
    type: 'PROSPECT',
    status: 'SAMPEL_DIKIRIM',
    source: 'WEBSITE_RFQ',
    preferredCommodity: 'Pasir Silika Bangka Putih Mesh 14-20',
    estimatedVolume: '100 Ton',
    notes: 'Sampel Pasir Silika 5kg dikirim via ekspedisi. Menunggu hasil lab turbiditas air.',
    totalOrders: 0,
    totalSpent: 0,
    lastContactAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'cust-4',
    name: 'Michael Tan',
    company: 'Global Export Minerals Pte Ltd',
    email: 'm.tan@globalminerals.sg',
    phone: '6281809988776',
    address: 'Marina Bay Financial Centre Tower 1 (Gudang Transit: Tanjung Priok)',
    type: 'PROSPECT',
    status: 'NEGOSIASI',
    source: 'WEBSITE_RFQ',
    preferredCommodity: 'Zeolite Alam Granular 2-4mm',
    estimatedVolume: 'FCL 40ft (25 Ton)',
    notes: 'Inquiry FCL 40ft Zeolite Granular untuk ekspor. Pembahasan harga FOB Tanjung Priok.',
    totalOrders: 0,
    totalSpent: 0,
    lastContactAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  siteName: 'Adably',
  tagline: 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#059669',
  csWhatsapp: '6281234567890',
  csEmail: 'cs@adably.id',
  csOperationalHours: 'Senin - Sabtu, 08.00 - 17.00 WIB',
  address: 'Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat',
  bankAccounts: [
    {
      bank: 'BCA',
      noRekening: '8001234567',
      atasNama: 'Adably',
    },
    {
      bank: 'Mandiri',
      noRekening: '1230009876543',
      atasNama: 'Adably',
    },
  ],
  footerText: '© 2026 Adably. All rights reserved.',
};

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN';
  isActive: boolean; // Sesi #17 (Temuan J)
  createdAt: string;
}

export interface UserItemStored extends UserItem {
  password?: string;
}

export const DEFAULT_USERS: UserItemStored[] = [
  {
    id: 'seed-admin-01',
    name: 'Super Admin Adably',
    email: 'admin@Adably.com',
    role: 'SUPERADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

interface LocalStoreData {
  categories: CategoryItem[];
  usages: UsageItem[];
  products: ProductItem[];
  orders: OrderData[];
  siteSettings: SiteSettingsData;
  articles: ArticleItem[];
  contentBlocks: ContentBlockItem[];
  faqs: FAQItem[];
  customers: CustomerItem[];
  users?: UserItemStored[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Mineral Tambang',
    slug: 'mineral-tambang',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cat-2',
    name: 'Hasil Hutan Non-Kayu',
    slug: 'hasil-hutan-non-kayu',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_USAGES: UsageItem[] = [
  { id: 'u-1', name: 'Pertanian & Pupuk', slug: 'pertanian-pupuk' },
  { id: 'u-2', name: 'Peternakan & Pakan Ternak', slug: 'peternakan-pakan-ternak' },
  { id: 'u-3', name: 'Pengolahan Air', slug: 'pengolahan-air' },
  { id: 'u-4', name: 'Industri & Konstruksi', slug: 'industri-konstruksi' },
  { id: 'u-5', name: 'Industri Elektronik', slug: 'industri-elektronik' },
  { id: 'u-6', name: 'Kesehatan & Kosmetik', slug: 'kesehatan-kosmetik' },
  { id: 'u-7', name: 'Parfum & Dupa', slug: 'parfum-dupa' },
  { id: 'u-8', name: 'Ekspor Bahan Mentah', slug: 'ekspor-bahan-mentah' },
];

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Zeolite Alam Aktif Mesh 80',
    slug: 'zeolite-alam-aktif-mesh-80',
    description: 'Zeolite alam murni berpori aktif dengan KTK tinggi untuk perbaikan kesuburan tanah, campuran pupuk slow-release, dan media filter air bersih.',
    price: 45000,
    stock: 500,
    unit: 'sak (25 kg)',
    minStock: 50,
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'],
    tags: ['zeolite', 'mineralalam', 'penyaringair', 'pupukorganik'],
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Mineral Tambang', slug: 'mineral-tambang' },
    usageIds: ['u-1', 'u-3', 'u-2'],
    usages: [
      { usage: { id: 'u-1', name: 'Pertanian & Pupuk', slug: 'pertanian-pupuk' } },
      { usage: { id: 'u-3', name: 'Pengolahan Air', slug: 'pengolahan-air' } },
      { usage: { id: 'u-2', name: 'Peternakan & Pakan Ternak', slug: 'peternakan-pakan-ternak' } },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Bentonite Sodium Swelling Grade A',
    slug: 'bentonite-sodium-swelling-grade-a',
    description: 'Bentonite sodium swelling tinggi untuk lumpur pemboran (drilling mud), pembuatan pelet pakan ternak, dan penjernih limbah cair.',
    price: 65000,
    stock: 350,
    unit: 'sak (25 kg)',
    minStock: 50,
    images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'],
    tags: ['bentonite', 'clay', 'drillingmud', 'catlitter'],
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Mineral Tambang', slug: 'mineral-tambang' },
    usageIds: ['u-4', 'u-3', 'u-1'],
    usages: [
      { usage: { id: 'u-4', name: 'Industri & Konstruksi', slug: 'industri-konstruksi' } },
      { usage: { id: 'u-3', name: 'Pengolahan Air', slug: 'pengolahan-air' } },
      { usage: { id: 'u-1', name: 'Pertanian & Pupuk', slug: 'pertanian-pupuk' } },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Timah Balok Murni (Tin Ingot) Sn 99.9%',
    slug: 'timah-balok-murni-sn-99',
    description: 'Ingot balok timah murni kadar 99.9% berstandar LME untuk industri manufaktur elektronik solder presisi dan pelapis plat baja.',
    price: 485000,
    stock: 120,
    unit: 'batang/ingot',
    minStock: 20,
    images: ['https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=80'],
    tags: ['timah', 'tin', 'logam', 'ekspor'],
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Mineral Tambang', slug: 'mineral-tambang' },
    usageIds: ['u-5', 'u-8'],
    usages: [
      { usage: { id: 'u-5', name: 'Industri Elektronik', slug: 'industri-elektronik' } },
      { usage: { id: 'u-8', name: 'Ekspor Bahan Mentah', slug: 'ekspor-bahan-mentah' } },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Kayu Gaharu Super Natural (Aquilaria)',
    slug: 'kayu-gaharu-super-natural-aquilaria',
    description: 'Potongan kayu gaharu alami berkualitas grade super dengan aroma manis hangat tahan lama untuk bahan dupa aromaterapi dan parfum atsiri.',
    price: 1250000,
    stock: 45,
    unit: 'kg',
    minStock: 10,
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'],
    tags: ['gaharu', 'agarwood', 'parfum', 'dupa'],
    categoryId: 'cat-2',
    category: { id: 'cat-2', name: 'Hasil Hutan Non-Kayu', slug: 'hasil-hutan-non-kayu' },
    usageIds: ['u-6', 'u-7', 'u-8'],
    usages: [
      { usage: { id: 'u-6', name: 'Kesehatan & Kosmetik', slug: 'kesehatan-kosmetik' } },
      { usage: { id: 'u-7', name: 'Parfum & Dupa', slug: 'parfum-dupa' } },
      { usage: { id: 'u-8', name: 'Ekspor Bahan Mentah', slug: 'ekspor-bahan-mentah' } },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    title: 'Peran Zeolite Aktif dalam Meningkatkan Kesuburan Tanah dan Efisiensi Pupuk',
    slug: 'peran-zeolite-aktif-dalam-meningkatkan-kesuburan-tanah',
    htmlContent: `
      <p>Zeolite alam telah lama diakui sebagai salah satu bahan pembenah tanah (soil conditioner) terbaik di dunia pertanian modern. Dengan struktur kristal berpori mikro yang unik, zeolite mampu mengikat kation hara penting seperti amonium (NH4+) dan kalium (K+) agar tidak mudah tercuci oleh air hujan.</p>
      <h2>Mengapa Petani Membutuhkan Zeolite?</h2>
      <p>Pemberian pupuk kimia secara terus-menerus sering kali menyebabkan degradasi tanah dan inefisiensi biaya karena pupuk larut terbawa air sebelum diserap akar. Zeolite bertindak sebagai wadah cadangan yang melepaskan hara secara perlahan (slow-release mechanism).</p>
      <h3>Manfaat Utama:</h3>
      <ul>
        <li>Meningkatkan Kapasitas Tukar Kation (KTK) tanah hingga 200%.</li>
        <li>Mengurangi kehilangan nitrogen akibat penguapan dan pencucian.</li>
        <li>Menjaga kelembaban zona perakaran pada musim kemarau.</li>
      </ul>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    metaDesc: 'Pelajari bagaimana zeolite aktif mampu memperbaiki struktur tanah, menghemat pupuk, dan mendongkrak hasil panen pertanian secara berkelanjutan.',
    isPublished: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'art-2',
    title: 'Mengenal Bentonite: Karakteristik Mineral Lempung dan Aplikasinya',
    slug: 'mengenal-bentonite-karakteristik-dan-aplikasi',
    htmlContent: `
      <p>Bentonite adalah mineral lempung yang terbentuk dari pelapukan abu vulkanik selama jutaan tahun. Komponen utamanya adalah mineral montmorillonite yang memiliki kemampuan mengembang (swelling) luar biasa saat bersentuhan dengan air.</p>
      <h2>Aplikasi Utama di Dunia Industri</h2>
      <p>Dari dunia pengeboran minyak dan gas hingga industri penjernihan minyak nabati (bleaching earth), bentonite memegang peranan krusial sebagai bahan baku fungsional yang hemat biaya dan ramah lingkungan.</p>
      <h3>Kegunaan Populer Lainnya:</h3>
      <ul>
        <li>Lumpur pemboran (drilling mud) sumur migas dan panas bumi.</li>
        <li>Perekat alami untuk pelet pakan ternak dan unggas.</li>
        <li>Penyerap bau dan kelembaban pada produk cat litter higienis.</li>
      </ul>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    metaDesc: 'Mengenal mineral bentonite, sifat swelling, dan penggunaannya dalam industri lumpur bor, pakan ternak, dan pengolahan limbah.',
    isPublished: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CONTENT_BLOCKS: ContentBlockItem[] = [
  {
    id: 'block-hero',
    key: 'homepage_hero',
    title: 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor',
    content: 'Menyediakan Zeolite Alam Aktif, Bentonite Clay Kemurnian Tinggi, Timah Ingot Murni 99.9%, dan Kayu Gaharu Super langsung dari tambang serta perkebunan terpercaya di Indonesia. Siap melayani kebutuhan pasokan pabrik, agrikultur modern, dan pengiriman kontainer ekspor dengan legalitas resmi.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-about',
    key: 'about_us',
    title: 'Tentang Adably',
    content: 'Adably adalah platform penyedia komoditas mineral industri dan hasil alam berkualitas di Indonesia. Didirikan dengan komitmen transparansi dan keandalan suplai, kami melayani kebutuhan bahan baku industri manufaktur, agrikultur, pengolahan air (water treatment), dan eksportir melalui rantai pasok terpercaya.\n\nSetiap komoditas disajikan dengan data spesifikasi fisik yang jelas serta opsi verifikasi sampel sebelum transaksi. Kami siap melayani pengadaan berkala maupun partai besar dengan dukungan koordinasi logistik kargo terpercaya ke berbagai wilayah di Indonesia.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-why',
    key: 'why_us',
    title: 'Mengapa Memilih Adably?',
    content: '1. Legalitas Usaha & Kemitraan Terverifikasi: Menjalankan aktivitas niaga melalui badan usaha resmi dengan rantai pasok yang jelas, mengutamakan keterbukaan dokumen pengiriman dan kepatuhan terhadap ketentuan perdagangan yang berlaku.\n2. Kesesuaian Spesifikasi & Uji Sampel: Informasi kadar kemurnian, mesh, dan parameter fisik disajikan sesuai data fisik komoditas. Kami mendukung pengiriman sampel fisik dan penyediaan dokumen uji teknis sesuai ketersediaan pada masing-masing komoditas.\n3. Fleksibilitas Pengambilan & Ekspedisi: Mendukung opsi pengambilan mandiri di sentra/gudang penyimpanan (Loco/FOB) maupun koordinasi pengiriman dengan mitra jasa ekspedisi kargo independen sesuai kuantitas pesanan Anda.\n4. Skema Grosir & Harga Kompetitif: Penawaran harga yang rasional dan transparan dengan penyesuaian khusus untuk pembelian partai besar, kebutuhan kontinuitas industri, maupun pemesanan berkala.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-shipping',
    key: 'shipping_info',
    title: 'Informasi Pengiriman & Logistik Komoditas',
    content: 'Kami melayani pengiriman skala industri dan kebutuhan retail dengan opsi logistik fleksibel:\n- Truk Curah & Kargo Darat: Koordinasi armada CDD, Fuso, hingga Tronton untuk area Jawa, Bali, dan Sumatra.\n- Kontainer Laut (FCL 20ft & 40ft / LCL): Pengiriman antar-pulau atau ekspor melalui pelabuhan muat utama.\n- Pengambilan Mandiri (Loco / FOB): Pembeli dapat mengoordinasikan armada atau ekspedisi sendiri langsung dari gudang penyimpanan kami.\n- Surat Jalan & Dokumen Pengiriman: Setiap kiriman disertai dokumen pengiriman resmi untuk kelancaran administrasi penerimaan di lokasi Anda.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-terms',
    key: 'terms',
    title: 'Syarat & Ketentuan Pemesanan Komoditas',
    content: '1. Pemesanan & Kontrak: Pembelian dapat dilakukan secara langsung melalui platform atau melalui Purchase Order (PO) resmi untuk volume industri kontrak berkala.\n2. Minimum Order Quantity (MOQ): Setiap produk memiliki batas minimum pemesanan sesuai satuan kemasan (karung sak 25kg, jumbo bag 1 ton, atau batangan ingot).\n3. Verifikasi Pembayaran: Pembayaran wajib ditransfer ke rekening bank resmi atas nama perusahaan (Adably). Bukti transfer akan diverifikasi oleh bagian keuangan maksimal 1x24 jam kerja.\n4. Inspeksi & Komplain: Pembeli berhak melakukan verifikasi fisik dan kesesuaian spesifikasi saat barang tiba di lokasi pembongkaran dengan toleransi susut standar logistik komoditas.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-privacy',
    key: 'privacy_policy',
    title: 'Kebijakan Privasi & Perlindungan Data',
    content: 'Adably berkomitmen menjaga kerahasiaan data seluruh mitra dan pelanggan. Informasi nama, kontak WhatsApp, alamat pergudangan, dan rincian transaksi hanya digunakan untuk kepentingan pemrosesan pesanan, pengiriman logistik, dan konfirmasi pembayaran resmi. Kami tidak pernah membagikan atau memperjualbelikan data pelanggan kepada pihak ketiga mana pun tanpa persetujuan tertulis.',
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Apakah komoditas yang disediakan memiliki Certificate of Analysis (COA) atau hasil uji lab?',
    answer: 'Spesifikasi produk kami disajikan sesuai standar data fisik komoditas. Untuk kebutuhan industri tertentu, pengiriman sampel fisik serta penyediaan salinan dokumen uji teknis (seperti COA) dapat dikoordinasikan dan disediakan sesuai ketersediaan pada masing-masing komoditas.',
    order: 1,
    isActive: true,
  },
  {
    id: 'faq-2',
    question: 'Berapa Minimum Order Quantity (MOQ) untuk pemesanan komoditas?',
    answer: 'MOQ bervariasi tergantung jenis komoditas. Untuk Zeolite dan Bentonite sak 25 kg, pemesanan dapat dimulai dari 1 sak untuk trial, sedangkan untuk kebutuhan industri tonase besar dapat dipesan dalam kelipatan Jumbo Bag (1 Ton) atau muatan truk kargo (8-25 Ton). Timah Ingot dan Gaharu memiliki ketentuan minimum per kilogram/batang yang tertera pada masing-masing halaman produk.',
    order: 2,
    isActive: true,
  },
  {
    id: 'faq-3',
    question: 'Apakah saya bisa meminta sampel komoditas sebelum order partai besar?',
    answer: 'Tentu bisa. Kami menyediakan paket sampel uji laboratorium (misal 500 gram - 1 kg) untuk keperluan trial pabrik, pengujian mesh, atau uji absorpsi tambak. Anda dapat menghubungi WhatsApp CS resmi kami untuk pengajuan permintaan sampel komoditas.',
    order: 3,
    isActive: true,
  },
  {
    id: 'faq-4',
    question: 'Bagaimana alur pembayaran dan verifikasinya?',
    answer: 'Pembayaran dilakukan melalui transfer bank manual ke rekening resmi perusahaan yang tertera di halaman instruksi pembayaran (BCA & Bank Mandiri a.n Adably). Setelah mentransfer, unggah foto bukti transfer di halaman pesanan Anda. Tim keuangan kami akan memverifikasi bukti tersebut dalam waktu 15-30 menit pada jam kerja.',
    order: 4,
    isActive: true,
  },
  {
    id: 'faq-5',
    question: 'Bagaimana metode pengiriman dan jangkauan wilayahnya?',
    answer: 'Kami melayani pengiriman ke berbagai wilayah di Indonesia melalui koordinasi dengan jasa ekspedisi/kargo terpercaya (truk CDD, Fuso, Tronton, maupun kontainer laut FCL/LCL). Kami juga mendukung opsi pengambilan mandiri (Loco) langsung di sentra atau gudang penyimpanan kami sesuai kesepakatan.',
    order: 5,
    isActive: true,
  },
  {
    id: 'faq-6',
    question: 'Bagaimana cara melacak status pesanan yang telah dikirim?',
    answer: 'Anda dapat mengecek status pesanan kapan saja melalui menu "Lacak Pesanan" di navigasi utama atau footer web. Cukup masukkan Kode Pesanan (contoh: ORD-20260908-XXXX) dan 4 digit terakhir nomor WhatsApp yang Anda gunakan saat checkout.',
    order: 6,
    isActive: true,
  },
];

export function handleDbFallback(fnName: string, err: any): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowFallback = process.env.ALLOW_LOCAL_FALLBACK === 'true' || !isProduction;

  console.warn(
    JSON.stringify({
      level: 'WARN',
      event: 'DB_FALLBACK_TRIGGERED',
      function: fnName,
      isProduction,
      allowFallback,
      error: err?.message || String(err),
      timestamp: new Date().toISOString(),
    })
  );

  if (
    allowFallback &&
    (err?.code === 'P1001' ||
      err?.message?.includes("Can't reach database server") ||
      err?.message?.includes('ECONNREFUSED'))
  ) {
    markDbUnavailable();
  }

  if (!allowFallback) {
    throw new Error(
      `[CRITICAL DATABASE ERROR] Failed executing ${fnName} against database: ${err?.message || err}. Local store fallback is disabled in production.`
    );
  }
  return true;
}

function readLocalStore(): LocalStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.orders) parsed.orders = [];
      if (!parsed.siteSettings) parsed.siteSettings = DEFAULT_SITE_SETTINGS;
      if (!parsed.articles) parsed.articles = DEFAULT_ARTICLES;
      if (!parsed.contentBlocks) parsed.contentBlocks = DEFAULT_CONTENT_BLOCKS;
      if (!parsed.faqs) parsed.faqs = DEFAULT_FAQS;
      if (!parsed.customers) parsed.customers = DEFAULT_CUSTOMERS;
      if (!parsed.users) parsed.users = DEFAULT_USERS;
      return parsed;
    }
  } catch (e) {
    console.error('Failed reading .local-store.json, using defaults', e);
  }

  const initialData: LocalStoreData = {
    categories: DEFAULT_CATEGORIES,
    usages: DEFAULT_USAGES,
    products: DEFAULT_PRODUCTS,
    orders: [],
    siteSettings: DEFAULT_SITE_SETTINGS,
    articles: DEFAULT_ARTICLES,
    contentBlocks: DEFAULT_CONTENT_BLOCKS,
    faqs: DEFAULT_FAQS,
    customers: DEFAULT_CUSTOMERS,
    users: DEFAULT_USERS,
  };

  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing initial .local-store.json', e);
  }

  return initialData;
}

function writeLocalStore(data: LocalStoreData) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowFallback = process.env.ALLOW_LOCAL_FALLBACK === 'true' || !isProduction;

  if (!allowFallback) {
    throw new Error(
      '[CRITICAL PERSISTENCE ERROR] Attempted writing mutation data to local .local-store.json in production. Local store fallback is disabled.'
    );
  }

  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing .local-store.json', e);
  }
}

// --- KATEGORI METHODS ---
export async function getCategories() {
  try {
    return await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  } catch {
    const store = readLocalStore();
    return store.categories.map((c) => ({
      ...c,
      _count: {
        products: store.products.filter((p) => p.categoryId === c.id).length,
      },
    }));
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const cat = await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (cat) return cat;
  } catch {}

  const store = readLocalStore();
  const found = store.categories.find((c) => c.slug === slug);
  if (!found) return null;
  return {
    ...found,
    _count: {
      products: store.products.filter((p) => p.categoryId === found.id).length,
    },
  };
}

export async function createCategory(data: { name: string; image?: string }) {
  const slug = slugify(data.name);
  try {
    return await prisma.category.create({
      data: {
        name: data.name,
        slug,
        image: data.image || null,
      },
    });
  } catch {
    const store = readLocalStore();
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: data.name,
      slug,
      image: data.image || null,
    };
    store.categories.push(newCat);
    writeLocalStore(store);
    return newCat;
  }
}

export async function updateCategory(id: string, data: { name: string; image?: string }) {
  const slug = slugify(data.name);
  try {
    return await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        image: data.image || null,
      },
    });
  } catch {
    const store = readLocalStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.categories[idx] = {
        ...store.categories[idx],
        name: data.name,
        slug,
        image: data.image !== undefined ? (data.image || null) : store.categories[idx].image,
      };
      writeLocalStore(store);
      return store.categories[idx];
    }
    throw new Error('Kategori tidak ditemukan');
  }
}

export async function deleteCategory(id: string) {
  try {
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${productCount} produk komoditas.`);
    }
    return await prisma.category.delete({ where: { id } });
  } catch (err: any) {
    if (err?.message?.includes('tidak dapat dihapus karena masih digunakan')) {
      throw err;
    }
    handleDbFallback('deleteCategory', err);

    const store = readLocalStore();
    const productCount = (store.products || []).filter((p) => p.categoryId === id || p.category?.id === id).length;
    if (productCount > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${productCount} produk komoditas.`);
    }
    store.categories = store.categories.filter((c) => c.id !== id);
    writeLocalStore(store);
    return { success: true };
  }
}

// --- USAGE (PERUNTUKAN) METHODS ---
export async function getUsages() {
  try {
    return await prisma.usage.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  } catch {
    const store = readLocalStore();
    return store.usages.map((u) => ({
      ...u,
      _count: {
        products: store.products.filter((p) => p.usageIds?.includes(u.id)).length,
      },
    }));
  }
}

export async function createUsage(data: { name: string }) {
  const slug = slugify(data.name);
  try {
    return await prisma.usage.create({
      data: { name: data.name, slug },
    });
  } catch {
    const store = readLocalStore();
    const newUsage: UsageItem = {
      id: `u-${Date.now()}`,
      name: data.name,
      slug,
    };
    store.usages.push(newUsage);
    writeLocalStore(store);
    return newUsage;
  }
}

export async function updateUsage(id: string, data: { name: string }) {
  const slug = slugify(data.name);
  try {
    return await prisma.usage.update({
      where: { id },
      data: { name: data.name, slug },
    });
  } catch {
    const store = readLocalStore();
    const idx = store.usages.findIndex((u) => u.id === id);
    if (idx !== -1) {
      store.usages[idx] = { ...store.usages[idx], name: data.name, slug };
      writeLocalStore(store);
      return store.usages[idx];
    }
    throw new Error('Peruntukan tidak ditemukan');
  }
}

export async function deleteUsage(id: string) {
  try {
    const usageProductsCount = await prisma.productUsage.count({ where: { usageId: id } });
    if (usageProductsCount > 0) {
      throw new Error(`Peruntukan tidak dapat dihapus karena masih dikaitkan dengan ${usageProductsCount} produk komoditas.`);
    }
    return await prisma.usage.delete({ where: { id } });
  } catch (err: any) {
    if (err?.message?.includes('tidak dapat dihapus karena masih dikaitkan')) {
      throw err;
    }
    handleDbFallback('deleteUsage', err);

    const store = readLocalStore();
    const usageProductsCount = (store.products || []).filter(
      (p) => p.usageIds?.includes(id) || p.usages?.some((u: any) => u.usageId === id || u.id === id)
    ).length;
    if (usageProductsCount > 0) {
      throw new Error(`Peruntukan tidak dapat dihapus karena masih dikaitkan dengan ${usageProductsCount} produk komoditas.`);
    }
    store.usages = store.usages.filter((u) => u.id !== id);
    writeLocalStore(store);
    return { success: true };
  }
}

export interface GetProductsOptions {
  kategori?: string | string[];
  peruntukan?: string | string[];
  q?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'name-asc' | 'name-desc';
}

// --- PRODUK METHODS ---
export async function getProducts(options?: GetProductsOptions) {
  // Normalize kategori slugs
  const catSlugs = Array.isArray(options?.kategori)
    ? options.kategori
    : options?.kategori?.split(',').map((s) => s.trim()).filter(Boolean);

  // Normalize peruntukan slugs
  const usageSlugs = Array.isArray(options?.peruntukan)
    ? options.peruntukan
    : options?.peruntukan?.split(',').map((s) => s.trim()).filter(Boolean);

  try {
    const where: any = { isActive: true };

    if (catSlugs && catSlugs.length > 0) {
      where.category = { slug: { in: catSlugs } };
    }

    if (usageSlugs && usageSlugs.length > 0) {
      where.usages = {
        some: { usage: { slug: { in: usageSlugs } } },
      };
    }

    if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
      where.price = {};
      if (options?.minPrice !== undefined) where.price.gte = options.minPrice;
      if (options?.maxPrice !== undefined) where.price.lte = options.maxPrice;
    }

    if (options?.inStock) {
      where.stock = { gt: 0 };
    }

    if (options?.q) {
      where.OR = [
        { name: { contains: options.q, mode: 'insensitive' } },
        { description: { contains: options.q, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (options?.sort === 'price-asc') orderBy = { price: 'asc' };
    else if (options?.sort === 'price-desc') orderBy = { price: 'desc' };
    else if (options?.sort === 'name-asc') orderBy = { name: 'asc' };
    else if (options?.sort === 'name-desc') orderBy = { name: 'desc' };
    else if (options?.sort === 'newest') orderBy = { createdAt: 'desc' };

    return await prisma.product.findMany({
      where,
      include: {
        category: true,
        usages: { include: { usage: true } },
      },
      orderBy,
    });
  } catch {
    const store = readLocalStore();
    let prods = [...store.products];

    // Filter Kategori (Multi-select)
    if (catSlugs && catSlugs.length > 0) {
      prods = prods.filter((p) => p.category && catSlugs.includes(p.category.slug));
    }

    // Filter Peruntukan (Multi-select)
    if (usageSlugs && usageSlugs.length > 0) {
      prods = prods.filter((p) =>
        p.usages?.some((u: any) => usageSlugs.includes(u.usage?.slug))
      );
    }

    // Filter Harga
    if (options?.minPrice !== undefined && !isNaN(options.minPrice)) {
      prods = prods.filter((p) => p.price >= options.minPrice!);
    }
    if (options?.maxPrice !== undefined && !isNaN(options.maxPrice)) {
      prods = prods.filter((p) => p.price <= options.maxPrice!);
    }

    // Filter Stok Tersedia
    if (options?.inStock) {
      prods = prods.filter((p) => p.stock > 0);
    }

    // Filter Kata Kunci (Q)
    if (options?.q) {
      const query = options.q.toLowerCase();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t: string) => t.toLowerCase().includes(query))
      );
    }

    // Filter Hashtag
    if (options?.tag) {
      const targetTag = options.tag.toLowerCase();
      prods = prods.filter((p) =>
        p.tags.some((t: string) => t.toLowerCase().replace(/^#/, '') === targetTag)
      );
    }

    // Sorting
    if (options?.sort === 'price-asc') {
      prods.sort((a, b) => a.price - b.price);
    } else if (options?.sort === 'price-desc') {
      prods.sort((a, b) => b.price - a.price);
    } else if (options?.sort === 'name-asc') {
      prods.sort((a, b) => a.name.localeCompare(b.name));
    } else if (options?.sort === 'name-desc') {
      prods.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // newest default
      prods.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    return prods.map((p) => ({
      ...p,
      unit: p.unit || 'kg',
      minStock: p.minStock ?? 50,
    }));
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        usages: { include: { usage: true } },
      },
    });
  } catch {
    const store = readLocalStore();
    return store.products.find((p) => p.slug === slug) || null;
  }
}

export async function getProductById(id: string) {
  try {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        usages: { include: { usage: true } },
      },
    });
  } catch {
    const store = readLocalStore();
    return store.products.find((p) => p.id === id) || null;
  }
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
  unit?: string;
  minStock?: number;
  images: string[];
  tags: string[];
  categoryId: string;
  usageIds: string[];
  isActive?: boolean;
}) {
  const baseSlug = slugify(data.name);
  const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

  try {
    return await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        unit: data.unit || 'kg',
        minStock: data.minStock ?? 50,
        images: data.images,
        tags: data.tags,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
        usages: {
          create: data.usageIds.map((uId) => ({
            usage: { connect: { id: uId } },
          })),
        },
      },
      include: {
        category: true,
        usages: { include: { usage: true } },
      },
    });
  } catch {
    const store = readLocalStore();
    const category = store.categories.find((c) => c.id === data.categoryId);
    const usages = data.usageIds
      .map((uId) => store.usages.find((u) => u.id === uId))
      .filter(Boolean)
      .map((u) => ({ usage: u! }));

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      stock: data.stock,
      unit: data.unit || 'kg',
      minStock: data.minStock ?? 50,
      images: data.images,
      tags: data.tags,
      categoryId: data.categoryId,
      category: category || { id: data.categoryId, name: 'Umum', slug: 'umum' },
      usageIds: data.usageIds,
      usages: usages as any,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    store.products.unshift(newProd);
    writeLocalStore(store);
    return newProd;
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    unit?: string;
    minStock?: number;
    images: string[];
    tags: string[];
    categoryId: string;
    usageIds: string[];
    isActive?: boolean;
  }
) {
  try {
    await prisma.productUsage.deleteMany({ where: { productId: id } });

    return await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        unit: data.unit || 'kg',
        minStock: data.minStock ?? 50,
        images: data.images,
        tags: data.tags,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
        usages: {
          create: data.usageIds.map((uId) => ({
            usage: { connect: { id: uId } },
          })),
        },
      },
      include: {
        category: true,
        usages: { include: { usage: true } },
      },
    });
  } catch {
    const store = readLocalStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const category = store.categories.find((c) => c.id === data.categoryId);
      const usages = data.usageIds
        .map((uId) => store.usages.find((u) => u.id === uId))
        .filter(Boolean)
        .map((u) => ({ usage: u! }));

      store.products[idx] = {
        ...store.products[idx],
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        unit: data.unit || store.products[idx].unit || 'kg',
        minStock: data.minStock ?? store.products[idx].minStock ?? 50,
        images: data.images,
        tags: data.tags,
        categoryId: data.categoryId,
        category: category || store.products[idx].category,
        usageIds: data.usageIds,
        usages: usages as any,
        isActive: data.isActive ?? store.products[idx].isActive,
      };

      writeLocalStore(store);
      return store.products[idx];
    }
    throw new Error('Produk tidak ditemukan');
  }
}

export async function deleteProduct(id: string) {
  try {
    // Cek apakah produk pernah dipesan dalam OrderItem
    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      throw new Error(
        `Produk tidak dapat dihapus permanen karena tercatat dalam ${orderCount} riwayat transaksi pesanan. Silakan nonaktifkan status produk (edit -> nonaktifkan) agar tidak tampil di katalog.`
      );
    }
    return await prisma.product.delete({ where: { id } });
  } catch (err: any) {
    if (err?.message?.includes('tidak dapat dihapus permanen')) {
      throw err;
    }
    handleDbFallback('deleteProduct', err);

    const store = readLocalStore();
    let orderCount = 0;
    for (const ord of store.orders || []) {
      if (ord.items?.some((it) => it.productId === id)) {
        orderCount++;
      }
    }
    if (orderCount > 0) {
      throw new Error(
        `Produk tidak dapat dihapus permanen karena tercatat dalam ${orderCount} riwayat pesanan. Silakan nonaktifkan status produk agar tidak tampil di katalog.`
      );
    }

    store.products = store.products.filter((p) => p.id !== id);
    writeLocalStore(store);
    return { success: true };
  }
}

// --- SITE SETTINGS METHODS ---
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { id: 'default-setting' } });
    if (s) {
      return {
        siteName: s.siteName,
        tagline: s.tagline || DEFAULT_SITE_SETTINGS.tagline,
        logoUrl: s.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl,
        faviconUrl: s.faviconUrl || DEFAULT_SITE_SETTINGS.faviconUrl,
        primaryColor: s.primaryColor || DEFAULT_SITE_SETTINGS.primaryColor,
        csWhatsapp: s.csWhatsapp || DEFAULT_SITE_SETTINGS.csWhatsapp,
        csEmail: s.csEmail || DEFAULT_SITE_SETTINGS.csEmail,
        csOperationalHours: s.csOperationalHours || DEFAULT_SITE_SETTINGS.csOperationalHours,
        address: s.address || DEFAULT_SITE_SETTINGS.address,
        bankAccounts: (s.bankAccounts as any) || DEFAULT_SITE_SETTINGS.bankAccounts,
        footerText: (s as any).footerText || DEFAULT_SITE_SETTINGS.footerText,
      };
    }
  } catch {}

  const store = readLocalStore();
  return store.siteSettings || DEFAULT_SITE_SETTINGS;
}

export async function updateSiteSettings(data: Partial<SiteSettingsData>): Promise<SiteSettingsData> {
  const current = await getSiteSettings();
  const updated: SiteSettingsData = {
    ...current,
    ...data,
    siteName: data.siteName ?? current.siteName,
    tagline: data.tagline ?? current.tagline,
    logoUrl: data.logoUrl !== undefined ? data.logoUrl : current.logoUrl,
    faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl : current.faviconUrl,
    primaryColor: data.primaryColor !== undefined ? data.primaryColor : current.primaryColor,
    csWhatsapp: data.csWhatsapp ?? current.csWhatsapp,
    csEmail: data.csEmail ?? current.csEmail,
    csOperationalHours: data.csOperationalHours ?? current.csOperationalHours,
    address: data.address ?? current.address,
    bankAccounts: data.bankAccounts ?? current.bankAccounts,
    footerText: data.footerText !== undefined ? data.footerText : current.footerText,
  };

  try {
    await prisma.siteSetting.upsert({
      where: { id: 'default-setting' },
      update: {
        siteName: updated.siteName,
        tagline: updated.tagline,
        logoUrl: updated.logoUrl,
        faviconUrl: updated.faviconUrl,
        primaryColor: updated.primaryColor,
        csWhatsapp: updated.csWhatsapp,
        csEmail: updated.csEmail,
        csOperationalHours: updated.csOperationalHours,
        address: updated.address,
        bankAccounts: updated.bankAccounts as any,
      },
      create: {
        id: 'default-setting',
        siteName: updated.siteName,
        tagline: updated.tagline,
        logoUrl: updated.logoUrl,
        faviconUrl: updated.faviconUrl,
        primaryColor: updated.primaryColor,
        csWhatsapp: updated.csWhatsapp,
        csEmail: updated.csEmail,
        csOperationalHours: updated.csOperationalHours,
        address: updated.address,
        bankAccounts: updated.bankAccounts as any,
      },
    });
  } catch (e) {
    console.error('Failed updating site setting in prisma, saving to local store', e);
  }

  const store = readLocalStore();
  store.siteSettings = updated;
  writeLocalStore(store);

  return updated;
}

// --- ORDER METHODS ---
export async function createOrder(data: {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerAddress: string;
  notes?: string;
  items: { productId: string; qty: number }[];
}) {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Item pesanan tidak boleh kosong.');
  }

  // P0: Validasi ketat kuantitas produk > 0 dan bilangan bulat
  for (const item of data.items) {
    if (!item.productId || typeof item.productId !== 'string') {
      throw new Error('ID produk tidak valid.');
    }
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error('Kuantitas pesanan harus berupa bilangan bulat positif minimal 1.');
    }
  }

  // Resolve items with current products & prices
  const allProducts = await getProducts();
  const resolvedItems = data.items.map((item) => {
    const p = allProducts.find((prod) => prod.id === item.productId);
    if (!p) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
    if (p.stock !== null && p.stock !== undefined && p.stock < item.qty) {
      throw new Error(`Stok komoditas ${p.name} tidak mencukupi (tersedia: ${p.stock}).`);
    }
    return {
      productId: item.productId,
      qty: item.qty,
      price: p.price,
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        images: Array.isArray(p.images) ? (p.images as string[]) : [],
        unit: p.unit || 'kg',
      },
    };
  });

  const total = resolvedItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  let finalOrderCode = '';
  let order: any = null;
  const maxRetries = 5;

  try {
    // P0: Retry loop jika terjadi tabrakan unik pada orderCode
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const orderCode = generateOrderCode();
      try {
        order = await prisma.$transaction(async (tx) => {
          // 1. Potong stok secara atomik & kondisional untuk cegah race condition / overselling (R-6)
          for (const item of resolvedItems) {
            const updateRes = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.qty },
              },
              data: {
                stock: { decrement: item.qty },
              },
            });

            if (updateRes.count === 0) {
              throw new Error(
                `Stok komoditas "${item.product.name}" tidak mencukupi untuk jumlah pesanan ${item.qty}.`
              );
            }
          }

          // 2. Buat record Order beserta OrderItem dalam transaksi yang sama
          return await tx.order.create({
            data: {
              orderCode,
              buyerName: data.buyerName,
              buyerPhone: data.buyerPhone,
              buyerEmail: data.buyerEmail || null,
              buyerAddress: data.buyerAddress,
              notes: data.notes || null,
              total,
              status: 'PENDING_PAYMENT',
              items: {
                create: resolvedItems.map((item) => ({
                  productId: item.productId,
                  qty: item.qty,
                  price: item.price,
                })),
              },
            },
            include: {
              items: true,
              proof: true,
            },
          });
        });

        finalOrderCode = orderCode;
        break; // Berhasil!
      } catch (err: any) {
        if (
          err?.code === 'P2002' &&
          (err.meta?.target?.includes('orderCode') || JSON.stringify(err.meta || '').includes('orderCode')) &&
          attempt < maxRetries - 1
        ) {
          console.warn(`[createOrder] Collision on orderCode ${orderCode}, retrying (${attempt + 1}/${maxRetries})...`);
          continue;
        }
        throw err;
      }
    }

    if (!order) {
      throw new Error('Gagal membuat pesanan setelah beberapa percobaan.');
    }

    // 3. Catat calon pembeli sebagai prospek (R-7: belum DEAL, LTV/totalOrders belum bertambah)
    await recordLeadFromCheckout({
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: data.buyerEmail,
      buyerAddress: data.buyerAddress,
    }).catch((err) => console.error('Error auto-syncing lead from checkout:', err));

    return {
      ...order,
      items: order.items.map((it: any) => {
        const prod = resolvedItems.find((ri) => ri.productId === it.productId);
        return {
          ...it,
          product: prod?.product,
        };
      }),
    };
  } catch (err: any) {
    // Jika kegagalan disebabkan stok habis saat transaksi atomik, lempar langsung ke pengguna!
    if (err?.message?.includes('Stok komoditas') && err?.message?.includes('tidak mencukupi')) {
      throw err;
    }

    handleDbFallback('createOrder', err);

    const store = readLocalStore();
    if (!store.orders) store.orders = [];

    // Validasi stok di local store
    for (const item of resolvedItems) {
      const p = store.products.find((prod) => prod.id === item.productId);
      if (!p || (p.stock !== null && p.stock !== undefined && p.stock < item.qty)) {
        throw new Error(`Stok komoditas "${item.product.name}" tidak mencukupi.`);
      }
    }

    // Deduct stock in local store
    for (const item of resolvedItems) {
      const pIdx = store.products.findIndex((p) => p.id === item.productId);
      if (pIdx !== -1) {
        store.products[pIdx].stock = Math.max(0, store.products[pIdx].stock - item.qty);
      }
    }

    const orderCode = finalOrderCode || generateOrderCode();

    const newOrder: OrderData = {
      id: `ord-${Date.now()}`,
      orderCode,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: data.buyerEmail || null,
      buyerAddress: data.buyerAddress,
      notes: data.notes || null,
      trackingNumber: null,
      status: 'PENDING_PAYMENT',
      total,
      items: resolvedItems.map((it, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        orderId: `ord-${Date.now()}`,
        productId: it.productId,
        qty: it.qty,
        price: it.price,
        product: it.product,
      })),
      proof: null,
      createdAt: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);
    writeLocalStore(store);

    // Sync lead prospek in local fallback (R-7)
    await recordLeadFromCheckout({
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: data.buyerEmail,
      buyerAddress: data.buyerAddress,
    }).catch((e) => console.error('Error syncing lead in local fallback:', e));

    return newOrder;
  }
}

export async function getOrderByCode(orderCode: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: {
        items: true,
        proof: true,
      },
    });
    if (order) {
      const allProds = await getProducts();
      return {
        ...order,
        items: order.items.map((it) => {
          const prod = allProds.find((p) => p.id === it.productId);
          return {
            ...it,
            product: prod
              ? { id: prod.id, name: prod.name, slug: prod.slug, images: prod.images, unit: prod.unit || 'kg' }
              : { id: it.productId, name: '[Komoditas Diarsipkan]', slug: '#', images: [], unit: 'kg' },
          };
        }),
      };
    }
  } catch {}

  const store = readLocalStore();
  const found = (store.orders || []).find((o) => o.orderCode === orderCode);
  if (!found) return null;

  return {
    ...found,
    items: found.items.map((it) => {
      if (it.product) return it;
      const p = store.products.find((prod) => prod.id === it.productId);
      return {
        ...it,
        product: p
          ? { id: p.id, name: p.name, slug: p.slug, images: p.images, unit: p.unit || 'kg' }
          : { id: it.productId, name: '[Komoditas Diarsipkan]', slug: '#', images: [], unit: 'kg' },
      };
    }),
  };
}

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        proof: true,
      },
    });
    if (order) {
      const allProds = await getProducts();
      return {
        ...order,
        items: order.items.map((it) => {
          const prod = allProds.find((p) => p.id === it.productId);
          return {
            ...it,
            product: prod
              ? { id: prod.id, name: prod.name, slug: prod.slug, images: prod.images, unit: prod.unit || 'kg' }
              : { id: it.productId, name: '[Komoditas Diarsipkan]', slug: '#', images: [], unit: 'kg' },
          };
        }),
      };
    }
  } catch {}

  const store = readLocalStore();
  const found = (store.orders || []).find((o) => o.id === id);
  if (!found) return null;

  return {
    ...found,
    items: found.items.map((it) => {
      if (it.product) return it;
      const p = store.products.find((prod) => prod.id === it.productId);
      return {
        ...it,
        product: p
          ? { id: p.id, name: p.name, slug: p.slug, images: p.images, unit: p.unit || 'kg' }
          : { id: it.productId, name: '[Komoditas Diarsipkan]', slug: '#', images: [], unit: 'kg' },
      };
    }),
  };
}

export async function getOrders(options?: { status?: string; q?: string }) {
  try {
    const where: any = {};
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status;
    }
    if (options?.q) {
      where.OR = [
        { orderCode: { contains: options.q, mode: 'insensitive' } },
        { buyerName: { contains: options.q, mode: 'insensitive' } },
        { buyerPhone: { contains: options.q, mode: 'insensitive' } },
      ];
    }
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        proof: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const allProds = await getProducts();
    return orders.map((order) => ({
      ...order,
      items: order.items.map((it) => {
        const prod = allProds.find((p) => p.id === it.productId);
        return {
          ...it,
          product: prod
            ? { id: prod.id, name: prod.name, slug: prod.slug, images: prod.images, unit: prod.unit || 'kg' }
            : { id: it.productId, name: '[Komoditas Diarsipkan]', slug: '#', images: [], unit: 'kg' },
        };
      }),
    }));
  } catch {
    const store = readLocalStore();
    let orders = [...(store.orders || [])];

    if (options?.status && options.status !== 'ALL') {
      orders = orders.filter((o) => o.status === options.status);
    }
    if (options?.q) {
      const q = options.q.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.buyerPhone.includes(q)
      );
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function submitPaymentProof(
  orderId: string,
  data: {
    fileUrl: string;
    senderBank?: string;
    senderName?: string;
    amount?: number;
    note?: string;
  }
) {
  try {
    // P0: Status Gate — hanya izinkan jika PENDING_PAYMENT, PENDING_VERIFICATION, atau REJECTED
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      throw new Error('Pesanan tidak ditemukan.');
    }

    if (['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(currentOrder.status)) {
      throw new Error('Pesanan ini sudah lunas atau dalam proses pengiriman. Bukti pembayaran tidak dapat diubah.');
    }

    if (currentOrder.status === 'CANCELLED') {
      throw new Error('Pesanan ini telah dibatalkan.');
    }

    await prisma.paymentProof.upsert({
      where: { orderId },
      create: {
        orderId,
        fileUrl: data.fileUrl,
        senderBank: data.senderBank || null,
        senderName: data.senderName || null,
        amount: data.amount || null,
        note: data.note || null,
        status: 'PENDING',
      },
      update: {
        fileUrl: data.fileUrl,
        senderBank: data.senderBank || null,
        senderName: data.senderName || null,
        amount: data.amount || null,
        note: data.note || null,
        status: 'PENDING',
        rejectionReason: null,
        uploadedAt: new Date(),
      },
    });

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PENDING_VERIFICATION' },
      include: { proof: true, items: true },
    });
  } catch (err: any) {
    if (
      err?.message?.includes('sudah lunas atau dalam proses') ||
      err?.message?.includes('telah dibatalkan') ||
      err?.message?.includes('tidak ditemukan')
    ) {
      throw err;
    }

    handleDbFallback('submitPaymentProof', err);

    const store = readLocalStore();
    const oIdx = (store.orders || []).findIndex((o) => o.id === orderId || o.orderCode === orderId);
    if (oIdx === -1) throw new Error('Pesanan tidak ditemukan');

    const ord = store.orders[oIdx];
    if (['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(ord.status)) {
      throw new Error('Pesanan ini sudah lunas atau dalam proses pengiriman. Bukti pembayaran tidak dapat diubah.');
    }

    if (ord.status === 'CANCELLED') {
      throw new Error('Pesanan ini telah dibatalkan.');
    }

    const proof: PaymentProofData = {
      id: `proof-${Date.now()}`,
      orderId: store.orders[oIdx].id,
      fileUrl: data.fileUrl,
      senderBank: data.senderBank || null,
      senderName: data.senderName || null,
      amount: data.amount || null,
      note: data.note || null,
      status: 'PENDING',
      rejectionReason: null,
      uploadedAt: new Date().toISOString(),
    };

    store.orders[oIdx].proof = proof;
    store.orders[oIdx].status = 'PENDING_VERIFICATION';
    writeLocalStore(store);
    return store.orders[oIdx];
  }
}

export async function verifyPaymentProof(
  orderId: string,
  isApproved: boolean,
  notes?: string,
  verifiedBy?: string,
  verifiedById?: string // Sesi #17 (Temuan S): ID staf — source of truth akuntabilitas
) {
  const proofStatus = isApproved ? 'APPROVED' : 'REJECTED';
  const orderStatus = isApproved ? 'PAID' : 'PENDING_PAYMENT';

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) throw new Error('Pesanan tidak ditemukan');

    const wasAlreadyPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(existingOrder.status);

    await prisma.paymentProof.update({
      where: { orderId },
      data: {
        status: proofStatus,
        rejectionReason: isApproved ? null : notes || 'Bukti pembayaran tidak valid',
        verifiedBy: verifiedBy || 'Super Admin',
        verifiedById: verifiedById || null, // Sesi #17 (Temuan S)
        verifiedAt: new Date(),
      },
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus as any },
      include: { proof: true, items: true },
    });

    // R-7: Jika pembayaran disetujui (PAID) dan SEBELUMNYA BELUM PAID, catat status DEAL & akumulasi LTV di database CRM
    if (isApproved && !wasAlreadyPaid) {
      await recordCustomerDealFromPaidOrder(orderId).catch((err) =>
        console.error('Error recording CRM deal after payment verification:', err)
      );
    }

    // Koreksi kompensasi LTV jika pembayaran yang tadinya sudah lunas kini ditolak
    if (!isApproved && wasAlreadyPaid) {
      const normalizedPhone = normalizePhone(existingOrder.buyerPhone);
      if (normalizedPhone) {
        const cust = await prisma.customer.findUnique({ where: { phone: normalizedPhone } });
        if (cust) {
          await prisma.customer.update({
            where: { id: cust.id },
            data: {
              totalOrders: Math.max(0, cust.totalOrders - 1),
              totalSpent: Math.max(0, cust.totalSpent - Math.round(existingOrder.total)),
              notes: cust.notes
                ? `${cust.notes}\n[${new Date().toLocaleDateString('id-ID')}] Pembayaran pesanan ${existingOrder.orderCode} dibatalkan/ditolak (Koreksi LTV -Rp ${existingOrder.total.toLocaleString('id-ID')}).`
                : `Pembayaran pesanan ${existingOrder.orderCode} ditolak.`,
            },
          }).catch((err) => console.error('Error compensating CRM deal:', err));
        }
      }
    }

    return updated;
  } catch (err: any) {
    handleDbFallback('verifyPaymentProof', err);

    const store = readLocalStore();
    const oIdx = (store.orders || []).findIndex((o) => o.id === orderId || o.orderCode === orderId);
    if (oIdx === -1) throw new Error('Pesanan tidak ditemukan');

    const wasAlreadyPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(store.orders[oIdx].status);

    if (store.orders[oIdx].proof) {
      store.orders[oIdx].proof!.status = proofStatus;
      store.orders[oIdx].proof!.rejectionReason = isApproved ? null : notes || 'Bukti pembayaran tidak valid';
      store.orders[oIdx].proof!.verifiedBy = verifiedBy || 'Super Admin';
      store.orders[oIdx].proof!.verifiedAt = new Date().toISOString();
    }

    store.orders[oIdx].status = orderStatus as any;
    writeLocalStore(store);

    // R-7: Catat deal CRM pada fallback lokal hanya jika sebelumnya belum PAID
    if (isApproved && !wasAlreadyPaid) {
      await recordCustomerDealFromPaidOrder(orderId).catch((e) =>
        console.error('Error recording CRM deal in local fallback:', e)
      );
    }

    // Koreksi kompensasi LTV pada fallback lokal jika pembayaran yang tadinya lunas kini ditolak
    if (!isApproved && wasAlreadyPaid) {
      const normalizedPhone = normalizePhone(store.orders[oIdx].buyerPhone);
      if (normalizedPhone && store.customers) {
        const cIdx = store.customers.findIndex((c) => normalizePhone(c.phone) === normalizedPhone);
        if (cIdx !== -1) {
          store.customers[cIdx].totalOrders = Math.max(0, (store.customers[cIdx].totalOrders || 0) - 1);
          store.customers[cIdx].totalSpent = Math.max(0, (store.customers[cIdx].totalSpent || 0) - Math.round(store.orders[oIdx].total));
        }
      }
    }

    return store.orders[oIdx];
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: any,
  notes?: string,
  trackingNumber?: string
) {
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) throw new Error('Pesanan tidak ditemukan');

  if (status !== undefined && status !== currentOrder.status) {
    if (!isValidOrderTransition(currentOrder.status, status)) {
      throw new Error(`Transisi status pesanan dari '${currentOrder.status}' ke '${status}' tidak diizinkan.`);
    }
  }

  const prevStatus = currentOrder.status;
  const isCancelling =
    (status === 'CANCELLED' || status === 'REJECTED') &&
    prevStatus !== 'CANCELLED' &&
    prevStatus !== 'REJECTED';
  const wasPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(prevStatus);

  try {
    return await prisma.$transaction(async (tx) => {
      // R-5: Kembalikan stok jika pesanan dibatalkan atau ditolak permanen
      if (isCancelling && currentOrder.items && currentOrder.items.length > 0) {
        for (const item of currentOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          }).catch((e) => console.warn(`Restock warning for product ${item.productId}:`, e?.message));
        }
      }

      // R-7: Kompensasi LTV dan jumlah pesanan jika transaksi yang sudah sempat lunas dibatalkan
      if (isCancelling && wasPaid) {
        const normalizedPhone = normalizePhone(currentOrder.buyerPhone);
        if (normalizedPhone) {
          const cust = await tx.customer.findUnique({ where: { phone: normalizedPhone } });
          if (cust) {
            await tx.customer.update({
              where: { id: cust.id },
              data: {
                totalOrders: Math.max(0, cust.totalOrders - 1),
                totalSpent: Math.max(0, cust.totalSpent - Math.round(currentOrder.total)),
                notes: cust.notes
                  ? `${cust.notes}\n[${new Date().toLocaleDateString('id-ID')}] Pesanan ${currentOrder.orderCode} dibatalkan (Koreksi LTV -Rp ${currentOrder.total.toLocaleString('id-ID')}).`
                  : `Pesanan ${currentOrder.orderCode} dibatalkan.`,
              },
            });
          }
        }
      }

      const updateData: any = { status };
      if (notes !== undefined) updateData.notes = notes;
      if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;

      return await tx.order.update({
        where: { id: currentOrder.id },
        data: updateData,
        include: { proof: true, items: true },
      });
    });
  } catch (err: any) {
    handleDbFallback('updateOrderStatus', err);

    const store = readLocalStore();
    const oIdx = (store.orders || []).findIndex((o) => o.id === orderId || o.orderCode === orderId);
    if (oIdx === -1) throw new Error('Pesanan tidak ditemukan');

    // R-5: Restock pada local fallback
    if (isCancelling && currentOrder.items && currentOrder.items.length > 0) {
      for (const item of currentOrder.items) {
        const pIdx = store.products.findIndex((p) => p.id === item.productId);
        if (pIdx !== -1) {
          store.products[pIdx].stock = (store.products[pIdx].stock || 0) + item.qty;
        }
      }
    }

    // R-7: Kompensasi metrik customer pada local fallback
    if (isCancelling && wasPaid) {
      const normalizedPhone = normalizePhone(currentOrder.buyerPhone);
      if (normalizedPhone && store.customers) {
        const cIdx = store.customers.findIndex((c) => normalizePhone(c.phone) === normalizedPhone);
        if (cIdx !== -1) {
          store.customers[cIdx].totalOrders = Math.max(0, (store.customers[cIdx].totalOrders || 0) - 1);
          store.customers[cIdx].totalSpent = Math.max(0, (store.customers[cIdx].totalSpent || 0) - Math.round(currentOrder.total));
        }
      }
    }

    store.orders[oIdx].status = status;
    if (notes !== undefined) store.orders[oIdx].notes = notes;
    if (trackingNumber !== undefined) store.orders[oIdx].trackingNumber = trackingNumber;

    writeLocalStore(store);
    return store.orders[oIdx];
  }
}

// --- ARTICLE METHODS ---
export async function getArticles(options?: { publishedOnly?: boolean; q?: string }) {
  try {
    const where: any = {};
    if (options?.publishedOnly) {
      where.isPublished = true;
    }
    if (options?.q) {
      where.OR = [
        { title: { contains: options.q, mode: 'insensitive' } },
        { metaDesc: { contains: options.q, mode: 'insensitive' } },
      ];
    }
    return await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    const store = readLocalStore();
    let articles = [...(store.articles || [])];
    if (options?.publishedOnly) {
      articles = articles.filter((a) => a.isPublished);
    }
    if (options?.q) {
      const q = options.q.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.metaDesc && a.metaDesc.toLowerCase().includes(q))
      );
    }
    return articles.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (article) return article;
  } catch {}

  const store = readLocalStore();
  return (store.articles || []).find((a) => a.slug === slug) || null;
}

export async function getArticleById(id: string) {
  try {
    const article = await prisma.article.findUnique({ where: { id } });
    if (article) return article;
  } catch {}

  const store = readLocalStore();
  return (store.articles || []).find((a) => a.id === id) || null;
}

export async function createArticle(data: {
  title: string;
  slug?: string;
  htmlContent: string;
  thumbnail?: string | null;
  metaDesc?: string | null;
  isPublished?: boolean;
}) {
  const finalSlug = data.slug ? slugify(data.slug) : slugify(data.title);
  const cleanHtml = sanitize(data.htmlContent);
  const publishedAt = data.isPublished ? new Date() : null;

  try {
    return await prisma.article.create({
      data: {
        title: data.title,
        slug: finalSlug,
        htmlContent: cleanHtml,
        thumbnail: data.thumbnail || null,
        metaDesc: data.metaDesc || null,
        isPublished: Boolean(data.isPublished),
        publishedAt,
      },
    });
  } catch {
    const store = readLocalStore();
    if (!store.articles) store.articles = [];

    const newArticle: ArticleItem = {
      id: `art-${Date.now()}`,
      title: data.title,
      slug: finalSlug,
      htmlContent: cleanHtml,
      thumbnail: data.thumbnail || null,
      metaDesc: data.metaDesc || null,
      isPublished: Boolean(data.isPublished),
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    store.articles.unshift(newArticle);
    writeLocalStore(store);
    return newArticle;
  }
}

export async function updateArticle(
  id: string,
  data: {
    title?: string;
    slug?: string;
    htmlContent?: string;
    thumbnail?: string | null;
    metaDesc?: string | null;
    isPublished?: boolean;
  }
) {
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = slugify(data.slug);
  if (data.htmlContent !== undefined) updateData.htmlContent = sanitize(data.htmlContent);
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail || null;
  if (data.metaDesc !== undefined) updateData.metaDesc = data.metaDesc || null;
  if (data.isPublished !== undefined) {
    updateData.isPublished = Boolean(data.isPublished);
    if (data.isPublished) updateData.publishedAt = new Date();
  }

  try {
    return await prisma.article.update({
      where: { id },
      data: updateData,
    });
  } catch {
    const store = readLocalStore();
    const idx = (store.articles || []).findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Artikel tidak ditemukan');

    store.articles[idx] = {
      ...store.articles[idx],
      title: data.title !== undefined ? data.title : store.articles[idx].title,
      slug: data.slug !== undefined ? slugify(data.slug) : store.articles[idx].slug,
      htmlContent:
        data.htmlContent !== undefined
          ? sanitize(data.htmlContent)
          : store.articles[idx].htmlContent,
      thumbnail:
        data.thumbnail !== undefined
          ? data.thumbnail || null
          : store.articles[idx].thumbnail,
      metaDesc:
        data.metaDesc !== undefined
          ? data.metaDesc || null
          : store.articles[idx].metaDesc,
      isPublished:
        data.isPublished !== undefined
          ? Boolean(data.isPublished)
          : store.articles[idx].isPublished,
      publishedAt: data.isPublished
        ? new Date().toISOString()
        : store.articles[idx].publishedAt,
    };

    writeLocalStore(store);
    return store.articles[idx];
  }
}

export async function deleteArticle(id: string) {
  try {
    return await prisma.article.delete({ where: { id } });
  } catch {
    const store = readLocalStore();
    store.articles = (store.articles || []).filter((a) => a.id !== id);
    writeLocalStore(store);
    return { success: true };
  }
}

// --- CONTENT BLOCK METHODS ---
export async function getContentBlocks(): Promise<ContentBlockItem[]> {
  try {
    const blocks = await prisma.contentBlock.findMany();
    if (blocks && blocks.length > 0) {
      return blocks.map((b) => ({
        id: b.id,
        key: b.key,
        title: b.title,
        content: b.content,
        updatedAt: b.updatedAt.toISOString(),
      }));
    }
  } catch {}

  const store = readLocalStore();
  return store.contentBlocks || DEFAULT_CONTENT_BLOCKS;
}

export async function getContentBlockByKey(key: string): Promise<ContentBlockItem | null> {
  try {
    const b = await prisma.contentBlock.findUnique({ where: { key } });
    if (b) {
      return {
        id: b.id,
        key: b.key,
        title: b.title,
        content: b.content,
        updatedAt: b.updatedAt.toISOString(),
      };
    }
  } catch {}

  const store = readLocalStore();
  const found = (store.contentBlocks || DEFAULT_CONTENT_BLOCKS).find((b) => b.key === key);
  return found || null;
}

export async function updateContentBlock(
  key: string,
  data: { title?: string | null; content: string }
): Promise<ContentBlockItem> {
  const sanitizedContent = sanitize(data.content);
  const now = new Date().toISOString();

  try {
    const updated = await prisma.contentBlock.upsert({
      where: { key },
      update: {
        title: data.title !== undefined ? data.title : undefined,
        content: sanitizedContent,
      },
      create: {
        key,
        title: data.title || null,
        content: sanitizedContent,
      },
    });

    const store = readLocalStore();
    if (!store.contentBlocks) store.contentBlocks = [...DEFAULT_CONTENT_BLOCKS];
    const idx = store.contentBlocks.findIndex((b) => b.key === key);
    const item: ContentBlockItem = {
      id: updated.id,
      key,
      title: updated.title,
      content: updated.content,
      updatedAt: now,
    };
    if (idx !== -1) {
      store.contentBlocks[idx] = item;
    } else {
      store.contentBlocks.push(item);
    }
    writeLocalStore(store);

    return item;
  } catch {
    const store = readLocalStore();
    if (!store.contentBlocks) store.contentBlocks = [...DEFAULT_CONTENT_BLOCKS];
    const idx = store.contentBlocks.findIndex((b) => b.key === key);
    const item: ContentBlockItem = {
      id: idx !== -1 ? store.contentBlocks[idx].id : `block-${key}`,
      key,
      title: data.title !== undefined ? data.title : (idx !== -1 ? store.contentBlocks[idx].title : null),
      content: sanitizedContent,
      updatedAt: now,
    };
    if (idx !== -1) {
      store.contentBlocks[idx] = item;
    } else {
      store.contentBlocks.push(item);
    }
    writeLocalStore(store);
    return item;
  }
}

// --- FAQ METHODS ---
export async function getFAQs(options?: { activeOnly?: boolean }): Promise<FAQItem[]> {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: options?.activeOnly ? { isActive: true } : undefined,
      orderBy: { order: 'asc' },
    });
    if (faqs && faqs.length > 0) {
      return faqs.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        order: f.order,
        isActive: f.isActive,
      }));
    }
  } catch {}

  const store = readLocalStore();
  let list = store.faqs || DEFAULT_FAQS;
  if (options?.activeOnly) {
    list = list.filter((f) => f.isActive);
  }
  return [...list].sort((a, b) => a.order - b.order);
}

export async function getFAQById(id: string): Promise<FAQItem | null> {
  try {
    const f = await prisma.fAQ.findUnique({ where: { id } });
    if (f) {
      return {
        id: f.id,
        question: f.question,
        answer: f.answer,
        order: f.order,
        isActive: f.isActive,
      };
    }
  } catch {}

  const store = readLocalStore();
  const found = (store.faqs || DEFAULT_FAQS).find((f) => f.id === id);
  return found || null;
}

export async function createFAQ(data: {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}): Promise<FAQItem> {
  const sanitizedAnswer = sanitize(data.answer);
  const newOrder = data.order ?? 0;
  const newActive = data.isActive ?? true;

  try {
    const created = await prisma.fAQ.create({
      data: {
        question: data.question,
        answer: sanitizedAnswer,
        order: newOrder,
        isActive: newActive,
      },
    });

    const store = readLocalStore();
    if (!store.faqs) store.faqs = [...DEFAULT_FAQS];
    const item: FAQItem = {
      id: created.id,
      question: created.question,
      answer: created.answer,
      order: created.order,
      isActive: created.isActive,
    };
    store.faqs.push(item);
    writeLocalStore(store);

    return item;
  } catch {
    const store = readLocalStore();
    if (!store.faqs) store.faqs = [...DEFAULT_FAQS];
    const item: FAQItem = {
      id: `faq-${Date.now()}`,
      question: data.question,
      answer: sanitizedAnswer,
      order: newOrder,
      isActive: newActive,
    };
    store.faqs.push(item);
    writeLocalStore(store);
    return item;
  }
}

export async function updateFAQ(
  id: string,
  data: Partial<{ question: string; answer: string; order: number; isActive: boolean }>
): Promise<FAQItem> {
  const sanitizedAnswer = data.answer !== undefined ? sanitize(data.answer) : undefined;

  try {
    const updated = await prisma.fAQ.update({
      where: { id },
      data: {
        question: data.question,
        answer: sanitizedAnswer,
        order: data.order,
        isActive: data.isActive,
      },
    });

    const store = readLocalStore();
    if (!store.faqs) store.faqs = [...DEFAULT_FAQS];
    const idx = store.faqs.findIndex((f) => f.id === id);
    const item: FAQItem = {
      id: updated.id,
      question: updated.question,
      answer: updated.answer,
      order: updated.order,
      isActive: updated.isActive,
    };
    if (idx !== -1) {
      store.faqs[idx] = item;
    }
    writeLocalStore(store);

    return item;
  } catch {
    const store = readLocalStore();
    if (!store.faqs) store.faqs = [...DEFAULT_FAQS];
    const idx = store.faqs.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('FAQ tidak ditemukan');

    const item: FAQItem = {
      ...store.faqs[idx],
      question: data.question !== undefined ? data.question : store.faqs[idx].question,
      answer: sanitizedAnswer !== undefined ? sanitizedAnswer : store.faqs[idx].answer,
      order: data.order !== undefined ? Number(data.order) : store.faqs[idx].order,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : store.faqs[idx].isActive,
    };
    store.faqs[idx] = item;
    writeLocalStore(store);
    return item;
  }
}

export async function deleteFAQ(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.fAQ.delete({ where: { id } });
  } catch {}

  const store = readLocalStore();
  if (store.faqs) {
    store.faqs = store.faqs.filter((f) => f.id !== id);
    writeLocalStore(store);
  }
  return { success: true };
}

// --- DASHBOARD STATS METHODS ---
export async function getAdminDashboardStats() {
  const [orders, products, articles, customers, settings] = await Promise.all([
    getOrders(),
    getProducts(),
    getArticles(),
    getCustomers(),
    getSiteSettings(),
  ]);

  const paidStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
  const totalRevenue = orders
    .filter((o) => paidStatuses.includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingVerificationCount = orders.filter((o) => o.status === 'PENDING_VERIFICATION').length;
  const pendingPaymentCount = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
  const inShippingCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalOrdersCount = orders.length;

  const totalProductsCount = products.filter((p) => p.isActive !== false).length;
  const totalArticlesCount = articles.filter((a) => a.isPublished).length;

  const totalCustomersCount = customers.filter((c) => c.type === 'CUSTOMER').length;
  const totalProspectsCount = customers.filter((c) => c.type === 'PROSPECT').length;
  const totalLeadsCount = customers.length;

  const defaultThreshold = settings.lowStockAlertThreshold ?? 50;

  const lowStockProducts = products
    .filter((p) => p.stock < (p.minStock !== undefined ? p.minStock : defaultThreshold))
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      unit: p.unit || 'kg',
      minStock: p.minStock ?? defaultThreshold,
      price: p.price,
      image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null,
    }));

  const recentOrders = orders.slice(0, 7).map((o) => ({
    id: o.id,
    orderCode: o.orderCode,
    buyerName: o.buyerName,
    buyerPhone: o.buyerPhone,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
    itemsCount: o.items?.length || 0,
    hasProof: Boolean(o.proof),
  }));

  return {
    totalRevenue,
    pendingVerificationCount,
    pendingPaymentCount,
    inShippingCount,
    completedCount,
    totalOrdersCount,
    totalProductsCount,
    totalArticlesCount,
    totalCustomersCount,
    totalProspectsCount,
    totalLeadsCount,
    lowStockProducts,
    recentOrders,
  };
}

// --- CUSTOMER & CRM METHODS ---

export async function getCustomers(options?: {
  q?: string;
  type?: string;
  status?: string;
}): Promise<CustomerItem[]> {
  try {
    const where: any = {};
    if (options?.type && options.type !== 'ALL') {
      where.type = options.type as any;
    }
    if (options?.status && options.status !== 'ALL') {
      where.status = options.status as any;
    }
    if (options?.q) {
      const q = options.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { preferredCommodity: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return customers.map((c) => ({
      ...c,
      lastContactAt: c.lastContactAt ? c.lastContactAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })) as CustomerItem[];
  } catch {
    const store = readLocalStore();
    let list = store.customers || DEFAULT_CUSTOMERS;

    if (options?.type && options.type !== 'ALL') {
      list = list.filter((c) => c.type === options.type);
    }
    if (options?.status && options.status !== 'ALL') {
      list = list.filter((c) => c.status === options.status);
    }
    if (options?.q) {
      const q = options.q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.preferredCommodity && c.preferredCommodity.toLowerCase().includes(q))
      );
    }

    return [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}

export async function getCustomerById(id: string): Promise<CustomerItem | null> {
  try {
    const c = await prisma.customer.findUnique({
      where: { id },
    });
    if (!c) return null;
    return {
      ...c,
      lastContactAt: c.lastContactAt ? c.lastContactAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    } as CustomerItem;
  } catch {
    const store = readLocalStore();
    const c = (store.customers || DEFAULT_CUSTOMERS).find((item) => item.id === id);
    return c || null;
  }
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  company?: string | null;
  email?: string | null;
  address?: string | null;
  type?: 'PROSPECT' | 'CUSTOMER';
  status?: 'BARU' | 'DIHUBUNGI' | 'SAMPEL_DIKIRIM' | 'NEGOSIASI' | 'DEAL' | 'BATAL';
  source?: string;
  preferredCommodity?: string | null;
  estimatedVolume?: string | null;
  notes?: string | null;
}): Promise<CustomerItem> {
  const normalizedPhone = normalizePhone(data.phone);
  if (!normalizedPhone) {
    throw new Error('Nomor telepon / WhatsApp wajib diisi.');
  }

  const cleanName = sanitize(data.name.trim());
  const cleanCompany = data.company ? sanitize(data.company.trim()) : null;
  const cleanEmail = data.email ? sanitize(data.email.trim()) : null;
  const cleanAddress = data.address ? sanitize(data.address.trim()) : null;
  const cleanCommodity = data.preferredCommodity ? sanitize(data.preferredCommodity.trim()) : null;
  const cleanVolume = data.estimatedVolume ? sanitize(data.estimatedVolume.trim()) : null;
  const cleanNotes = data.notes ? sanitize(data.notes.trim()) : null;
  const type = data.type || 'PROSPECT';
  const status = data.status || 'BARU';
  const source = data.source || 'MANUAL_ADMIN';

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existing) {
      throw new Error(`Kontak dengan nomor WhatsApp ${normalizedPhone} sudah terdaftar (${existing.name}).`);
    }

    const created = await prisma.customer.create({
      data: {
        name: cleanName,
        phone: normalizedPhone,
        company: cleanCompany,
        email: cleanEmail,
        address: cleanAddress,
        type: type as any,
        status: status as any,
        source,
        preferredCommodity: cleanCommodity,
        estimatedVolume: cleanVolume,
        notes: cleanNotes,
        totalOrders: 0,
        totalSpent: 0,
        lastContactAt: new Date(),
      },
    });

    return {
      ...created,
      lastContactAt: created.lastContactAt ? created.lastContactAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    } as CustomerItem;
  } catch (err: any) {
    if (err.message && err.message.includes('sudah terdaftar')) {
      throw err;
    }
    const store = readLocalStore();
    if (!store.customers) store.customers = [...DEFAULT_CUSTOMERS];

    const duplicate = store.customers.find((c) => normalizePhone(c.phone) === normalizedPhone);
    if (duplicate) {
      throw new Error(`Kontak dengan nomor WhatsApp ${normalizedPhone} sudah terdaftar (${duplicate.name}).`);
    }

    const now = new Date().toISOString();
    const newCustomer: CustomerItem = {
      id: `cust-${Date.now()}`,
      name: cleanName,
      company: cleanCompany,
      email: cleanEmail,
      phone: normalizedPhone,
      address: cleanAddress,
      type,
      status,
      source,
      preferredCommodity: cleanCommodity,
      estimatedVolume: cleanVolume,
      notes: cleanNotes,
      totalOrders: 0,
      totalSpent: 0,
      lastContactAt: now,
      createdAt: now,
      updatedAt: now,
    };

    store.customers.unshift(newCustomer);
    writeLocalStore(store);
    return newCustomer;
  }
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    company: string | null;
    email: string | null;
    address: string | null;
    type: 'PROSPECT' | 'CUSTOMER';
    status: 'BARU' | 'DIHUBUNGI' | 'SAMPEL_DIKIRIM' | 'NEGOSIASI' | 'DEAL' | 'BATAL';
    source: string;
    preferredCommodity: string | null;
    estimatedVolume: string | null;
    notes: string | null;
    totalOrders: number;
    totalSpent: number;
    lastContactAt: string | null;
  }>
): Promise<CustomerItem> {
  const updatePayload: any = {};
  if (data.name !== undefined) updatePayload.name = sanitize(data.name.trim());
  if (data.phone !== undefined) updatePayload.phone = normalizePhone(data.phone);
  if (data.company !== undefined) updatePayload.company = data.company ? sanitize(data.company.trim()) : null;
  if (data.email !== undefined) updatePayload.email = data.email ? sanitize(data.email.trim()) : null;
  if (data.address !== undefined) updatePayload.address = data.address ? sanitize(data.address.trim()) : null;
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.source !== undefined) updatePayload.source = data.source;
  if (data.preferredCommodity !== undefined) updatePayload.preferredCommodity = data.preferredCommodity ? sanitize(data.preferredCommodity.trim()) : null;
  if (data.estimatedVolume !== undefined) updatePayload.estimatedVolume = data.estimatedVolume ? sanitize(data.estimatedVolume.trim()) : null;
  if (data.notes !== undefined) updatePayload.notes = data.notes ? sanitize(data.notes.trim()) : null;
  if (data.totalOrders !== undefined) updatePayload.totalOrders = data.totalOrders;
  if (data.totalSpent !== undefined) updatePayload.totalSpent = Math.round(data.totalSpent);
  if (data.lastContactAt !== undefined) updatePayload.lastContactAt = data.lastContactAt ? new Date(data.lastContactAt) : null;

  try {
    const updated = await prisma.customer.update({
      where: { id },
      data: updatePayload,
    });
    return {
      ...updated,
      lastContactAt: updated.lastContactAt ? updated.lastContactAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    } as CustomerItem;
  } catch {
    const store = readLocalStore();
    if (!store.customers) store.customers = [...DEFAULT_CUSTOMERS];

    const idx = store.customers.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Customer dengan ID ${id} tidak ditemukan.`);
    }

    const now = new Date().toISOString();
    store.customers[idx] = {
      ...store.customers[idx],
      ...updatePayload,
      lastContactAt: data.lastContactAt !== undefined ? data.lastContactAt : store.customers[idx].lastContactAt,
      updatedAt: now,
    };
    writeLocalStore(store);
    return store.customers[idx];
  }
}

export async function deleteCustomer(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.customer.delete({
      where: { id },
    });
    return { success: true };
  } catch {
    const store = readLocalStore();
    if (store.customers) {
      store.customers = store.customers.filter((c) => c.id !== id);
      writeLocalStore(store);
    }
    return { success: true };
  }
}

// R-7: Siklus Pelanggan CRM Tahap 1 - Pencatatan Prospek dari Checkout (Belum Lunas / Pending)
export async function recordLeadFromCheckout(order: {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerAddress?: string | null;
}): Promise<CustomerItem | null> {
  const normalizedPhone = normalizePhone(order.buyerPhone);
  if (!normalizedPhone) return null;

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: existing.name || order.buyerName,
          email: existing.email || order.buyerEmail || null,
          address: order.buyerAddress || existing.address || null,
          lastContactAt: new Date(),
        },
      });
      return {
        ...updated,
        lastContactAt: updated.lastContactAt ? updated.lastContactAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      } as CustomerItem;
    } else {
      const created = await prisma.customer.create({
        data: {
          name: order.buyerName,
          phone: normalizedPhone,
          email: order.buyerEmail || null,
          address: order.buyerAddress || null,
          type: 'PROSPECT',
          status: 'BARU',
          source: 'CHECKOUT',
          notes: 'Tercatat otomatis dari formulir checkout (menunggu pembayaran).',
          totalOrders: 0,
          totalSpent: 0,
          lastContactAt: new Date(),
        },
      });
      return {
        ...created,
        lastContactAt: created.lastContactAt ? created.lastContactAt.toISOString() : null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      } as CustomerItem;
    }
  } catch (err: any) {
    handleDbFallback('recordLeadFromCheckout', err);

    const store = readLocalStore();
    if (!store.customers) store.customers = [...DEFAULT_CUSTOMERS];

    const idx = store.customers.findIndex((c) => normalizePhone(c.phone) === normalizedPhone);
    const now = new Date().toISOString();

    if (idx !== -1) {
      const c = store.customers[idx];
      store.customers[idx] = {
        ...c,
        name: c.name || order.buyerName,
        email: c.email || order.buyerEmail || null,
        address: order.buyerAddress || c.address || null,
        lastContactAt: now,
        updatedAt: now,
      };
      writeLocalStore(store);
      return store.customers[idx];
    } else {
      const newCust: CustomerItem = {
        id: `cust-${Date.now()}`,
        name: order.buyerName,
        company: null,
        email: order.buyerEmail || null,
        phone: normalizedPhone,
        address: order.buyerAddress || null,
        type: 'PROSPECT',
        status: 'BARU',
        source: 'CHECKOUT',
        preferredCommodity: null,
        estimatedVolume: null,
        notes: 'Tercatat otomatis dari formulir checkout (menunggu pembayaran).',
        totalOrders: 0,
        totalSpent: 0,
        lastContactAt: now,
        createdAt: now,
        updatedAt: now,
      };
      store.customers.unshift(newCust);
      writeLocalStore(store);
      return newCust;
    }
  }
}

// R-7: Siklus Pelanggan CRM Tahap 2 - Akumulasi LTV & Status DEAL saat Pembayaran Diverifikasi Lunas
export async function recordCustomerDealFromPaidOrder(orderId: string): Promise<CustomerItem | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const normalizedPhone = normalizePhone(order.buyerPhone);
  if (!normalizedPhone) return null;

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      // P0: Idempotency check — jangan gandakan LTV jika order ini sudah pernah dicatat
      const orderAlreadyCounted =
        existing.notes &&
        existing.notes.includes(`Pembayaran pesanan ${order.orderCode} diverifikasi lunas`);

      if (orderAlreadyCounted) {
        return {
          ...existing,
          lastContactAt: existing.lastContactAt ? existing.lastContactAt.toISOString() : null,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
        } as CustomerItem;
      }

      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          type: 'CUSTOMER',
          status: 'DEAL',
          totalOrders: { increment: 1 },
          totalSpent: { increment: Math.round(order.total) },
          lastContactAt: new Date(),
          notes: existing.notes
            ? `${existing.notes}\n[${new Date().toLocaleDateString('id-ID')}] Pembayaran pesanan ${order.orderCode} diverifikasi lunas (Rp ${order.total.toLocaleString('id-ID')}).`
            : `Pembayaran pesanan ${order.orderCode} diverifikasi lunas (Rp ${order.total.toLocaleString('id-ID')}).`,
        },
      });
      return {
        ...updated,
        lastContactAt: updated.lastContactAt ? updated.lastContactAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      } as CustomerItem;
    } else {
      const created = await prisma.customer.create({
        data: {
          name: order.buyerName,
          phone: normalizedPhone,
          email: order.buyerEmail || null,
          address: order.buyerAddress || null,
          type: 'CUSTOMER',
          status: 'DEAL',
          source: 'CHECKOUT',
          totalOrders: 1,
          totalSpent: Math.round(order.total),
          notes: `Pembayaran pesanan ${order.orderCode} diverifikasi lunas (Rp ${order.total.toLocaleString('id-ID')}).`,
          lastContactAt: new Date(),
        },
      });
      return {
        ...created,
        lastContactAt: created.lastContactAt ? created.lastContactAt.toISOString() : null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      } as CustomerItem;
    }
  } catch (err: any) {
    handleDbFallback('recordCustomerDealFromPaidOrder', err);

    const store = readLocalStore();
    if (!store.customers) store.customers = [...DEFAULT_CUSTOMERS];

    const idx = store.customers.findIndex((c) => normalizePhone(c.phone) === normalizedPhone);
    const now = new Date().toISOString();

    if (idx !== -1) {
      const c = store.customers[idx];
      const orderAlreadyCounted =
        c.notes && c.notes.includes(`Pembayaran pesanan ${order.orderCode} diverifikasi lunas`);
      if (orderAlreadyCounted) {
        return c;
      }
      store.customers[idx] = {
        ...c,
        name: c.name || order.buyerName,
        email: c.email || order.buyerEmail || null,
        address: order.buyerAddress || c.address || null,
        type: 'CUSTOMER',
        status: 'DEAL',
        totalOrders: (c.totalOrders || 0) + 1,
        totalSpent: (c.totalSpent || 0) + Math.round(order.total),
        lastContactAt: now,
        updatedAt: now,
        notes: c.notes
          ? `${c.notes}\n[${new Date().toLocaleDateString('id-ID')}] Pembayaran pesanan ${order.orderCode} diverifikasi lunas.`
          : `Pembayaran pesanan ${order.orderCode} diverifikasi lunas.`,
      };
      writeLocalStore(store);
      return store.customers[idx];
    } else {
      const newCust: CustomerItem = {
        id: `cust-${Date.now()}`,
        name: order.buyerName,
        company: null,
        email: order.buyerEmail || null,
        phone: normalizedPhone,
        address: order.buyerAddress || null,
        type: 'CUSTOMER',
        status: 'DEAL',
        source: 'CHECKOUT',
        preferredCommodity: null,
        estimatedVolume: null,
        notes: `Pembayaran pesanan ${order.orderCode} diverifikasi lunas.`,
        totalOrders: 1,
        totalSpent: Math.round(order.total),
        lastContactAt: now,
        createdAt: now,
        updatedAt: now,
      };
      store.customers.unshift(newCust);
      writeLocalStore(store);
      return newCust;
    }
  }
}

// Fungsi pembungkus terpadu untuk backward compatibility
export async function syncCustomerFromOrder(order: {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerAddress?: string | null;
  total: number;
  isPaid?: boolean;
}): Promise<CustomerItem | null> {
  if (order.isPaid) {
    const normalizedPhone = normalizePhone(order.buyerPhone);
    if (!normalizedPhone) return null;

    try {
      const existing = await prisma.customer.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existing) {
        const updated = await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: existing.name || order.buyerName,
            email: existing.email || order.buyerEmail || null,
            address: order.buyerAddress || existing.address || null,
            type: 'CUSTOMER',
            status: 'DEAL',
            totalOrders: { increment: 1 },
            totalSpent: { increment: Math.round(order.total) },
            lastContactAt: new Date(),
          },
        });
        return {
          ...updated,
          lastContactAt: updated.lastContactAt ? updated.lastContactAt.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        } as CustomerItem;
      } else {
        const created = await prisma.customer.create({
          data: {
            name: order.buyerName,
            phone: normalizedPhone,
            email: order.buyerEmail || null,
            address: order.buyerAddress || null,
            type: 'CUSTOMER',
            status: 'DEAL',
            source: 'CHECKOUT',
            notes: 'Dibuat otomatis dari transaksi lunas.',
            totalOrders: 1,
            totalSpent: Math.round(order.total),
            lastContactAt: new Date(),
          },
        });
        return {
          ...created,
          lastContactAt: created.lastContactAt ? created.lastContactAt.toISOString() : null,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        } as CustomerItem;
      }
    } catch (err: any) {
      handleDbFallback('syncCustomerFromOrder(paid)', err);

      const store = readLocalStore();
      if (!store.customers) store.customers = [...DEFAULT_CUSTOMERS];

      const idx = store.customers.findIndex((c) => normalizePhone(c.phone) === normalizedPhone);
      const now = new Date().toISOString();

      if (idx !== -1) {
        const c = store.customers[idx];
        store.customers[idx] = {
          ...c,
          name: c.name || order.buyerName,
          email: c.email || order.buyerEmail || null,
          address: order.buyerAddress || c.address || null,
          type: 'CUSTOMER',
          status: 'DEAL',
          totalOrders: (c.totalOrders || 0) + 1,
          totalSpent: (c.totalSpent || 0) + Math.round(order.total),
          lastContactAt: now,
          updatedAt: now,
        };
        writeLocalStore(store);
        return store.customers[idx];
      } else {
        const newCust: CustomerItem = {
          id: `cust-${Date.now()}`,
          name: order.buyerName,
          company: null,
          email: order.buyerEmail || null,
          phone: normalizedPhone,
          address: order.buyerAddress || null,
          type: 'CUSTOMER',
          status: 'DEAL',
          source: 'CHECKOUT',
          preferredCommodity: null,
          estimatedVolume: null,
          notes: 'Dibuat otomatis dari transaksi lunas.',
          totalOrders: 1,
          totalSpent: Math.round(order.total),
          lastContactAt: now,
          createdAt: now,
          updatedAt: now,
        };
        store.customers.unshift(newCust);
        writeLocalStore(store);
        return newCust;
      }
    }
  }

  // Jika belum dibayar (default saat form checkout submit), catat sebagai prospek lead awal
  return recordLeadFromCheckout({
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    buyerEmail: order.buyerEmail,
    buyerAddress: order.buyerAddress,
  });
}

export async function createOrUpdateLead(data: {
  name: string;
  phone: string;
  company?: string | null;
  email?: string | null;
  address?: string | null;
  preferredCommodity?: string | null;
  estimatedVolume?: string | null;
  notes?: string | null;
}): Promise<{ customer: CustomerItem; isNew: boolean }> {
  const normalizedPhone = normalizePhone(data.phone);
  if (!normalizedPhone) throw new Error('Nomor WhatsApp wajib diisi.');

  const cleanName = sanitize(data.name.trim());
  const cleanCompany = data.company ? sanitize(data.company.trim()) : null;
  const cleanEmail = data.email ? sanitize(data.email.trim()) : null;
  const cleanAddress = data.address ? sanitize(data.address.trim()) : null;
  const cleanCommodity = data.preferredCommodity ? sanitize(data.preferredCommodity.trim()) : null;
  const cleanVolume = data.estimatedVolume ? sanitize(data.estimatedVolume.trim()) : null;
  const cleanNotes = data.notes ? sanitize(data.notes.trim()) : null;

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      const mergedNotes = [
        existing.notes,
        cleanNotes ? `[RFQ Baru]: ${cleanNotes}` : null,
      ]
        .filter(Boolean)
        .join('\n---\n');

      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: cleanName || existing.name,
          company: cleanCompany || existing.company,
          email: cleanEmail || existing.email,
          address: cleanAddress || existing.address,
          preferredCommodity: cleanCommodity || existing.preferredCommodity,
          estimatedVolume: cleanVolume || existing.estimatedVolume,
          status: 'BARU',
          notes: mergedNotes,
          lastContactAt: new Date(),
        },
      });
      return {
        customer: {
          ...updated,
          lastContactAt: updated.lastContactAt ? updated.lastContactAt.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        } as CustomerItem,
        isNew: false,
      };
    } else {
      const created = await prisma.customer.create({
        data: {
          name: cleanName,
          phone: normalizedPhone,
          company: cleanCompany,
          email: cleanEmail,
          address: cleanAddress,
          type: 'PROSPECT',
          status: 'BARU',
          source: 'WEBSITE_RFQ',
          preferredCommodity: cleanCommodity,
          estimatedVolume: cleanVolume,
          notes: cleanNotes ? `[RFQ Inisial]: ${cleanNotes}` : null,
          totalOrders: 0,
          totalSpent: 0,
          lastContactAt: new Date(),
        },
      });
      return {
        customer: {
          ...created,
          lastContactAt: created.lastContactAt ? created.lastContactAt.toISOString() : null,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        } as CustomerItem,
        isNew: true,
      };
    }
  } catch {
    const store = readLocalStore();
    if (!store.customers) store.customers = [...DEFAULT_CUSTOMERS];

    const idx = store.customers.findIndex((c) => normalizePhone(c.phone) === normalizedPhone);
    const now = new Date().toISOString();

    if (idx !== -1) {
      const existing = store.customers[idx];
      const mergedNotes = [
        existing.notes,
        cleanNotes ? `[RFQ Baru]: ${cleanNotes}` : null,
      ]
        .filter(Boolean)
        .join('\n---\n');

      store.customers[idx] = {
        ...existing,
        name: cleanName || existing.name,
        company: cleanCompany || existing.company,
        email: cleanEmail || existing.email,
        address: cleanAddress || existing.address,
        preferredCommodity: cleanCommodity || existing.preferredCommodity,
        estimatedVolume: cleanVolume || existing.estimatedVolume,
        status: 'BARU',
        notes: mergedNotes,
        lastContactAt: now,
        updatedAt: now,
      };
      writeLocalStore(store);
      return { customer: store.customers[idx], isNew: false };
    } else {
      const newCust: CustomerItem = {
        id: `cust-${Date.now()}`,
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
        phone: normalizedPhone,
        address: cleanAddress,
        type: 'PROSPECT',
        status: 'BARU',
        source: 'WEBSITE_RFQ',
        preferredCommodity: cleanCommodity,
        estimatedVolume: cleanVolume,
        notes: cleanNotes ? `[RFQ Inisial]: ${cleanNotes}` : null,
        totalOrders: 0,
        totalSpent: 0,
        lastContactAt: now,
        createdAt: now,
        updatedAt: now,
      };
      store.customers.unshift(newCust);
      writeLocalStore(store);
      return { customer: newCust, isNew: true };
    }
  }
}

export async function getAdminUsers(): Promise<UserItem[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      ...u,
      role: u.role as 'SUPERADMIN' | 'ADMIN',
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (err: any) {
    handleDbFallback('getAdminUsers', err);
    const store = readLocalStore();
    return (store.users || DEFAULT_USERS).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive ?? true,
      createdAt: u.createdAt,
    }));
  }
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'SUPERADMIN' | 'ADMIN';
}): Promise<UserItem> {
  const cleanName = sanitize(data.name).trim();
  const cleanEmail = data.email.toLowerCase().trim();

  if (data.role && data.role !== 'ADMIN' && data.role !== 'SUPERADMIN') {
    throw new Error('Role tidak valid. Pilihan yang sah: ADMIN atau SUPERADMIN.');
  }
  const cleanRole = data.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';

  if (!cleanName || !cleanEmail || !data.password) {
    throw new Error('Nama, email, dan kata sandi wajib diisi.');
  }

  if (data.password.length < 8) {
    throw new Error('Kata sandi minimal 8 karakter.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  try {
    const created = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: cleanRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return {
      ...created,
      role: created.role as 'SUPERADMIN' | 'ADMIN',
      createdAt: created.createdAt.toISOString(),
    };
  } catch (err: any) {
    handleDbFallback('createAdminUser', err);
    const store = readLocalStore();
    if (!store.users) store.users = [...DEFAULT_USERS];
    if (store.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email ${cleanEmail} sudah terdaftar.`);
    }

    const newUser: UserItemStored = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      isActive: true,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    writeLocalStore(store);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive ?? true,
      createdAt: newUser.createdAt,
    };
  }
}

export async function updateAdminUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'SUPERADMIN' | 'ADMIN';
    isActive?: boolean; // Sesi #17 (Temuan J)
  },
  currentUserId: string
): Promise<UserItem> {
  const updatePayload: any = {};
  if (data.name) updatePayload.name = sanitize(data.name).trim();
  if (data.email) updatePayload.email = data.email.toLowerCase().trim();
  if (data.role) {
    if (data.role !== 'ADMIN' && data.role !== 'SUPERADMIN') {
      throw new Error('Role tidak valid. Pilihan yang sah: ADMIN atau SUPERADMIN.');
    }
    if (id === currentUserId && data.role !== 'SUPERADMIN') {
      throw new Error('Anda tidak dapat menurunkan role akun Anda sendiri.');
    }
    updatePayload.role = data.role;
  }
  // Sesi #17 (Temuan J): Terima perubahan status isActive, tolak self-deactivation
  if (typeof data.isActive === 'boolean') {
    if (id === currentUserId && data.isActive === false) {
      throw new Error('SUPERADMIN tidak dapat menonaktifkan akunnya sendiri.');
    }
    updatePayload.isActive = data.isActive;
  }
  if (data.password) {
    if (data.password.length < 8) {
      throw new Error('Kata sandi minimal 8 karakter.');
    }
    updatePayload.password = await bcrypt.hash(data.password, 10);
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return {
      ...updated,
      role: updated.role as 'SUPERADMIN' | 'ADMIN',
      createdAt: updated.createdAt.toISOString(),
    };
  } catch (err: any) {
    handleDbFallback('updateAdminUser', err);
    const store = readLocalStore();
    if (!store.users) store.users = [...DEFAULT_USERS];
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Pengguna admin tidak ditemukan.');

    if (updatePayload.name) store.users[idx].name = updatePayload.name;
    if (updatePayload.email) store.users[idx].email = updatePayload.email;
    if (updatePayload.role) store.users[idx].role = updatePayload.role;
    if (updatePayload.password) store.users[idx].password = updatePayload.password;
    if (typeof updatePayload.isActive === 'boolean') store.users[idx].isActive = updatePayload.isActive;

    writeLocalStore(store);
    return {
      id: store.users[idx].id,
      name: store.users[idx].name,
      email: store.users[idx].email,
      role: store.users[idx].role,
      isActive: store.users[idx].isActive ?? true,
      createdAt: store.users[idx].createdAt,
    };
  }
}

export async function deleteAdminUser(id: string, currentUserId: string): Promise<void> {
  if (id === currentUserId) {
    throw new Error('Keamanan: Anda tidak dapat menghapus akun Anda sendiri.');
  }

  try {
    // Pastikan tidak menghapus jika hanya tersisa 1 SUPERADMIN
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPERADMIN' },
    });
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === 'SUPERADMIN' && superAdminCount <= 1) {
      throw new Error('Tidak dapat menghapus satu-satunya akun SUPERADMIN sistem.');
    }

    await prisma.user.delete({ where: { id } });
  } catch (err: any) {
    if (err.message?.includes('SUPERADMIN') || err.message?.includes('sendiri')) {
      throw err;
    }
    handleDbFallback('deleteAdminUser', err);
    const store = readLocalStore();
    if (!store.users) store.users = [...DEFAULT_USERS];

    const targetUser = store.users.find((u) => u.id === id);
    const superAdmins = store.users.filter((u) => u.role === 'SUPERADMIN');
    if (targetUser?.role === 'SUPERADMIN' && superAdmins.length <= 1) {
      throw new Error('Tidak dapat menghapus satu-satunya akun SUPERADMIN sistem.');
    }

    store.users = store.users.filter((u) => u.id !== id);
    writeLocalStore(store);
  }
}
