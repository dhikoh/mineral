import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getAdminDashboardStats } from '@/lib/data-store';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat statistik dashboard.' },
      { status: 500 }
    );
  }
}
