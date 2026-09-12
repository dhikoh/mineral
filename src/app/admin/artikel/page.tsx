'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Plus,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
} from 'lucide-react';

export default function AdminArtikelPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchArticles = async (q?: string) => {
    setIsLoading(true);
    try {
      const url = q ? `/api/admin/artikel?q=${encodeURIComponent(q)}` : '/api/admin/artikel';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(searchQuery);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(searchQuery);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/artikel/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== deleteId));
        setDeleteId(null);
      }
    } catch (e) {
      console.error('Failed to delete article:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-surface-200 bg-white p-2 text-slate-600 hover:bg-surface-100 hover:text-slate-900 shadow-soft-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Artikel &amp; Berita Edukasi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Publikasikan artikel edukasi spesifikasi mineral, kegunaan industri, dan berita komoditas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchArticles(searchQuery)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-surface-100 shadow-soft-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Segarkan</span>
            </button>
            <Link
              href="/admin/artikel/baru"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-soft-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tulis Artikel Baru</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft-xs">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul artikel atau ringkasan topik..."
                className="w-full rounded-xl border border-surface-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-soft-xs"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Table List */}
        <div className="rounded-2xl border border-surface-200 bg-white shadow-soft-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Memuat daftar artikel...
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Belum Ada Artikel</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mulai publikasikan tulisan edukasi pertama Anda tentang komoditas mineral alam.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/artikel/baru"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-soft-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tulis Artikel Baru</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-surface-100/70 border-b border-surface-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Artikel</th>
                    <th className="px-4 py-3.5">Slug URL</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Tanggal Dibuat</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
                            {art.thumbnail ? (
                              <Image
                                src={art.thumbnail}
                                alt={art.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <FileText className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="max-w-md min-w-0">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{art.title}</h3>
                            {art.metaDesc && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {art.metaDesc}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        /{art.slug}
                      </td>
                      <td className="px-4 py-3.5">
                        {art.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Terbit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold">
                            <Clock className="h-3 w-3" />
                            Draf
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDate(art.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {art.isPublished && (
                            <Link
                              href={`/artikel/${art.slug}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-100 hover:text-emerald-700 transition-colors"
                              title="Lihat di Web Publik"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/artikel/${art.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-100 hover:text-blue-700 transition-colors"
                            title="Edit Artikel"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteId(art.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Artikel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">Hapus Artikel Ini?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Artikel yang dihapus tidak dapat dipulihkan kembali. Anda yakin ingin melanjutkan?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-surface-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-surface-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-soft-xs disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Artikel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
