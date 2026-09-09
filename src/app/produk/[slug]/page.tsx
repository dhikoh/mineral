import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/data-store';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mineralhub.id';

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan — MineralHub Indonesia',
    };
  }

  const title = `${product.name} — Pasokan Komoditas MineralHub`;
  const description =
    product.description ||
    `Beli ${product.name} kualitas ekspor & industri dengan spesifikasi teruji lab dari MineralHub Indonesia.`;
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const mainImage = images[0] || `${baseUrl}/icons/icon-512.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/produk/${product.slug}`,
      siteName: 'MineralHub Indonesia',
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mineralhub.id';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [`${baseUrl}/icons/icon-512.png`],
    description: product.description || `Komoditas ${product.name} berkualitas tinggi dari MineralHub Indonesia.`,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'MineralHub Indonesia',
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
        name: 'MineralHub Indonesia',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailClient product={product as any} />
    </div>
  );
}

