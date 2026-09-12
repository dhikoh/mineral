'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
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

interface UsageItem {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export default function AdminPeruntukanPage() {
  const [usages, setUsages] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/peruntukan');
      const json = await res.json();
      if (json.success) {
        setUsages(json.data);
      }
    } catch {
      setError('Gagal memuat taksonomi peruntukan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsages();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UsageItem) => {
    setEditingId(u.id);
    setFormName(u.name);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Nama peruntukan tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/peruntukan/${editingId}`
        : '/api/admin/peruntukan';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Gagal menyimpan data');
        setSubmitting(false);
        return;
      }

      setSuccess(
        editingId
          ? 'Peruntukan berhasil diperbarui'
          : 'Peruntukan baru berhasil ditambahkan'
      );
      setTimeout(() => setSuccess(null), 3000);
      setIsModalOpen(false);
      fetchUsages();
    } catch {
      setError('Terjadi kesalahan jaringan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus taksonomi peruntukan ini?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/peruntukan/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        setSuccess('Peruntukan berhasil dihapus');
        setTimeout(() => setSuccess(null), 3000);
        fetchUsages();
      } else {
        alert(json.error || 'Gagal menghapus peruntukan');
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
      <header className="relative z-10 md:sticky md:top-0 md:z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
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
                <Sparkles className="h-4 w-4 text-amber-400" />
                Manajemen Peruntukan Produk (Usage)
              </h1>
              <p className="text-[11px] text-slate-400">
                Taksonomi terkontrol untuk filter checkbox rapi di etalase publik
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Peruntukan</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 pt-6 space-y-6">
        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-soft-md">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Daftar Taksonomi Peruntukan</h2>
              <p className="text-[11px] text-slate-400">
                Total {usages.length} opsi peruntukan terdaftar
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              <span>Memuat data peruntukan...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-b border-slate-800">
              {usages.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-800/40 transition-colors border-b border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{u.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {u.slug}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-amber-400">
                          <Package className="h-3 w-3" />
                          {u._count?.products ?? 0} Produk
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(u)}
                      className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      className="rounded-lg p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                      title="Hapus"
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-soft-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Peruntukan' : 'Tambah Peruntukan Baru'}
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
                  Nama Peruntukan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pertanian & Pupuk"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
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
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-soft-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambah Peruntukan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
