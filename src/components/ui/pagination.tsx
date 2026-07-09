'use client';

import { Button } from '@/components/ui/button';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

interface PaginationProps {
  meta: PaginationMeta | undefined | null;
  onPageChange: (page: number) => void;
  /** Kata benda untuk suffix "(N {itemLabel})", mis. "booking", "permohonan". */
  itemLabel?: string;
}

/** Footer paginasi standar: "Halaman X dari Y (N …)" + tombol Sebelumnya/Selanjutnya. */
export function Pagination({ meta, onPageChange, itemLabel = '' }: PaginationProps) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        Halaman {meta.current_page} dari {meta.last_page}
        {itemLabel ? ` (${meta.total} ${itemLabel})` : ` (${meta.total})`}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
