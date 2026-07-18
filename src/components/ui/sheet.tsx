'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Panel geser dari sisi kanan — dipakai untuk konten kontekstual (mis. agenda kalender)
 * yang tak perlu menutupi/menggelapkan seluruh layar seperti Dialog (overlay tipis,
 * cuma untuk menangkap klik-di-luar-untuk-tutup).
 */
export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <div
      data-state={open ? 'open' : 'closed'}
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
    >
      {open && (
        <div className="fixed inset-0 bg-black/10" onClick={() => onOpenChange(false)} />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-background shadow-lg transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
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
