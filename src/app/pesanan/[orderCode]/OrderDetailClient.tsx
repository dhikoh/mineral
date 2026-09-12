'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatRupiah, formatDate } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/ImageUploader';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building2,
  Truck,
  MessageCircle,
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Package,
  ShoppingBag,
  ExternalLink,
  UploadCloud,
  XCircle,
} from 'lucide-react';

interface BankAccount {
  bank: string;
  noRekening: string;
  atasNama: string;
}

interface OrderDetailClientProps {
  initialOrder: any;
  bankAccounts: BankAccount[];
  csWhatsapp: string;
}

export function OrderDetailClient({
  initialOrder,
  bankAccounts,
  csWhatsapp,
}: OrderDetailClientProps) {
  const [order, setOrder] = useState(initialOrder);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Upload proof form state
  const [proofFileUrl, setProofFileUrl] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [senderName, setSenderName] = useState(order.buyerName || '');
  const [amount, setAmount] = useState(order.total.toString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedBank(type);
      setTimeout(() => setCopiedBank(null), 2000);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!proofFileUrl) {
      setSubmitError('Harap upload foto atau struk bukti transfer terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/pesanan/${order.orderCode}/bukti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: proofFileUrl,
          senderBank,
          senderName,
          amount: Number(amount),
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim bukti pembayaran.');
      }

      setSubmitSuccess('Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.');
      setOrder(data.order);
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan saat mengunggah bukti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const waNumber = csWhatsapp ? csWhatsapp.replace(/[^0-9]/g, '') : '6281234567890';
  const waMessage = encodeURIComponent(
    `Halo Admin Adably, saya ingin konfirmasi pesanan:\n` +
      `• Kode Pesanan: ${order.orderCode}\n` +
      `• Nama: ${order.buyerName}\n` +
      `• Total: ${formatRupiah(order.total)}\n` +
      `Mohon dicek bukti transfer saya. Terima kasih!`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const renderStatusBanner = () => {
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 text-amber-900 flex items-start gap-3.5">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Menunggu Pembayaran Transfer Bank</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Silakan lakukan transfer sejumlah <strong>{formatRupiah(order.total)}</strong> ke salah satu rekening resmi di bawah ini, lalu unggah struk atau bukti transfer Anda agar pesanan segera diverifikasi.
              </p>
            </div>
          </div>
        );
      case 'PENDING_VERIFICATION':
        return (
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 sm:p-5 text-blue-900 flex items-start gap-3.5">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Bukti Pembayaran Sedang Diverifikasi Admin</h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Bukti transfer Anda telah kami terima pada{' '}
                {order.proof?.uploadedAt ? formatDate(order.proof.uploadedAt) : 'baru saja'}. Tim admin sedang memvalidasi mutasi bank. Status akan diperbarui otomatis setelah disetujui.
              </p>
            </div>
          </div>
        );
      case 'PAID':
        return (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 text-emerald-900 flex items-start gap-3.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Pembayaran Diterima &amp; Terverifikasi</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Pembayaran Anda telah dinyatakan lunas dan terverifikasi sah. Pesanan Anda segera disiapkan oleh tim gudang logistik.
              </p>
            </div>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 sm:p-5 text-indigo-900 flex items-start gap-3.5">
            <Package className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Pesanan Sedang Diproses &amp; Dikemas</h3>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Komoditas mineral alam pesanan Anda sedang dalam proses penimbangan, pengemasan, dan persiapan surat jalan pengiriman.
              </p>
            </div>
          </div>
        );
      case 'SHIPPED':
        return (
          <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4 sm:p-5 text-purple-900 flex items-start gap-3.5">
            <Truck className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Pesanan Sedang Dalam Pengiriman</h3>
              <p className="text-xs text-purple-800 leading-relaxed">
                Muatan pesanan Anda telah diberangkatkan melalui jasa ekspedisi/kargo logistik.
                {order.trackingNumber && (
                  <span className="block font-bold mt-1">
                    No. Resi / Surat Jalan: {order.trackingNumber}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 text-emerald-900 flex items-start gap-3.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Pesanan Telah Selesai</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Pengadaan komoditas ini telah selesai diterima di lokasi tujuan. Terima kasih telah mempercayakan kebutuhan mineral Anda kepada Adably.
              </p>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 sm:p-5 text-rose-900 flex items-start gap-3.5">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Bukti Pembayaran Ditolak</h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                {order.proof?.rejectionReason
                  ? `Alasan penolakan: "${order.proof.rejectionReason}". `
                  : 'Bukti transfer tidak dapat divalidasi. '}
                Silakan periksa kembali mutasi Anda dan unggah ulang bukti transfer yang valid di formulir bawah.
              </p>
            </div>
          </div>
        );
      case 'CANCELLED':
        return (
          <div className="rounded-2xl bg-slate-100 border border-slate-300 p-4 sm:p-5 text-slate-800 flex items-start gap-3.5">
            <XCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Pesanan Telah Dibatalkan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pesanan ini telah dibatalkan. Jika ada pertanyaan, hubungi tim dukungan pelanggan kami.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-200">
        <Link
          href="/produk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Katalog</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/lacak-pesanan"
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Lacak Pesanan Lain
          </Link>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-soft-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat CS WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Status Banner */}
      {renderStatusBanner()}

      {/* Main Order Info Card */}
      <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kode Transaksi Pesanan
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {order.orderCode}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(order.orderCode, 'code')}
                className="rounded-lg bg-surface-100 p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                title="Salin Kode Pesanan"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Tagihan
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {formatRupiah(order.total)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Dibuat pada {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Bank Account Details (Shown if not yet completed/cancelled) */}
        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Rekening Resmi Tujuan Pembayaran:
              </h3>
              <span className="text-[11px] text-slate-400">Transfer tepat sesuai total tagihan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Array.isArray(bankAccounts) ? bankAccounts : []).map((acc) => {
                const isCopied = copiedBank === acc.bank;
                return (
                  <div
                    key={acc.bank}
                    className="rounded-2xl border border-surface-200 bg-surface-50 p-4 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-black text-white">
                        Bank {acc.bank}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.noRekening, acc.bank)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white border border-surface-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer shadow-soft-xs"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Salin No. Rekening</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <div className="text-base font-black tracking-wide text-slate-900 font-mono">
                        {acc.noRekening}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        a.n. <strong className="text-slate-700">{acc.atasNama}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Form Upload Bukti Transfer (Shown if PENDING_PAYMENT or REJECTED) */}
      {(order.status === 'PENDING_PAYMENT' || order.status === 'REJECTED') && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 shadow-soft-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-emerald-200/60">
            <UploadCloud className="h-5 w-5 text-emerald-700" />
            <h2 className="text-base font-bold text-emerald-950">
              Unggah Bukti Transfer Pembayaran
            </h2>
          </div>

          {submitError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="rounded-2xl bg-emerald-100 border border-emerald-300 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleProofSubmit} className="space-y-5">
            {/* Image Uploader Component */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Foto Struk / Tangkapan Layar Bukti Transfer <span className="text-rose-500">*</span>
              </label>
              <ImageUploader
                value={proofFileUrl}
                onChange={(val) => setProofFileUrl(val as string)}
                uploadEndpoint="/api/upload"
                helperText="Upload struk transfer bank (JPG, PNG, WEBP, maks 5MB)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Pengirim
                </label>
                <input
                  type="text"
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  className="w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pemilik Rekening Pengirim
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama sesuai rekening"
                  className="w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Ditransfer (Rp)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Jumlah transfer"
                  className="w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Transfer dari m-Banking BCA atas nama Budi"
                className="w-full rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-soft-md hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Mengunggah Bukti...' : 'Kirim Bukti Pembayaran'}
            </button>
          </form>
        </div>
      )}

      {/* Display Uploaded Proof Preview if Pending Verification or Paid */}
      {order.proof && order.status !== 'PENDING_PAYMENT' && order.status !== 'REJECTED' && (
        <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              Bukti Transfer yang Diunggah
            </h3>
            <span className="text-[11px] text-slate-400">
              Diunggah {formatDate(order.proof.uploadedAt)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative h-40 w-40 sm:h-48 sm:w-48 overflow-hidden rounded-2xl border border-surface-200 bg-surface-100">
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
                <strong className="text-slate-800">{order.proof.senderBank || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Nama Rekening:</span>{' '}
                <strong className="text-slate-800">{order.proof.senderName || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Nominal Transfer:</span>{' '}
                <strong className="text-emerald-700">
                  {order.proof.amount ? formatRupiah(order.proof.amount) : formatRupiah(order.total)}
                </strong>
              </div>
              {order.proof.note && (
                <div>
                  <span className="text-slate-400">Catatan:</span>{' '}
                  <span className="text-slate-700">{order.proof.note}</span>
                </div>
              )}
              <div className="pt-2">
                <a
                  href={order.proof.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka Gambar Ukuran Penuh</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buyer & Shipping Information */}
      <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-surface-200">
          <Truck className="h-4 w-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Informasi Pembeli &amp; Alamat Pengiriman
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400">Nama Pembeli:</div>
            <div className="font-bold text-slate-900 mt-0.5">{order.buyerName}</div>
          </div>
          <div>
            <div className="text-slate-400">No. WhatsApp / Telepon:</div>
            <div className="font-bold text-slate-900 mt-0.5">{order.buyerPhone}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-slate-400">Alamat Tujuan Pengiriman:</div>
            <div className="font-medium text-slate-800 mt-0.5 whitespace-pre-line leading-relaxed">
              {order.buyerAddress}
            </div>
          </div>
          {order.notes && (
            <div className="sm:col-span-2">
              <div className="text-slate-400">Catatan Pengadaan:</div>
              <div className="font-medium text-slate-800 mt-0.5 bg-surface-50 p-2.5 rounded-xl border border-surface-200">
                {order.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-200">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
            Rincian Komoditas yang Dipesan ({order.items?.length || 0})
          </h3>
        </div>

        <div className="divide-y divide-surface-100">
          {order.items?.map((it: any) => {
            const prod = it.product;
            const img = prod?.images?.[0] || null;
            return (
              <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
                    {img ? (
                      <Image src={img} alt={prod?.name || 'Komoditas'} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {prod?.slug ? (
                      <Link href={`/produk/${prod.slug}`} className="text-xs font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1">
                        {prod.name}
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-slate-900">
                        {prod?.name || it.productId}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {it.qty} {prod?.unit || 'unit'} × {formatRupiah(it.price)}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 shrink-0">
                  {formatRupiah(it.price * it.qty)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-surface-200 text-sm font-bold">
          <span className="text-slate-700">Total Pembayaran:</span>
          <span className="text-base font-black text-emerald-700">{formatRupiah(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
