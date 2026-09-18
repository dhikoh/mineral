import { getBaseUrl, getDefaultSiteName } from '@/lib/config';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data-store';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import { safeJsonLd } from '@/lib/json-ld';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const baseUrl = getBaseUrl();

  if (!product) {
    return {
      title: `Produk Tidak Ditemukan — ${getDefaultSiteName()}`,
    };
  }

  const title = `${product.name} — Pasokan Komoditas ${getDefaultSiteName()}`;
  const description =
    product.description ||
    `Beli ${product.name} kualitas ekspor & industri dengan spesifikasi teruji lab dari ${getDefaultSiteName()}.`;
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const mainImage = images[0] || `${baseUrl}/icons/icon-512.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/produk/${product.slug}`,
      siteName: getDefaultSiteName(),
      type: 'website',
      images: [
        {
          url: mainImage,
          alt: product.name,
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

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const baseUrl = getBaseUrl();

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [`${baseUrl}/icons/icon-512.png`],
    description: product.description || `Komoditas ${product.name} berkualitas tinggi dari ${getDefaultSiteName()}.`,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: getDefaultSiteName(),
    },
    category: product.category?.name || 'Mineral Tambang',
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/produk/${product.slug}`,
      priceCurrency: 'IDR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: getDefaultSiteName(),
      },
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
        name: 'Katalog Produk',
        item: `${baseUrl}/produk`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${baseUrl}/produk/${product.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />

      <ProductDetailClient product={product as any} />
    </div>
  );
}

