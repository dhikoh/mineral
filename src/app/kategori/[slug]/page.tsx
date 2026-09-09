import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategoryBySlug, getProducts, getCategories } from '@/lib/data-store';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Layers, ArrowLeft, ArrowRight, PackageSearch, Sparkles, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mineralhub.id';

  if (!category) {
    return {
      title: 'Kategori Tidak Ditemukan — MineralHub Indonesia',
    };
  }

  const title = `Komoditas ${category.name} — MineralHub Indonesia`;
  const description = `Katalog lengkap produk komoditas mineral kategori ${category.name}. Pasokan langsung dari sentra tambang bergaransi uji lab terstandarisasi.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/kategori/${category.slug}`,
      siteName: 'MineralHub Indonesia',
      type: 'website',
      images: category.image ? [{ url: category.image }] : ['/icons/icon-512.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: category.image ? [category.image] : ['/icons/icon-512.png'],
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, allCategories, products] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getProducts({ kategori: slug }),
  ]);

  if (!category) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mineralhub.id';

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
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${baseUrl}/kategori/${category.slug}`,
      },
    ],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Kategori ${category.name}`,
    description: `Daftar komoditas mineral kategori ${category.name}`,
    url: `${baseUrl}/kategori/${category.slug}`,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-emerald-700 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/produk" className="hover:text-emerald-700 transition-colors">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{category.name}</span>
      </nav>

      {/* Category Hero Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-soft-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <Layers className="h-3.5 w-3.5" />
            <span>Kategori Komoditas Khusus</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Komoditas {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Menampilkan seluruh varian dan spesifikasi komoditas dalam kategori {category.name}. Siap dipesan dalam kuantitas retail maupun pengiriman kontainer tonase industri.
          </p>
          <div className="pt-2 flex items-center gap-3 text-xs text-emerald-300">
            <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 font-bold border border-slate-700">
              {products.length} Produk Tersedia
            </span>
            <Link
              href={`/produk?kategori=${category.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-white hover:text-emerald-400 transition-colors"
            >
              <span>Buka di Filter Sidebar Lengkap</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Kategori Lain:
        </span>
        <Link
          href="/produk"
          className="shrink-0 rounded-full bg-white border border-surface-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 transition-all"
        >
          Semua Komoditas
        </Link>
        {allCategories.map((cat) => {
          const isCurrent = cat.slug === category.slug;
          return (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : 'bg-white border border-surface-200 text-slate-700 hover:border-emerald-300'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-surface-300 bg-white py-20 px-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-slate-400 mb-4">
            <PackageSearch className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Belum Ada Produk di Kategori Ini</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Komoditas untuk kategori {category.name} sedang dalam proses kurasi inventaris tambang.
          </p>
          <div className="mt-6">
            <Link
              href="/produk"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-soft-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Lihat Semua Katalog Komoditas</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                images={images}
                categoryName={product.category?.name || category.name}
                usages={productUsages}
                tags={tags}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
