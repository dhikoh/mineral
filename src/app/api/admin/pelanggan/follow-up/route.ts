import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getFollowUpsDue } from '@/lib/data-store';

// GET /api/admin/pelanggan/follow-up
// Sesi #20: Kontak yang jadwal follow-upnya sudah tiba/terlewat (max 5)
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contacts = await getFollowUpsDue(5);
    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    console.error('Error fetching follow-ups due:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat data follow-up' },
      { status: 500 }
    );
  }
}
