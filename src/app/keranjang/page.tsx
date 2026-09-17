'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatRupiah } from '@/lib/utils';

interface CartIssue {
  id: string;
  name: string;
  reason: 'DELETED' | 'INACTIVE' | 'STOCK_CHANGED' | 'PRICE_CHANGED';
  message: string;
  newPrice?: number;
  availableStock?: number;
}

export default function KeranjangPage() {
  const { items, updateQty, removeItem, totalItems, totalPrice, isLoaded } = useCart();
  const [issues, setIssues] = useState<CartIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  const validateCart = useCallback(async () => {
    if (items.length === 0) { setIssues([]); setValidated(true); return; }
    setIsValidating(true);
    try {
      const res = await fetch('/api/validate-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            qty: it.qty,
            price: it.price,
            stock: it.stock,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.invalidItems || []);
      }
    } catch {
      // Jika network error, jangan blok user
    } finally {
      setIsValidating(false);
      setValidated(true);
    }
  }, [items]);

  useEffect(() => {
    if (isLoaded && !validated) {
      validateCart();
    }
  }, [isLoaded, validated, validateCart]);

  useEffect(() => {
    setValidated(false);
  }, [items.length]);

  const dismissIssue = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
  };

  const issueMap = new Map(issues.map((i) => [i.id, i]));
  const fatalIds = new Set(
    issues
      .filter((i) => i.reason === 'DELETED' || i.reason === 'INACTIVE')
      .map((i) => i.id)
  );

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 space-y-8">
        <div className="flex items-center justify-between border-b border-surface-200 pb-4">
          <div className="h-8 w-56 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-6 w-36 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="h-48 rounded-3xl bg-white border border-surface-200 p-6 animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 rounded-3xl bg-white border border-surface-200 p-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 space-y-8">
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

      {isValidating && (
        <div className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-medium text-sky-700">
          <RefreshCw className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
          <span>Memverifikasi ketersediaan produk dengan katalog terbaru...</span>
        </div>
      )}

      {issues.length > 0 && !isValidating && (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
                issue.reason === 'DELETED' || issue.reason === 'INACTIVE'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : issue.reason === 'PRICE_CHANGED'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-orange-200 bg-orange-50 text-orange-800'
              }`}
            >
              <div className="flex items-start gap-2 flex-1">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{issue.message}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(issue.reason === 'DELETED' || issue.reason === 'INACTIVE') && (
                  <button
                    onClick={() => { removeItem(issue.id); dismissIssue(issue.id); }}
                    className="rounded-lg bg-rose-100 hover:bg-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition-colors"
                  >
                    Hapus Item
                  </button>
                )}
                {issue.reason === 'STOCK_CHANGED' &&
                  issue.availableStock !== undefined &&
                  issue.availableStock > 0 && (
                    <button
                      onClick={() => { updateQty(issue.id, issue.availableStock!); dismissIssue(issue.id); }}
                      className="rounded-lg bg-orange-100 hover:bg-orange-200 px-2.5 py-1 text-[11px] font-bold text-orange-700 transition-colors"
                    >
                      Sesuaikan Qty
                    </button>
                  )}
                {issue.reason === 'STOCK_CHANGED' &&
                  (issue.availableStock === undefined || issue.availableStock <= 0) && (
                    <button
                      onClick={() => { removeItem(issue.id); dismissIssue(issue.id); }}
                      className="rounded-lg bg-orange-100 hover:bg-orange-200 px-2.5 py-1 text-[11px] font-bold text-orange-700 transition-colors"
                    >
                      Hapus Item
                    </button>
                  )}
                <button
                  onClick={() => dismissIssue(issue.id)}
                  className="rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="rounded-3xl border border-surface-200 bg-white p-4 sm:p-6 shadow-soft-sm divide-y divide-surface-100">
              {items.map((item) => {
                const isMaxStock = item.qty >= item.stock;
                const issue = issueMap.get(item.id);
                const isFatal = fatalIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-opacity ${
                      isFatal ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
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
                          {formatRupiah(
                            issue?.reason === 'PRICE_CHANGED' && issue.newPrice !== undefined
                              ? issue.newPrice
                              : item.price
                          )}{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            /{item.unit || 'kg'}
                          </span>
                          {issue?.reason === 'PRICE_CHANGED' && (
                            <span className="ml-1 text-[10px] font-bold text-amber-600">
                              (harga diperbarui)
                            </span>
                          )}
                        </p>
                        {item.qty >= 1000 && (item.unit || 'kg').toLowerCase() === 'kg' && (
                          <p className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1">
                            ⇄ {(item.qty / 1000).toLocaleString('id-ID')} TON
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center rounded-xl border border-surface-300 bg-surface-50 p-0.5">
                        <button
                          type="button"
                          disabled={isFatal}
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          disabled={isFatal}
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              updateQty(item.id, Math.min(item.stock, val));
                            }
                          }}
                          aria-label={`Jumlah ${item.name}`}
                          className="w-14 text-center text-xs font-bold text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          disabled={isMaxStock || isFatal}
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <span className="block text-xs font-black text-slate-900">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => { removeItem(item.id); dismissIssue(item.id); }}
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
                  <span>Ongkos Kirim Ekspedisi / Kargo</span>
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
              {fatalIds.size > 0 ? (
                <div className="w-full rounded-2xl bg-rose-50 border border-rose-200 py-3.5 px-4 text-center text-xs font-semibold text-rose-700">
                  Hapus produk tidak tersedia sebelum melanjutkan checkout
                </div>
              ) : (
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-xs font-bold text-white shadow-soft-md active:scale-95 transition-all"
                >
                  <span>Lanjut ke Formulir Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

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
