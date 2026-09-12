import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getOrders } from '@/lib/data-store';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const q = searchParams.get('q') || undefined;
  // Sesi #19 (Fix #2): Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    const result = await getOrders({ status, q, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat daftar pesanan.' },
      { status: 500 }
    );
  }
}

