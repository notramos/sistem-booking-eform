'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AllBookingsTable } from '@/components/admin/AllBookingsTable';
import { AllServicesTable } from '@/components/admin/AllServicesTable';

export default function AdminDataPage() {
  const [tab, setTab] = useState<'bookings' | 'services'>('bookings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Booking &amp; Pelayanan Umat</h1>
        <p className="text-muted-foreground mt-1">Lihat seluruh riwayat booking ruangan dan permohonan pelayanan umat</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="bookings">Booking Ruangan</TabsTrigger>
          <TabsTrigger value="services">Pelayanan Umat</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <AllBookingsTable />
        </TabsContent>
        <TabsContent value="services">
          <AllServicesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
