import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout Pesanan Komoditas — MineralHub Indonesia',
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
