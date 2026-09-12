import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { getSiteSettings } from '@/lib/data-store';
import { CartProvider } from '@/lib/cart-context';
import { BrowserCompatibilityGuard } from '@/components/common/BrowserCompatibilityGuard';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adably.id';
  try {
    const setting = await getSiteSettings();
    const siteTitle = setting.siteName || 'Adably';
    const siteTagline = setting.tagline || 'Pusat Komoditas Mineral Tambang & Hasil Alam';
    const siteDescription =
      'Platform B2B & Retail Terpercaya Penyedia Komoditas Tambang Indonesia: Zeolite, Bentonite, Timah murni, serta Gaharu super untuk industri, agrikultur, dan ekspor.';

    return {
      metadataBase: new URL(baseUrl),
      title: {
        default: `${siteTitle} — ${siteTagline}`,
        template: `%s — ${siteTitle}`,
      },
      description: siteDescription,
      keywords: [
        'komoditas mineral',
        'tambang indonesia',
        'zeolite alam',
        'bentonite tambang',
        'timah murni',
        'gaharu kalimantan',
        'b2b komoditas',
        'distributor mineral',
      ],
      authors: [{ name: siteTitle }],
      creator: siteTitle,
      publisher: siteTitle,
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      icons: {
        icon: [
          { url: '/favicon.svg', type: 'image/svg+xml' },
          { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
        shortcut: '/favicon.svg',
      },
      manifest: '/manifest.webmanifest',
      openGraph: {
        type: 'website',
        locale: 'id_ID',
        url: baseUrl,
        siteName: siteTitle,
        title: `${siteTitle} — ${siteTagline}`,
        description: siteDescription,
        images: [
          {
            url: '/icons/icon-512.png',
            width: 512,
            height: 512,
            alt: siteTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${siteTitle} — ${siteTagline}`,
        description: siteDescription,
        images: ['/icons/icon-512.png'],
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Adably',
      },
    };
  } catch {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Adably — Pusat Komoditas Tambang',
      description: 'Penyedia komoditas mineral tambang berkualitas.',
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSetting = await getSiteSettings();

  const siteName = siteSetting.siteName || 'Adably';
  const csWhatsapp = siteSetting.csWhatsapp || '6281234567890';
  const tagline = siteSetting.tagline || 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor';
  const address = siteSetting.address || 'Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat';
  const csOperationalHours = siteSetting.csOperationalHours || 'Senin - Sabtu, 08.00 - 17.00 WIB';
  const bankAccounts = Array.isArray(siteSetting.bankAccounts)
    ? siteSetting.bankAccounts
    : [
        { bank: 'BCA', noRekening: '8001234567', atasNama: 'Adably' },
        { bank: 'Mandiri', noRekening: '1230009876543', atasNama: 'Adably' },
      ];
  const footerText = siteSetting.footerText || '© 2026 Adably. All rights reserved.';

  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function s(m,f){var t=(m&&(typeof m==='string'?m:(m.message||'')))||'';return t.indexOf('startTime')!==-1||t.indexOf('reportAllChanges')!==-1||(f&&f.indexOf('VM')!==-1&&t.indexOf('TypeError')!==-1);}window.addEventListener('error',function(e){if(s(e.message||(e.error&&e.error.message),e.filename)){e.preventDefault();e.stopImmediatePropagation();return true;}},true);window.addEventListener('unhandledrejection',function(e){var r=e.reason?(e.reason.message||String(e.reason)):'';if(s(r,'')){e.preventDefault();e.stopImmediatePropagation();}},true);var o=console.error;console.error=function(){var a=Array.prototype.slice.call(arguments),f=a[0],t=(f&&(typeof f==='string'?f:(f.message||'')))||'';if(s(t,''))return;return o.apply(console,arguments);};})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <BrowserCompatibilityGuard />
        <CartProvider>
          <StorefrontShell
            siteName={siteName}
            tagline={tagline}
            address={address}
            csWhatsapp={csWhatsapp}
            csOperationalHours={csOperationalHours}
            bankAccounts={bankAccounts}
            footerText={footerText}
          >
            {children}
          </StorefrontShell>
        </CartProvider>
      </body>
    </html>
  );
}
