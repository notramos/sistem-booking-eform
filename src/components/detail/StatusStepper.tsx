'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  label: string;
  state: 'done' | 'current' | 'todo' | 'rejected';
}

/**
 * Stepper horizontal alur status (mis. Diajukan → Ditinjau → Disetujui → Selesai).
 * Ramah untuk semua kalangan: ikon centang/silang + label jelas.
 */
export function StatusStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <div className="flex items-start w-full overflow-x-auto">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className={cn('flex items-start', !isLast && 'flex-1 min-w-[64px]')}>
            <div className="flex flex-col items-center gap-1.5 px-1">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  step.state === 'done' && 'border-green-500 bg-green-500 text-white',
                  step.state === 'current' && 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/15',
                  step.state === 'rejected' && 'border-red-500 bg-red-500 text-white',
                  step.state === 'todo' && 'border-border bg-muted text-muted-foreground'
                )}
              >
                {step.state === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : step.state === 'rejected' ? (
                  <X className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-center text-[11px] sm:text-xs font-medium leading-tight max-w-[80px]',
                  step.state === 'todo' ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'mt-[17px] h-0.5 flex-1 rounded',
                  step.state === 'done' ? 'bg-green-500' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
