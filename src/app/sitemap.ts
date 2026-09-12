import type { MetadataRoute } from 'next';
import { getProducts, getCategories, getArticles } from '@/lib/data-store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';
  const currentDate = new Date();

  // 1. Static Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/produk`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artikel`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tentang-kami`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontak`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/syarat-ketentuan`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/lacak-pesanan`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Products
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productEntries = (products as any[])
      .filter((p: any) => p.isActive !== false)
      .map((p: any) => ({
        url: `${baseUrl}/produk/${p.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }));
  } catch (error) {
    console.error('Error generating product sitemap entries:', error);
  }

  // 3. Dynamic Categories
  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categoryEntries = categories.map((c) => ({
      url: `${baseUrl}/kategori/${c.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch (error) {
    console.error('Error generating category sitemap entries:', error);
  }

  // 4. Dynamic Articles
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: articles } = await getArticles({ limit: 1000 });
    articleEntries = articles
      .filter((a: any) => a.isPublished)
      .map((a: any) => ({
        url: `${baseUrl}/artikel/${a.slug}`,
        lastModified: a.publishedAt ? new Date(a.publishedAt) : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.error('Error generating article sitemap entries:', error);
  }

  return [...staticPages, ...productEntries, ...categoryEntries, ...articleEntries];
}
