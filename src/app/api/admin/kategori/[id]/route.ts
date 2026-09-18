import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { updateCategory, deleteCategory, getCategories } from '@/lib/data-store';
import { deleteMedia } from '@/lib/storage';

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

    revalidatePath('/');
    revalidatePath('/produk');
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
    const categories = await getCategories().catch(() => []);
    const existing = (categories as any[]).find((c: any) => c.id === id);
    await deleteCategory(id);

    // P2-E: Bersihkan berkas gambar kategori di storage agar tidak menjadi media orphan
    if (existing?.image) {
      deleteMedia(existing.image).catch(() => {});
    }
    revalidatePath('/');
    revalidatePath('/produk');
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
