import Link from 'next/link';
import { CreditCard, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface FooterProps {
  siteName?: string;
  tagline?: string;
  address?: string;
  csWhatsapp?: string;
  csOperationalHours?: string;
  bankAccounts?: Array<{ bank: string; noRekening: string; atasNama: string }>;
  footerText?: string;
}

export function Footer({
  siteName = 'Adably',
  tagline = 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor',
  address = 'Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat',
  csWhatsapp = '6281234567890',
  csOperationalHours = 'Senin - Sabtu, 08.00 - 17.00 WIB',
  bankAccounts = [
    { bank: 'BCA', noRekening: '8001234567', atasNama: 'Adably' },
    { bank: 'Mandiri', noRekening: '1230009876543', atasNama: 'Adably' },
  ],
  footerText = '© 2026 Adably. All rights reserved.',
}: FooterProps) {
  return (
    <footer className="border-t border-surface-200 bg-white pt-12 pb-24 text-slate-600 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Kolom 1: Brand Info */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 font-black text-lg text-white">
                M
              </div>
              <span className="text-lg font-bold text-slate-900">{siteName}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {tagline}
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{csOperationalHours}</span>
              </div>
            </div>
          </div>

          {/* Kolom 2: Rekening Resmi */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Rekening Transfer Resmi
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              Pembayaran sah hanya ditujukan ke rekening di bawah ini:
            </p>
            <div className="mt-3 space-y-2.5">
              {bankAccounts.map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-surface-200 bg-surface-50 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">
                      Bank {b.bank}
                    </span>
                    <span className="font-mono text-emerald-700">{b.noRekening}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    a/n {b.atasNama}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kolom 3: Navigasi Cepat */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Navigasi & Informasi
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/produk" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Katalog Seluruh Komoditas
                </Link>
              </li>
              <li>
                <Link href="/lacak-pesanan" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Pelacakan Status Pesanan
                </Link>
              </li>
              <li>
                <Link href="/artikel" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Artikel & Analisis Mineral
                </Link>
              </li>
              <li>
                <Link href="/faq" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Tanya Jawab (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/tentang-kami" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Tentang Perusahaan
                </Link>
              </li>
              <li>
                <Link href="/kontak" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Kontak & Gudang Logistik
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Jaminan & CS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Jaminan Transaksi
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Setiap batch komoditas dipasok dengan uji lab resmi dan verifikasi pembayaran manual demi keamanan transaksi bisnis Anda.
            </p>
            <div className="mt-4">
              <a
                href={`https://wa.me/${csWhatsapp}?text=${encodeURIComponent('Halo CS Adably')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-surface-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-surface-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                Konsultasi WhatsApp CS
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-surface-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>{footerText}</p>
          <div className="flex items-center gap-4">
            <Link href="/syarat-ketentuan" prefetch={false} className="hover:underline">
              Syarat & Ketentuan
            </Link>
            <span>•</span>
            <Link href="/faq" prefetch={false} className="hover:underline">
              Bantuan
            </Link>
            <span>•</span>
            <Link href="/admin/login" prefetch={false} className="hover:text-slate-600">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
