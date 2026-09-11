'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Truck,
  FileText,
  FileSpreadsheet,
  Minus,
  Plus,
  Share2,
  Check,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { RfqModal } from '@/components/storefront/RfqModal';

export interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    unit?: string;
    minStock?: number;
    images: string[];
    tags: string[];
    category?: { id: string; name: string; slug: string };
    usages?: { usage?: { id: string; name: string; slug: string } }[];
  };
  csWhatsapp?: string;
}

export function ProductDetailClient({
  product,
  csWhatsapp = '6281234567890',
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'];

  const [activeImage, setActiveImage] = useState(images[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRfqOpen, setIsRfqOpen] = useState(false);

  const unit = product.unit || 'kg';
  const isOutOfStock = product.stock <= 0;
  const usages = product.usages?.map((u) => u.usage?.name || '').filter(Boolean) || [];

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0],
      stock: product.stock,
      unit,
      qty,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0],
      stock: product.stock,
      unit,
      qty,
    });
    router.push('/keranjang');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappMessage = `Halo CS MineralHub, saya tertarik dengan produk ${product.name} (Rp ${product.price.toLocaleString('id-ID')}). Mohon info ketersediaan spesifikasi dan logistik pengiriman.`;
  const whatsappUrl = `https://wa.me/${csWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-emerald-600 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/produk" className="hover:text-emerald-600 transition-colors">
          Katalog
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/kategori/${product.category.slug}`}
              className="hover:text-emerald-600 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-900 truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery Column (5 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Active Big Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft-sm">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover transition-all duration-300"
            />
            {product.category && (
              <span className="absolute top-4 left-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                {product.category.name}
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                    activeImage === img
                      ? 'border-emerald-600 shadow-soft-sm scale-105'
                      : 'border-surface-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions Column (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Usages Chips */}
            {usages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {usages.map((uName, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60"
                  >
                    {uName}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price & Stock Section */}
            <div className="rounded-2xl bg-surface-50 border border-surface-200 p-4 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Harga Resmi Komoditas
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatRupiah(product.price)}
                  <span className="text-sm font-normal text-slate-500 ml-1">/{unit}</span>
                </span>
              </div>

              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Stok Habis
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Tersedia ({product.stock} {unit})
                  </span>
                )}
              </div>
            </div>

            {/* Description Short */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Hashtag Badges */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-400 mr-1">Tags:</span>
                {product.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/produk?tag=${encodeURIComponent(tag.replace(/^#/, ''))}`}
                    className="rounded-md bg-surface-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 text-xs text-slate-600 font-medium transition-colors"
                  >
                    #{tag.replace(/^#/, '')}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Purchasing & Cart Controls */}
          <div className="space-y-4 pt-4 border-t border-surface-200">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Jumlah ({unit}):
              </span>
              <div className="flex items-center rounded-xl border border-surface-300 bg-white">
                <button
                  type="button"
                  disabled={qty <= 1 || isOutOfStock}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-12 text-center text-xs font-bold text-slate-900">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={qty >= product.stock || isOutOfStock}
                  onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                  className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-400">
                Subtotal:{' '}
                <strong className="text-slate-900">
                  {formatRupiah(product.price * qty)}
                </strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-3 px-4 text-xs font-bold transition-all ${
                  added
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:scale-95 shadow-soft-sm'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Masuk Keranjang!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>Tambah ke Keranjang</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-bold text-white shadow-soft-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Beli Sekarang</span>
              </button>
            </div>

            {/* WhatsApp CS Quick Button */}
            {/* WhatsApp CS Quick Button */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 py-2.5 px-4 text-xs font-semibold text-white transition-all"
              >
                <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                <span>Konsultasi Teknis & Pembelian via WA</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                title="Salin Tautan Produk"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-surface-200 bg-white text-slate-500 hover:text-slate-900 transition-colors shadow-soft-sm"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>

            {/* B2B RFQ Button */}
            <button
              type="button"
              onClick={() => setIsRfqOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 py-2.5 px-4 text-xs font-bold text-emerald-800 transition-all active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Minta Penawaran Skala Industri / Sampel Lab (RFQ)</span>
            </button>

            {/* Trust Points */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-surface-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Jaminan Mutu & Hasil Lab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Pengiriman Armada Truk/FCL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public RFQ Modal */}
      <RfqModal
        isOpen={isRfqOpen}
        onClose={() => setIsRfqOpen(false)}
        defaultCommodity={product.name}
      />
    </div>
  );
}
