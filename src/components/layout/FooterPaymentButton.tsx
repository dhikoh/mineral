'use client';

import { useState } from 'react';
import { CreditCard, ChevronRight } from 'lucide-react';
import { PaymentMethodModal } from '@/components/common/PaymentMethodModal';
import type { BankAccount } from '@/lib/data-store';

interface FooterPaymentButtonProps {
  paymentMethods: BankAccount[];
}

/**
 * Client component kecil untuk tombol "Lihat Semua Metode Pembayaran" di Footer.
 * Diekstrak agar Footer (server component) tidak perlu jadi client.
 */
export function FooterPaymentButton({ paymentMethods }: FooterPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (paymentMethods.filter((m) => m.isActive !== false).length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
      >
        <CreditCard className="h-3.5 w-3.5" />
        Lihat Semua Metode Pembayaran
        <ChevronRight className="h-3 w-3" />
      </button>

      <PaymentMethodModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        paymentMethods={paymentMethods}
      />
    </>
  );
}
