'use client';

import { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Jangan aktifkan prompt PWA atau service worker di area dashboard admin
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;

    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });
    }

    // 2. Check if dismissed before in sessionStorage
    const dismissedSession = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissedSession) {
      setIsDismissed(true);
    }

    // 3. Listen to beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isDismissed, isAdmin]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsVisible(false);
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Sembunyikan di dashboard admin
  if (isAdmin || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Prompt PWA Adably"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:right-6 md:left-auto"
    >
      <div className="relative flex items-center justify-between gap-3.5 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-white">Pasang Aplikasi Adably</h4>
            <p className="text-xs text-slate-300">Akses cepat & katalog luring di layar HP Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Pasang</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Tutup prompt aplikasi"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
