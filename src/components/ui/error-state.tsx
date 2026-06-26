'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="w-4 h-4 mr-1" /> Muat Ulang
        </Button>
      )}
    </div>
  );
}
