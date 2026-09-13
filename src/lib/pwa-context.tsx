'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextValue {
  /** Apakah aplikasi sudah terpasang sebagai PWA */
  isInstalled: boolean;
  /** Apakah prompt instalasi tersedia (beforeinstallprompt sudah difiring) */
  isInstallable: boolean;
  /** Apakah user sudah memilih "jangan tampilkan lagi" secara permanen */
  isDismissedPermanently: boolean;
  /** Panggil ini untuk memicu prompt instalasi native browser */
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
  /** Tutup banner dengan opsi menyimpan preferensi permanen */
  dismissBanner: (neverShow?: boolean) => void;
}

const PwaContext = createContext<PwaContextValue>({
  isInstalled: false,
  isInstallable: false,
  isDismissedPermanently: false,
  promptInstall: async () => null,
  dismissBanner: () => {},
});

const LS_NEVER_SHOW_KEY = 'pwa_prompt_never_show';
const LS_INSTALLED_KEY = 'pwa_installed';

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissedPermanently, setIsDismissedPermanently] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 0. Register Service Worker (terpusat di sini)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('[PWA] SW registration failed:', err));
    }

    // 1. Deteksi: Apakah sudah dipasang & berjalan sebagai standalone PWA?
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    const prevInstalled = localStorage.getItem(LS_INSTALLED_KEY) === 'true';
    if (isStandalone || prevInstalled) {
      setIsInstalled(true);
      if (!prevInstalled) localStorage.setItem(LS_INSTALLED_KEY, 'true');
    }

    // 2. Deteksi: Apakah user sudah memilih "jangan tampilkan lagi"?

    if (localStorage.getItem(LS_NEVER_SHOW_KEY) === 'true') {
      setIsDismissedPermanently(true);
    }

    // 3. Listen event instalasi selesai oleh browser
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Tangkap prompt instalasi native browser
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) return null;
    setIsInstallable(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
    }
    return outcome;
  }, [deferredPrompt]);

  const dismissBanner = useCallback((neverShow = false) => {
    if (neverShow) {
      localStorage.setItem(LS_NEVER_SHOW_KEY, 'true');
      setIsDismissedPermanently(true);
    }
  }, []);

  return (
    <PwaContext.Provider
      value={{ isInstalled, isInstallable, isDismissedPermanently, promptInstall, dismissBanner }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
