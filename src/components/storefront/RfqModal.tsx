'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Building2,
  CheckCircle2,
  PhoneCall,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface RfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCommodity?: string;
}

export function RfqModal({ isOpen, onClose, defaultCommodity = '' }: RfqModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [preferredCommodity, setPreferredCommodity] = useState(defaultCommodity);
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (defaultCommodity) {
      setPreferredCommodity(defaultCommodity);
    }
  }, [defaultCommodity]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama lengkap / PIC wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setError('Nomor WhatsApp aktif wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          company: company.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          preferredCommodity: preferredCommodity.trim() || undefined,
          estimatedVolume: estimatedVolume.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim permintaan penawaran.');
      }

      setSuccess(true);
      setSuccessMsg(data.message || 'Permintaan penawaran resmi Anda berhasil dikirim ke tim sales MineralHub.');
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccess(false);
    setError(null);
    setName('');
    setPhone('');
    setCompany('');
    setEmail('');
    setAddress('');
    setEstimatedVolume('');
    setNotes('');
    onClose();
  };

  // WhatsApp follow-up link for buyer
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waSalesText = `Halo Tim Sales MineralHub, saya telah mengirimkan formulir permintaan penawaran resmi (RFQ):\n\nNama: ${name}\nPerusahaan: ${company || '-'}\nKomoditas: ${preferredCommodity || '-'}\nKebutuhan: ${estimatedVolume || '-'}\nLokasi: ${address || '-'}\n\nMohon info ketersediaan stok & quotation resmi. Terima kasih.`;
  const waSalesUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(waSalesText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Minta Penawaran Resmi (RFQ)
              </h3>
              <p className="text-xs text-slate-500">
                Pengadaan Skala Industri, Kontrak Rutin & Pengiriman FCL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            disabled={loading}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-soft-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-xl font-extrabold text-slate-900">
                  Permintaan Penawaran Terkirim!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {successMsg}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-left text-xs text-emerald-900 space-y-1.5 max-w-lg mx-auto">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Kebutuhan Urgent / Fast Response?
                </p>
                <p className="text-emerald-800">
                  Anda dapat langsung mengonfirmasi penawaran ini ke WhatsApp Business tim sales kami untuk respon prioritas:
                </p>
                <div className="pt-2">
                  <a
                    href={waSalesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs transition-all shadow-sm"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    Hubungi Sales via WhatsApp Sekarang
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Tutup Jendela
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PIC Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap / PIC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Ir. Bambang / Bu Dian"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400">
                    Penawaran resmi & CoA akan dikirimkan ke nomor ini.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Perusahaan / Pabrik
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Contoh: PT Semen Perkasa Nusantara"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Business Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Bisnis (Opsional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: procurement@perusahaan.co.id"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Commodity Interest */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Komoditas yang Diminati
                  </label>
                  <input
                    type="text"
                    value={preferredCommodity}
                    onChange={(e) => setPreferredCommodity(e.target.value)}
                    placeholder="Contoh: Zeolite Alam Mesh 80 / Pasir Silika"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Estimated Volume */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimasi Volume Kebutuhan
                  </label>
                  <input
                    type="text"
                    value={estimatedVolume}
                    onChange={(e) => setEstimatedVolume(e.target.value)}
                    placeholder="Contoh: 50 Ton / Bulan atau FCL 20ft"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Address / Port Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Pabrik / Gudang / Pelabuhan Tujuan
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Kawasan Industri Cilegon / Pelabuhan Tanjung Priok"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* Specification Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Spesifikasi & Kebutuhan Khusus
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sebutkan kebutuhan khusus seperti mesh, tingkat kemurnian, request uji lab sampel, atau skema pengiriman..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* Security / Privacy notice */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-200/60">
                <HelpCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  Data kontak Anda aman dan hanya digunakan untuk keperluan pengiriman quotation resmi dari PT MineralHub Indonesia.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-soft-sm transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengirim Permintaan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim Permintaan Penawaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
