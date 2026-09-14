'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { sanitize } from '@/lib/sanitize';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import {
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  Eye,
  Pencil,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ArticleFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function ArticleForm({ initialData, isEditing = false }: ArticleFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [metaDesc, setMetaDesc] = useState(initialData?.metaDesc || '');
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || '');
  const [htmlContent, setHtmlContent] = useState(initialData?.htmlContent || '');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!slug || slug === slugify(title))) {
      setSlug(slugify(val));
    }
  };

  const handleGenerateSlug = () => {
    if (title.trim()) {
      setSlug(slugify(title));
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Judul artikel wajib diisi.');
      return;
    }

    if (!htmlContent.trim()) {
      setErrorMsg('Isi konten artikel wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() ? slugify(slug) : slugify(title),
        metaDesc: metaDesc.trim() || null,
        thumbnail: thumbnail || null,
        htmlContent,
        isPublished,
      };

      const url = isEditing
        ? `/api/admin/artikel/${initialData.id}`
        : '/api/admin/artikel';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan artikel.');
      }

      router.push('/admin/artikel');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan artikel.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/artikel"
            className="rounded-xl border border-surface-200 bg-white p-2 text-slate-600 hover:bg-surface-100 hover:text-slate-900 shadow-soft-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola tulisan edukasi spesifikasi mineral dan berita hasil alam.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/artikel"
            className="rounded-xl border border-surface-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-surface-100 shadow-soft-xs"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-soft-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Title, Slug, Content Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Judul Artikel <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Contoh: Peran Zeolite Aktif dalam Meningkatkan Kesuburan Tanah"
                className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  URL Slug Artikel
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate dari Judul
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-mono text-slate-400">
                  /artikel/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="peran-zeolite-aktif-pertanian"
                  className="w-full rounded-xl border border-surface-300 bg-white py-2 pl-20 pr-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ringkasan Singkat / Meta Description (SEO)
              </label>
              <textarea
                rows={2}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="Ringkasan 1-2 kalimat untuk preview kartu dan meta search engine..."
                className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Rich Text Editor with Live Preview Tab */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-4">
            <div className="flex items-center gap-1 rounded-xl bg-surface-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-white text-slate-900 shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-emerald-700 shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Pratinjau</span>
              </button>
            </div>

            {activeTab === 'editor' ? (
              <div>
                <RichTextEditor
                  value={htmlContent}
                  onChange={setHtmlContent}
                  placeholder="Tulis konten artikel: heading, paragraf, list, gambar, link..."
                  theme="light"
                  minHeight={350}
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Konten otomatis disanitasi dari skrip berbahaya (XSS-safe).
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-6 min-h-[350px]">
                {htmlContent ? (
                  <article
                    className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed prose-headings:font-bold prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5"
                    dangerouslySetInnerHTML={{ __html: sanitize(htmlContent) }}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-xs text-slate-400">
                    Belum ada konten untuk dipratinjau.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Thumbnail & Publication Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Switch */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-surface-100 pb-3">
              Status Publikasi
            </h2>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-surface-50 border border-surface-200 cursor-pointer hover:border-emerald-300 transition-colors">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-surface-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Terbitkan di Web Publik
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Jika tidak dicentang, artikel akan disimpan sebagai Draf internal.
                </span>
              </div>
            </label>
          </div>

          {/* Thumbnail Uploader */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-surface-100 pb-3">
              Foto Sampul (Thumbnail)
            </h2>

            <ImageUploader
              value={thumbnail}
              onChange={(val) => setThumbnail(val as string)}
              helperText="Upload foto sampul artikel komoditas"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
