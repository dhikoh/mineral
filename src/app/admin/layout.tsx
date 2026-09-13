'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Tag,
  Wrench,
  ShoppingCart,
  Users,
  FileText,
  Layout,
  HelpCircle,
  UserCheck,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  ShoppingBag,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  superadminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produk', label: 'Produk', icon: Package },
  { href: '/admin/kategori', label: 'Kategori', icon: Tag },
  { href: '/admin/peruntukan', label: 'Peruntukan', icon: Wrench },
  { href: '/admin/pesanan', label: 'Pesanan', icon: ShoppingCart },
  { href: '/admin/pelanggan', label: 'CRM Leads', icon: Users },
  { href: '/admin/penawaran-jual', label: 'Penawaran Jual', icon: ShoppingBag },
  { href: '/admin/artikel', label: 'Artikel', icon: FileText },
  { href: '/admin/konten', label: 'Konten', icon: Layout },
  { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/admin/pengguna', label: 'Pengguna', icon: UserCheck, superadminOnly: true },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, superadminOnly: true },
  { href: '/admin/audit-log', label: 'Audit Log', icon: Activity, superadminOnly: true },
];

/**
 * Sesi #17 (Temuan P): Shared Admin Layout
 * Menyediakan sidebar dengan navigasi dan tombol logout persisten di semua halaman admin.
 * Halaman login (/admin/login) dikecualikan dari layout sidebar.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Jangan render sidebar untuk halaman login
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, [isLoginPage]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch {
      setLoggingOut(false);
    }
  };

  // Halaman login: render tanpa sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.superadminOnly || user?.role === 'SUPERADMIN'
  );

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-56 xl:w-64 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow">
              A
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Adably</div>
              <div className="text-[10px] text-slate-500">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map((item) => {
            const isActive =
              item.href === '/admin/dashboard'
                ? pathname === '/admin/dashboard'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-800 px-3 py-3">
          {user && (
            <div className="mb-2.5 px-1">
              <p className="text-[11px] font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                <Shield className="h-2.5 w-2.5" />
                {user.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-300 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs shadow">
            A
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Adably Admin</span>
            <span className="text-[10px] text-emerald-400 font-medium">Panel Manajemen</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
          aria-label="Buka navigasi menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-slate-900 border-r border-slate-800 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs">
                  A
                </div>
                <span className="text-sm font-bold text-white">Menu Navigasi</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Tutup navigasi menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {visibleNav.map((item) => {
                const isActive =
                  item.href === '/admin/dashboard'
                    ? pathname === '/admin/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-soft-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white active:scale-98'
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-800 p-4">
              {user && (
                <div className="mb-3 px-1">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <Shield className="h-3 w-3" />
                    {user.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Keluar...' : 'Keluar dari Panel'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 xl:ml-64 pt-0 lg:pt-0">
        <div className="lg:hidden h-14" /> {/* Spacer for mobile header (56px) */}
        {children}
      </main>
    </div>
  );
}
