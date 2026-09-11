'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  ShoppingBag,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Package,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Eye,
  CreditCard,
  MessageSquare,
  Users,
  UserCheck,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  pendingVerificationCount: number;
  pendingPaymentCount: number;
  inShippingCount: number;
  completedCount: number;
  totalOrdersCount: number;
  totalProductsCount: number;
  totalArticlesCount: number;
  totalCustomersCount?: number;
  totalProspectsCount?: number;
  totalLeadsCount?: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
    price: number;
    image: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    orderCode: string;
    buyerName: string;
    buyerPhone: string;
    total: number;
    status: string;
    createdAt: string;
    itemsCount: number;
    hasProof: boolean;
  }>;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/auth/me').then((r) => {
        if (!r.ok) throw new Error('Unauthenticated');
        return r.json();
      }),
      fetch('/api/admin/dashboard/stats').then((r) => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      }),
    ])
      .then(([authData, statsData]) => {
        setUser(authData.user);
        setStats(statsData.stats);
        setLoading(false);
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3 w-3" /> Verifikasi Bukti
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            Menunggu Bayar
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            Lunas
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
            Diproses
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
            <Truck className="h-3 w-3" /> Dikirim
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Selesai
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Memuat data dasbor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 font-bold text-white shadow-soft-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">MineralHub Admin</h1>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  {user?.role || 'SUPERADMIN'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-surface-50 transition-colors shadow-soft-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lihat Toko Publik</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-soft-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 p-6 text-white shadow-soft-lg sm:p-8">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pusat Kendali Tunggal Ekosistem MineralHub</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Selamat Datang Kembali, {user?.name || 'Superadmin'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pantau arus transaksi komoditas tambang, verifikasi setoran transfer bank pembeli, perbarui inventaris, dan publikasikan artikel edukasi secara terpusat.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 relative z-10">
            <Link
              href="/admin/produk/baru"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-400 transition-all shadow-soft-sm"
            >
              <Plus className="h-4 w-4" /> Tambah Produk
            </Link>
            <Link
              href="/admin/pesanan?tab=PENDING_VERIFICATION"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all backdrop-blur-md"
            >
              <CreditCard className="h-4 w-4" /> Verifikasi Pembayaran
            </Link>
            <Link
              href="/admin/artikel/baru"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all backdrop-blur-md"
            >
              <FileText className="h-4 w-4" /> Tulis Artikel
            </Link>
            <Link
              href="/admin/pelanggan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all backdrop-blur-md"
            >
              <Users className="h-4 w-4" /> Database CRM ({stats?.totalLeadsCount || 0})
            </Link>
            <Link
              href="/admin/pengaturan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all backdrop-blur-md"
            >
              <Settings className="h-4 w-4" /> Pengaturan CS
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Omset */}
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Omset Terverifikasi
              </span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">
              {formatRupiah(stats?.totalRevenue || 0)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{stats?.completedCount || 0} pesanan selesai</span>
              <span className="font-semibold text-emerald-600">Real-time</span>
            </div>
          </div>

          {/* Card 2: Perlu Verifikasi */}
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Perlu Verifikasi
              </span>
              <div className={`rounded-xl p-2 ${(stats?.pendingVerificationCount || 0) > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">
                {stats?.pendingVerificationCount || 0}
              </p>
              <span className="text-xs text-slate-500">pesanan bukti masuk</span>
            </div>
            <div className="mt-2">
              {(stats?.pendingVerificationCount || 0) > 0 ? (
                <Link
                  href="/admin/pesanan?tab=PENDING_VERIFICATION"
                  className="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                >
                  Periksa Sekarang &rarr;
                </Link>
              ) : (
                <span className="text-[11px] text-slate-400">Semua bukti sudah diproses</span>
              )}
            </div>
          </div>

          {/* Card 3: Komoditas Aktif */}
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Komoditas Aktif
              </span>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">
                {stats?.totalProductsCount || 0}
              </p>
              <span className="text-xs text-slate-500">produk siap kirim</span>
            </div>
            <div className="mt-2">
              <Link
                href="/admin/produk"
                className="text-[11px] font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                Kelola Produk &rarr;
              </Link>
            </div>
          </div>

          {/* Card 4: Artikel Edukasi */}
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Artikel Edukasi
              </span>
              <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">
                {stats?.totalArticlesCount || 0}
              </p>
              <span className="text-xs text-slate-500">artikel terbit publik</span>
            </div>
            <div className="mt-2">
              <Link
                href="/admin/artikel"
                className="text-[11px] font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                Buka CMS Artikel &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Peringatan Stok Menipis ({stats.lowStockProducts.length} Komoditas)</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Produk berikut memiliki stok fisik di bawah batas aman minimum yang ditentukan. Disarankan segera memperbarui stok komoditas:
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stats.lowStockProducts.map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-amber-200 bg-white p-3 flex items-center justify-between shadow-soft-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] font-extrabold text-amber-700 mt-0.5">
                      Sisa: {p.stock} {p.unit || 'kg'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Batas aman: {p.minStock ?? 50} {p.unit || 'kg'}
                    </p>
                  </div>
                  <Link
                    href={`/admin/produk/${p.id}`}
                    className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200 transition-colors"
                  >
                    Ubah Stok
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pesanan Masuk Terbaru</h3>
              <p className="text-xs text-slate-500">
                Aktivitas pesanan terkini yang memerlukan tindakan pemrosesan atau pengiriman.
              </p>
            </div>
            <Link
              href="/admin/pesanan"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              Lihat Semua Pesanan &rarr;
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft-xs">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Kode Pesanan</th>
                      <th className="px-4 py-3">Pembeli</th>
                      <th className="px-4 py-3">Total Belanja</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Bukti Bayar</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {stats.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-surface-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {ord.orderCode}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-800">{ord.buyerName}</p>
                          <p className="text-[11px] text-slate-400">{ord.buyerPhone}</p>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-700">
                          {formatRupiah(ord.total)}
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(ord.status)}</td>
                        <td className="px-4 py-3.5">
                          {ord.hasProof ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Terlampir
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Belum ada</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {formatTanggal(ord.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/admin/pesanan/${ord.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-all shadow-soft-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada data pesanan transaksi yang tercatat.
              </div>
            )}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mt-10">
          <h3 className="text-base font-bold text-slate-900">Modul Administrasi & Konten</h3>
          <p className="text-xs text-slate-500">
            Akses cepat ke seluruh menu operasional dan modul konten situs.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Produk */}
            <Link
              href="/admin/produk"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Package className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Katalog Produk</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Kelola komoditas, stok tonase/karung, multi-foto, tags, dan relasi peruntukan industri.
              </p>
            </Link>

            {/* 2. Pesanan */}
            <Link
              href="/admin/pesanan"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Pesanan & Transaksi</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Verifikasi setoran transfer bank, proses pengiriman kargo, input nomor resi, dan konfirmasi selesai.
              </p>
            </Link>

            {/* 3. Database Pelanggan & CRM Leads */}
            <Link
              href="/admin/pelanggan"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1.5">
                  {(stats?.totalProspectsCount || 0) > 0 && (
                    <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold">
                      {stats?.totalProspectsCount} Leads Baru
                    </span>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Database Pelanggan & CRM</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Manajemen kontak prospek RFQ, follow-up WhatsApp 1-click, riwayat belanja repeat order, & ekspor CSV.
              </p>
            </Link>

            {/* 4. Artikel */}
            <Link
              href="/admin/artikel"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">CMS Artikel Edukasi</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Publikasikan panduan teknis komoditas mineral, uji lab, wawasan tambang, dan SEO.
              </p>
            </Link>

            {/* 4. Konten Teks Web */}
            <Link
              href="/admin/konten"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">CMS Teks & Halaman</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Ubah teks banner hero beranda, profil Tentang Kami, keunggulan usaha, dan ketentuan pemesanan.
              </p>
            </Link>

            {/* 5. FAQ Dinamis */}
            <Link
              href="/admin/faq"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-teal-50 p-3 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Modul FAQ Dinamis</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Atur daftar tanya-jawab umum seputar komoditas, sertifikat COA, MOQ, dan tata cara pembelian.
              </p>
            </Link>

            {/* 6. Kategori */}
            <Link
              href="/admin/kategori"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Layers className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Kategori Komoditas</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Kelola taksonomi kategori utama seperti Mineral Tambang, Hasil Hutan, dan Logam Industri.
              </p>
            </Link>

            {/* 7. Peruntukan */}
            <Link
              href="/admin/peruntukan"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Taksonomi Peruntukan</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Filter target aplikasi komoditas: Tambak Udang, Agrikultur, Pabrik Cat, dan Kosmetika.
              </p>
            </Link>

            {/* 8. Pengaturan Situs */}
            <Link
              href="/admin/pengaturan"
              className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <Settings className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </div>
              <h4 className="mt-4 font-bold text-slate-900 text-sm">Pengaturan Situs & Bank</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Konfigurasi nomor WhatsApp CS, jam operasional, alamat gudang, dan nomor rekening transfer resmi.
              </p>
            </Link>

            {/* 9. Manajemen Pengguna / Admin (Khusus SUPERADMIN) */}
            {user?.role === 'SUPERADMIN' && (
              <Link
                href="/admin/pengguna"
                className="group rounded-2xl border border-surface-200 bg-white p-5 hover:border-emerald-500 hover:shadow-soft-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-rose-50 p-3 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">
                      Superadmin
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                  </div>
                </div>
                <h4 className="mt-4 font-bold text-slate-900 text-sm">Manajemen Admin & Staf</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Kelola akun admin portal, atur hak akses SUPERADMIN/ADMIN, dan kredensial login.
                </p>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
