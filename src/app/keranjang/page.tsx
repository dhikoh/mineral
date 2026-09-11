'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatRupiah } from '@/lib/utils';

export default function KeranjangPage() {
  const { items, updateQty, removeItem, totalItems, totalPrice } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-emerald-600" />
            Keranjang Belanja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Periksa kembali pesanan komoditas mineral dan hasil alam Anda
          </p>
        </div>

        <Link
          href="/produk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Lanjut Belanja Komoditas</span>
        </Link>
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="rounded-3xl border border-dashed border-surface-300 bg-white py-20 px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-slate-400 mb-4 shadow-soft-sm">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Keranjang Belanja Masih Kosong</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Anda belum menambahkan komoditas apa pun ke dalam keranjang. Jelajahi katalog kami untuk menemukan mineral alam berkualitas.
          </p>
          <div className="mt-6">
            <Link
              href="/produk"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-soft-sm active:scale-95"
            >
              <span>Buka Katalog Produk</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items List (7 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="rounded-3xl border border-surface-200 bg-white p-4 sm:p-6 shadow-soft-sm divide-y divide-surface-100">
              {items.map((item) => {
                const isMaxStock = item.qty >= item.stock;

                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Image & Product Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-surface-200 bg-surface-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/produk/${item.slug}`}
                          className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {formatRupiah(item.price)} <span className="text-[11px] font-normal text-slate-400">/{item.unit || 'kg'}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Stok tersedia: {item.stock} {item.unit || 'kg'}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Counter */}
                      <div className="flex items-center rounded-xl border border-surface-300 bg-surface-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-900">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          disabled={isMaxStock}
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[100px]">
                        <span className="block text-xs font-black text-slate-900">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary Card (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-surface-100 pb-3">
                Ringkasan Pembelian
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Kuantitas Komoditas</span>
                  <span className="font-bold text-slate-900">{totalItems} item</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk</span>
                  <span className="font-bold text-slate-900">{formatRupiah(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim Armada</span>
                  <span className="text-emerald-700 font-semibold">Dihitung saat Checkout</span>
                </div>
              </div>

              <div className="border-t border-surface-200 pt-3 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Total Tagihan:
                </span>
                <span className="text-xl font-black text-slate-900">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-xs font-bold text-white shadow-soft-md active:scale-95 transition-all"
              >
                <span>Lanjut ke Formulir Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Payment & Security Note */}
            <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Pembayaran Manual Transfer Bank</span>
              </div>
              <p className="leading-relaxed">
                Pemesanan diproses setelah Anda mengunggah bukti transfer resmi ke rekening perusahaan (BCA / Mandiri) dan diverifikasi oleh admin.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
