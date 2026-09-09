import { ArticleForm } from '@/components/admin/ArticleForm';

export const dynamic = 'force-dynamic';

export default function BaruArtikelPage() {
  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ArticleForm />
      </div>
    </div>
  );
}
