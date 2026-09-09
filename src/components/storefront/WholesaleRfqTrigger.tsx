'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { RfqModal } from '@/components/storefront/RfqModal';

export function WholesaleRfqTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95 border border-emerald-400/50"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Minta Penawaran Resmi (RFQ)</span>
      </button>

      <RfqModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
