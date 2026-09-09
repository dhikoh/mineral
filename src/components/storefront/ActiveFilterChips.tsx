'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, RotateCcw } from 'lucide-react';

interface ActiveFilterChipsProps {
  categories: { id: string; name: string; slug: string }[];
  usages: { id: string; name: string; slug: string }[];
  params?: { [key: string]: string | undefined };
}

export function ActiveFilterChips({ categories, usages, params: serverParams }: ActiveFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const clientSearchParams = useSearchParams();

  // Use client searchParams if available, or fallback to server-provided params for SSR
  const q = clientSearchParams?.get('q') ?? serverParams?.q;
  const tag = clientSearchParams?.get('tag') ?? serverParams?.tag;
  const inStock = clientSearchParams?.get('inStock') ?? serverParams?.inStock;
  const minPrice = clientSearchParams?.get('minPrice') ?? serverParams?.minPrice;
  const maxPrice = clientSearchParams?.get('maxPrice') ?? serverParams?.maxPrice;
  const kategoriParam = clientSearchParams?.get('kategori') ?? serverParams?.kategori;
  const peruntukanParam = clientSearchParams?.get('peruntukan') ?? serverParams?.peruntukan;

  const selectedCategories = kategoriParam
    ? kategoriParam.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const selectedUsages = peruntukanParam
    ? peruntukanParam.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const hasActiveFilters =
    Boolean(q) ||
    Boolean(tag) ||
    Boolean(inStock === 'true' || inStock === '1') ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    selectedCategories.length > 0 ||
    selectedUsages.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  const removeParam = (key: string, valueToRemove?: string) => {
    const params = new URLSearchParams(clientSearchParams ? clientSearchParams.toString() : '');

    if (valueToRemove && (key === 'kategori' || key === 'peruntukan')) {
      const currentValues = (params.get(key) || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== valueToRemove);

      if (currentValues.length > 0) {
        params.set(key, currentValues.join(','));
      } else {
        params.delete(key);
      }
    } else {
      params.delete(key);
      if (key === 'price') {
        params.delete('minPrice');
        params.delete('maxPrice');
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetAllFilters = () => {
    const params = new URLSearchParams();
    const sort = clientSearchParams?.get('sort') ?? serverParams?.sort;
    if (sort) {
      params.set('sort', sort);
    }
    const target = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(target);
  };

  const formatRupiah = (numStr: string) => {
    const n = parseInt(numStr, 10);
    if (isNaN(n)) return numStr;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
        Filter Aktif:
      </span>

      {/* Query Search */}
      {q && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800">
          <span>Kata kunci: "{q}"</span>
          <button
            type="button"
            onClick={() => removeParam('q')}
            className="rounded-full p-0.5 hover:bg-emerald-200 text-emerald-700 transition-colors cursor-pointer"
            title="Hapus filter pencarian"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Tag */}
      {tag && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-medium text-teal-800">
          <span>#{tag}</span>
          <button
            type="button"
            onClick={() => removeParam('tag')}
            className="rounded-full p-0.5 hover:bg-teal-200 text-teal-700 transition-colors cursor-pointer"
            title="Hapus filter tag"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Categories */}
      {selectedCategories.map((catSlug) => {
        const cat = categories.find((c) => c.slug === catSlug);
        const name = cat ? cat.name : catSlug;
        return (
          <span
            key={catSlug}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-800"
          >
            <span>Kategori: {name}</span>
            <button
              type="button"
              onClick={() => removeParam('kategori', catSlug)}
              className="rounded-full p-0.5 hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
              title={`Hapus kategori ${name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      {/* Usages */}
      {selectedUsages.map((usageSlug) => {
        const usage = usages.find((u) => u.slug === usageSlug);
        const name = usage ? usage.name : usageSlug;
        return (
          <span
            key={usageSlug}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-800"
          >
            <span>Peruntukan: {name}</span>
            <button
              type="button"
              onClick={() => removeParam('peruntukan', usageSlug)}
              className="rounded-full p-0.5 hover:bg-blue-200 text-blue-700 transition-colors cursor-pointer"
              title={`Hapus peruntukan ${name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      {/* Price Range */}
      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
          <span>
            {minPrice && maxPrice
              ? `Harga: ${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`
              : minPrice
              ? `Harga: ≥ ${formatRupiah(minPrice)}`
              : `Harga: ≤ ${formatRupiah(maxPrice!)}`}
          </span>
          <button
            type="button"
            onClick={() => removeParam('price')}
            className="rounded-full p-0.5 hover:bg-amber-200 text-amber-700 transition-colors cursor-pointer"
            title="Hapus filter rentang harga"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* In Stock */}
      {(inStock === 'true' || inStock === '1') && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-800">
          <span>Hanya Stok Tersedia</span>
          <button
            type="button"
            onClick={() => removeParam('inStock')}
            className="rounded-full p-0.5 hover:bg-green-200 text-green-700 transition-colors cursor-pointer"
            title="Hapus filter stok tersedia"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Reset Button */}
      <button
        type="button"
        onClick={resetAllFilters}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
      >
        <RotateCcw className="h-3 w-3" />
        <span>Reset Semua</span>
      </button>
    </div>
  );
}
