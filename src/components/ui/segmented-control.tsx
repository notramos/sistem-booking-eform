'use client';

import { cn } from '@/lib/utils';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: readonly SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Grup filter pill (mis. status), gaya seragam dipakai di seluruh aplikasi. */
export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary/50'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
