'use client';

import { useState, type ComponentProps } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OfficialDocumentPreview } from '@/components/ui/official-document-preview';

type Props = ComponentProps<typeof OfficialDocumentPreview> & {
  triggerLabel?: string;
  triggerClassName?: string;
};

/**
 * Tombol untuk membuka pratinjau "bukti dokumen" (surat resmi) dalam dialog,
 * lengkap dengan tombol cetak. Dokumen di-render di dalam dialog sehingga
 * aturan @media print (.print-area) tetap menangkapnya saat dicetak.
 */
export function DocumentPreviewDialog({ triggerLabel = 'Preview & Cetak Dokumen', triggerClassName, ...docProps }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className={triggerClassName ?? 'w-full gap-2'} onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" /> {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <DialogTitle>Bukti Dokumen</DialogTitle>
          </DialogHeader>
          <OfficialDocumentPreview {...docProps} showPrintButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
