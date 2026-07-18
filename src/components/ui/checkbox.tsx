'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className, ...props }, ref) => (
    <div className={cn('flex items-start gap-2', className)}>
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
        {...props}
      />
      <label htmlFor={id} className="text-sm leading-snug text-foreground select-none">
        {label}
      </label>
    </div>
  )
);
Checkbox.displayName = 'Checkbox';
