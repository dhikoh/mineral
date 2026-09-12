import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/data-store';
import { formatDate } from '@/lib/utils';
import { FileText, Clock, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';
  return {
    title: 'Artikel & Riset Komoditas Mineral',
    description:
      'Panduan teknis, spesifikasi industri, analisis laboratorium, dan edukasi aplikasi mineral aktif serta hasil alam bernilai tinggi.',
    openGraph: {
      title: 'Artikel & Riset Komoditas Mineral — Adably',
      description:
        'Panduan teknis, spesifikasi industri, dan analisis aplikasi komoditas mineral Indonesia.',
      url: `${baseUrl}/artikel`,
      type: 'website',
    },
  };
}

function estimateReadingTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return `${minutes} menit baca`;
}

export default async function ArtikelListingPage() {
  const { data: articles } = await getArticles({ publishedOnly: true });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';

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
        name: 'Artikel & Riset',
        item: `${baseUrl}/artikel`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 space-y-8">
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-soft-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Pusat Edukasi &amp; Wawasan Komoditas</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Artikel &amp; Riset Mineral Tambang
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Panduan teknis, spesifikasi industri, analisis laboratorium, dan edukasi aplikasi mineral aktif serta hasil alam bernilai tinggi.
          </p>
        </div>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-surface-300 bg-white py-20 px-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-slate-400 mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Belum Ada Artikel yang Diterbitkan</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Artikel edukasi dan ulasan komoditas terbaru sedang dipersiapkan oleh tim riset kami.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => {
            const readTime = estimateReadingTime(art.htmlContent);
            return (
              <article
                key={art.id}
                className="group flex flex-col rounded-3xl border border-surface-200 bg-white overflow-hidden shadow-soft-xs hover:shadow-soft-md hover:border-emerald-300 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-100">
                  {art.thumbnail ? (
                    <Image
                      src={art.thumbnail}
                      alt={art.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <FileText className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span>{readTime}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-slate-400">
                      {formatDate(art.publishedAt || art.createdAt)}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/artikel/${art.slug}`}>
                        {art.title}
                      </Link>
                    </h2>
                    {art.metaDesc && (
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {art.metaDesc}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-surface-100">
                    <Link
                      href={`/artikel/${art.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors"
                    >
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
