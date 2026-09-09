import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/data-store';
import { AdminOrderDetailClient } from './AdminOrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <AdminOrderDetailClient initialOrder={order} />;
}
