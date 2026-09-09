import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSiteSettings, updateSiteSettings } from '@/lib/data-store';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pengaturan situs.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateSiteSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan pengaturan situs.' },
      { status: 500 }
    );
  }
}
