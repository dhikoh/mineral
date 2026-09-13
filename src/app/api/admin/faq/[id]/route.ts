import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getFAQById, updateFAQ, deleteFAQ } from '@/lib/data-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const faq = await getFAQById(id);
    if (!faq) {
      return NextResponse.json({ error: 'FAQ tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    console.error('Error fetching FAQ by ID:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat detail FAQ.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await updateFAQ(id, body);
    revalidatePath('/faq');
    return NextResponse.json({ success: true, faq: updated });
  } catch (error: any) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui FAQ.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteFAQ(id);
    revalidatePath('/faq');
    return NextResponse.json({ success: true, message: 'FAQ berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus FAQ.' },
      { status: 500 }
    );
  }
}
