'use client';

import { useEffect } from 'react';

// global-error menggantikan seluruh root layout (termasuk <html>/<body>) saat
// error terjadi di root layout itu sendiri — jadi harus mandiri, tidak boleh
// bergantung pada Providers/komponen lain yang mungkin ikut gagal.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 antialiased">
        <div className="text-center px-6">
          <h1 className="text-lg font-semibold text-gray-900">Terjadi Kesalahan</h1>
          <p className="mt-1 text-sm text-gray-500">Aplikasi gagal dimuat. Silakan coba lagi.</p>
          <button
            onClick={reset}
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
