import { getDefaultSiteName } from '@/lib/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Keranjang Belanja — ${getDefaultSiteName()}`,
  description:
    'Tinjau komoditas mineral tambang dalam keranjang Anda sebelum melanjutkan ke formulir pemesanan.',
};

export default function KeranjangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
