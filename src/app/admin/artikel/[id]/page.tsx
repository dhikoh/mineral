import { notFound } from 'next/navigation';
import { getArticleById } from '@/lib/data-store';
import { ArticleForm } from '@/components/admin/ArticleForm';

export const dynamic = 'force-dynamic';

export default async function EditArtikelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ArticleForm initialData={article} isEditing={true} />
      </div>
    </div>
  );
}
