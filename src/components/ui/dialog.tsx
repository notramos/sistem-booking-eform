'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <div
      data-state={open ? 'open' : 'closed'}
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
    >
      {open && (
        <div className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      )}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${open ? '' : 'hidden'}`}
        onClick={() => onOpenChange(false)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

const DialogContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200',
        className
      )}
      {...props}
    >
      {children}
      {/* Close via DialogContext would be better, but keep simple */}
    </div>
  )
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
DialogDescription.displayName = 'DialogDescription';

const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

export { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
