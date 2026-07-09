'use client';

import { useState } from 'react';
import { usePendingBookings } from '@/hooks/useBookings';
import { useCongregationServices } from '@/hooks/useCongregationServices';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookingApprovalsTab } from '@/components/approvals/BookingApprovalsTab';
import { ServiceApprovalsTab } from '@/components/approvals/ServiceApprovalsTab';

export default function ApprovalsPage() {
  const { hasAnyRole } = useAuth();
  const isStaff = hasAnyRole(['sekretariat', 'admin']);
  const [tab, setTab] = useState<'bookings' | 'services'>('bookings');

  // Query halaman pertama di-dedupe otomatis oleh react-query dengan query yang sama
  // di dalam masing-masing tab (queryKey identik) — dipakai di sini hanya untuk label jumlah pending.
  const { data: pendingBookings } = usePendingBookings(isStaff, 1);
  const { data: pendingServices } = useCongregationServices({ status: 'pending', page: 1 });

  const bookingCount = pendingBookings?.meta?.total ?? 0;
  const serviceCount = pendingServices?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Persetujuan</h1>
        <p className="text-muted-foreground mt-1">Setujui atau tolak booking ruangan dan permohonan pelayanan umat</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="bookings">Booking Ruangan{bookingCount > 0 ? ` (${bookingCount})` : ''}</TabsTrigger>
          <TabsTrigger value="services">Pelayanan Umat{serviceCount > 0 ? ` (${serviceCount})` : ''}</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <BookingApprovalsTab />
        </TabsContent>
        <TabsContent value="services">
          <ServiceApprovalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
