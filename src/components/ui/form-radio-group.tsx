'use client';

import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  error?: string;
}

export function FormRadioGroup({ options, value, onChange, name, error }: FormRadioGroupProps) {
  return (
    <div>
      <div className="flex gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                selected
                  ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
