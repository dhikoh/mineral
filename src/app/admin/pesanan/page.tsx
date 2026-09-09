'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeft,
  ChevronRight,
  Filter,
  FileCheck,
  RotateCcw,
  Eye,
  XCircle,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'ALL', label: 'Semua Pesanan' },
  { key: 'PENDING_VERIFICATION', label: 'Perlu Verifikasi' },
  { key: 'PENDING_PAYMENT', label: 'Belum Bayar' },
  { key: 'PAID', label: 'Sudah Lunas' },
  { key: 'PROCESSING', label: 'Diproses' },
  { key: 'SHIPPED', label: 'Dikirim' },
  { key: 'COMPLETED', label: 'Selesai' },
  { key: 'REJECTED', label: 'Ditolak' },
];

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async (status?: string, q?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.set('status', status);
      if (q && q.trim()) params.set('q', q.trim());

      const res = await fetch(`/api/admin/pesanan?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab, searchQuery);
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(activeTab, searchQuery);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold">
            <Clock className="h-3 w-3" />
            Menunggu Pembayaran
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[11px] font-bold animate-pulse">
            <AlertCircle className="h-3 w-3" />
            Perlu Verifikasi
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            Lunas
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-[11px] font-bold">
            <ShoppingBag className="h-3 w-3" />
            Diproses
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[11px] font-bold">
            <Truck className="h-3 w-3" />
            Dikirim
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            Selesai
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[11px] font-bold">
            <XCircle className="h-3 w-3" />
            Bukti Ditolak
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold">
            Dibatalkan
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const renderProofIndicator = (order: any) => {
    if (!order.proof) {
      return (
        <span className="text-[11px] text-slate-400 font-medium">Belum Upload</span>
      );
    }
    if (order.proof.status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
          <FileCheck className="h-3.5 w-3.5 text-blue-600" />
          Ada Bukti (Tinjau)
        </span>
      );
    }
    if (order.proof.status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Terverifikasi
        </span>
      );
    }
    if (order.proof.status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
          <XCircle className="h-3.5 w-3.5 text-rose-600" />
          Ditolak
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-surface-200 bg-white p-2 text-slate-600 hover:bg-surface-100 hover:text-slate-900 shadow-soft-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Pesanan &amp; Verifikasi Pembayaran
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola transaksi masuk, validasi bukti transfer bank, dan kontrol status pengiriman.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(activeTab, searchQuery)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-surface-100 shadow-soft-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft-xs space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-surface-100">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-soft-xs'
                      : 'text-slate-600 hover:bg-surface-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode pesanan (ORD-...), nama pembeli, atau nomor WhatsApp..."
                className="w-full rounded-xl border border-surface-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-soft-xs"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-surface-200 bg-white shadow-soft-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Memuat daftar transaksi pesanan...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Pesanan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Belum ada transaksi yang sesuai dengan kriteria status atau pencarian ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-surface-100/70 border-b border-surface-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Kode &amp; Tanggal</th>
                    <th className="px-4 py-3.5">Pembeli</th>
                    <th className="px-4 py-3.5">Total &amp; Komoditas</th>
                    <th className="px-4 py-3.5">Status Pesanan</th>
                    <th className="px-4 py-3.5">Bukti Transfer</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono">
                        <div className="font-bold text-slate-900">{ord.orderCode}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(ord.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{ord.buyerName}</div>
                        <div className="text-[11px] text-slate-500">{ord.buyerPhone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-emerald-700">{formatRupiah(ord.total)}</div>
                        <div className="text-[10px] text-slate-400">
                          {ord.items?.length || 0} jenis komoditas
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{renderStatusBadge(ord.status)}</td>
                      <td className="px-4 py-3.5">{renderProofIndicator(ord)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/pesanan/${ord.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-soft-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Periksa Detail</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
