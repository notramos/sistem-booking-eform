'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { APK_BANNER_DISMISSED_KEY, APK_DOWNLOAD_PATH } from '@/lib/constants';

interface ApkDownloadBannerProps {
  /** Versi kecil (pill) untuk latar gelap seperti hero login — vs. versi bar penuh di AppShell. */
  compact?: boolean;
}

/**
 * Notifikasi dismissible untuk unduh APK Android — muncul sekali per browser
 * (kecuali ditutup), mirip pola TataTertibDialog tapi non-blocking (banner,
 * bukan modal wajib). Tersembunyi lagi setelah pengguna menutupnya. Dipakai di
 * dua tempat (AppShell & halaman login) dengan localStorage key yang sama,
 * jadi ditutup sekali di mana pun akan tersembunyi di keduanya.
 */
export function ApkDownloadBanner({ compact = false }: ApkDownloadBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Baca-sekali dari localStorage setelah mount, sama seperti pola di AppShell/TataTertibDialog.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(!window.localStorage.getItem(APK_BANNER_DISMISSED_KEY));
    }
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(APK_BANNER_DISMISSED_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/80">
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <a href={APK_DOWNLOAD_PATH} download className="inline-flex items-center gap-1 font-medium text-white hover:underline">
          <Download className="w-3 h-3" /> Download APK Android
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 -m-1 text-white/60 hover:text-white shrink-0"
          aria-label="Tutup notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-sm">
      <Smartphone className="w-4 h-4 text-primary shrink-0" />
      <p className="flex-1 min-w-0 text-foreground">
        Ada aplikasi Android E-Albertus — install langsung dari HP kamu.
      </p>
      <a
        href={APK_DOWNLOAD_PATH}
        download
        className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline shrink-0"
      >
        <Download className="w-3.5 h-3.5" /> Download APK
      </a>
      <button
        type="button"
        onClick={dismiss}
        className="p-1 -m-1 text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
