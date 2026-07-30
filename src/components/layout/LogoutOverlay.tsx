'use client';

import { LogOut } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

/**
 * Overlay penuh layar saat proses logout — dirender di AppShell selama
 * `isLoggingOut` true (lihat useAuth.tsx). Tetap tampil sampai redirect ke
 * /login selesai (AppShell/route ini unmount begitu pindah ke luar grup
 * (dashboard)), jadi tidak perlu direset manual.
 */
export function LogoutOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogOut className="h-7 w-7 text-primary" />
          </div>
        </div>
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Keluar dari akun...</p>
      </div>
    </div>
  );
}
