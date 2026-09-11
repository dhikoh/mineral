import { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Truck,
  Building2,
  FileCheck,
  CheckCircle2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { getContentBlockByKey, getSiteSettings } from '@/lib/data-store';
import { sanitize } from '@/lib/sanitize';

export const metadata: Metadata = {
  title: 'Tentang Kami — MineralHub Indonesia',
  description:
    'Profil MineralHub Indonesia sebagai mitra penyedia komoditas mineral tambang dan bahan baku industri dengan spesifikasi transparan dan layanan profesional.',
};

export default async function TentangKamiPage() {
  const [aboutBlock, whyUsBlock, settings] = await Promise.all([
    getContentBlockByKey('about_us'),
    getContentBlockByKey('why_us'),
    getSiteSettings(),
  ]);

  let cleanWa = settings.csWhatsapp.replace(/\D/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  }
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Halo ${settings.siteName}, saya membaca profil Tentang Kami dan ingin mendiskusikan kemitraan pasokan komoditas...`
  )}`;

  return (
    <div className="min-h-screen bg-surface-50 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">Tentang Kami</span>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 p-8 sm:p-12 text-white shadow-soft-lg">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              <span>Integritas Rantai Pasok Tambang & Alam</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              {aboutBlock?.title || 'Tentang MineralHub Indonesia'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
              Menghubungkan sektor industri manufaktur, agrikultur modern, dan pelaku usaha dengan pasokan komoditas mineral nusantara secara profesional, transparan, dan terpercaya.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 relative z-10 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">Legalitas Usaha Terdaftar</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-md">
              <Award className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">Kesesuaian Sampel & Data Teknis</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-md">
              <Truck className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">Dukungan Ekspedisi & Self-Pickup</span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="mt-8 rounded-3xl border border-surface-200 bg-white p-6 sm:p-10 shadow-soft-xs space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Visi Keberlanjutan & Keunggulan Pasokan
            </h2>
            <div
              className="mt-4 prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: sanitize(
                  aboutBlock?.content ||
                    'MineralHub Indonesia berdedikasi menyediakan komoditas mineral dan hasil hutan non-kayu berkualitas tinggi dengan standar transparansi tertinggi.'
                ),
              }}
            />
          </div>

          {/* 4 Pillars Grid (Why Us) */}
          <div className="border-t border-surface-100 pt-8">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              {whyUsBlock?.title || 'Mengapa Memilih Kami?'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Komitmen kami dalam menjamin kepastian kualitas dan ketepatan pengiriman bahan baku industri Anda.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-soft-xs space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Legalitas Usaha & Kemitraan Terverifikasi</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menjalankan aktivitas niaga melalui badan usaha resmi dengan rantai pasok yang jelas, mengutamakan keterbukaan dokumen pengiriman dan kepatuhan terhadap ketentuan perdagangan yang berlaku.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-soft-xs space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Kesesuaian Spesifikasi & Uji Sampel</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Informasi kadar kemurnian, mesh, dan parameter fisik disajikan sesuai data fisik komoditas. Kami mendukung pengiriman sampel fisik dan penyediaan dokumen uji teknis sesuai ketersediaan pada masing-masing komoditas.
                </p>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5 shadow-soft-xs space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Fleksibilitas Pengambilan & Ekspedisi</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mendukung opsi pengambilan mandiri di sentra/gudang penyimpanan (Loco/FOB) maupun koordinasi pengiriman dengan mitra jasa ekspedisi kargo independen sesuai kuantitas pesanan Anda.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-soft-xs space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Skema Grosir & Harga Kompetitif</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Penawaran harga yang rasional dan transparan dengan penyesuaian khusus untuk pembelian partai besar, kebutuhan kontinuitas industri, maupun pemesanan berkala.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="border-t border-surface-100 pt-8">
            <h3 className="text-base font-bold text-slate-900">Kantor & Pergudangan Terpadu</h3>
            <div className="mt-3 rounded-2xl bg-surface-50 p-5 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-900">{settings.siteName}</p>
              <p>{settings.address}</p>
              <p className="text-slate-500">Jam Layanan: {settings.csOperationalHours}</p>
              <p className="text-slate-500">Email: {settings.csEmail}</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center bg-white rounded-3xl border border-surface-200 p-8 shadow-soft-xs">
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
            Siap Bermitra untuk Pasokan Bahan Baku Industri Anda?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hubungi Customer Service kami untuk penawaran pasokan berkala, permintaan sampel fisik, atau konsultasi pengiriman partai besar.
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-soft-sm hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hubungi WhatsApp Tim Penjualan</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
