'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  _count?: { products: number };
}

export default function AdminKategoriPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State (Modal Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/kategori');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch {
      setError('Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormImage('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormImage(cat.image || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Nama kategori tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/kategori/${editingId}`
        : '/api/admin/kategori';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          image: formImage || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Gagal menyimpan kategori');
        setSubmitting(false);
        return;
      }

      setSuccess(
        editingId
          ? 'Kategori berhasil diperbarui'
          : 'Kategori baru berhasil ditambahkan'
      );
      setTimeout(() => setSuccess(null), 3000);
      setIsModalOpen(false);
      fetchCategories();
    } catch {
      setError('Terjadi kesalahan jaringan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/kategori/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        setSuccess('Kategori berhasil dihapus');
        setTimeout(() => setSuccess(null), 3000);
        fetchCategories();
      } else {
        alert(json.error || 'Gagal menghapus kategori');
      }
    } catch {
      alert('Terjadi kesalahan sistem saat menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar Admin */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                Manajemen Kategori Komoditas
              </h1>
              <p className="text-[11px] text-slate-400">
                Pengelompokan utama produk (Mineral Tambang, Hasil Hutan, dsb)
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 pt-6 space-y-6">
        {/* Feedback banners */}
        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Categories Table / Cards */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-soft-md">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Daftar Kategori Aktif</h2>
              <p className="text-[11px] text-slate-400">
                Total {categories.length} kategori terdaftar dalam sistem
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span>Memuat data kategori...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Belum ada kategori yang ditambahkan. Silakan klik tombol "Tambah Kategori".
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-800/40 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-600">
                          <Layers className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                          /{cat.slug}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Package className="h-3 w-3" />
                          {cat._count?.products ?? 0} Produk
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all disabled:opacity-50"
                    >
                      {deletingId === cat.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-soft-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Kategori Komoditas' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mineral Tambang"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Shared Image Uploader Component */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                <ImageUploader
                  label="Gambar Banner / Thumbnail Kategori"
                  helperText="Format JPG, PNG, WEBP, atau SVG. Maksimal 5 MB."
                  value={formImage}
                  onChange={(url: string) => setFormImage(url)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-soft-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
