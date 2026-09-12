'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function AdminProdukPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/produk');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch {
      console.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/produk/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        setSuccess(`Produk "${name}" berhasil dihapus`);
        setTimeout(() => setSuccess(null), 3000);
        fetchProducts();
      } else {
        alert(json.error || 'Gagal menghapus produk');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menghapus produk');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header */}
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
                <Package className="h-4 w-4 text-emerald-400" />
                Katalog Produk & Komoditas
              </h1>
              <p className="text-[11px] text-slate-400">
                Kelola stok, harga, galeri multi-gambar, peruntukan, dan hashtag
              </p>
            </div>
          </div>

          <Link
            href="/admin/produk/baru"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk Baru</span>
          </Link>
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

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Cari produk, kategori, atau tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>

          <div className="text-xs text-slate-400 self-end sm:self-center">
            Menampilkan <span className="font-bold text-white">{filteredProducts.length}</span> dari{' '}
            {products.length} komoditas
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-soft-md">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-xs text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Memuat daftar produk...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Tidak ada produk yang sesuai dengan pencarian Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Produk</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Peruntukan</th>
                    <th className="py-3.5 px-4">Harga & Stok</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredProducts.map((p) => {
                    const firstImg = p.images?.[0] || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=300&q=80';
                    const isOutOfStock = p.stock <= 0;
                    const usages = p.usages?.map((u: any) => u.usage?.name || u.name) || [];

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Info Produk & Foto */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                              <Image
                                src={firstImg}
                                alt={p.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-white hover:text-emerald-400 transition-colors block">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                {p.tags?.slice(0, 3).map((tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-4">
                          <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                            {p.category?.name || 'Umum'}
                          </span>
                        </td>

                        {/* Peruntukan */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {usages.slice(0, 2).map((uName: string, idx: number) => (
                              <span
                                key={idx}
                                className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20"
                              >
                                {uName}
                              </span>
                            ))}
                            {usages.length > 2 && (
                              <span className="rounded bg-slate-800 px-1 text-[10px] text-slate-400">
                                +{usages.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Harga & Stok */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{formatRupiah(p.price)}</div>
                          <div className="mt-0.5">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                                <AlertCircle className="h-3 w-3" /> Habis
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Stok: <strong className="text-emerald-400">{p.stock}</strong>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/produk/${p.slug}`}
                              target="_blank"
                              title="Lihat Halaman Publik"
                              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/produk/${p.id}`}
                              title="Edit Produk"
                              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              disabled={deletingId === p.id}
                              title="Hapus Produk"
                              className="rounded-lg p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                            >
                              {deletingId === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
