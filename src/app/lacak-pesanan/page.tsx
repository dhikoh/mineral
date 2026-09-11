import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data-store';
import { OrderTrackingClient } from './OrderTrackingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lacak Pesanan Komoditas — MineralHub Indonesia',
  description:
    'Lacak status pengiriman dan kargo pesanan komoditas mineral Anda secara real-time dengan kode pesanan dan nomor WhatsApp.',
};

export default async function LacakPesananPage() {
  const settings = await getSiteSettings();

  return <OrderTrackingClient csWhatsapp={settings.csWhatsapp} />;
}

