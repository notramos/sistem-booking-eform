'use client';

import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';

interface WizardFooterProps {
  /** Omit untuk menyembunyikan tombol "Sebelumnya" (mis. di step pertama). */
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextIcon?: ComponentType<{ className?: string }>;
}

/** Footer navigasi wizard (Sebelumnya/Lanjut) — dipakai di setiap step. */
export function WizardFooter({ onPrev, onNext, nextLabel = 'Selanjutnya', nextDisabled, nextLoading, nextIcon: Icon }: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      {onPrev ? (
        <Button type="button" variant="outline" onClick={onPrev}>
          Sebelumnya
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {nextLabel}
      </Button>
    </div>
  );
}
