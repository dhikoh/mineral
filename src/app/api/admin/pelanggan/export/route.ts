import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCustomers } from '@/lib/data-store';

function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

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

    // Export tidak perlu pagination — ambil semua dengan limit besar
    const { data: customers } = await getCustomers({ type, status, q, limit: 10000, page: 1 });

    const headers = [
      'ID',
      'Nama Kontak',
      'Perusahaan',
      'No. WhatsApp',
      'Email',
      'Alamat / Lokasi',
      'Tipe Akun',
      'Status Prospek',
      'Sumber',
      'Komoditas Minat',
      'Estimasi Volume',
      'Total Pesanan',
      'Total Belanja (Rp)',
      'Kontak Terakhir',
      'Tanggal Dibuat',
      'Catatan Negosiasi / Sales',
    ];

    const rows = customers.map((c) => [
      escapeCsvField(c.id),
      escapeCsvField(c.name),
      escapeCsvField(c.company || '-'),
      escapeCsvField(c.phone),
      escapeCsvField(c.email || '-'),
      escapeCsvField(c.address || '-'),
      escapeCsvField(c.type),
      escapeCsvField(c.status),
      escapeCsvField(c.source),
      escapeCsvField(c.preferredCommodity || '-'),
      escapeCsvField(c.estimatedVolume || '-'),
      escapeCsvField(c.totalOrders),
      escapeCsvField(c.totalSpent),
      escapeCsvField(c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString('id-ID') : '-'),
      escapeCsvField(new Date(c.createdAt).toLocaleDateString('id-ID')),
      escapeCsvField(c.notes || '-'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Adably-database-pelanggan-${todayStr}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error exporting customer CSV:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengekspor data pelanggan' },
      { status: 500 }
    );
  }
}
