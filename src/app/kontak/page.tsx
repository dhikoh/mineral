import { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  MessageCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { getSiteSettings } from '@/lib/data-store';

export const metadata: Metadata = {
  title: 'Hubungi Kami — MineralHub Indonesia',
  description:
    'Kontak resmi WhatsApp Customer Service, email, alamat kantor pergudangan, dan rekening transfer resmi MineralHub Indonesia.',
};

export default async function KontakPage() {
  const settings = await getSiteSettings();

  let cleanWa = settings.csWhatsapp.replace(/\D/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  }
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Halo Customer Service ${settings.siteName}, saya ingin menanyakan informasi seputar komoditas mineral...`
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
          <span className="font-semibold text-slate-700">Hubungi Kami</span>
        </nav>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-soft-xs">
            <Phone className="h-4 w-4 text-emerald-600" />
            <span>Layanan Pelanggan & Konsultasi Teknis</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Hubungi Tim Penjualan & Dukungan Kami
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed">
            Apakah Anda memerlukan informasi spesifikasi komoditas, permintaan sampel fisik, konsultasi pengiriman kargo partai besar, atau konfirmasi transaksi? Tim kami siap melayani.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: WhatsApp */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-xs flex flex-col justify-between hover:border-emerald-500 transition-all group">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">WhatsApp Resmi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Respon cepat untuk pertanyaan teknis, cek ketersediaan stok komoditas, dan konfirmasi bukti pembayaran.
              </p>
              <p className="font-mono text-sm font-bold text-emerald-700">
                +{settings.csWhatsapp}
              </p>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-soft-xs"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat WhatsApp Sekarang</span>
            </a>
          </div>

          {/* Card 2: Email CS */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-xs flex flex-col justify-between hover:border-blue-500 transition-all group">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Email Korespondensi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Untuk pengiriman dokumen Purchase Order (PO), kontrak suplai berkala pabrik, dan penawaran tender.
              </p>
              <p className="font-mono text-sm font-bold text-blue-700">
                {settings.csEmail}
              </p>
            </div>

            <a
              href={`mailto:${settings.csEmail}`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-soft-xs"
            >
              <Mail className="h-4 w-4" />
              <span>Kirim Email Resmi</span>
            </a>
          </div>

          {/* Card 3: Jam Kerja */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-xs flex flex-col justify-between hover:border-teal-500 transition-all group sm:col-span-2 lg:col-span-1">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Jam Operasional</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jadwal layanan customer service, koordinasi pengiriman, dan konfirmasi administrasi pesanan.
              </p>
              <div className="rounded-xl bg-surface-50 p-3 text-xs font-bold text-slate-700">
                {settings.csOperationalHours}
              </div>
            </div>

            <p className="mt-6 text-[11px] text-slate-400">
              *Pesanan dan formulir checkout di web tetap dapat diakses 24/7.
            </p>
          </div>
        </div>

        {/* Office Address & Official Bank Accounts */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Kantor & Pergudangan */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <h3>Kantor & Pergudangan Pusat</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {settings.address}
            </p>
            <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-bold text-slate-800">Standar Penanganan & Pengemasan Kami:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Pengemasan Jumbo Bag (1 Ton) dan Sak Paper Bag 25 Kg sesuai spesifikasi</li>
                <li>Area penyimpanan terlindung untuk menjaga kualitas dan kelembaban komoditas</li>
                <li>Verifikasi kuantitas dan pengecekan fisik sebelum serah terima</li>
                <li>Dukungan pengambilan mandiri (Loco) maupun koordinasi mitra ekspedisi kargo</li>
              </ul>
            </div>
          </div>

          {/* Rekening Transfer Bank Resmi */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3>Rekening Bank Transfer Resmi</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pastikan seluruh pembayaran hanya dialihkan ke nomor rekening resmi terdaftar di bawah ini a.n PT MineralHub Indonesia:
            </p>

            <div className="space-y-3">
              {settings.bankAccounts.map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-surface-200 bg-surface-50/70 p-4 flex items-center justify-between shadow-soft-xs"
                >
                  <div>
                    <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      Bank {b.bank}
                    </span>
                    <p className="mt-1.5 font-mono text-sm font-black text-slate-900">
                      {b.noRekening}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      a.n {b.atasNama}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
