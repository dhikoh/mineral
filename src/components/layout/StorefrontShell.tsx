'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { BottomNav } from '@/components/layout/BottomNav';
import { PwaPrompt } from '@/components/common/PwaPrompt';

interface StorefrontShellProps {
  children: React.ReactNode;
  siteName: string;
  tagline: string;
  address: string;
  csWhatsapp: string;
  csOperationalHours: string;
  bankAccounts: Array<{ bank: string; noRekening: string; atasNama: string }>;
  footerText: string;
}

/**
 * Shell pembungkus storefront publik.
 * Memisahkan secara total elemen-elemen toko (Navbar, Footer, WhatsApp floating,
 * BottomNav, PWA prompt) agar tidak pernah bocor atau menimpa halaman panel admin (/admin/*).
 */
export function StorefrontShell({
  children,
  siteName,
  tagline,
  address,
  csWhatsapp,
  csOperationalHours,
  bankAccounts,
  footerText,
}: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Jika berada di area panel admin, render halaman admin secara murni
  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  // Jika berada di storefront publik, render struktur lengkap toko
  return (
    <div className="flex min-h-screen flex-col pb-mobile-nav md:pb-0">
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
    </div>
  );
}
