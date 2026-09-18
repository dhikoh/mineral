import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/checkout', '/pesanan/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/checkout', '/pesanan/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
