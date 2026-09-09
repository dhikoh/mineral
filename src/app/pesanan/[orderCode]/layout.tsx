import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rincian Pesanan & Pembayaran — MineralHub Indonesia',
  description:
    'Rincian nomor rekening pembayaran resmi dan formulir upload bukti transfer pesanan komoditas MineralHub.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
