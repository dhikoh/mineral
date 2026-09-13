import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getArticleById, updateArticle, deleteArticle } from '@/lib/data-store';

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
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error fetching article by id:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat artikel.' },
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
    const updated = await updateArticle(id, body);
    revalidatePath('/artikel');
    if (updated.slug) revalidatePath('/artikel/' + updated.slug);
    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil diperbarui.',
      article: updated,
    });
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui artikel.' },
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
    await deleteArticle(id);
    revalidatePath('/artikel');
    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dihapus.',
    });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus artikel.' },
      { status: 500 }
    );
  }
}
