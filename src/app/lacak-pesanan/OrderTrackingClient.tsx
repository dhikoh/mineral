'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  XCircle,
} from 'lucide-react';

export function OrderTrackingClient({ csWhatsapp }: { csWhatsapp: string }) {
  const searchParams = useSearchParams();
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [order, setOrder] = useState<any>(null);

  const performTracking = async (codeToTrack: string, phoneToTrack: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch('/api/lacak-pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: codeToTrack,
          phone: phoneToTrack,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pesanan tidak ditemukan.');
      }

      setOrder(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melacak pesanan. Pastikan kode pesanan dan nomor WhatsApp benar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill from URL params if available
  useEffect(() => {
    const codeParam = searchParams.get('code') || searchParams.get('orderCode');
    const phoneParam = searchParams.get('phone');
    if (codeParam) setOrderCode(codeParam);
    if (phoneParam) setPhone(phoneParam);

    if (codeParam && phoneParam) {
      performTracking(codeParam, phoneParam);
    }
  }, [searchParams]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim() || !phone.trim()) {
      setErrorMsg('Harap masukkan kode pesanan dan nomor WhatsApp.');
      return;
    }
    performTracking(orderCode.trim(), phone.trim());
  };

  const waNumber = csWhatsapp ? csWhatsapp.replace(/[^0-9]/g, '') : '6281234567890';

  // Timeline stage calculation
  const getTimelineStep = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 1;
      case 'PENDING_VERIFICATION':
        return 2;
      case 'PAID':
        return 3;
      case 'PROCESSING':
        return 4;
      case 'SHIPPED':
        return 5;
      case 'COMPLETED':
        return 6;
      default:
        return 1;
    }
  };

  const currentStep = order ? getTimelineStep(order.status) : 0;

  const steps = [
    {
      step: 1,
      title: 'Pesanan Dibuat',
      desc: 'Menunggu transfer bank',
      icon: Clock,
    },
    {
      step: 2,
      title: 'Bukti Diunggah',
      desc: 'Verifikasi mutasi admin',
      icon: CheckCircle2,
    },
    {
      step: 3,
      title: 'Pembayaran Lunas',
      desc: 'Terverifikasi sah',
      icon: ShieldCheck,
    },
    {
      step: 4,
      title: 'Diproses Gudang',
      desc: 'Penimbangan & muat barang',
      icon: Package,
    },
    {
      step: 5,
      title: 'Dalam Pengiriman',
      desc: 'Kurir / jasa ekspedisi kargo',
      icon: Truck,
    },
    {
      step: 6,
      title: 'Pesanan Selesai',
      desc: 'Telah sampai di tujuan',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-500/20">
          <Truck className="h-4 w-4" />
          <span>Sistem Pelacakan Pengadaan Real-time</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Lacak Status Pesanan Komoditas
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Masukkan kode pesanan unik (contoh: <span className="font-mono font-bold text-slate-700">ORD-260908-XXXX</span>) beserta nomor WhatsApp pembeli untuk memantau status pesanan dan surat jalan.
        </p>
      </div>

      {/* Tracking Search Form Card */}
      <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-sm">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kode Pesanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Contoh: ORD-260908-1234"
                className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp Pembeli <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor WA yang didaftarkan saat checkout"
                className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-bold text-white shadow-soft-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>{isLoading ? 'Mencari Data Pesanan...' : 'Lacak Pesanan Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tracking Result View */}
      {order && (
        <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-8 animate-in fade-in duration-300">
          {/* Order Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-surface-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kode Pesanan
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {order.orderCode}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Atas Nama: <strong className="text-slate-800">{order.buyerName}</strong> ({order.buyerPhone})
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Nilai Transaksi
              </div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {formatRupiah(order.total)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Dibuat {formatDate(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Stepper Timeline */}
          {order.status === 'CANCELLED' ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-center space-y-2">
              <XCircle className="h-8 w-8 text-rose-600 mx-auto" />
              <h3 className="text-sm font-bold text-rose-900">Pesanan Telah Dibatalkan</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Pesanan ini telah dibatalkan. Silakan hubungi tim CS kami jika membutuhkan bantuan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Progress Status Pesanan
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {steps.map((st) => {
                  const isDone = currentStep >= st.step;
                  const isCurrent = currentStep === st.step;
                  const Icon = st.icon;

                  return (
                    <div
                      key={st.step}
                      className={`relative rounded-2xl p-3.5 text-center flex flex-col items-center justify-between border transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-soft-xs'
                          : isDone
                          ? 'border-surface-200 bg-surface-50 text-slate-800'
                          : 'border-surface-200/60 bg-surface-50/40 text-slate-400 opacity-60'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl mb-2.5 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-soft-xs'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-surface-200 text-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="space-y-1">
                        <div
                          className={`text-xs font-bold leading-tight ${
                            isCurrent ? 'text-emerald-950 font-black' : isDone ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {st.title}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug">
                          {st.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.trackingNumber && (
                <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4 text-xs text-purple-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-purple-700" />
                    <span>
                      Nomor Resi / Surat Jalan Ekspedisi:{' '}
                      <strong className="font-mono text-sm">{order.trackingNumber}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ordered Products Preview */}
          <div className="space-y-3 pt-2 border-t border-surface-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Komoditas yang Dipesan
            </h3>
            <div className="divide-y divide-surface-100">
              {order.items?.map((it: any) => {
                const prod = it.product;
                const img = prod?.images?.[0] || null;
                return (
                  <div key={it.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
                        {img ? (
                          <Image src={img} alt={prod?.name || 'Item'} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{prod?.name || it.productId}</div>
                        <div className="text-[11px] text-slate-400">{it.qty} unit × {formatRupiah(it.price)}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {formatRupiah(it.price * it.qty)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-200">
            <Link
              href={`/pesanan/${order.orderCode}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-soft-xs"
            >
              <span>Buka Rincian Pembayaran &amp; Bukti Transfer</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Halo Admin, saya ingin menanyakan status pesanan saya: ${order.orderCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Butuh Bantuan? Hubungi WhatsApp CS</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
