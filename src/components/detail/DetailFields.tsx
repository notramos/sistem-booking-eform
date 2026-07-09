'use client';

import type { ReactNode } from 'react';

export interface DetailField {
  label: string;
  value?: ReactNode;
}

export interface DetailGroup {
  title?: string;
  fields: DetailField[];
}

function isEmpty(value: ReactNode): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Tampilan "versi web" — menjabarkan detail sebagai definition list yang rapi
 * dan responsif. Field kosong otomatis disembunyikan.
 */
export function DetailFields({ groups }: { groups: DetailGroup[] }) {
  const nonEmpty = groups
    .map((g) => ({ ...g, fields: g.fields.filter((f) => !isEmpty(f.value)) }))
    .filter((g) => g.fields.length > 0);

  if (nonEmpty.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="space-y-6">
      {nonEmpty.map((group, gi) => (
        <div key={gi}>
          {group.title && (
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </h3>
          )}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {group.fields.map((f, fi) => (
              <div key={fi} className="min-w-0">
                <dt className="mb-0.5 text-xs text-muted-foreground">{f.label}</dt>
                <dd className="break-words text-sm font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
