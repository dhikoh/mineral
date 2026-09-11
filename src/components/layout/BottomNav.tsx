'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, ShoppingBag, Truck, Headphones } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface BottomNavProps {
  cartCount?: number;
  csWhatsapp?: string;
}

export function BottomNav({ cartCount, csWhatsapp = '6281234567890' }: BottomNavProps) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const effectiveCartCount = cartCount !== undefined ? cartCount : totalItems;

  // Sembunyikan bottom nav di panel admin
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const items = [
    { label: 'Beranda', href: '/', icon: Home, active: pathname === '/' },
    {
      label: 'Katalog',
      href: '/produk',
      icon: Layers,
      active: pathname.startsWith('/produk') || pathname.startsWith('/kategori'),
    },
    {
      label: 'Keranjang',
      href: '/keranjang',
      icon: ShoppingBag,
      active: pathname === '/keranjang',
      badge: effectiveCartCount > 0 ? effectiveCartCount : undefined,
    },
    {
      label: 'Lacak',
      href: '/lacak-pesanan',
      icon: Truck,
      active: pathname === '/lacak-pesanan',
    },
  ];

  const whatsappUrl = `https://wa.me/${csWhatsapp}?text=${encodeURIComponent(
    'Halo CS Adably, saya membutuhkan bantuan informasi produk/pesanan.'
  )}`;

  return (
    <nav
      role="navigation"
      aria-label="Navigasi Bawah Seluler"
      style={{ paddingBottom: 'max(0.5rem, calc(0.35rem + env(safe-area-inset-bottom, 0px)))' }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200/80 bg-white/95 px-2 pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                item.active
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {/* Active Pill Glow Indicator */}
              {item.active && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.6)] animate-in fade-in zoom-in duration-200" />
              )}

              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    item.active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`mt-1 text-[11px] leading-tight ${item.active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* CS Action */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi Customer Service via WhatsApp"
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-500 hover:text-emerald-700 font-medium transition-all duration-200 active:scale-90"
        >
          <div className="relative">
            <Headphones className="h-5 w-5 stroke-[1.8]" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <span className="mt-1 text-[11px] leading-tight font-medium">Bantuan</span>
        </a>
      </div>
    </nav>
  );
}
