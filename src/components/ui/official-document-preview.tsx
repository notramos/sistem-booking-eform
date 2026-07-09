'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

interface DocumentField {
  label: string;
  value: string | null | undefined;
}

interface DocumentSection {
  title: string;
  fields: DocumentField[];
}

interface OfficialDocumentPreviewProps {
  title: string;
  sections: DocumentSection[];
  applicantName?: string;
  submittedAt?: string;
  status?: string;
  showPrintButton?: boolean;
  signaturePemohonUrl?: string | null;
  signaturePetugasUrl?: string | null;
  signerPetugasName?: string | null;
}

function formatFieldValue(value: unknown): string {
  if (!value) return '';
  if (value === 'L') return 'Laki-laki';
  if (value === 'P') return 'Perempuan';
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    try {
      return formatDate(value, 'long');
    } catch {
      return value;
    }
  }
  return String(value);
}

export function OfficialDocumentPreview({
  title,
  sections,
  applicantName,
  submittedAt,
  status,
  showPrintButton = false,
  signaturePemohonUrl,
  signaturePetugasUrl,
  signerPetugasName,
}: OfficialDocumentPreviewProps) {
  const signDate = submittedAt ? formatDate(submittedAt, 'long') : formatDate(new Date().toISOString(), 'long');

  return (
    <div className="space-y-3">
      {showPrintButton && (
        <div className="flex justify-end no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
        </div>
      )}

      <div className="print-area border rounded-lg bg-white text-black font-serif p-6 sm:p-8 space-y-5">
        {/* Kop surat */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/albertus-logo.png"
            alt="Logo Paroki Santo Albertus Agung"
            className="w-16 h-16 shrink-0 object-contain"
          />
          <div className="flex-1 text-center">
            <div className="text-lg font-bold tracking-wide">PAROKI HARAPAN INDAH</div>
            <div className="text-base font-bold">SANTO ALBERTUS AGUNG</div>
            <div className="text-xs leading-tight">
              Jl. Bulevar Raya Kav. 23 Harapan Indah 17131
              <br />
              Telp (021)29477580 - Fax (021) 29477579
              <br />
              Jawa Barat - Indonesia
            </div>
          </div>
          {status && (
            <div className="no-print shrink-0">
              <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
            </div>
          )}
        </div>

        {/* Judul */}
        <div className="text-center font-bold underline uppercase text-base">{title}</div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="font-bold text-sm mb-1.5">{section.title}</div>
              <div className="space-y-1.5">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-baseline gap-2 text-sm">
                    <span className="shrink-0 w-2/5 sm:w-1/3">{field.label}</span>
                    <span className="shrink-0">:</span>
                    <span
                      className={cn(
                        'flex-1 border-b border-dotted border-black pb-0.5 min-h-[1.3em]'
                      )}
                    >
                      {formatFieldValue(field.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tanda tangan */}
        <div className="print-signature-block pt-4 space-y-6">
          <div className="text-right text-sm">Bekasi, {signDate}</div>
          <div className="flex justify-between gap-6">
            <div className="w-1/2 text-center text-sm">
              Pemohon
              <div className="mt-2 h-12 flex items-end justify-center">
                {signaturePemohonUrl && (
                  <img src={signaturePemohonUrl} alt="Tanda tangan pemohon" className="h-12 object-contain" />
                )}
              </div>
              <div className="border-b border-dotted border-black w-4/5 mx-auto" />
              <div className="w-4/5 mx-auto pt-0.5 min-h-[1.3em] font-semibold">
                {applicantName || ' '}
              </div>
            </div>
            <div className="w-1/2 text-center text-sm">
              Petugas Sekretariat Paroki
              <div className="mt-2 h-12 flex items-end justify-center">
                {signaturePetugasUrl && (
                  <img src={signaturePetugasUrl} alt="Tanda tangan petugas" className="h-12 object-contain" />
                )}
              </div>
              <div className="border-b border-dotted border-black w-4/5 mx-auto" />
              <div className="w-4/5 mx-auto pt-0.5 min-h-[1.3em] font-semibold">
                {signerPetugasName || ' '}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
