'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Save,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { TagInput } from '@/components/ui/TagInput';
import { formatRupiah } from '@/lib/utils';

export default function AdminEditProdukPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // Master Data
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [usages, setUsages] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedUsageIds, setSelectedUsageIds] = useState<string[]>([]);
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('0');
  const [unit, setUnit] = useState<string>('kg');
  const [minStock, setMinStock] = useState<string>('50');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, usageRes, prodRes] = await Promise.all([
          fetch('/api/admin/kategori'),
          fetch('/api/admin/peruntukan'),
          fetch(`/api/admin/produk/${id}`),
        ]);

        const catJson = await catRes.json();
        const usageJson = await usageRes.json();
        const prodJson = await prodRes.json();

        if (catJson.success) setCategories(catJson.data);
        if (usageJson.success) setUsages(usageJson.data);

        if (prodJson.success && prodJson.data) {
          const p = prodJson.data;
          setName(p.name || '');
          setCategoryId(p.categoryId || '');
          setPrice(String(p.price || 0));
          setStock(String(p.stock ?? 0));
          setUnit(p.unit || 'kg');
          setMinStock(String(p.minStock ?? 50));
          setDescription(p.description || '');
          setTags(Array.isArray(p.tags) ? p.tags : []);
          setImages(Array.isArray(p.images) ? p.images : []);
          setIsActive(p.isActive ?? true);

          // Extract usage IDs
          if (Array.isArray(p.usages)) {
            const uIds = p.usages
              .map((u: any) => u.usageId || u.usage?.id)
              .filter(Boolean);
            setSelectedUsageIds(uIds);
          } else if (Array.isArray(p.usageIds)) {
            setSelectedUsageIds(p.usageIds);
          }
        } else {
          setError('Produk tidak ditemukan');
        }
      } catch (err) {
        console.error('Failed to load product data:', err);
        setError('Gagal memuat data produk dari server');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const toggleUsage = (uId: string) => {
    setSelectedUsageIds((prev) =>
      prev.includes(uId) ? prev.filter((item) => item !== uId) : [...prev, uId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }
    if (!categoryId) {
      setError('Kategori produk wajib dipilih');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Harga produk harus lebih besar dari Rp 0');
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      setError('Jumlah stok tidak valid');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/produk/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          stock: numStock,
          unit: unit.trim() || 'kg',
          minStock: Number(minStock) || 50,
          categoryId,
          usageIds: selectedUsageIds,
          tags,
          images,
          isActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Gagal memperbarui produk');
        setSubmitting(false);
        return;
      }

      router.push('/admin/produk');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan jaringan saat menyimpan perubahan');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        <span>Memuat data produk...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="relative z-10 md:sticky md:top-0 md:z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/produk"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-bold text-white text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-400" />
                Edit Produk: {name || 'Komoditas'}
              </h1>
              <p className="text-[11px] text-slate-400">
                Perbarui harga, stok, spesifikasi, dan galeri media
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-8 pt-6">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Informasi Utama */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-soft-md space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-400" />
              Informasi Utama Produk
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nama Produk Komoditas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  Kategori Utama <span className="text-rose-400">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Status Publikasi
                </label>
                <div className="flex items-center gap-3 pt-1.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500/20"
                    />
                    <span className="text-slate-300">Tampilkan di Toko Publik</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Deskripsi & Spesifikasi Teknis
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Harga & Stok */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-soft-md space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Harga & Manajemen Stok
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Harga Satuan (IDR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                />
                {price && (
                  <p className="mt-1 text-[11px] font-bold text-emerald-400">
                    Preview: {formatRupiah(Number(price))} / {unit || 'kg'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Satuan Komoditas (UoM) <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={['kg', 'ton', 'sak (25 kg)', 'sak (50 kg)', 'jumbo bag (1 ton)', 'batang/ingot', 'm³', 'liter'].includes(unit) ? unit : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') setUnit(e.target.value);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="ton">ton (Metrik Ton)</option>
                    <option value="sak (25 kg)">sak (25 kg)</option>
                    <option value="sak (50 kg)">sak (50 kg)</option>
                    <option value="jumbo bag (1 ton)">jumbo bag (1 ton)</option>
                    <option value="batang/ingot">batang / ingot</option>
                    <option value="m³">m³ (Meter Kubik)</option>
                    <option value="liter">liter</option>
                    <option value="custom">Kustom...</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Ketik satuan kustom"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Jumlah Stok Fisik ({unit || 'kg'}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Batas Peringatan Stok Minimum (Min Stock)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Contoh: 50"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Peringatan stok tipis muncul di dashboard jika stok &le; angka ini
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Taksonomi Peruntukan (Usage) & Hashtags */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-soft-md space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Taksonomi Peruntukan & Hashtags
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Pilih Peruntukan Produk (Multi-Select)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {usages.map((u) => {
                  const isChecked = selectedUsageIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      onClick={() => toggleUsage(u.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                      />
                      <span className="text-[11px]">{u.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <TagInput
                label="Tags / Hashtag Produk (Folksonomi Bebas)"
                tags={tags}
                onChange={(newTags) => setTags(newTags)}
              />
            </div>
          </div>

          {/* Card 4: Galeri Multi-Gambar */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-soft-md space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Galeri Gambar Produk
            </h2>

            <ImageUploader
              multiple={true}
              label="Foto / Galeri Komoditas"
              values={images}
              onChange={(newImages: string[]) => setImages(newImages)}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/produk"
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-soft-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
