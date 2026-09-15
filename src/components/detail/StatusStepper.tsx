'use client';

import { Check, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  label: string;
  state: 'done' | 'current' | 'todo' | 'rejected' | 'revision';
}

/**
 * Stepper horizontal alur status (mis. Diajukan → Ditinjau → Disetujui → Selesai).
 * Ramah untuk semua kalangan: ikon centang/silang + label jelas.
 */
export function StatusStepper({ steps }: { steps: StepperStep[] }) {
  const explicitIndex = steps.findIndex((step) => ['current', 'rejected', 'revision'].includes(step.state));
  const firstTodoIndex = steps.findIndex((step) => step.state === 'todo');
  const activeIndex = explicitIndex >= 0
    ? explicitIndex
    : firstTodoIndex > 0
      ? firstTodoIndex - 1
      : steps.length - 1;
  const activeStep = steps[activeIndex];
  const nextStep = activeStep?.state === 'current' ? steps[activeIndex + 1] : undefined;
  const progress = Math.max(0, ((activeIndex + 1) / steps.length) * 100);

  return (
    <>
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status saat ini</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{activeStep?.label}</p>
          </div>
          {nextStep && <p className="text-right text-xs text-muted-foreground">Berikutnya<br /><span className="font-medium text-foreground">{nextStep.label}</span></p>}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              activeStep?.state === 'rejected' ? 'bg-red-500' : activeStep?.state === 'revision' ? 'bg-orange-500' : 'bg-[#5E8C72]'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Tahap {activeIndex + 1} dari {steps.length}</p>
      </div>

    <div className="hidden sm:flex items-start w-full overflow-x-auto">
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
                  step.state === 'revision' && 'border-orange-500 bg-orange-500 text-white',
                  step.state === 'todo' && 'border-border bg-muted text-muted-foreground'
                )}
              >
                {step.state === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : step.state === 'rejected' ? (
                  <X className="h-4 w-4" />
                ) : step.state === 'revision' ? (
                  <RotateCcw className="h-4 w-4" />
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
    </>
  );
}
