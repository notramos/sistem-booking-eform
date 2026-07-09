/**
 * Jam operasional global untuk booking ruangan. Mirror dari
 * config/booking.php ('operating_hours') di backend. Dipakai untuk membatasi
 * time picker dan menggambar timeline ketersediaan.
 */
export const OPERATING_HOURS = { open: '06:00', close: '22:00' } as const;

/**
 * Rentang hari-maju booking ruangan. Mirror dari config/booking.php
 * ('min_advance_days' / 'max_advance_days') di backend.
 */
export const BOOKING_MIN_ADVANCE_DAYS = 7;
export const BOOKING_MAX_ADVANCE_DAYS = 30;

/**
 * Nama cookie session Laravel (HttpOnly, di-set backend saat login via
 * Sanctum SPA mode). Mirror dari config/session.php: Str::slug(APP_NAME).'-session'.
 * Hanya dipakai middleware.ts untuk cek keberadaan (bukan isi) cookie demi
 * gating redirect — validasi sesungguhnya tetap di backend.
 */
export const SESSION_COOKIE_NAME = 'e-albertus-session';
