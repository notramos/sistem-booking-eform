import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        if (typeof window !== 'undefined') {
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

export default apiClient;
