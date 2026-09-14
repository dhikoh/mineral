'use client';

/**
 * src/app/admin/katalog-pdf/page.tsx
 * Sesi #28 — Halaman Admin: Generator Katalog PDF
 *
 * Alur:
 * 1. Fetch daftar kategori & peruntukan untuk filter dropdown
 * 2. Fetch semua produk aktif via /api/admin/produk untuk preview
 * 3. Filter produk client-side saat filter berubah (real-time preview)
 * 4. Klik "Download PDF" → buka /api/admin/katalog-pdf?... di tab baru → browser auto-download
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileDown,
  Filter,
  Eye,
  Tag,
  Wrench,
  Search,
  ToggleLeft,
  ToggleRight,
  User,
  Building2,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface UsageItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductPreview {
  id: string;
  name: string;
  images: string[];
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  usageIds?: string[];
  usages?: { usage?: { id: string; name: string } }[];
  isActive?: boolean;
  price: number;
  unit?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminKatalogPdfPage() {
  const router = useRouter();

  // Filter state
  const [categoryId, setCategoryId]     = useState('');
  const [usageId, setUsageId]           = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showPrice, setShowPrice]       = useState(true);
  const [buyerName, setBuyerName]       = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');

  // Data state
  const [categories, setCategories]     = useState<CategoryItem[]>([]);
  const [usages, setUsages]             = useState<UsageItem[]>([]);
  const [allProducts, setAllProducts]   = useState<ProductPreview[]>([]);

  // UI state
  const [loadingData, setLoadingData]   = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  // ── Fetch data awal ──────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, usageRes, prodRes] = await Promise.all([
          fetch('/api/admin/kategori'),
          fetch('/api/admin/peruntukan'),
          fetch('/api/admin/produk'),
        ]);

        // Redirect jika tidak terautentikasi
        if (catRes.status === 401 || usageRes.status === 401 || prodRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        const [catData, usageData, prodData] = await Promise.all([
          catRes.json(),
          usageRes.json(),
          prodRes.json(),
        ]);

        setCategories(catData.categories || catData || []);
        setUsages(usageData.usages || usageData || []);
        const prods = prodData.products || prodData || [];
        setAllProducts(prods.filter((p: ProductPreview) => p.isActive !== false));
      } catch (err) {
        setErrorMsg('Gagal memuat data. Silakan refresh halaman.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchAll();
  }, [router]);

  // ── Filter produk client-side (preview real-time) ────────────────────────

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (categoryId) {
      result = result.filter((p) => p.categoryId === categoryId);
    }

    if (usageId) {
      result = result.filter(
        (p) =>
          p.usageIds?.includes(usageId) ||
          p.usages?.some((u) => u.usage?.id === usageId)
      );
    }

    if (searchQuery.trim()) {
      const lq = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lq));
    }

    return result;
  }, [allProducts, categoryId, usageId, searchQuery]);

  // ── Handler: Download PDF ─────────────────────────────────────────────────

  const handleDownload = () => {
    if (filteredProducts.length === 0) {
      setErrorMsg('Tidak ada produk yang sesuai filter. Ubah kriteria filter terlebih dahulu.');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);
    setSuccessMsg('');

    const params = new URLSearchParams();
    if (categoryId)   params.set('categoryId', categoryId);
    if (usageId)      params.set('usageId', usageId);
    if (searchQuery)  params.set('q', searchQuery);
    params.set('showPrice', String(showPrice));
    if (buyerName)    params.set('buyerName', buyerName.slice(0, 100));
    if (buyerCompany) params.set('buyerCompany', buyerCompany.slice(0, 100));

    // Buka di tab baru → browser auto-download PDF
    window.open(`/api/admin/katalog-pdf?${params.toString()}`, '_blank');

    // Reset loading state setelah jeda singkat (fetch PDF async di tab baru)
    setTimeout(() => {
      setIsGenerating(false);
      setSuccessMsg(`PDF berhasil di-generate dengan ${filteredProducts.length} produk. Periksa unduhan browser Anda.`);
      setTimeout(() => setSuccessMsg(''), 6000);
    }, 1800);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-sm">Memuat data katalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <span>Admin</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-emerald-400 font-medium">Katalog PDF</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FileDown className="h-5 w-5 text-emerald-400" />
              Generator Katalog PDF
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Generate katalog produk terfilter dalam format PDF siap kirim ke buyer.
            </p>
          </div>
          {/* Stat badge */}
          <div className="flex-shrink-0 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-center hidden sm:block">
            <div className="text-2xl font-bold text-white">{allProducts.length}</div>
            <div className="text-xs text-slate-400">Total Produk Aktif</div>
          </div>
        </div>
      </div>

      {/* ── Alert Messages ────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ═══════════════════════════════════════════════════════════
            Kolom Kiri: Filter & Opsi (4 cols)
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4">

          {/* Filter Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-400" />
              Filter Produk
            </h2>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                <Tag className="h-3 w-3 inline mr-1 text-slate-400" />
                Kategori
              </label>
              <select
                id="filter-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Peruntukan */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                <Wrench className="h-3 w-3 inline mr-1 text-slate-400" />
                Peruntukan
              </label>
              <select
                id="filter-usage"
                value={usageId}
                onChange={(e) => setUsageId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              >
                <option value="">Semua Peruntukan</option>
                {usages.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Cari nama produk */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                <Search className="h-3 w-3 inline mr-1 text-slate-400" />
                Cari Nama Produk
              </label>
              <input
                id="filter-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama produk..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>

            {/* Reset filter */}
            {(categoryId || usageId || searchQuery) && (
              <button
                type="button"
                onClick={() => { setCategoryId(''); setUsageId(''); setSearchQuery(''); }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors underline underline-offset-2"
              >
                Reset semua filter
              </button>
            )}
          </div>

          {/* Opsi PDF Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-400" />
              Opsi PDF
            </h2>

            {/* Toggle harga */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-200">Tampilkan Harga</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Jika off, harga diganti "Hubungi Kami"</p>
              </div>
              <button
                id="toggle-show-price"
                type="button"
                onClick={() => setShowPrice((v) => !v)}
                aria-pressed={showPrice}
                className="transition-colors"
              >
                {showPrice ? (
                  <ToggleRight className="h-7 w-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Personalisasi Buyer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              Personalisasi Buyer
              <span className="text-[10px] text-slate-500 font-normal">(opsional)</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                <User className="h-3 w-3 inline mr-1 text-slate-400" />
                Nama Buyer / PIC
              </label>
              <input
                id="buyer-name"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value.slice(0, 100))}
                placeholder="Contoh: Bpk. Bambang Sudiro"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                <Building2 className="h-3 w-3 inline mr-1 text-slate-400" />
                Nama Perusahaan
              </label>
              <input
                id="buyer-company"
                type="text"
                value={buyerCompany}
                onChange={(e) => setBuyerCompany(e.target.value.slice(0, 100))}
                placeholder="Contoh: PT Semen Perkasa Nusantara"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Download Button */}
          <button
            id="btn-download-pdf"
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || filteredProducts.length === 0}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sedang memproses PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Download PDF ({filteredProducts.length} produk)
              </>
            )}
          </button>

          {/* Info note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>PDF akan dibuka di tab baru dan otomatis ter-download. Proses 5–20 detik tergantung jumlah produk.</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            Kolom Kanan: Preview Produk (8 cols)
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            {/* Preview header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                Preview Produk
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                filteredProducts.length > 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {filteredProducts.length} produk
              </span>
            </div>

            {/* Empty state */}
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">Tidak ada produk</p>
                <p className="text-xs text-slate-600 mt-1">Ubah filter untuk menampilkan produk</p>
              </div>
            ) : (
              /* Product list */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:border-emerald-500/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate leading-tight">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {product.category?.name || '—'}
                      </p>
                      {showPrice && (
                        <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                          Rp {product.price.toLocaleString('id-ID')}/{product.unit || 'kg'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
