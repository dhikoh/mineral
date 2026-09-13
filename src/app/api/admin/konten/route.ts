import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getContentBlocks, updateContentBlock } from '@/lib/data-store';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const blocks = await getContentBlocks();
    return NextResponse.json({ success: true, blocks });
  } catch (error: any) {
    console.error('Error fetching content blocks:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat blok konten teks.' },
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
    const { key, title, content } = body;

    if (!key || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Parameter key dan content wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await updateContentBlock(key, { title, content });
    revalidatePath('/');
    return NextResponse.json({ success: true, block: updated });
  } catch (error: any) {
    console.error('Error updating content block:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui blok konten.' },
      { status: 500 }
    );
  }
}
