/**
 * Jam operasional global untuk booking ruangan. Mirror dari
 * config/booking.php ('operating_hours') di backend. Dipakai untuk membatasi
 * time picker dan menggambar timeline ketersediaan.
 */
export const OPERATING_HOURS = { open: '06:00', close: '22:00' } as const;

/**
 * Jarak minimal hari-maju booking ruangan. Mirror dari config/booking.php
 * ('min_advance_days') di backend. Batas ATAS tanggal booking ada di
 * getMaxBookableDate() (lib/utils.ts) — akhir tahun berjalan, kecuali mulai
 * November naik ke akhir tahun depan.
 */
export const BOOKING_MIN_ADVANCE_DAYS = 7;

/**
 * Pilihan durasi (bulan) untuk booking rutin — mirror validasi backend
 * (PreviewRecurringBookingRequest: duration_months in:1,2,3). Booking rutin
 * selalu berhenti di akhir tahun kalender dari tanggal pertamanya, tidak
 * peduli aturan "November" di atas — lanjut ke tahun berikutnya berarti
 * bikin seri booking rutin baru.
 */
export const RECURRING_DURATION_OPTIONS = [1, 2, 3] as const;

/** Label tampilan untuk `booking.purpose_type` — dipakai di kartu booking/detail/approval. */
export const PURPOSE_LABELS: Record<string, string> = {
  ibadah: 'Ibadah & Persekutuan',
  acara_keluarga: 'Acara Keluarga',
  latihan_musik: 'Latihan Musik',
  pembinaan: 'Pembinaan',
  rapat: 'Rapat Pelayanan',
  seminar: 'Seminar & Training',
  publik: 'Acara Publik',
};

/**
 * Cookie penanda status login, di-set backend saat login (AuthController::login)
 * dan dihapus saat logout — terpisah dari cookie sesi Sanctum karena cookie sesi
 * SELALU ada (bahkan untuk sesi anonim pasca-logout), jadi tak bisa dipakai untuk
 * deteksi status login. Hanya dipakai middleware.ts untuk gating redirect —
 * validasi sesungguhnya tetap di backend.
 */
export const AUTH_HINT_COOKIE_NAME = 'auth_hint';

/**
 * Kunci localStorage penanda pengguna sudah menyetujui tata tertib (sekali per
 * browser, tidak per-versi — lihat tata-tertib-dialog.tsx).
 */
export const TATA_TERTIB_STORAGE_KEY = 'tata_tertib_accepted';

/**
 * Kunci localStorage penanda notifikasi download APK sudah ditutup (sekali per
 * browser — lihat ApkDownloadBanner.tsx).
 */
export const APK_BANNER_DISMISSED_KEY = 'apk_banner_dismissed';

/**
 * Path file APK Android (hasil build PWABuilder) — taruh file .apk di
 * public/downloads/ dengan nama ini setelah di-generate dari URL production.
 */
export const APK_DOWNLOAD_PATH = '/downloads/e-albertus.apk';

/**
 * PLACEHOLDER — isi teks tata tertib resmi di sini. Satu tempat, mudah diganti
 * tanpa menyentuh komponen dialog.
 */
export const TATA_TERTIB_TEXT = `
1. Pengajuan booking ruangan/pelayanan harus sesuai dengan keperluan yang sebenarnya.
2. Data dan informasi yang diisi harus benar dan dapat dipertanggungjawabkan.
3. Pemohon wajib menjaga kebersihan dan ketertiban ruangan yang digunakan.
4. Perubahan atau pembatalan booking harus dilakukan sesegera mungkin agar tidak menghalangi jemaat lain.
5. Pihak sekretariat/admin berhak menolak atau meminta revisi pengajuan yang tidak sesuai ketentuan.
`.trim();
