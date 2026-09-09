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

  return (
    <OrderDetailClient
      initialOrder={order}
      bankAccounts={settings.bankAccounts}
      csWhatsapp={settings.csWhatsapp}
    />
  );
}
