import Link from 'next/link';
import Image from 'next/image';
import { formatRupiah } from '@/lib/utils';
import { ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  categoryName?: string;
  usages?: string[];
  tags?: string[];
}

export function ProductCard({
  name,
  slug,
  price,
  stock,
  images,
  categoryName,
  usages = [],
  tags = [],
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const displayImage =
    images && images.length > 0
      ? images[0]
      : 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-soft-lg">
      {/* Image Thumbnail & Floating Badges */}
      <Link href={`/produk/${slug}`} className="relative aspect-[4/3] w-full overflow-hidden bg-surface-100">
        <Image
          src={displayImage}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Category Pill Top-Left */}
        {categoryName && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm">
            {categoryName}
          </span>
        )}

        {/* Stock Badge Top-Right */}
        <span
          className={`absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm ${
            isOutOfStock
              ? 'bg-rose-600/90 text-white'
              : 'bg-emerald-600/90 text-white'
          }`}
        >
          {isOutOfStock ? (
            <>
              <AlertCircle className="h-3 w-3" /> Habis
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3" /> Stok: {stock}
            </>
          )}
        </span>
      </Link>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        {/* Usages (Peruntukan) Chips */}
        {usages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {usages.slice(0, 2).map((usage, idx) => (
              <span
                key={idx}
                className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100"
              >
                {usage}
              </span>
            ))}
            {usages.length > 2 && (
              <span className="rounded-md bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                +{usages.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Product Title */}
        <Link href={`/produk/${slug}`}>
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Tags / Hashtags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, idx) => (
              <Link
                key={idx}
                href={`/produk?tag=${encodeURIComponent(tag.replace(/^#/, ''))}`}
                className="text-[11px] font-medium text-slate-400 hover:text-emerald-600 transition-colors"
              >
                #{tag.replace(/^#/, '')}
              </Link>
            ))}
          </div>
        )}

        {/* Price & Action Row */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-surface-100">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Harga
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {formatRupiah(price)}
            </span>
          </div>

          <Link
            href={`/produk/${slug}`}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              isOutOfStock
                ? 'bg-surface-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft-sm active:scale-95'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Pesan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
