'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { formatRupiah } from '@/lib/utils';
import type { BankAccount } from '@/lib/data-store';
import { PaymentMethodModal } from '@/components/common/PaymentMethodModal';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  QrCode,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<BankAccount[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Ambil metode pembayaran dari pengaturan situs
  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((d) => {
        const methods = d?.bankAccounts;
        if (Array.isArray(methods) && methods.length > 0) setPaymentMethods(methods);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.customerName.trim()) {
      setErrorMsg('Nama lengkap pembeli wajib diisi.');
      return;
    }

    if (!formData.customerPhone.trim()) {
      setErrorMsg('Nomor WhatsApp aktif wajib diisi untuk pelacakan dan konfirmasi pesanan.');
      return;
    }

    if (!formData.shippingAddress.trim()) {
      setErrorMsg('Alamat pengiriman lengkap wajib diisi.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Keranjang belanja Anda kosong.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          shippingAddress: formData.shippingAddress,
          notes: formData.notes,
          items: items.map((it) => ({
            productId: it.id,
            quantity: it.qty,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses pesanan.');
      }

      // Order created successfully
      clearCart();
      router.push(`/pesanan/${data.orderCode}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat pesanan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-slate-400 mb-5">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Keranjang Belanja Anda Kosong
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Silakan pilih komoditas mineral tambang atau hasil alam yang Anda butuhkan terlebih dahulu sebelum melakukan checkout.
        </p>
        <div className="mt-8">
          <Link
            href="/produk"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-soft-sm hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Jelajahi Katalog Komoditas</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Header Breadcrumb & Notice */}
      <div className="mb-8">
        <Link
          href="/keranjang"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Keranjang Belanja</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Checkout Pesanan Komoditas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pengadaan langsung dari penjual resmi. Tanpa registrasi akun, verifikasi instan via WhatsApp.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Transaksi Langsung &amp; Terpercaya</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Guest Buyer Form */}
        <div className="lg:col-span-7 space-y-6">
          <form id="checkout-form" onSubmit={handleSubmit} className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-surface-200">
              <Truck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Informasi Pembeli &amp; Alamat Pengiriman
              </h2>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Pembeli / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso / PT Sumber Alam Makmur"
                  className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp / Telepon Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  required
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890 (Wajib untuk notifikasi & tracking)"
                  className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Nomor ini akan digunakan untuk mengakses halaman pelacakan pesanan dan verifikasi bukti transfer.
                </p>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="Contoh: pengadaan@perusahaan.com"
                  className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Pengiriman Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="shippingAddress"
                  required
                  rows={3}
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  placeholder="Sebutkan alamat lengkap: nama jalan/area gudang, kelurahan, kecamatan, kota/kabupaten, provinsi, dan patokan lokasi penerimaan muatan."
                  className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan untuk Penjual <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Contoh: Pengambilan mandiri (Loco) / minta dokumen spesifikasi teknis bila ada / jam bongkar muat."
                  className="w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </form>

          {/* Payment Method Preview Box — Dinamis dari CMS */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Metode Pembayaran
                </h2>
              </div>
              {paymentMethods.filter((m) => m.isActive !== false).length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pembayaran dilakukan setelah pesanan dibuat. Pilih metode Transfer Bank atau QRIS sesuai preferensi Anda.
            </p>

            {/* Badge metode pembayaran tersedia */}
            <div className="flex flex-wrap gap-2">
              {paymentMethods.filter((m) => m.isActive !== false && m.type !== 'QRIS').map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{m.bank}</span>
                </button>
              ))}
              {paymentMethods.filter((m) => m.isActive !== false && m.type === 'QRIS').length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 hover:border-purple-400 hover:bg-purple-100 transition-all"
                >
                  <QrCode className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">QRIS</span>
                </button>
              )}
              {/* Fallback jika settings belum dimuat */}
              {paymentMethods.length === 0 && (
                <>
                  <div className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Transfer Bank</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2">
                    <QrCode className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-700">QRIS</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary & Submit Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-200">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ringkasan Pesanan ({items.length} Komoditas)
              </h2>
              <Link href="/keranjang" className="text-xs font-semibold text-emerald-600 hover:underline">
                Ubah
              </Link>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 py-2 border-b border-surface-100 last:border-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100">
                    {it.image ? (
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{it.name}</h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {it.qty} {it.unit || 'unit'} × {formatRupiah(it.price)}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 mt-1">
                      {formatRupiah(it.price * it.qty)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotals & Total */}
            <div className="space-y-2 pt-2 border-t border-surface-200 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Komoditas</span>
                <span className="font-semibold text-slate-800">{formatRupiah(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimasi Biaya Muat / Ekspedisi</span>
                <span className="font-medium text-emerald-600">Disepakati via CS</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-surface-200">
                <span>Total Pembayaran</span>
                <span className="text-base text-emerald-700">{formatRupiah(totalPrice)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                form="checkout-form"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-soft-md hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Konfirmasi &amp; Buat Pesanan</span>
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Dengan membuat pesanan, Anda menyetujui syarat &amp; ketentuan pengadaan barang.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal Metode Pembayaran */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentMethods={paymentMethods}
      />
    </>
  );
}
