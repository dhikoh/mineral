import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { getArticles, createArticle } from '@/lib/data-store';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || undefined;
  // Sesi #19 (Fix #2): Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    const result = await getArticles({ q, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching admin articles:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat artikel.' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, htmlContent, thumbnail, metaDesc, isPublished } = body;

    if (!title || !htmlContent) {
      return NextResponse.json(
        { error: 'Judul dan isi konten artikel wajib diisi.' },
        { status: 400 }
      );
    }

    const article = await createArticle({
      title: title.trim(),
      slug: slug ? slug.trim() : undefined,
      htmlContent,
      thumbnail: thumbnail || null,
      metaDesc: metaDesc ? metaDesc.trim() : null,
      isPublished: Boolean(isPublished),
    });

    revalidatePath('/artikel');
    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat artikel.' },
      { status: 500 }
    );
  }
}
