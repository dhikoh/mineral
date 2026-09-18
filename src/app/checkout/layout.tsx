import { getDefaultSiteName } from '@/lib/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Checkout Pesanan Komoditas — ${getDefaultSiteName()}`,
  description:
    'Lengkapi alamat pengiriman dan konfirmasi pesanan komoditas mineral tambang Anda dengan aman.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
