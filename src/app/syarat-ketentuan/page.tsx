import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ShieldCheck, Truck, HelpCircle } from 'lucide-react';
import { getContentBlockByKey } from '@/lib/data-store';
import { sanitize } from '@/lib/sanitize';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — MineralHub Indonesia',
  description:
    'Syarat, ketentuan pemesanan, kebijakan pengiriman logistik, dan inspeksi komoditas mineral di MineralHub Indonesia.',
};

export default async function SyaratKetentuanPage() {
  const [termsBlock, shippingBlock, privacyBlock] = await Promise.all([
    getContentBlockByKey('terms'),
    getContentBlockByKey('shipping_info'),
    getContentBlockByKey('privacy_policy'),
  ]);

  return (
    <div className="min-h-screen bg-surface-50 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">Syarat & Ketentuan</span>
        </nav>

        {/* Header */}
        <div className="border-b border-surface-200 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-soft-xs">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Ketentuan Transaksi & Kebijakan Logistik</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Syarat, Ketentuan & Kebijakan
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Panduan resmi mengenai hak dan kewajiban pembeli, prosedur verifikasi pembayaran, minimum order quantity (MOQ), serta protokol penerimaan muatan logistik.
          </p>
        </div>

        {/* Section 1: Terms */}
        <div className="mt-8 rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-base">
            <FileText className="h-5 w-5" />
            <h2>{termsBlock?.title || 'Syarat & Ketentuan Pemesanan'}</h2>
          </div>
          <div
            className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                termsBlock?.content ||
                  'Pemesanan komoditas mineral tunduk pada verifikasi pembayaran transfer bank resmi dan ketersediaan stok tambang.'
              ),
            }}
          />
        </div>

        {/* Section 2: Shipping Info */}
        <div className="mt-6 rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
          <div className="flex items-center gap-2.5 text-blue-700 font-bold text-base">
            <Truck className="h-5 w-5" />
            <h2>{shippingBlock?.title || 'Informasi Pengiriman & Logistik Komoditas'}</h2>
          </div>
          <div
            className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                shippingBlock?.content ||
                  'Pengiriman menggunakan armada truk curah, tronton muatan jumbo bag, atau peti kemas kontainer 20ft/40ft.'
              ),
            }}
          />
        </div>

        {/* Section 3: Privacy Policy */}
        <div className="mt-6 rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
          <div className="flex items-center gap-2.5 text-purple-700 font-bold text-base">
            <ShieldCheck className="h-5 w-5" />
            <h2>{privacyBlock?.title || 'Kebijakan Privasi & Perlindungan Data'}</h2>
          </div>
          <div
            className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                privacyBlock?.content ||
                  'Data pribadi dan transaksi seluruh mitra kami lindungi dengan standar kerahasiaan tinggi.'
              ),
            }}
          />
        </div>

        {/* Footer Support Link */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Butuh penjelasan lebih lanjut mengenai syarat komersial?{' '}
          <Link href="/kontak" className="font-bold text-emerald-700 hover:underline">
            Hubungi Bagian Legal & Komersial Kami
          </Link>
        </div>
      </div>
    </div>
  );
}
