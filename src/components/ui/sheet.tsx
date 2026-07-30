'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /**
   * `right` — panel geser dari kanan (perilaku lama, default).
   * `responsive` — menempel di bawah layar saat di HP (lebih mudah dijangkau
   * jempol), berubah jadi panel kanan mulai breakpoint `sm`.
   */
  side?: 'right' | 'responsive';
}

/**
 * Panel geser untuk konten kontekstual (mis. agenda kalender) yang tak perlu
 * menutupi/menggelapkan seluruh layar seperti Dialog — overlay-nya tipis, cuma
 * untuk menangkap klik-di-luar-untuk-tutup.
 */
export function Sheet({ open, onOpenChange, children, side = 'right' }: SheetProps) {
  // Tutup dengan Escape + kunci scroll halaman di belakang selama panel terbuka.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    const previousOverflow = document.body.style.overflow;

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  const isResponsive = side === 'responsive';

  return (
    <div
      data-state={open ? 'open' : 'closed'}
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
    >
      {open && (
        <div className="fixed inset-0 bg-black/10" onClick={() => onOpenChange(false)} />
      )}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 bg-background shadow-lg transition-transform duration-300 ease-in-out',
          isResponsive
            ? [
                'inset-x-0 bottom-0 h-[85vh] rounded-t-xl border-t',
                'sm:left-auto sm:top-0 sm:h-full sm:w-full sm:max-w-md sm:rounded-none sm:border-t-0 sm:border-l',
                open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full sm:translate-y-0',
              ]
            : [
                'right-0 top-0 h-full w-full max-w-md border-l',
                open ? 'translate-x-0' : 'translate-x-full',
              ]
        )}
      >
        {isResponsive && (
          // Afordansi visual bahwa panel ini datang dari bawah — hanya relevan di HP.
          <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

const SheetContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex h-full flex-col gap-4 p-6 overflow-y-auto', className)} {...props}>
      {children}
    </div>
  )
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start justify-between gap-3', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
SheetDescription.displayName = 'SheetDescription';

function SheetClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tutup"
      className="rounded-sm p-1 -m-1 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-accent transition-colors shrink-0"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

const SheetFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto pt-4 border-t', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

export { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter };
