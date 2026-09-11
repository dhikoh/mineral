import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getArticleBySlug, getProducts } from '@/lib/data-store';
import { formatDate, formatRupiah } from '@/lib/utils';
import { sanitize } from '@/lib/sanitize';
import {
  Clock,
  ArrowLeft,
  Share2,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';

  if (!article || !article.isPublished) {
    return {
      title: 'Artikel Tidak Ditemukan — Adably',
    };
  }

  const title = `${article.title} — Riset Adably`;
  const description = article.metaDesc || article.title;
  const mainImage = article.thumbnail || `${baseUrl}/icons/icon-512.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/artikel/${article.slug}`,
      siteName: 'Adably',
      type: 'article',
      publishedTime: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
      images: [
        {
          url: mainImage,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mainImage],
    },
  };
}

function estimateReadingTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return `${minutes} menit baca`;
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, allProducts] = await Promise.all([
    getArticleBySlug(slug),
    getProducts(),
  ]);

  if (!article || !article.isPublished) {
    notFound();
  }

  const cleanHtml = sanitize(article.htmlContent);
  const readTime = estimateReadingTime(article.htmlContent);

  // Find related products (e.g. products matching tags or title keywords)
  const titleLower = article.title.toLowerCase();
  const relatedProducts = allProducts
    .filter((p) => {
      const nameMatch = titleLower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes('zeolite');
      return nameMatch;
    })
    .slice(0, 3);

  const finalRelated = relatedProducts.length > 0 ? relatedProducts : allProducts.slice(0, 3);

  const shareText = encodeURIComponent(
    `Baca artikel menarik: "${article.title}" di Adably.\n`
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    image: article.thumbnail ? [article.thumbnail] : [`${baseUrl}/icons/icon-512.png`],
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date(article.createdAt).toISOString(),
    dateModified: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date(article.createdAt).toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Tim Riset Adably',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Adably',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/icon-512.png`,
      },
    },
    description: article.metaDesc || article.title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/artikel/${article.slug}`,
    },
  };

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
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${baseUrl}/artikel/${article.slug}`,
      },
    ],
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-emerald-700 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/artikel" className="hover:text-emerald-700 transition-colors">
          Artikel &amp; Riset
        </Link>
        <span>/</span>
        <span className="text-slate-800 line-clamp-1">{article.title}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Wawasan Industri &amp; Laboratorium</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{readTime}</span>
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-400">
            {formatDate(article.publishedAt || article.createdAt)}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>

        {article.metaDesc && (
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {article.metaDesc}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-surface-200 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-bold text-white shadow-soft-xs text-xs">
              MH
            </div>
            <div>
              <div className="font-bold text-slate-900">Tim Riset &amp; Pengadaan Adably</div>
              <div className="text-[11px] text-slate-400">Spesialis Komoditas Mineral Tambang</div>
            </div>
          </div>

          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-soft-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Bagikan ke WA</span>
          </a>
        </div>
      </header>

      {/* Featured Image */}
      {article.thumbnail && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-surface-200 bg-surface-100 shadow-soft-sm">
          <Image
            src={article.thumbnail}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      {/* Sanitized HTML Body with styled typography */}
      <div
        className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-10 shadow-soft-sm text-slate-800 leading-relaxed text-sm sm:text-base space-y-4
          [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:font-black [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:tracking-tight
          [&>h3]:text-base [&>h3]:sm:text-lg [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2
          [&>p]:my-3.5 [&>p]:leading-relaxed [&>p]:text-slate-700
          [&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1.5 [&>ul>li]:text-slate-700
          [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1.5 [&>ol>li]:text-slate-700
          [&>blockquote]:my-6 [&>blockquote]:rounded-2xl [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-500 [&>blockquote]:bg-emerald-50/50 [&>blockquote]:p-4 [&>blockquote]:italic [&>blockquote]:text-emerald-950
          [&>table]:my-6 [&>table]:w-full [&>table]:text-xs [&>table]:border-collapse [&>table]:rounded-xl [&>table]:overflow-hidden
          [&>table_th]:bg-surface-100 [&>table_th]:p-3 [&>table_th]:font-bold [&>table_th]:text-slate-800 [&>table_th]:border [&>table_th]:border-surface-200
          [&>table_td]:p-3 [&>table_td]:border [&>table_td]:border-surface-200 [&>table_td]:text-slate-700
          [&>strong]:font-bold [&>strong]:text-slate-900
          [&>a]:text-emerald-600 [&>a]:underline [&>a]:font-semibold hover:[&>a]:text-emerald-700"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />

      {/* Bottom CTA / Related Commodities */}
      <div className="rounded-3xl border border-surface-200 bg-surface-50 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShoppingBag className="h-4 w-4" />
              <span>Pengadaan Langsung</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Komoditas Mineral Terkait Artikel Ini
            </h3>
          </div>
          <Link
            href="/produk"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Lihat Semua Katalog &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {finalRelated.map((p: any) => {
            const img = Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-surface-200 bg-white p-4 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all shadow-soft-xs"
              >
                <div className="space-y-2.5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-100">
                    {img ? (
                      <Image src={img} alt={p.name} fill sizes="250px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    <div className="text-xs font-black text-emerald-700 mt-1">
                      {formatRupiah(p.price)}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/produk/${p.slug}`}
                  className="w-full flex items-center justify-center rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-soft-xs"
                >
                  Lihat Detail &amp; Pesan
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
