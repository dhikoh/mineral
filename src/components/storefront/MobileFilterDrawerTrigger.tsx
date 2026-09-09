'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { FilterSidebar } from './FilterSidebar';

interface MobileFilterDrawerTriggerProps {
  categories: { id: string; name: string; slug: string; _count?: { products: number } }[];
  usages: { id: string; name: string; slug: string; _count?: { products: number } }[];
}

export function MobileFilterDrawerTrigger({ categories, usages }: MobileFilterDrawerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  // Count active filters
  const q = searchParams.get('q');
  const tag = searchParams.get('tag');
  const inStock = searchParams.get('inStock');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const kategori = searchParams.get('kategori');
  const peruntukan = searchParams.get('peruntukan');

  let activeCount = 0;
  if (q) activeCount++;
  if (tag) activeCount++;
  if (inStock === 'true' || inStock === '1') activeCount++;
  if (minPrice || maxPrice) activeCount++;
  if (kategori) activeCount += kategori.split(',').filter(Boolean).length;
  if (peruntukan) activeCount += peruntukan.split(',').filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex lg:hidden items-center gap-2 rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-soft-xs hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile Drawer */}
      <FilterSidebar
        categories={categories}
        usages={usages}
        isMobileDrawer={true}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
