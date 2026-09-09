'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  PhoneCall,
  Package,
  Layers,
  ShieldCheck,
} from 'lucide-react';

import { useCart } from '@/lib/cart-context';

interface NavbarProps {
  siteName?: string;
  csWhatsapp?: string;
  cartCount?: number;
}

export function Navbar({
  siteName = 'MineralHub',
  csWhatsapp = '6281234567890',
  cartCount,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { totalItems } = useCart();
  const displayCartCount = cartCount !== undefined ? cartCount : totalItems;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/produk?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const whatsappUrl = `https://wa.me/${csWhatsapp}?text=${encodeURIComponent(
    'Halo CS MineralHub, saya ingin konsultasi mengenai produk mineral dan komoditas.'
  )}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200 bg-white/90 backdrop-blur-md transition-all">
      {/* Top micro-bar info */}
      <div className="hidden border-b border-surface-100 bg-slate-900 px-4 py-1.5 text-xs text-slate-300 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Pasokan Komoditas Industri & Ekspor Siap Kirim
            </span>
            <span className="text-slate-500">|</span>
            <span>Pengiriman Armada Truk & Kontainer FCL/LCL</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tentang-kami"
              className="hover:text-white transition-colors"
            >
              Tentang Kami
            </Link>
            <Link
              href="/faq"
              className="hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/lacak-pesanan"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              Lacak Pesanan
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors text-slate-400"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Portal Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            M
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              {siteName}
            </span>
            <span className="hidden text-[10px] uppercase tracking-wider text-slate-600 sm:block">
              Komoditas & Mineral Alam
            </span>
          </div>
        </Link>

        {/* Search Bar Desktop */}
        <form
          onSubmit={handleSearch}
          className="relative hidden flex-1 max-w-md md:block"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Cari zeolite, bentonite, timah, atau kegunaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-surface-300 bg-surface-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </form>

        {/* Quick Nav Links & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/produk"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-surface-100 lg:flex"
          >
            <Layers className="h-4 w-4 text-emerald-600" />
            Katalog Produk
          </Link>

          <Link
            href="/artikel"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-surface-100 lg:flex"
          >
            Artikel & Edukasi
          </Link>

          {/* Cart Button */}
          <Link
            href="/keranjang"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-surface-200 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-600 transition-colors shadow-soft-sm"
            aria-label="Keranjang Belanja"
          >
            <ShoppingCart className="h-5 w-5" />
            {displayCartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-sm">
                {displayCartCount}
              </span>
            )}
          </Link>

          {/* WhatsApp CS Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-sm hover:bg-emerald-700 hover:shadow-soft-md transition-all active:scale-95"
          >
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline">Hubungi CS</span>
          </a>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Cari komoditas, zeolite, bentonite..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-surface-300 bg-surface-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </form>
      </div>
    </header>
  );
}
