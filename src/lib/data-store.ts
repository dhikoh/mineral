import { prisma } from '@/lib/db';
import { slugify, generateOrderCode } from '@/lib/utils';
import { sanitize } from '@/lib/sanitize';
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
  siteName: 'MineralHub Indonesia',
  tagline: 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#059669',
  csWhatsapp: '6281234567890',
  csEmail: 'cs@mineralhub.id',
  csOperationalHours: 'Senin - Sabtu, 08.00 - 17.00 WIB',
  address: 'Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat',
  bankAccounts: [
    {
      bank: 'BCA',
      noRekening: '8001234567',
      atasNama: 'PT MineralHub Indonesia',
    },
    {
      bank: 'Mandiri',
      noRekening: '1230009876543',
      atasNama: 'PT MineralHub Indonesia',
    },
  ],
  footerText: '© 2026 MineralHub Indonesia. All rights reserved.',
};

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
    title: 'Tentang MineralHub Indonesia',
    content: 'PT MineralHub Indonesia adalah platform rantai pasok terintegrasi penyedia komoditas mineral tambang non-logam, logam murni, dan hasil alam berkualitas tinggi di Indonesia. Didirikan dengan komitmen transparansi dan keandalan suplai, kami menjembatani langsung para pelaku industri manufaktur, agrikultur, pengolahan air (water treatment), dan eksportir dengan produsen tangan pertama di sentra tambang nusantara.\n\nSetiap komoditas yang kami pasok melewati pengujian laboratorium independen terakreditasi (Sucofindo / Geoservices) guna memastikan Certificate of Analysis (COA) yang presisi. Kami siap memenuhi komitmen pasokan berkala maupun pesanan partai besar dengan dukungan armada logistik tronton dan peti kemas ke seluruh pelabuhan utama Indonesia.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-why',
    key: 'why_us',
    title: 'Mengapa Memilih MineralHub Indonesia?',
    content: '1. Legalitas IUP & Izin Usaha Lengkap: Seluruh komoditas berasal dari konsesi tambang berizin resmi (IUP Operasi Produksi) dengan dokumen kepatuhan lingkungan lengkap.\n2. Uji Mutu Laboratorium (COA Valid): Setiap batch pengiriman disertai Certificate of Analysis terperinci mencakup kemurnian, kadar mesh, dan uji mineralogi.\n3. Logistik Terintegrasi Nusantara: Jaringan armada dump truck, tronton, hingga kontainer 20ft/40ft siap kirim FOB Pelabuhan atau CIF Gudang Pembeli.\n4. Harga Kompetitif Tangan Pertama: Memangkas rantai perantara sehingga mitra industri mendapatkan efisiensi biaya bahan baku maksimal.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-shipping',
    key: 'shipping_info',
    title: 'Informasi Pengiriman & Logistik Komoditas',
    content: 'Kami melayani pengiriman skala industri dengan berbagai opsi moda logistik:\n- Truk Curah & Dump Truck: Untuk pengiriman lokal/regional area Jawa dan Sumatera (kapasitas 8 - 25 Ton per rit).\n- Truk Tronton & Fuso: Muatan pallet atau karung jumbo 1 Ton (Jumbo Bag) dengan kapasitas angkut 20 - 30 Ton.\n- Kontainer Laut (FCL 20ft & 40ft): Pengiriman antar-pulau atau ekspor via Pelabuhan Tanjung Priok, Tanjung Perak, dan Belawan.\n- Layanan Ekspedisi Curah: Termasuk timbangan jembatan resmi (Weighbridge Slip) dan segel kontainer pengaman.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-terms',
    key: 'terms',
    title: 'Syarat & Ketentuan Pemesanan Komoditas',
    content: '1. Pemesanan & Kontrak: Pembelian dapat dilakukan secara langsung melalui platform atau melalui Purchase Order (PO) resmi untuk volume industri kontrak berkala.\n2. Minimum Order Quantity (MOQ): Setiap produk memiliki batas minimum pemesanan sesuai satuan kemasan (karung sak 25kg, jumbo bag 1 ton, atau batangan ingot).\n3. Verifikasi Pembayaran: Pembayaran wajib ditransfer ke rekening bank resmi atas nama perusahaan (PT MineralHub Indonesia). Bukti transfer akan diverifikasi oleh bagian keuangan maksimal 1x24 jam kerja.\n4. Inspeksi & Komplain: Pembeli berhak melakukan verifikasi fisik dan kesesuaian spesifikasi saat barang tiba di lokasi pembongkaran dengan toleransi susut standar logistik komoditas.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'block-privacy',
    key: 'privacy_policy',
    title: 'Kebijakan Privasi & Perlindungan Data',
    content: 'MineralHub Indonesia berkomitmen menjaga kerahasiaan data seluruh mitra dan pelanggan. Informasi nama, kontak WhatsApp, alamat pergudangan, dan rincian transaksi hanya digunakan untuk kepentingan pemrosesan pesanan, pengiriman logistik, dan konfirmasi pembayaran resmi. Kami tidak pernah membagikan atau memperjualbelikan data pelanggan kepada pihak ketiga mana pun tanpa persetujuan tertulis.',
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Apakah seluruh komoditas memiliki Certificate of Analysis (COA) resmi?',
    answer: 'Ya, seluruh komoditas yang kami sediakan seperti Zeolite, Bentonite, dan Timah Ingot telah melalui uji laboratorium independen terakreditasi (Sucofindo / Geoservices). Salinan dokumen COA terbaru dapat diminta langsung ke Customer Service atau disertakan pada setiap pengiriman pesanan partai besar.',
    order: 1,
    isActive: true,
  },
  {
    id: 'faq-2',
    question: 'Berapa Minimum Order Quantity (MOQ) untuk pemesanan komoditas?',
    answer: 'MOQ bervariasi tergantung jenis komoditas. Untuk Zeolite dan Bentonite sak 25 kg, pemesanan dapat dimulai dari 1 sak untuk trial, sedangkan untuk kebutuhan industri tonase besar dapat dipesan dalam kelipatan Jumbo Bag (1 Ton) atau muatan armada truk (8-25 Ton). Timah Ingot dan Gaharu memiliki ketentuan minimum per kilogram/batang yang tertera pada masing-masing halaman produk.',
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
    answer: 'Pembayaran dilakukan melalui transfer bank manual ke rekening resmi perusahaan yang tertera di halaman instruksi pembayaran (BCA & Bank Mandiri a.n PT MineralHub Indonesia). Setelah mentransfer, unggah foto bukti transfer di halaman pesanan Anda. Tim keuangan kami akan memverifikasi bukti tersebut dalam waktu 15-30 menit pada jam kerja.',
    order: 4,
    isActive: true,
  },
  {
    id: 'faq-5',
    question: 'Bagaimana armada pengiriman dan jangkauan wilayahnya?',
    answer: 'Kami melayani pengiriman ke seluruh wilayah Indonesia. Untuk pulau Jawa, armada darat kami menggunakan Colt Diesel Double (CDD), Fuso, dan Tronton. Untuk luar pulau Jawa dan kebutuhan ekspor, kami melayani pengiriman via kontainer laut (FCL 20ft & 40ft) dengan skema FOB pelabuhan keberangkatan maupun CIF pelabuhan tujuan.',
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
    return await prisma.category.delete({ where: { id } });
  } catch {
    const store = readLocalStore();
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
    return await prisma.usage.delete({ where: { id } });
  } catch {
    const store = readLocalStore();
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

    return prods;
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
    return await prisma.product.delete({ where: { id } });
  } catch {
    const store = readLocalStore();
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
  const orderCode = generateOrderCode();

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
      },
    };
  });

  const total = resolvedItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
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

    // 3. Catat calon pembeli sebagai prospek (R-7: belum DEAL, LTV/totalOrders belum bertambah)
    await recordLeadFromCheckout({
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: data.buyerEmail,
      buyerAddress: data.buyerAddress,
    }).catch((err) => console.error('Error auto-syncing lead from checkout:', err));

    return {
      ...order,
      items: order.items.map((it) => {
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
            product: prod ? { id: prod.id, name: prod.name, slug: prod.slug, images: prod.images } : undefined,
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
        product: p ? { id: p.id, name: p.name, slug: p.slug, images: p.images } : undefined,
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
            product: prod ? { id: prod.id, name: prod.name, slug: prod.slug, images: prod.images } : undefined,
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
        product: p ? { id: p.id, name: p.name, slug: p.slug, images: p.images } : undefined,
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
          product: prod ? { id: prod.id, name: prod.name, slug: prod.slug, images: prod.images } : undefined,
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
  } catch {
    const store = readLocalStore();
    const oIdx = (store.orders || []).findIndex((o) => o.id === orderId || o.orderCode === orderId);
    if (oIdx === -1) throw new Error('Pesanan tidak ditemukan');

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
  verifiedBy?: string
) {
  const proofStatus = isApproved ? 'APPROVED' : 'REJECTED';
  const orderStatus = isApproved ? 'PAID' : 'PENDING_PAYMENT';

  try {
    await prisma.paymentProof.update({
      where: { orderId },
      data: {
        status: proofStatus,
        rejectionReason: isApproved ? null : notes || 'Bukti pembayaran tidak valid',
        verifiedBy: verifiedBy || 'Super Admin',
        verifiedAt: new Date(),
      },
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus as any },
      include: { proof: true, items: true },
    });

    // R-7: Jika pembayaran disetujui (PAID), catat status DEAL & akumulasi LTV di database CRM
    if (isApproved) {
      await recordCustomerDealFromPaidOrder(orderId).catch((err) =>
        console.error('Error recording CRM deal after payment verification:', err)
      );
    }

    return updated;
  } catch (err: any) {
    handleDbFallback('verifyPaymentProof', err);

    const store = readLocalStore();
    const oIdx = (store.orders || []).findIndex((o) => o.id === orderId || o.orderCode === orderId);
    if (oIdx === -1) throw new Error('Pesanan tidak ditemukan');

    if (store.orders[oIdx].proof) {
      store.orders[oIdx].proof!.status = proofStatus;
      store.orders[oIdx].proof!.rejectionReason = isApproved ? null : notes || 'Bukti pembayaran tidak valid';
      store.orders[oIdx].proof!.verifiedBy = verifiedBy || 'Super Admin';
      store.orders[oIdx].proof!.verifiedAt = new Date().toISOString();
    }

    store.orders[oIdx].status = orderStatus as any;
    writeLocalStore(store);

    // R-7: Catat deal CRM pada fallback lokal
    if (isApproved) {
      await recordCustomerDealFromPaidOrder(orderId).catch((e) =>
        console.error('Error recording CRM deal in local fallback:', e)
      );
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
  const [orders, products, articles, customers] = await Promise.all([
    getOrders(),
    getProducts(),
    getArticles(),
    getCustomers(),
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

  const lowStockProducts = products
    .filter((p) => p.stock < 500)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
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



