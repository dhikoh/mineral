'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import type { SellOfferItem, SellOfferStatus } from '@/lib/data-store';

const STATUS_LABELS: Record<SellOfferStatus, string> = {
  BARU: 'Baru',
  DIHUBUNGI: 'Dihubungi',
  DIVERIFIKASI: 'Diverifikasi',
  DITOLAK: 'Ditolak',
};

const STATUS_COLORS: Record<SellOfferStatus, string> = {
  BARU: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DIHUBUNGI: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  DIVERIFIKASI: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  DITOLAK: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const ALL_STATUSES: (SellOfferStatus | '')[] = ['', 'BARU', 'DIHUBUNGI', 'DIVERIFIKASI', 'DITOLAK'];

export default function AdminPenawaranJualPage() {
  const [offers, setOffers] = useState<SellOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SellOfferStatus | ''>('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', '50');
      const res = await fetch(`/api/admin/penawaran-jual?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOffers(json.data || []);
      setTotal(json.total || 0);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const filtered = offers.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.commodityName.toLowerCase().includes(q) ||
      (o.company || '').toLowerCase().includes(q) ||
      o.phone.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            <div>
              <h1 className="font-bold text-white text-sm">Penawaran Jual Komoditas</h1>
              <p className="text-[11px] text-slate-400">
                {total} penawaran masuk — supplier yang ingin menjual komoditas ke platform
              </p>
            </div>
          </div>
          <button
            onClick={fetchOffers}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, komoditas, telp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SellOfferStatus | '')}
            className="rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s === '' ? 'Semua Status' : STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400 text-xs">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Memuat penawaran...</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <ShoppingBag className="h-10 w-10 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">Belum ada penawaran jual masuk</p>
            <p className="text-xs text-center max-w-xs">
              Penawaran dari supplier akan muncul di sini setelah mereka mengisi form di halaman{' '}
              <Link href="/jual" target="_blank" className="text-emerald-400 hover:underline">/jual</Link>
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Komoditas</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Penawar</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider hidden sm:table-cell">WhatsApp</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Volume</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider hidden lg:table-cell">Provinsi</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((offer) => (
                    <tr key={offer.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{offer.commodityName}</p>
                        {offer.priceExpected && (
                          <p className="text-[11px] text-emerald-400 mt-0.5">{offer.priceExpected}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{offer.name}</p>
                        {offer.company && <p className="text-[11px] text-slate-400">{offer.company}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <a
                          href={`https://wa.me/${offer.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline font-mono"
                        >
                          {offer.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-300">
                        {offer.estimatedVolume || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                        {offer.province || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[offer.status]}`}>
                          {STATUS_LABELS[offer.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500">
                        {new Date(offer.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/penawaran-jual/${offer.id}`}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors group-hover:text-emerald-400"
                        >
                          <span className="hidden sm:inline text-[11px]">Detail</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
