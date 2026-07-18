'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Spinner } from '@/components/ui/spinner';
import { TataTertibDialog } from '@/components/ui/tata-tertib-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TATA_TERTIB_STORAGE_KEY } from '@/lib/constants';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTataTertib, setShowTataTertib] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // localStorage cuma bisa dibaca di client setelah mount (tak ada di server untuk SSR) —
    // pola baca-sekali ini disengaja, bukan sinkronisasi state yang berulang.
    if (!loading && user && typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowTataTertib(!window.localStorage.getItem(TATA_TERTIB_STORAGE_KEY));
    }
  }, [loading, user]);

  // Sudah pasti tidak ada sesi (bukan sedang loading) — akan redirect ke /login,
  // jangan sempat menampilkan shell dashboard sebelum pindah halaman.
  if (!loading && !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <TataTertibDialog open={showTataTertib} onAccepted={() => setShowTataTertib(false)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6">
          {loading ? <Spinner size="lg" center label="Memuat..." /> : children}
        </main>
      </div>
    </div>
  );
}
