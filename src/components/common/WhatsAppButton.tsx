'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  csWhatsapp?: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  csWhatsapp = '6281234567890',
  defaultMessage = 'Halo Tim Adably, saya tertarik berkonsultasi mengenai pemesanan komoditas mineral...',
}: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Clean phone number
  let cleanNumber = csWhatsapp.replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1);
  }

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 flex flex-col items-end">
      {/* Tooltip on hover / initial prompt */}
      {showTooltip && (
        <div className="mb-2.5 max-w-[220px] rounded-2xl border border-emerald-100 bg-white p-3 shadow-soft-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              Konsultasi Komoditas & Sampel Gratis
            </p>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Chat langsung dengan tim teknis & logistik Adably via WhatsApp.
          </p>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        className="group relative flex h-13 w-13 items-center justify-center rounded-full bg-emerald-600 text-white shadow-soft-lg transition-all duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-soft-xl focus:outline-none focus:ring-4 focus:ring-emerald-300 active:scale-95"
        aria-label="Hubungi WhatsApp Customer Service"
      >
        {/* Subtle Pulse Animation */}
        <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-emerald-500/30 opacity-75 duration-1000" />

        {/* WhatsApp Icon (SVG) */}
        <svg
          className="h-7 w-7 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.3-.776.978-.952 1.179-.175.2-.351.226-.652.075-.3-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.3-.019-.462.132-.612.136-.135.301-.351.451-.527.151-.175.201-.3.301-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.927-2.232-.244-.587-.492-.507-.676-.516l-.576-.01c-.2 0-.527.075-.803.376-.276.3-1.053 1.028-1.053 2.508 0 1.48 1.078 2.909 1.229 3.11.15.2 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.38.197 1.9.12.579-.087 1.78-.728 2.031-1.43.25-.703.25-1.305.175-1.43-.075-.125-.276-.2-.577-.35zM12.04 2C6.516 2 2.03 6.486 2.03 12.01c0 1.97.574 3.805 1.564 5.357L2.002 22l4.793-1.551a9.96 9.96 0 0 0 5.245 1.472h.004c5.523 0 10.01-4.486 10.01-10.01C22.054 6.486 17.564 2 12.04 2zm0 18.324a8.27 8.27 0 0 1-4.225-1.159l-.303-.18-3.136 1.015 1.036-3.053-.198-.314a8.28 8.28 0 0 1-1.27-4.48c0-4.57 3.719-8.288 8.29-8.288 4.57 0 8.288 3.719 8.288 8.288 0 4.57-3.718 8.291-8.287 8.291z" />
        </svg>

        {/* Small label for desktop hover */}
        <span className="sr-only">Hubungi WhatsApp CS</span>
      </a>
    </div>
  );
}
