import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/data-store';

/**
 * GET /api/public/settings
 * Endpoint publik: mengembalikan metode pembayaran (bankAccounts) saja.
 * Tidak memerlukan autentikasi karena digunakan di halaman checkout & pesanan publik.
 * Data sensitif (no. rekening) memang harus tampil kepada pembeli untuk proses transfer.
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    const bankAccounts = Array.isArray(settings.bankAccounts) ? settings.bankAccounts : [];

    return NextResponse.json(
      { bankAccounts },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ bankAccounts: [] }, { status: 200 });
  }
}
