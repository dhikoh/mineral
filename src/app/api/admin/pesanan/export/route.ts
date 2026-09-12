/**
 * GET /api/admin/pesanan/export
 * Sesi #19 (Fix #5): Export daftar pesanan ke CSV untuk rekonsiliasi keuangan/akuntansi.
 *
 * Query params:
 *   status    - filter status (opsional, default: semua)
 *   dateFrom  - filter tanggal mulai ISO 8601 (opsional)
 *   dateTo    - filter tanggal akhir ISO 8601 (opsional)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) where.createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          // Inklusif sampai akhir hari dateTo
          to.setHours(23, 59, 59, 999);
          where.createdAt.lte = to;
        }
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    // Targeted product lookup — OrderItem tidak punya relasi Prisma ke Product
    const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
    const products = productIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, unit: true } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Bangun CSV
    const headers = [
      'Kode Pesanan',
      'Nama Pembeli',
      'Telepon',
      'Email',
      'Alamat',
      'Total (Rp)',
      'Status',
      'Tanggal Pesan',
      'Ringkasan Item',
    ];

    const rows = orders.map((o) => {
      const itemSummary = o.items
        .map((it) => {
          const prod = productMap.get(it.productId);
          return `${prod?.name || 'Produk Arsip'} x${it.qty} ${prod?.unit || 'kg'}`;
        })
        .join(' | ');

      return [
        o.orderCode,
        o.buyerName,
        o.buyerPhone,
        o.buyerEmail || '',
        o.buyerAddress,
        o.total,
        o.status,
        formatDate(o.createdAt),
        itemSummary,
      ].map(escapeCSV).join(',');
    });


    const csv = [headers.join(','), ...rows].join('\n');
    const today = new Date().toISOString().substring(0, 10);
    const filename = `pesanan_export_${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[export/pesanan] error:', error);
    return NextResponse.json(
      { error: 'Gagal mengekspor data pesanan' },
      { status: 500 }
    );
  }
}
