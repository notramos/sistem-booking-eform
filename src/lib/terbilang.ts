const SATUAN = [
  '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
  'Sepuluh', 'Sebelas',
];

function bilangan(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${bilangan(n - 10)} Belas`;
  if (n < 100) return `${bilangan(Math.floor(n / 10))} Puluh${n % 10 !== 0 ? ` ${bilangan(n % 10)}` : ''}`;
  if (n < 200) return `Seratus${n % 100 !== 0 ? ` ${bilangan(n % 100)}` : ''}`;
  if (n < 1000) return `${bilangan(Math.floor(n / 100))} Ratus${n % 100 !== 0 ? ` ${bilangan(n % 100)}` : ''}`;
  if (n < 2000) return `Seribu${n % 1000 !== 0 ? ` ${bilangan(n % 1000)}` : ''}`;
  if (n < 1_000_000) return `${bilangan(Math.floor(n / 1000))} Ribu${n % 1000 !== 0 ? ` ${bilangan(n % 1000)}` : ''}`;
  if (n < 1_000_000_000) return `${bilangan(Math.floor(n / 1_000_000))} Juta${n % 1_000_000 !== 0 ? ` ${bilangan(n % 1_000_000)}` : ''}`;
  if (n < 1_000_000_000_000) return `${bilangan(Math.floor(n / 1_000_000_000))} Miliar${n % 1_000_000_000 !== 0 ? ` ${bilangan(n % 1_000_000_000)}` : ''}`;
  return `${bilangan(Math.floor(n / 1_000_000_000_000))} Triliun${n % 1_000_000_000_000 !== 0 ? ` ${bilangan(n % 1_000_000_000_000)}` : ''}`;
}

/** Ubah angka jadi terbilang bahasa Indonesia, mis. 50000 -> "Lima Puluh Ribu". */
export function angkaKeTerbilang(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (n === 0) return 'Nol';
  const negative = n < 0;
  const abs = Math.floor(Math.abs(n));
  return `${negative ? 'Minus ' : ''}${bilangan(abs)}`;
}
