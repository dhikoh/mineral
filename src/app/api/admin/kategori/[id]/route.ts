import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { updateCategory, deleteCategory } from '@/lib/data-store';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, image } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi' },
        { status: 400 }
      );
    }

    const updated = await updateCategory(id, {
      name: name.trim(),
      image: image !== undefined ? image : undefined,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Kategori berhasil diperbarui',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui kategori' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil dihapus',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus kategori' },
      { status: 500 }
    );
  }
}
