'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldAlert,
  Shield,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

const ACTION_LABEL_MAP: Record<string, string> = {
  LOGIN_SUCCESS: 'Login Berhasil',
  LOGIN_FAILED: 'Login Gagal',
  LOGOUT: 'Logout',
  CREATE_USER: 'Buat Pengguna',
  UPDATE_USER: 'Ubah Pengguna',
  ACTIVATE_USER: 'Aktifkan Pengguna',
  DEACTIVATE_USER: 'Nonaktifkan Pengguna',
  DELETE_USER: 'Hapus Pengguna',
  UPDATE_ORDER_STATUS: 'Ubah Status Pesanan',
  VERIFY_PAYMENT_APPROVED: 'Verifikasi Pembayaran ✓',
  VERIFY_PAYMENT_REJECTED: 'Verifikasi Pembayaran ✗',
  UPDATE_BANK_ACCOUNTS: 'Ubah Rekening Bank',
  UPDATE_SITE_SETTINGS: 'Ubah Pengaturan Situs',
};

const ACTION_COLOR: Record<string, string> = {
  LOGIN_SUCCESS: 'text-emerald-400',
  LOGIN_FAILED: 'text-rose-400',
  LOGOUT: 'text-slate-400',
  CREATE_USER: 'text-blue-400',
  UPDATE_USER: 'text-amber-400',
  ACTIVATE_USER: 'text-emerald-400',
  DEACTIVATE_USER: 'text-amber-400',
  DELETE_USER: 'text-rose-400',
  VERIFY_PAYMENT_APPROVED: 'text-emerald-400',
  VERIFY_PAYMENT_REJECTED: 'text-rose-400',
  UPDATE_ORDER_STATUS: 'text-amber-400',
  UPDATE_BANK_ACCOUNTS: 'text-amber-400',
  UPDATE_SITE_SETTINGS: 'text-amber-400',
};

/**
 * Sesi #17 (Temuan K): Halaman Audit Log — khusus SUPERADMIN
 */
export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterAction) params.set('action', filterAction);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat audit log.');
      setLogs(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotalCount(json.pagination.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Audit Log Sistem
              </h1>
              <p className="text-[11px] text-slate-400">
                {totalCount.toLocaleString('id-ID')} entri tersimpan
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-6 space-y-6">
        {/* Filter */}
        <form
          onSubmit={handleFilterSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-wrap gap-3 items-end"
        >
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Tipe Aksi</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Aksi</option>
              {Object.entries(ACTION_LABEL_MAP).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Dari Tanggal
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sampai Tanggal</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
          <button
            type="button"
            onClick={() => { setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Reset
          </button>
        </form>

        {/* Content */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">Belum ada entri audit log.</div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900 font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Waktu</th>
                    <th className="px-5 py-3">Aktor</th>
                    <th className="px-5 py-3">Aksi</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <td className="px-5 py-3 text-slate-400 whitespace-nowrap font-mono">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            {log.actorRole === 'SUPERADMIN' ? (
                              <ShieldAlert className="h-3 w-3 text-rose-400 flex-shrink-0" />
                            ) : (
                              <Shield className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                            )}
                            <span className="text-white font-medium">{log.actorName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`font-bold ${ACTION_COLOR[log.action] || 'text-slate-300'}`}>
                            {ACTION_LABEL_MAP[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {log.targetType ? (
                            <span className="font-mono">
                              {log.targetType}
                              {log.targetId && <span className="text-slate-600"> #{log.targetId.slice(0, 8)}</span>}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <span className="text-emerald-500 text-[10px] font-bold">
                              {expandedId === log.id ? '▲ Tutup' : '▼ Lihat'}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                      {expandedId === log.id && log.metadata && (
                        <tr key={`${log.id}-detail`} className="bg-slate-900/50">
                          <td colSpan={5} className="px-5 py-3">
                            <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-all bg-slate-950 rounded-lg p-3 max-h-40 overflow-y-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
