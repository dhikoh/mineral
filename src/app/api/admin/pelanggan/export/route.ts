/**
 * GET /api/admin/pelanggan/export
 * P1-04: Pakai buildCsv() + escapeCsvField() dari src/lib/csv.ts (anti formula injection)
 * P2-12: Catat EXPORT_CUSTOMERS ke audit log
 */
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCustomers } from '@/lib/data-store';
import { buildCsv } from '@/lib/csv';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/audit-log';
import { getBrandSlug } from '@/lib/config';

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const q = searchParams.get('q') || undefined;

    const { data: customers } = await getCustomers({ type, status, q, limit: 10000, page: 1 });

    const headers = [
      'ID', 'Nama Kontak', 'Perusahaan', 'No. WhatsApp', 'Email',
      'Alamat / Lokasi', 'Tipe Akun', 'Status Prospek', 'Sumber',
      'Komoditas Minat', 'Estimasi Volume', 'Total Pesanan',
      'Total Belanja (Rp)', 'Kontak Terakhir', 'Tanggal Dibuat',
      'Catatan',
    ];

    const rows = customers.map(c => [
      c.id,
      c.name,
      c.company || '',
      c.phone,
      c.email || '',
      c.address || '',
      c.type,
      c.status,
      c.source,
      c.preferredCommodity || '',
      c.estimatedVolume || '',
      c.totalOrders,
      c.totalSpent,
      c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString('id-ID') : '',
      new Date(c.createdAt).toLocaleDateString('id-ID'),
      c.notes || '',
    ]);

    // P1-04: buildCsv otomatis pakai escapeCsvField (anti formula injection) + BOM + CRLF
    const csvContent = buildCsv(headers, rows);

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const brand = getBrandSlug();
    const filename = `${brand}-database-pelanggan-${todayStr}.csv`;

    // P2-12: Audit log ekspor PII
    await recordAuditLog({
      actorId: session.id,
      actorName: session.name,
      actorRole: session.role,
      action: AUDIT_ACTIONS.EXPORT_CUSTOMERS,
      metadata: { count: customers.length, filters: { type, status, q } },
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
    console.error('Error exporting customer CSV:', err);
    return NextResponse.json({ error: err?.message || 'Gagal mengekspor data pelanggan' }, { status: 500 });
  }
}
