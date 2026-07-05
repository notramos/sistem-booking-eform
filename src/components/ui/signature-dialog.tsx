'use client';

import { useRef, useState } from 'react';
import { PenLine, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/signature-pad';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  savedSignature?: string | null;
  onSubmit: (dataUrl: string) => void;
  isPending?: boolean;
}

/**
 * Inner body is a separate component so its state (draw mode / hasDrawn) is initialised
 * fresh every time the dialog opens — DialogContent unmounts on close, so no reset effect
 * is needed.
 */
function SignatureDialogBody({
  savedSignature,
  onSubmit,
  onCancel,
  isPending,
}: {
  savedSignature?: string | null;
  onSubmit: (dataUrl: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [drawMode, setDrawMode] = useState(!savedSignature);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleSaveDrawn = () => {
    const dataUrl = padRef.current?.getDataUrl();
    if (dataUrl) onSubmit(dataUrl);
  };

  return (
    <>
      {savedSignature && !drawMode ? (
        <div className="space-y-3">
          <div className="rounded-md border bg-white p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={savedSignature} alt="Tanda tangan tersimpan" className="h-24 object-contain" />
          </div>
          <button type="button" onClick={() => setDrawMode(true)} className="text-sm text-primary hover:underline">
            Atau gambar tanda tangan baru
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <SignaturePad ref={padRef} onChange={setHasDrawn} />
          {savedSignature && (
            <button type="button" onClick={() => setDrawMode(false)} className="text-sm text-primary hover:underline">
              Gunakan tanda tangan tersimpan
            </button>
          )}
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        {savedSignature && !drawMode ? (
          <Button onClick={() => onSubmit(savedSignature)} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PenLine className="w-4 h-4 mr-1" />}
            Gunakan Tanda Tangan Tersimpan
          </Button>
        ) : (
          <Button onClick={handleSaveDrawn} disabled={!hasDrawn || isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Simpan Tanda Tangan
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function SignatureDialog({
  open,
  onOpenChange,
  title,
  description = 'Gambar tanda tangan Anda, lalu simpan. Tanda tangan tidak dapat diubah setelah disimpan.',
  savedSignature,
  onSubmit,
  isPending = false,
}: SignatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && (
          <SignatureDialogBody
            savedSignature={savedSignature}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
