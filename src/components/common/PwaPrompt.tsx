'use client';

import { useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { usePwa } from '@/lib/pwa-context';

export function PwaPrompt() {
  const pathname = usePathname();
  const { isInstalled, isInstallable, isDismissedPermanently, promptInstall, dismissBanner } =
    usePwa();

  const [localVisible, setLocalVisible] = useState(true);
  const [neverShow, setNeverShow] = useState(false);

  // Jangan aktifkan prompt PWA di admin atau rute transaksi
  const isAdmin = pathname?.startsWith('/admin');
  const isTransactionPage =
    pathname?.startsWith('/keranjang') ||
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/lacak-pesanan') ||
    pathname?.startsWith('/pesanan');

  // Tidak perlu tampil jika: admin, transaksi, sudah terpasang, permanent dismiss, atau user sudah tutup
  if (
    isAdmin ||
    isTransactionPage ||
    isInstalled ||
    isDismissedPermanently ||
    !localVisible ||
    !isInstallable
  ) {
    return null;
  }

  const handleInstallClick = async () => {
    setLocalVisible(false);
    await promptInstall();
  };

  const handleDismiss = () => {
    dismissBanner(neverShow);
    setLocalVisible(false);
  };

  return (
    <aside
      aria-label="Prompt PWA Adably"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:right-6 md:left-auto"
    >
      <div className="relative flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight text-white">Pasang Aplikasi Adably</h4>
            <p className="text-xs text-slate-300 leading-tight mt-0.5">Akses cepat &amp; katalog luring di layar HP Anda</p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Tutup prompt aplikasi"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Checkbox jangan tampilkan lagi */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={neverShow}
              onChange={(e) => setNeverShow(e.target.checked)}
            />
            <div className="h-4 w-4 rounded border border-slate-600 bg-slate-800 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center">
              {neverShow && (
                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors leading-tight">
            Jangan tampilkan lagi di perangkat ini
          </span>
        </label>

        {/* Tombol aksi */}
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Pasang Sekarang</span>
        </button>
      </div>
    </aside>
  );
}
