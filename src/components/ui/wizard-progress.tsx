'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardStep {
  title: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;
          const isClickable = isCompleted && !!onStepClick;
          const Circle = isClickable ? 'button' : 'div';

          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <Circle
                  type={isClickable ? 'button' : undefined}
                  onClick={isClickable ? () => onStepClick?.(index) : undefined}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'ring-2 ring-primary ring-offset-2 bg-background text-primary',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground',
                    isClickable && 'cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </Circle>
                <span
                  className={cn(
                    'text-xs mt-1.5 text-center leading-tight max-w-[80px]',
                    isActive && 'text-primary font-medium',
                    isCompleted && 'text-muted-foreground',
                    !isCompleted && !isActive && 'text-muted-foreground/60'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3 mt-[-1.5rem] transition-all duration-300',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
