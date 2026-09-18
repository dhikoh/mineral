'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RichTextRenderer } from '@/components/editor/RichTextRenderer';
import { ProductGallery } from '@/components/storefront/ProductGallery';
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

  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'ton'>('kg');
  const [qtyInput, setQtyInput] = useState<number>(1);
  const [rawQtyStr, setRawQtyStr] = useState<string>('1');
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRfqOpen, setIsRfqOpen] = useState(false);

  const baseUnit = product.unit || 'kg';
  const baseUnitLower = baseUnit.toLowerCase().trim();
  const isWeightUnit = baseUnitLower === 'kg' || baseUnitLower === 'kilogram' || baseUnitLower === 'ton';
  const isOutOfStock = product.stock <= 0;
  const usages = product.usages?.map((u) => u.usage?.name || '').filter(Boolean) || [];

  // Konversi kuantitas & kalkulasi harga per unit
  const isTonSelected = isWeightUnit && selectedUnit === 'ton';
  const unitMultiplier = isTonSelected ? 1000 : 1;
  const currentUnitLabel = isWeightUnit ? (isTonSelected ? 'ton' : 'kg') : baseUnit;

  // Stok maksimum dalam satuan yang aktif
  const maxStockInCurrentUnit = isTonSelected
    ? Math.floor(product.stock / 1000)
    : product.stock;

  // Kuantitas riil dalam satuan dasar (kg) untuk kalkulasi & keranjang
  const effectiveQtyInBase = Math.max(1, qtyInput * unitMultiplier);
  const effectivePricePerUnit = product.price * unitMultiplier;
  const currentSubtotal = effectiveQtyInBase * product.price;

  const handleUnitChange = (newUnit: 'kg' | 'ton') => {
    setSelectedUnit(newUnit);
    // Reset kuantitas ke 1 dan sesuaikan input
    setQtyInput(1);
    setRawQtyStr('1');
  };

  const handleQtyChange = (valStr: string) => {
    setRawQtyStr(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const clamped = Math.min(parsed, Math.max(1, maxStockInCurrentUnit));
      setQtyInput(clamped);
    }
  };

  const handleQtyBlur = () => {
    const parsed = parseInt(rawQtyStr, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQtyInput(1);
      setRawQtyStr('1');
    } else if (parsed > maxStockInCurrentUnit) {
      setQtyInput(maxStockInCurrentUnit);
      setRawQtyStr(String(maxStockInCurrentUnit));
    } else {
      setQtyInput(parsed);
      setRawQtyStr(String(parsed));
    }
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    const next = Math.min(maxStockInCurrentUnit, qtyInput + 1);
    setQtyInput(next);
    setRawQtyStr(String(next));
  };

  const handleDecrement = () => {
    if (isOutOfStock) return;
    const next = Math.max(1, qtyInput - 1);
    setQtyInput(next);
    setRawQtyStr(String(next));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0],
      stock: product.stock,
      unit: baseUnit,
      qty: effectiveQtyInBase,
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
      unit: baseUnit,
      qty: effectiveQtyInBase,
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

  const whatsappOrderQty = `${qtyInput} ${currentUnitLabel.toUpperCase()}${isTonSelected ? ` (${effectiveQtyInBase.toLocaleString('id-ID')} KG)` : ''}`;
  const whatsappMessage = `Halo CS, saya tertarik memesan produk ${product.name} sebanyak ${whatsappOrderQty} dengan perkiraan subtotal ${formatRupiah(currentSubtotal)}. Mohon info ketersediaan stok, sertifikat spesifikasi, dan estimasi logistik pengiriman.`;
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
        {/* Gallery Column (6 Cols) */}
        <div className="lg:col-span-6">
          <ProductGallery
            images={images}
            productName={product.name}
            categoryName={product.category?.name}
          />
        </div>

        {/* Product Details & Actions Column (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
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
                  {formatRupiah(effectivePricePerUnit)}
                  <span className="text-sm font-normal text-slate-500 ml-1">/{currentUnitLabel}</span>
                </span>
                {isTonSelected && (
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    (Setara {formatRupiah(product.price)} / kg)
                  </span>
                )}
              </div>

              <div className="text-right">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Stok Habis
                  </span>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Tersedia ({isTonSelected ? `${maxStockInCurrentUnit} ton` : `${product.stock} ${baseUnit}`})
                    </span>
                    {isTonSelected && product.stock > 0 && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Total stok: {product.stock.toLocaleString('id-ID')} kg
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================== */}
            {/* Purchasing & Cart Controls (REPOSITIONED ABOVE DESCRIPTION)    */}
            {/* ============================================================== */}
            <div className="rounded-2xl border border-surface-200 bg-white p-4 sm:p-5 shadow-soft-sm space-y-4">
              {/* Unit Switcher: KG ↔ TON (hanya untuk komoditas bersatuan berat) */}
              {isWeightUnit && (
                <div className="flex items-center justify-between gap-2 border-b border-surface-100 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Satuan Pembelian:
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      (B2B Flexible Unit)
                    </span>
                  </div>
                  <div className="inline-flex rounded-xl bg-surface-100 p-1 border border-surface-200">
                    <button
                      type="button"
                      onClick={() => handleUnitChange('kg')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        selectedUnit === 'kg'
                          ? 'bg-emerald-600 text-white shadow-soft-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kilogram (KG)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitChange('ton')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        selectedUnit === 'ton'
                          ? 'bg-emerald-600 text-white shadow-soft-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ton (TON)
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity Selector & Realtime Subtotal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                    Jumlah ({currentUnitLabel.toUpperCase()}):
                  </span>
                  <div className="flex items-center rounded-xl border border-surface-300 bg-white shadow-soft-xs">
                    <button
                      type="button"
                      aria-label="Kurangi Jumlah"
                      disabled={qtyInput <= 1 || isOutOfStock}
                      onClick={handleDecrement}
                      className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-surface-50 rounded-l-xl disabled:opacity-40 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      id="product-qty-input"
                      type="number"
                      min="1"
                      max={maxStockInCurrentUnit}
                      value={rawQtyStr}
                      disabled={isOutOfStock}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      onBlur={handleQtyBlur}
                      aria-label={`Jumlah dalam ${currentUnitLabel}`}
                      className="w-16 text-center text-xs font-bold text-slate-900 border-x border-surface-200 py-1.5 focus:outline-none focus:bg-emerald-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Tambah Jumlah"
                      disabled={qtyInput >= maxStockInCurrentUnit || isOutOfStock}
                      onClick={handleIncrement}
                      className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-surface-50 rounded-r-xl disabled:opacity-40 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 block">
                    Subtotal:{' '}
                    <strong className="text-slate-900 text-sm font-extrabold">
                      {formatRupiah(currentSubtotal)}
                    </strong>
                  </span>
                  {/* Indikator Konversi Otomatis */}
                  {isTonSelected ? (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      ⇄ Setara {effectiveQtyInBase.toLocaleString('id-ID')} KG
                    </span>
                  ) : isWeightUnit && qtyInput >= 1000 ? (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      ⇄ Setara {(qtyInput / 1000).toLocaleString('id-ID')} TON
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons: Tambah ke Keranjang / Beli Sekarang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  id="btn-add-to-cart"
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
                  id="btn-buy-now"
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs font-bold text-white shadow-soft-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Beli Sekarang</span>
                </button>
              </div>

              {/* WhatsApp CS Quick Button & Share */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  id="btn-consult-wa"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 py-2.5 px-4 text-xs font-semibold text-white transition-all shadow-soft-sm"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Konsultasi Teknis & Pembelian via WA</span>
                </a>

                <button
                  id="btn-share-product"
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
                id="btn-open-rfq-modal"
                type="button"
                onClick={() => setIsRfqOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 py-2.5 px-4 text-xs font-bold text-emerald-800 transition-all active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Minta Penawaran Skala Industri / Uji Sampel (RFQ)</span>
              </button>

              {/* Trust Points */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Kesesuaian Spesifikasi & Sampel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Opsi Pengiriman Truk / Kargo FCL</span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* Description & Specification (REPOSITIONED BELOW CONTROLS)      */}
            {/* ============================================================== */}
            <div className="pt-2 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Deskripsi & Spesifikasi Produk
              </h2>
              <div className="rounded-2xl bg-surface-50/60 border border-surface-200/80 p-4 sm:p-5">
                <RichTextRenderer
                  html={product.description || ''}
                  theme="light"
                  className="text-xs sm:text-sm text-slate-700 leading-relaxed"
                />
              </div>
            </div>

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
