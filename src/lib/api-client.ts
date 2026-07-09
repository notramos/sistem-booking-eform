import axios from 'axios';

// Auth memakai cookie session HttpOnly Sanctum (SPA mode) — token tidak lagi
// disimpan/dikirim manual dari JS. Browser otomatis menyertakan cookie session
// selama `withCredentials`/`withXSRFToken` aktif dan origin terdaftar di CORS.
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
  withXSRFToken: true,
});

// Sama dengan publicPaths di middleware.ts — cookie session HttpOnly tak bisa
// dicek dari JS, jadi useAuth SELALU memanggil /auth/user saat mount (termasuk
// di halaman ini sendiri). 401 di sini wajar (belum login), bukan sesi habis —
// tanpa guard ini, redirect ke '/login' saat SUDAH di '/login' memicu reload tanpa henti.
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 && typeof window !== 'undefined') {
        const onPublicPath = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
        if (!onPublicPath) {
          window.location.href = '/login';
        }
      }

      return Promise.reject({
        status,
        message: data?.message || 'Terjadi kesalahan',
        errors: data?.errors || {},
      });
    }

    return Promise.reject({ status: 0, message: 'Network error', errors: {} });
  }
);

/**
 * Ambil cookie XSRF-TOKEN dari endpoint bawaan Sanctum sebelum login/logout —
 * wajib untuk alur SPA-cookie (bukan bearer token). Endpoint ini ada di root
 * ("/sanctum/csrf-cookie"), bukan di bawah prefix "/api".
 */
export async function ensureCsrfCookie(): Promise<void> {
  const apiRoot = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api').replace(/\/api\/?$/, '');
  await axios.get(`${apiRoot}/sanctum/csrf-cookie`, { withCredentials: true });
}

export default apiClient;
