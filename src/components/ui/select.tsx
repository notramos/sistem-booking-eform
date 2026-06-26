'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

export { Select };
