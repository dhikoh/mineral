import Link from 'next/link';
import type { Metadata } from 'next';
import { getProducts, getCategories, getUsages } from '@/lib/data-store';
import { ProductCard } from '@/components/storefront/ProductCard';
import { FilterSidebar } from '@/components/storefront/FilterSidebar';
import { MobileFilterDrawerTrigger } from '@/components/storefront/MobileFilterDrawerTrigger';
import { SortSelect } from '@/components/storefront/SortSelect';
import { ActiveFilterChips } from '@/components/storefront/ActiveFilterChips';
import { PackageSearch, Filter, Sparkles, Layers } from 'lucide-react';
import { safeJsonLd } from '@/lib/json-ld';
import {  getDefaultSiteName , getBaseUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q;
  const kategori = params.kategori;

  let title = 'Katalog Produk Komoditas Mineral';
  const description =
    'Jelajahi pilihan komoditas tambang dan mineral berkualitas tinggi: Zeolite aktif, Bentonite, Timah murni, dan Gaharu super.';

  if (q) {
    title = `Hasil Pencarian "${q}" — Katalog Komoditas Mineral`;
  } else if (kategori) {
    title = `Komoditas Kategori ${kategori} — ${getDefaultSiteName()}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function KatalogProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const activeKategori = params.kategori;
  const activePeruntukan = params.peruntukan;
  const query = params.q;
  const tag = params.tag;
  const sort = params.sort as any;
  const inStock = params.inStock === 'true' || params.inStock === '1';
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const [products, categories, usages] = await Promise.all([
    getProducts({
      kategori: activeKategori,
      peruntukan: activePeruntukan,
      q: query,
      tag: tag,
      minPrice,
      maxPrice,
      inStock,
      sort,
    }),
    getCategories(),
    getUsages(),
  ]);

  const baseUrl = getBaseUrl();
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: `${baseUrl}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Katalog Produk',
        item: `${baseUrl}/produk`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-soft-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <PackageSearch className="h-3.5 w-3.5" />
            <span>Katalog Komoditas Mineral & Hasil Alam</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Pusat Pengadaan Komoditas Terpercaya
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Temukan mineral aktif, lempung swelling, logam murni, dan hasil alam bernilai tinggi dengan jaminan uji laboratorium dan spesifikasi industri.
          </p>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Category Quick Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Kategori:
        </span>
        <Link
          href="/produk"
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            !activeKategori
              ? 'bg-emerald-600 text-white shadow-soft-sm'
              : 'bg-white border border-surface-200 text-slate-700 hover:border-emerald-300'
          }`}
        >
          Semua Komoditas
        </Link>
        {categories.map((cat) => {
          const isSelected = activeKategori?.split(',').includes(cat.slug);
          return (
            <Link
              key={cat.id}
              href={`/produk?kategori=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : 'bg-white border border-surface-200 text-slate-700 hover:border-emerald-300'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Main 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Desktop Sticky Filter Sidebar */}
        <FilterSidebar categories={categories} usages={usages} />

        {/* Right Column: Catalog Content */}
        <main className="flex-1 w-full min-w-0 space-y-4">
          {/* Top Control Bar: Total Count + Mobile Filter Trigger + Sort Select */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-surface-200 p-4 shadow-soft-xs">
            <div className="text-xs text-slate-600">
              Menampilkan <strong className="text-slate-900 font-bold text-sm">{products.length}</strong> produk komoditas
            </div>

            <div className="flex items-center gap-2.5">
              {/* Mobile Filter Button */}
              <MobileFilterDrawerTrigger categories={categories} usages={usages} />

              {/* Sort Dropdown */}
              <SortSelect currentSort={sort} />
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          <ActiveFilterChips categories={categories} usages={usages} params={params} />

          {/* Products Grid or Empty State */}
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-surface-300 bg-white py-20 px-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-slate-400 mb-4">
                <PackageSearch className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Produk Tidak Ditemukan</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada produk komoditas yang sesuai dengan kriteria filter atau pencarian Anda.
              </p>
              <div className="mt-6">
                <Link
                  href="/produk"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-soft-sm"
                >
                  Reset Semua Filter &amp; Tampilkan Semua
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((product: any) => {
                const productUsages = product.usages?.map((u: any) => u.usage?.name || u.name) || [];
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
                    usages={productUsages}
                    tags={tags}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
