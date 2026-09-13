'use client';

import { useEffect, useState } from 'react';
import { Download, ExternalLink, Smartphone, X } from 'lucide-react';
import { PWA_BANNER_DISMISSED_KEY } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallBannerProps {
  compact?: boolean;
}

export function PwaInstallBanner({ compact = false }: PwaInstallBannerProps) {
  const [show, setShow] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    // Nilai browser hanya dibaca setelah hydration agar render server dan client sama.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInstalled(standalone);
    if (!standalone && !window.localStorage.getItem(PWA_BANNER_DISMISSED_KEY)) {
      setShow(true);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShow(!window.localStorage.getItem(PWA_BANNER_DISMISSED_KEY));
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(PWA_BANNER_DISMISSED_KEY, '1');
    setShow(false);
  };

  const install = async () => {
    if (!installEvent) {
      dismiss();
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === 'accepted') setShow(false);
  };

  if (!show || isInstalled) return null;

  if (compact) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/80">
        <Smartphone className="h-3.5 w-3.5 shrink-0" />
        {installEvent ? (
          <button type="button" onClick={install} className="inline-flex items-center gap-1 font-medium text-white hover:underline">
            <Download className="h-3 w-3" /> Pasang AlbertusKU
          </button>
        ) : (
          <span>Tambahkan AlbertusKU ke layar utama dari menu browser</span>
        )}
        <button type="button" onClick={dismiss} className="-m-1 shrink-0 p-1 text-white/60 hover:text-white" aria-label="Tutup informasi pemasangan">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-sm">
      <Smartphone className="h-4 w-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-foreground">
        Pasang AlbertusKU di layar utama agar lebih cepat dibuka dan siap menerima notifikasi.
      </p>
      {installEvent ? (
        <Button type="button" size="sm" onClick={install} className="shrink-0">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Pasang PWA
        </Button>
      ) : (
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <ExternalLink className="h-3.5 w-3.5" /> Menu browser → Tambahkan ke layar utama
        </span>
      )}
      <button type="button" onClick={dismiss} className="-m-1 shrink-0 p-1 text-muted-foreground hover:text-foreground" aria-label="Tutup informasi pemasangan">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
