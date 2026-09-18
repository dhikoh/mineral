import type { MetadataRoute } from 'next';
import { getDefaultSiteName } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${getDefaultSiteName()} — Marketplace Komoditas Tambang & Hasil Alam`,
    short_name: getDefaultSiteName(),
    description:
      'Platform B2B & Retail Terpercaya Komoditas Tambang Indonesia: Zeolite, Bentonite, Timah murni, serta Gaharu super.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#059669',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
