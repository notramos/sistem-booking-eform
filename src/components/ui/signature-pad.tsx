'use client';

import { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SignaturePadHandle {
  getDataUrl: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  className?: string;
  onChange?: (hasSignature: boolean) => void;
}

function getPoint(canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ className, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return null;
        return canvas.toDataURL('image/png');
      },
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setIsEmpty(true);
          onChange?.(false);
        }
      },
    }));

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      canvas.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const { x, y } = getPoint(canvas, e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const { x, y } = getPoint(canvas, e);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineTo(x, y);
      ctx.stroke();

      if (isEmpty) {
        setIsEmpty(false);
        onChange?.(true);
      }
    };

    const handlePointerUp = () => {
      drawingRef.current = false;
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setIsEmpty(true);
      onChange?.(false);
    };

    return (
      <div className={cn('space-y-2', className)}>
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-40 rounded-md border border-dashed border-input bg-white touch-none cursor-crosshair"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Gambar tanda tangan Anda di area di atas</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <Eraser className="w-3.5 h-3.5 mr-1" /> Bersihkan
          </Button>
        </div>
      </div>
    );
  }
);
