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
  label?: string;
  error?: string;
}

export function FormRadioGroup({ options, value, onChange, name, label, error }: FormRadioGroupProps) {
  return (
    <div>
      <div role="radiogroup" aria-label={label ?? name} className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label key={opt.value} className="relative cursor-pointer">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="peer sr-only"
              />
              <span className={cn(
                'flex min-h-11 items-center justify-center rounded-lg border px-3 py-2.5 text-center text-sm font-medium leading-snug transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                selected
                  ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
