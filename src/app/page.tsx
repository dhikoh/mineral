import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { WholesaleRfqTrigger } from '@/components/storefront/WholesaleRfqTrigger';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  FileCheck2,
  PhoneCall,
  Sparkles,
  Gem,
} from 'lucide-react';
import {
  getContentBlockByKey,
  getCategories,
  getProducts,
  getSiteSettings,
} from '@/lib/data-store';
import { sanitize } from '@/lib/sanitize';

export default async function HomePage() {
  const [heroBlock, whyUsBlock, supplierCtaBlock, categories, allProducts, settings] = await Promise.all([
    getContentBlockByKey('homepage_hero'),
    getContentBlockByKey('why_us'),
    getContentBlockByKey('supplier_cta'),
    getCategories(),
    getProducts(),
    getSiteSettings(),
  ]);

  const supplierTitle = supplierCtaBlock?.title || 'Punya Stok Komoditas? Jual Melalui Platform Kami';
  const supplierContent = supplierCtaBlock?.content || 'Zeolite, Bentonite, Kaolin, Pasir Silika, dan mineral lainnya — isi form penawaran singkat dan tim kami akan menghubungi Anda dalam 1×24 jam.';

  const products = (allProducts as any[]).filter((p: any) => p.isActive !== false).slice(0, 8);

  let cleanWa = settings.csWhatsapp.replace(/\D/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  }

  const heroWaUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Halo ${settings.siteName}, saya ingin konsultasi kebutuhan pasokan komoditas mineral...`
  )}`;

  const contractWaUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Halo ${settings.siteName}, saya ingin berdiskusi kontrak pasokan komoditas skala tonase / kontainer industri...`
  )}`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName || 'Adably',
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512.png`,
    description: settings.tagline || 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor',
    telephone: `+${cleanWa}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address || 'Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat',
      addressCountry: 'ID',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: `+${cleanWa}`,
        contactType: 'customer service',
        areaServed: 'ID',
        availableLanguage: ['Indonesian', 'English'],
      },
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.siteName || 'Adably',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/produk?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="space-y-12 md:space-y-16 pb-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-24 px-4">
        {/* Background glow effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Penyedia Mineral & Komoditas Ekspor Terpercaya</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {heroBlock?.title || 'Pasokan Mineral Tambang & Komoditas Alam Berkualitas'}
          </h1>

          {heroBlock?.content ? (
            <div
              className="mt-6 text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-white prose-em:text-slate-300 max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitize(heroBlock.content) }}
            />
          ) : (
            <p className="mt-6 text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Menyediakan Zeolite alam, Bentonite swelling, Timah murni, dan Gaharu alami langsung dari sentra tambang. Dilengkapi hasil uji laboratorium dan jaminan pengiriman skala industri.
            </p>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/produk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-soft-md hover:bg-emerald-400 transition-all active:scale-95"
            >
              <span>Jelajahi Katalog Produk</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={heroWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-700 transition-all backdrop-blur-sm"
            >
              <PhoneCall className="h-4 w-4 text-emerald-400" />
              <span>Konsultasi Kebutuhan Industri</span>
            </a>
          </div>

          {/* Quick Value Badges */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto pt-8 border-t border-slate-800/80 text-left">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40">
              <FileCheck2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Spesifikasi Transparan</p>
                <p className="text-[11px] text-slate-400">Opsi uji sampel & verifikasi</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40">
              <Truck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Pengiriman Fleksibel</p>
                <p className="text-[11px] text-slate-400">Loco, FOB & kargo kontainer</p>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Transaksi Aman</p>
                <p className="text-[11px] text-slate-400">Kemitraan niaga terpercaya</p>
              </div>
            </div>
          </div>

          {/* Sell Offer CTA — Untuk Supplier/Penjual Komoditas (Dark Glassmorphism) */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/60 p-6 sm:p-8 backdrop-blur-md shadow-soft-xl flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                  <Gem className="h-3.5 w-3.5" />
                  Untuk Pemilik Tambang & Supplier
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {supplierTitle}
                </h3>
                {supplierContent.includes('<p>') ? (
                  <div
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed [&>p]:mb-1 [&>ul]:list-disc [&>ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: sanitize(supplierContent) }}
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {supplierContent}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 w-full md:w-auto">
                <Link
                  href="/jual"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-soft-md transition-all active:scale-95"
                >
                  <Gem className="h-4 w-4" />
                  <span>Ajukan Penawaran Jual</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills / Showcase */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Kategori Komoditas</h2>
            <p className="text-xs text-slate-500">Pilihan komoditas tambang dan hasil hutan unggulan</p>
          </div>
          <Link
            href="/produk"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-4 transition-all duration-300 hover:shadow-soft-md hover:border-emerald-500"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{cat.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                    Jelajahi Kategori &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              <span>Siap Kirim Tonase & Eceran</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Produk Komoditas Unggulan</h2>
          </div>
          <Link
            href="/produk"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Buka Katalog Lengkap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product: any) => {
            const usages = product.usages?.map((u: any) => u.usage?.name || u.name) || [];
            const tags = Array.isArray(product.tags) ? product.tags : [];
            const images = Array.isArray(product.images) ? product.images : [];

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                description={product.description}
                price={product.price}
                stock={product.stock}
                unit={product.unit}
                images={images}
                categoryName={product.category?.name}
                categorySlug={product.category?.slug}
                usages={usages}
                tags={tags}
              />
            );
          })}
        </div>
      </section>



      {/* Wholesale & Custom Specification Banner */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 p-8 sm:p-12 text-white shadow-soft-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2 text-center md:text-left">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              Pemesanan Skala Tonase / Kontainer
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Butuh Spesifikasi Khusus atau Pasokan Rutin Pabrik?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Tim analis teknis kami siap mendiskusikan mesh size kustom, pengemasan jumbo bag 1 ton, serta kontrak pasokan jangka panjang dengan harga kompetitif.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <WholesaleRfqTrigger />
            <a
              href={contractWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-emerald-950 shadow-md hover:bg-emerald-50 transition-all active:scale-95"
            >
              <PhoneCall className="h-4 w-4 text-emerald-700" />
              <span>Hubungi via WA</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
