import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { PwaPrompt } from '@/components/common/PwaPrompt';
import { getSiteSettings } from '@/lib/data-store';
import { CartProvider } from '@/lib/cart-context';

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
      <body className="flex min-h-screen flex-col antialiased selection:bg-emerald-500 selection:text-white pb-mobile-nav md:pb-0">
        <CartProvider>
          <Navbar siteName={siteName} csWhatsapp={csWhatsapp} />
          <main className="flex-1">{children}</main>
          <Footer
            siteName={siteName}
            tagline={tagline}
            address={address}
            csWhatsapp={csWhatsapp}
            csOperationalHours={csOperationalHours}
            bankAccounts={bankAccounts}
            footerText={footerText}
          />
          <WhatsAppButton csWhatsapp={csWhatsapp} />
          <BottomNav csWhatsapp={csWhatsapp} />
          <PwaPrompt />
        </CartProvider>
      </body>
    </html>
  );
}
