'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Layers,
  Sparkles,
  Banknote,
  Boxes,
} from 'lucide-react';

interface FilterItem {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface FilterSidebarProps {
  categories: FilterItem[];
  usages: FilterItem[];
  isMobileDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function FilterSidebar({
  categories,
  usages,
  isMobileDrawer = false,
  isOpen = false,
  onClose,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state initialized from searchParams
  const [q, setQ] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);

  // Section collapse state
  const [catOpen, setCatOpen] = useState(true);
  const [usageOpen, setUsageOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Sync state with URL whenever searchParams change
  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setInStock(searchParams.get('inStock') === 'true' || searchParams.get('inStock') === '1');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');

    const catParam = searchParams.get('kategori');
    setSelectedCats(catParam ? catParam.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const usageParam = searchParams.get('peruntukan');
    setSelectedUsages(usageParam ? usageParam.split(',').map((s) => s.trim()).filter(Boolean) : []);
  }, [searchParams]);

  const toggleCategory = (slug: string) => {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleUsage = (slug: string) => {
    setSelectedUsages((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    // Preserve sort
    const currentSort = searchParams.get('sort');
    if (currentSort) params.set('sort', currentSort);

    if (q.trim()) params.set('q', q.trim());
    if (selectedCats.length > 0) params.set('kategori', selectedCats.join(','));
    if (selectedUsages.length > 0) params.set('peruntukan', selectedUsages.join(','));
    if (minPrice && !isNaN(Number(minPrice))) params.set('minPrice', minPrice);
    if (maxPrice && !isNaN(Number(maxPrice))) params.set('maxPrice', maxPrice);
    if (inStock) params.set('inStock', 'true');

    // Preserve tag if present
    const currentTag = searchParams.get('tag');
    if (currentTag) params.set('tag', currentTag);

    const targetUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(targetUrl);
    if (onClose) onClose();
  };

  const resetFilters = () => {
    setQ('');
    setSelectedCats([]);
    setSelectedUsages([]);
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);

    const params = new URLSearchParams();
    const currentSort = searchParams.get('sort');
    if (currentSort) params.set('sort', currentSort);

    const targetUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(targetUrl);
    if (onClose) onClose();
  };

  const setPricePreset = (min: number | null, max: number | null) => {
    setMinPrice(min !== null ? min.toString() : '');
    setMaxPrice(max !== null ? max.toString() : '');
  };

  const filterFormContent = (
    <div className="space-y-6">
      {/* Search Input Section */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-emerald-600" />
          Pencarian Kata Kunci
        </label>
        <div className="relative mt-1.5">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Cari nama, mineral, spesifikasi..."
            className="w-full rounded-xl border border-surface-300 bg-white py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 shadow-soft-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2.5 top-2.5 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <hr className="border-surface-200" />

      {/* Categories Multi-Select Section */}
      <div>
        <button
          type="button"
          onClick={() => setCatOpen(!catOpen)}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            Kategori ({categories.length})
          </span>
          {catOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {catOpen && (
          <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isChecked = selectedCats.includes(cat.slug);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isChecked ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-700 hover:bg-surface-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(cat.slug)}
                      className="h-3.5 w-3.5 rounded border-surface-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{cat.name}</span>
                  </div>
                  {cat._count !== undefined && (
                    <span className="rounded-md bg-surface-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {cat._count.products}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <hr className="border-surface-200" />

      {/* Usages Multi-Select Section */}
      <div>
        <button
          type="button"
          onClick={() => setUsageOpen(!usageOpen)}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Peruntukan ({usages.length})
          </span>
          {usageOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {usageOpen && (
          <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {usages.map((usage) => {
              const isChecked = selectedUsages.includes(usage.slug);
              return (
                <label
                  key={usage.id}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isChecked ? 'bg-blue-50 text-blue-950 font-semibold' : 'text-slate-700 hover:bg-surface-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleUsage(usage.slug)}
                      className="h-3.5 w-3.5 rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{usage.name}</span>
                  </div>
                  {usage._count !== undefined && (
                    <span className="rounded-md bg-surface-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {usage._count.products}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <hr className="border-surface-200" />

      {/* Price Range Section */}
      <div>
        <button
          type="button"
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5 text-emerald-600" />
            Rentang Harga (Rp)
          </span>
          {priceOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {priceOpen && (
          <div className="mt-3 space-y-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPricePreset(null, 50000)}
                className="rounded-lg bg-surface-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                &lt; 50 rb
              </button>
              <button
                type="button"
                onClick={() => setPricePreset(50000, 200000)}
                className="rounded-lg bg-surface-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                50rb - 200rb
              </button>
              <button
                type="button"
                onClick={() => setPricePreset(200000, null)}
                className="rounded-lg bg-surface-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                &gt; 200 rb
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Minimum</span>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-[11px] font-medium text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-xl border border-surface-300 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-800 shadow-soft-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Maksimum</span>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-[11px] font-medium text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Tak terhingga"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-xl border border-surface-300 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-800 shadow-soft-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-surface-200" />

      {/* Stock Availability */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer rounded-xl bg-surface-50 p-2.5 border border-surface-200 hover:border-emerald-300 transition-all">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="h-4 w-4 rounded border-surface-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-800">Hanya Stok Tersedia</span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={applyFilters}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-soft-sm hover:bg-emerald-700 transition-colors"
        >
          <Check className="h-4 w-4" />
          <span>Terapkan Filter</span>
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-surface-300 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-surface-100 hover:text-slate-900 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filter</span>
        </button>
      </div>
    </div>
  );

  // If Mobile Drawer Mode
  if (isMobileDrawer) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Bottom Sheet Drawer */}
        <div className="relative z-10 max-h-[85vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Filter & Cari Komoditas</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-surface-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="overflow-y-auto px-6 py-4 flex-1">
            {filterFormContent}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Sticky Sidebar
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-24 rounded-3xl border border-surface-200 bg-white p-5 shadow-soft-sm">
        <div className="flex items-center justify-between pb-3 border-b border-surface-200 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Filter Produk</h2>
          </div>
        </div>
        {filterFormContent}
      </div>
    </aside>
  );
}
