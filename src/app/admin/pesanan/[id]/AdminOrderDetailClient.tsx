'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Truck,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Save,
  Loader2,
  FileCheck,
  ShoppingBag,
} from 'lucide-react';

export function AdminOrderDetailClient({ initialOrder }: { initialOrder: any }) {
  const [order, setOrder] = useState(initialOrder);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Fulfillment status form
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [notes, setNotes] = useState(order.notes || '');

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Nominal transfer tidak sesuai dengan tagihan.');

  const handleVerifyProof = async (isApproved: boolean) => {
    setIsLoadingAction(true);
    setActionMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/admin/pesanan/${order.id}/verifikasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isApproved,
          notes: isApproved ? undefined : rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses verifikasi bukti.');

      setOrder(data.order);
      setStatus(data.order.status);
      setActionMessage({
        type: isApproved ? 'success' : 'warning',
        text: data.message,
      });
      setShowRejectModal(false);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAction(true);
    setActionMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/admin/pesanan/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status.');

      setOrder(data.order);
      setActionMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const buyerCleanPhone = order.buyerPhone ? order.buyerPhone.replace(/\D/g, '') : '';
  const waUrl = `https://wa.me/${buyerCleanPhone}?text=${encodeURIComponent(
    `Halo ${order.buyerName}, kami dari Admin Adably mengonfirmasi pesanan Anda dengan nomor ${order.orderCode}.`
  )}`;

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pesanan"
              className="rounded-xl border border-surface-200 bg-white p-2 text-slate-600 hover:bg-surface-100 hover:text-slate-900 shadow-soft-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {order.orderCode}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dipesan oleh <strong className="text-slate-800">{order.buyerName}</strong> pada{' '}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-soft-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat WhatsApp Pembeli</span>
          </a>
        </div>

        {/* Alert Feedback Banner */}
        {actionMessage.text && (
          <div
            className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-2.5 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : actionMessage.type === 'warning'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Payment Proof Verification & Ordered Items */}
          <div className="lg:col-span-7 space-y-6">
            {/* Panel Verifikasi Bukti Transfer */}
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  Verifikasi Bukti Transfer Bank
                </h2>
                {order.proof ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      order.proof.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.proof.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800 animate-pulse'
                    }`}
                  >
                    Status Bukti: {order.proof.status}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Belum ada bukti transfer</span>
                )}
              </div>

              {order.proof ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-2xl border border-surface-200 bg-surface-100">
                      <Image
                        src={order.proof.fileUrl}
                        alt="Bukti Transfer"
                        fill
                        sizes="200px"
                        className="object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(order.proof.fileUrl, '_blank')}
                      />
                    </div>
                    <div className="space-y-2 text-xs flex-1">
                      <div>
                        <span className="text-slate-400">Bank Pengirim:</span>{' '}
                        <strong className="text-slate-900">{order.proof.senderBank || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Nama Rekening:</span>{' '}
                        <strong className="text-slate-900">{order.proof.senderName || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Nominal Transfer:</span>{' '}
                        <strong className="text-emerald-700 text-sm">
                          {order.proof.amount ? formatRupiah(order.proof.amount) : '-'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Diunggah Pada:</span>{' '}
                        <span className="text-slate-700">{formatDate(order.proof.uploadedAt)}</span>
                      </div>
                      {order.proof.note && (
                        <div>
                          <span className="text-slate-400">Catatan Pembeli:</span>{' '}
                          <span className="text-slate-700 italic">{order.proof.note}</span>
                        </div>
                      )}
                      {order.proof.rejectionReason && (
                        <div className="text-rose-700 font-semibold">
                          Alasan Ditolak: {order.proof.rejectionReason}
                        </div>
                      )}
                      <div className="pt-1">
                        <a
                          href={order.proof.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Perbesar Foto Bukti</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Verification Buttons */}
                  <div className="pt-3 border-t border-surface-200 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={isLoadingAction}
                      onClick={() => handleVerifyProof(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-soft-xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Terima &amp; Setujui Pembayaran (Lunas)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoadingAction}
                      onClick={() => setShowRejectModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-soft-xs cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Tolak Bukti Transfer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-surface-300 py-8 text-center text-xs text-slate-500">
                  Pembeli belum mengunggah struk/bukti transfer bank.
                </div>
              )}
            </div>

            {/* Rincian Komoditas */}
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  Daftar Komoditas yang Dipesan ({order.items?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-surface-100">
                {order.items?.map((it: any) => {
                  const prod = it.product;
                  const img = prod?.images?.[0] || null;
                  return (
                    <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
                          {img ? (
                            <Image src={img} alt={prod?.name || 'Komoditas'} fill sizes="48px" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{prod?.name || it.productId}</div>
                          <div className="text-[11px] text-slate-400">{it.qty} {prod?.unit || 'unit'} × {formatRupiah(it.price)}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {formatRupiah(it.price * it.qty)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-surface-200 text-sm font-bold">
                <span className="text-slate-700">Total Tagihan:</span>
                <span className="text-base font-black text-emerald-700">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Status & Shipping Details Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status & Pengiriman Control Form */}
            <form onSubmit={handleUpdateStatus} className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-surface-200">
                <Truck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Kontrol Status &amp; Pengiriman
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Pesanan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="PENDING_PAYMENT">Menunggu Pembayaran (PENDING_PAYMENT)</option>
                    <option value="PENDING_VERIFICATION">Menunggu Verifikasi (PENDING_VERIFICATION)</option>
                    <option value="PAID" disabled={order.status !== 'PAID'}>
                      {order.status === 'PAID'
                        ? 'Pembayaran Lunas (PAID)'
                        : 'Pembayaran Lunas (Gunakan tombol verifikasi bukti bayar)'}
                    </option>
                    <option value="PROCESSING">Sedang Diproses Gudang (PROCESSING)</option>
                    <option value="SHIPPED">Sedang Dikirim (SHIPPED)</option>
                    <option value="COMPLETED">Pesanan Selesai (COMPLETED)</option>
                    <option value="REJECTED">Ditolak (REJECTED)</option>
                    <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
                  </select>
                  {order.status !== 'PAID' && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      * Status <strong>PAID</strong> hanya dapat diaktifkan melalui tombol verifikasi bukti transfer bank di sebelah kiri.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Resi / Surat Jalan Ekspedisi
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Contoh: TRK-2609-089 / B 1234 CD (Truk)"
                    className="w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Internal Admin / Catatan Pengadaan
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan internal pengiriman atau instruksi khusus..."
                    className="w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoadingAction}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-soft-sm hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingAction ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Perbarui Status Pesanan</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Informasi Kontak & Alamat Pembeli */}
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-surface-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Data Pembeli &amp; Lokasi Pengiriman
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Nama Pembeli:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{order.buyerName}</div>
                </div>
                <div>
                  <span className="text-slate-400">No. WhatsApp / HP:</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{order.buyerPhone}</div>
                </div>
                {order.buyerEmail && (
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <div className="font-medium text-slate-800 mt-0.5">{order.buyerEmail}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Alamat Lengkap Pengiriman:</span>
                  <div className="font-medium text-slate-800 mt-0.5 whitespace-pre-line leading-relaxed bg-surface-50 p-2.5 rounded-xl border border-surface-200">
                    {order.buyerAddress}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">Tolak Bukti Pembayaran</h3>
            </div>
            <p className="text-xs text-slate-600">
              Silakan tuliskan alasan penolakan bukti transfer ini. Alasan akan ditampilkan kepada pembeli agar dapat melakukan upload ulang.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Nominal transfer kurang, struk buram tidak terbaca, dsb."
              className="w-full rounded-xl border border-surface-300 p-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl border border-surface-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-surface-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isLoadingAction}
                onClick={() => handleVerifyProof(false)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-soft-xs disabled:opacity-50"
              >
                {isLoadingAction ? 'Memproses...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
