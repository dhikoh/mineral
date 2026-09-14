import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ShieldCheck, Truck, HelpCircle } from 'lucide-react';
import { getContentBlockByKey } from '@/lib/data-store';
import { RichTextRenderer } from '@/components/editor/RichTextRenderer';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Adably',
  description:
    'Syarat, ketentuan pemesanan, kebijakan pengiriman logistik, dan inspeksi komoditas mineral di Adably.',
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
          <RichTextRenderer
            html={
              termsBlock?.content ||
              '<p>Pemesanan komoditas mineral tunduk pada verifikasi pembayaran transfer bank resmi dan ketersediaan stok tambang.</p>'
            }
            theme="light"
            className="text-xs sm:text-sm text-slate-600"
          />
        </div>

        {/* Section 2: Shipping Info */}
        <div className="mt-6 rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
          <div className="flex items-center gap-2.5 text-blue-700 font-bold text-base">
            <Truck className="h-5 w-5" />
            <h2>{shippingBlock?.title || 'Informasi Pengiriman & Logistik Komoditas'}</h2>
          </div>
          <RichTextRenderer
            html={
              shippingBlock?.content ||
              '<p>Pengiriman dikoordinasikan menggunakan ekspedisi kargo darat dan laut atau opsi pengambilan mandiri (Loco).</p>'
            }
            theme="light"
            className="text-xs sm:text-sm text-slate-600"
          />
        </div>

        {/* Section 3: Privacy Policy */}
        <div className="mt-6 rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-4">
          <div className="flex items-center gap-2.5 text-purple-700 font-bold text-base">
            <ShieldCheck className="h-5 w-5" />
            <h2>{privacyBlock?.title || 'Kebijakan Privasi & Perlindungan Data'}</h2>
          </div>
          <RichTextRenderer
            html={
              privacyBlock?.content ||
              '<p>Data pribadi dan transaksi seluruh mitra kami lindungi dengan standar kerahasiaan tinggi.</p>'
            }
            theme="light"
            className="text-xs sm:text-sm text-slate-600"
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
