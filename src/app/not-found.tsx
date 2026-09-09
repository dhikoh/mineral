import Link from 'next/link';
import { Compass, Home, Layers, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 text-emerald-400 shadow-soft-lg border border-emerald-500/30">
        <Compass className="h-12 w-12 animate-spin-slow" />
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950 shadow-md">
          404
        </span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-500/20 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        <span>Halaman Belum Tersedia atau Telah Dipindahkan</span>
      </div>

      <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 max-w-lg">
        Jalur Komoditas yang Anda Cari Tidak Ditemukan
      </h1>

      <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        Tautan yang Anda tuju mungkin sudah kedaluwarsa, salah ketik, atau komoditas sedang dalam pemutakhiran data katalog.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-soft-md hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <Link
          href="/produk"
          className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-soft-xs hover:border-emerald-400 hover:text-emerald-700 transition-all active:scale-95"
        >
          <Layers className="h-4 w-4" />
          <span>Jelajahi Katalog</span>
        </Link>
        <Link
          href="/faq"
          className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-4 py-3 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Pusat Bantuan FAQ</span>
        </Link>
      </div>
    </div>
  );
}
