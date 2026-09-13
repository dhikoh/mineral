'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Building2,
  QrCode,
  Download,
  ZoomIn,
  CreditCard,
  Info,
} from 'lucide-react';
import type { BankAccount } from '@/lib/data-store';

// Pemetaan warna badge bank resmi Indonesia
const BANK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  BCA: { bg: 'bg-blue-600', text: 'text-white', label: 'Bank Central Asia' },
  MANDIRI: { bg: 'bg-amber-500', text: 'text-white', label: 'Bank Mandiri' },
  BNI: { bg: 'bg-orange-600', text: 'text-white', label: 'Bank Negara Indonesia' },
  BRI: { bg: 'bg-blue-800', text: 'text-white', label: 'Bank Rakyat Indonesia' },
  BSI: { bg: 'bg-emerald-700', text: 'text-white', label: 'Bank Syariah Indonesia' },
  CIMB: { bg: 'bg-red-700', text: 'text-white', label: 'CIMB Niaga' },
  DANAMON: { bg: 'bg-red-500', text: 'text-white', label: 'Bank Danamon' },
  PERMATA: { bg: 'bg-purple-700', text: 'text-white', label: 'Bank Permata' },
  DEFAULT: { bg: 'bg-slate-800', text: 'text-white', label: '' },
};

function getBankMeta(bankName: string) {
  const key = bankName.toUpperCase().replace(/\s+/g, '');
  return BANK_COLORS[key] || BANK_COLORS.DEFAULT;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethods: BankAccount[];
  /** Jika diset, metode dengan bank ini akan dipilih pertama kali */
  initialSelectedBank?: string;
  /** Callback ketika user memilih metode tertentu (untuk auto-fill form bukti bayar) */
  onSelectMethod?: (method: BankAccount) => void;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  paymentMethods,
  initialSelectedBank,
  onSelectMethod,
}: PaymentMethodModalProps) {
  const activeMethods = paymentMethods.filter((m) => m.isActive !== false);
  const bankMethods = activeMethods.filter((m) => m.type !== 'QRIS');
  const qrisMethods = activeMethods.filter((m) => m.type === 'QRIS');

  const hasQris = qrisMethods.length > 0;
  const initialTab = hasQris && bankMethods.length === 0 ? 'qris' : 'bank';
  const [activeTab, setActiveTab] = useState<'bank' | 'qris'>(initialTab);

  const [selectedMethod, setSelectedMethod] = useState<BankAccount | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [qrisZoomed, setQrisZoomed] = useState(false);

  // Set default selection saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    if (initialSelectedBank) {
      const found = activeMethods.find(
        (m) => m.bank.toLowerCase() === initialSelectedBank.toLowerCase()
      );
      if (found) {
        setSelectedMethod(found);
        setActiveTab(found.type === 'QRIS' ? 'qris' : 'bank');
        return;
      }
    }
    // Default: pilih metode pertama di tab aktif
    const defaultList = activeTab === 'qris' ? qrisMethods : bankMethods;
    if (defaultList.length > 0) setSelectedMethod(defaultList[0]);
  }, [isOpen, initialSelectedBank]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = useCallback(async (text: string, bank: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBank(bank);
      setTimeout(() => setCopiedBank(null), 2000);
    } catch {
      // Fallback untuk browser yang tidak support clipboard API
    }
  }, []);

  const handleSelectMethod = useCallback(
    (method: BankAccount) => {
      setSelectedMethod(method);
      onSelectMethod?.(method);
    },
    [onSelectMethod]
  );

  // Tutup dengan Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayedMethods = activeTab === 'qris' ? qrisMethods : bankMethods;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilih Metode Pembayaran"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Rekening & Metode Pembayaran Resmi</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-surface-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        {hasQris && bankMethods.length > 0 && (
          <div className="flex gap-1 px-6 pt-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('bank');
                if (bankMethods.length > 0) handleSelectMethod(bankMethods[0]);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                activeTab === 'bank'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Transfer Bank
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('qris');
                if (qrisMethods.length > 0) handleSelectMethod(qrisMethods[0]);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                activeTab === 'qris'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              QRIS
            </button>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Pilihan Rekening/Metode */}
          {displayedMethods.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {displayedMethods.map((m, idx) => {
                const meta = getBankMeta(m.bank);
                const isSelected = selectedMethod?.bank === m.bank && selectedMethod?.noRekening === m.noRekening;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectMethod(m)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-surface-200 bg-white text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-black ${meta.bg} ${meta.text}`}>
                      {m.bank.substring(0, 3).toUpperCase()}
                    </span>
                    {m.bank}
                  </button>
                );
              })}
            </div>
          )}

          {/* Detail Metode Terpilih */}
          {selectedMethod && (
            <>
              {/* --- Transfer Bank --- */}
              {selectedMethod.type !== 'QRIS' && (
                <div className="space-y-4">
                  {/* Badge Bank */}
                  <div className="flex items-center gap-3">
                    {(() => {
                      const meta = getBankMeta(selectedMethod.bank);
                      return (
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-black ${meta.bg} ${meta.text} shadow-sm`}>
                          {selectedMethod.bank.substring(0, 3).toUpperCase()}
                        </div>
                      );
                    })()}
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {getBankMeta(selectedMethod.bank).label || `Bank ${selectedMethod.bank}`}
                      </div>
                      <div className="text-xs text-slate-500">Rekening Resmi Perusahaan</div>
                    </div>
                  </div>

                  {/* Nomor Rekening */}
                  <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Nomor Rekening
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-black tracking-widest text-slate-900 font-mono">
                        {selectedMethod.noRekening}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMethod.noRekening, selectedMethod.bank)}
                        className="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all shrink-0"
                      >
                        {copiedBank === selectedMethod.bank ? (
                          <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-emerald-700">Tersalin!</span></>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /><span>Salin</span></>
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500">
                      Atas Nama: <span className="font-bold text-slate-800">{selectedMethod.atasNama}</span>
                    </div>
                  </div>

                  {/* Instruksi */}
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-3.5">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                      <div className="text-xs text-emerald-800 leading-relaxed">
                        {selectedMethod.instructions || (
                          <>
                            Transfer tepat sesuai jumlah tagihan. Setelah transfer, unggah bukti pembayaran pada halaman pesanan Anda. Verifikasi dilakukan dalam <strong>1×24 jam kerja</strong>.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- QRIS --- */}
              {selectedMethod.type === 'QRIS' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-sm">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">QRIS — Semua Aplikasi</div>
                      <div className="text-xs text-slate-500">GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin, dll</div>
                    </div>
                  </div>

                  {/* Gambar QR */}
                  {selectedMethod.qrImageUrl ? (
                    <div className="space-y-2">
                      <div
                        className={`relative flex items-center justify-center rounded-2xl border border-surface-200 bg-white p-4 transition-all ${qrisZoomed ? 'fixed inset-4 z-50 rounded-3xl shadow-2xl' : ''}`}
                        onClick={() => setQrisZoomed(!qrisZoomed)}
                      >
                        {qrisZoomed && (
                          <div className="absolute inset-0 bg-white/95 rounded-3xl" onClick={() => setQrisZoomed(false)} />
                        )}
                        <img
                          src={selectedMethod.qrImageUrl}
                          alt={`Kode QRIS ${selectedMethod.atasNama}`}
                          className={`relative z-10 object-contain transition-all ${qrisZoomed ? 'max-h-[70vh] max-w-full' : 'h-52 w-52'}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQrisZoomed(true)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-surface-50 transition-colors"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                          Perbesar
                        </button>
                        <a
                          href={selectedMethod.qrImageUrl}
                          download={`QRIS-${selectedMethod.atasNama}.png`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Unduh QR
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-surface-300 p-8 text-center">
                      <QrCode className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Gambar QR Code belum tersedia</p>
                    </div>
                  )}

                  {/* Merchant Info */}
                  <div className="rounded-2xl border border-surface-200 bg-surface-50 p-3.5 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Nama Merchant</span>
                      <span className="font-bold text-slate-800">{selectedMethod.atasNama}</span>
                    </div>
                    {selectedMethod.noRekening && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">NMID</span>
                        <span className="font-mono font-bold text-slate-800">{selectedMethod.noRekening}</span>
                      </div>
                    )}
                  </div>

                  {/* Instruksi QRIS */}
                  <div className="rounded-2xl bg-purple-50 border border-purple-200/60 p-3.5">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-700 mt-0.5 shrink-0" />
                      <div className="text-xs text-purple-800 leading-relaxed">
                        {selectedMethod.instructions || (
                          <>
                            Scan kode QRIS di atas menggunakan aplikasi mobile banking atau e-wallet Anda. Transfer sesuai total tagihan. Setelah membayar, unggah screenshot bukti pembayaran.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {displayedMethods.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              Tidak ada metode pembayaran tersedia saat ini.
            </div>
          )}
        </div>

        {/* Footer Konfirmasi */}
        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors active:scale-95"
          >
            Mengerti, Lanjutkan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}
