'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'w-3 h-3',
  default: 'w-4 h-4',
  lg: 'h-6 w-6',
  xl: 'w-8 h-8',
} as const;

interface SpinnerProps {
  size?: keyof typeof sizeClasses;
  className?: string;
  /** Bungkus dalam container flex-center (untuk loading section). */
  center?: boolean;
  /** Keterangan di bawah ikon — dianjurkan untuk spinner level section/halaman. */
  label?: string;
  /** Container penuh viewport, untuk auth-gate / transisi halaman. */
  fullScreen?: boolean;
}

/**
 * Indikator loading standar aplikasi. Pakai `size="sm"`/`"default"` untuk
 * inline (mis. di samping teks status), `size="lg"`/`"xl"` + `center`/`fullScreen`
 * untuk loading section atau halaman penuh.
 */
export function Spinner({ size = 'default', className, center, label, fullScreen }: SpinnerProps) {
  const icon = <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />;

  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        {icon}
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        {icon}
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    );
  }

  return icon;
}
