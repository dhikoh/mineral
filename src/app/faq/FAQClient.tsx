'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  FileCheck2,
  Truck,
  ShieldCheck,
  CreditCard,
  X,
} from 'lucide-react';
import { sanitize } from '@/lib/sanitize';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FAQClientProps {
  faqs: FAQItem[];
  csWhatsapp: string;
  siteName: string;
}

export function FAQClient({ faqs, csWhatsapp, siteName }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  const filteredFaqs = faqs.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
  });

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  let cleanWa = csWhatsapp.replace(/\D/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  }
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Halo ${siteName}, saya membaca halaman FAQ dan ingin menanyakan perihal komoditas mineral...`
  )}`;

  return (
    <div className="min-h-screen bg-surface-50 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-700 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">Tanya Jawab (FAQ)</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-soft-xs">
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            <span>Pusat Informasi & Panduan Transaksi</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed">
            Temukan jawaban lengkap seputar legalitas usaha, pengujian sampel komoditas, minimum pemesanan (MOQ), prosedur pembayaran, hingga opsi ekspedisi kargo nusantara.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kata kunci (contoh: COA, sampel, tonase, transfer, resi)..."
            className="w-full rounded-2xl border border-surface-200 bg-white py-3.5 pl-11 pr-10 text-xs sm:text-sm text-slate-900 shadow-soft-xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* FAQ List Accordion */}
        <div className="mt-8 space-y-3.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? 'border-emerald-500/80 bg-white shadow-soft-md ring-1 ring-emerald-500/20'
                      : 'border-surface-200 bg-white hover:border-slate-300 shadow-soft-xs'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors"
                  >
                    <div className="flex items-start gap-3.5 pr-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 font-mono text-xs font-bold text-emerald-700">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-surface-100 bg-surface-50/50 px-5 pt-3 pb-5">
                      <div
                        className="text-xs sm:text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: sanitize(faq.answer) }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-soft-xs">
              <HelpCircle className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">
                Tidak ada pertanyaan yang sesuai dengan &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Silakan coba kata kunci lain atau tanyakan langsung kepada Customer Service kami.
              </p>
            </div>
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-soft-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
                <MessageCircle className="h-3.5 w-3.5" /> Layanan Konsultasi Cepat
              </span>
              <h2 className="text-xl font-bold sm:text-2xl">
                Punya Pertanyaan Spesifik Mengenai Komoditas?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tim layanan kami siap membantu pengecekan ketersediaan data teknis, pengajuan sampel fisik, hingga penawaran pengiriman kargo skala industri.
              </p>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-soft-sm hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Konsultasi WhatsApp Sekarang</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
