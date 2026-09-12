'use client';

import { useEffect } from 'react';

/**
 * Komponen pelindung runtime browser & PWA.
 * Mencegah uncaught exception dari extension browser pihak ketiga (misalnya Web Vitals extension
 * versi lama yang melempar TypeError 'startTime' pada et.reportAllChanges di VM context).
 */
export function BrowserCompatibilityGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const errorHandler = (event: ErrorEvent) => {
      // Tangkap dan redam error dari script ekstensi / VM eksternal
      const msg = event.message || '';
      if (
        msg.includes("Cannot read properties of undefined (reading 'startTime')") ||
        msg.includes('reportAllChanges') ||
        (event.filename && event.filename.includes('VM'))
      ) {
        // Redam error agar tidak mencemari console atau mengganggu UX
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '');
      if (
        reason.includes("Cannot read properties of undefined (reading 'startTime')") ||
        reason.includes('reportAllChanges')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', errorHandler, true);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler, true);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return null;
}
