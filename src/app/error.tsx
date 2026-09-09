'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-soft-md">
        <AlertTriangle className="h-10 w-10" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 max-w-md">
        Terjadi Kendala Teknis Sementara
      </h1>

      <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        Sistem sedang memproses data komoditas atau terjadi anomali koneksi sementara. Silakan tekan tombol di bawah untuk memuat ulang komponen.
      </p>

      {error?.message && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 max-w-lg rounded-xl bg-slate-100 p-3 text-left font-mono text-[11px] text-slate-700 overflow-x-auto border border-slate-200">
          {error.message}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-soft-md hover:bg-emerald-700 transition-all active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Coba Muat Ulang</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Beranda</span>
        </Link>
      </div>
    </div>
  );
}
