/**
 * GET /api/admin/pesanan/export
 * P1-04: Pakai buildCsv() dari src/lib/csv.ts (anti formula injection + BOM + CRLF)
 * P2-12: Catat EXPORT_ORDERS ke audit log
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildCsv } from '@/lib/csv';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';
import { getBrandSlug } from '@/lib/config';

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().replace('T', ' ').substring(0, 19);
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          createdAt.lte = to;
        }
      }
      if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { select: { productName: true, qty: true, price: true, productUnit: true } },
        proof: { select: { senderBank: true, senderName: true, amount: true, verifiedAt: true } },
        customer: { select: { company: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const headers = [
      'Kode Pesanan', 'Status', 'Nama Pembeli', 'Perusahaan', 'No. WhatsApp',
      'Email', 'Alamat', 'Subtotal (Rp)', 'Ongkir (Rp)', 'PPN (Rp)',
      'Total Tagihan (Rp)', 'Nominal Transfer (Rp)', 'Bank Pengirim',
      'Nama Pengirim', 'Produk', 'No. Resi', 'Tanggal Pesanan', 'Tanggal Verifikasi',
      'Catatan Pembeli', 'Catatan Admin',
    ];

    const rows = orders.map(o => {
      const productSummary = o.items.map(i =>
        `${i.productName} (${i.qty} ${i.productUnit ?? 'kg'} @ Rp${i.price.toLocaleString('id-ID')})`
      ).join(' | ');

      return [
        o.orderCode,
        o.status,
        o.buyerName,
        o.customer?.company || '',
        o.buyerPhone,
        o.buyerEmail || '',
        o.buyerAddress,
        o.subtotal ?? o.total,
        o.shippingCost ?? 0,
        o.taxAmount ?? 0,
        o.grandTotal ?? o.total,
        o.proof?.amount ?? '',
        o.proof?.senderBank || '',
        o.proof?.senderName || '',
        productSummary,
        o.trackingNumber || '',
        formatDate(o.createdAt),
        formatDate(o.proof?.verifiedAt),
        o.notes || '',
        o.adminNotes || '',
      ];
    });

    const csvContent = buildCsv(headers, rows);

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const brand = getBrandSlug();
    const filename = `${brand}-laporan-pesanan-${todayStr}.csv`;

    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.EXPORT_ORDERS,
      metadata: { count: orders.length, filters: { status, dateFrom, dateTo } },
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error exporting orders CSV:', err);
    return NextResponse.json({ error: err?.message || 'Gagal mengekspor data pesanan' }, { status: 500 });
  }
}
