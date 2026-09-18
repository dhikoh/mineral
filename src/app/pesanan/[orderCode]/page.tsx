import { notFound } from 'next/navigation';
import { getOrderByCode, getSiteSettings } from '@/lib/data-store';
import { OrderDetailClient } from './OrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function PesananDetailPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
  const [order, settings] = await Promise.all([
    getOrderByCode(orderCode),
    getSiteSettings(),
  ]);

  if (!order) {
    notFound();
  }

  // P1-R: Hanya sertakan detail rekening bank jika pesanan butuh pembayaran/verifikasi
  const canShowBankAccounts =
    order.status === 'PENDING_PAYMENT' || order.status === 'PENDING_VERIFICATION';

  return (
    <OrderDetailClient
      initialOrder={order}
      bankAccounts={canShowBankAccounts ? settings.bankAccounts : []}
      csWhatsapp={settings.csWhatsapp}
    />
  );
}
