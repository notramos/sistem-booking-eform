'use client';

import { useState } from 'react';
import { useRooms, useRoomCategories } from '@/hooks/useRooms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';
import { Search, MapPin, Users, Building2, RotateCcw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function RoomsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [capacity, setCapacity] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: categories } = useRoomCategories();
  const { data: roomsData, isLoading, isError, refetch } = useRooms({
    search: debouncedSearch || undefined,
    category_id: categoryId || undefined,
    capacity: capacity || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ruangan</h1>
        <p className="text-muted-foreground mt-1">Cari dan lihat ketersediaan ruangan gereja</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari ruangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Semua Kategori</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            <Select value={capacity} onChange={(e) => setCapacity(e.target.value)}>
              <option value="">Semua Kapasitas</option>
              <option value="10">10+ orang</option>
              <option value="20">20+ orang</option>
              <option value="50">50+ orang</option>
              <option value="100">100+ orang</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Spinner size="lg" center label="Memuat daftar ruangan..." />
      ) : isError ? (
        <ErrorState
          title="Gagal Memuat Ruangan"
          message="Terjadi kesalahan saat memuat data ruangan. Silakan coba lagi."
          onRetry={refetch}
        />
      ) : roomsData?.data?.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <Building2 className="w-16 h-16 text-muted-foreground/40" />
              <div>
                <p className="text-lg font-medium text-foreground">Tidak ada ruangan ditemukan</p>
                <p className="text-sm text-muted-foreground mt-1">Coba ubah filter pencarian atau kategori</p>
              </div>
              <Button variant="outline" onClick={() => { setSearch(''); setCategoryId(''); setCapacity(''); }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomsData?.data?.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full hover:border-primary/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{room.name}</h3>
                      <p className="text-xs text-muted-foreground">{room.category?.name}</p>
                    </div>
                    <Badge
                      variant={room.status === 'available' ? 'success' : room.status === 'maintenance' ? 'warning' : 'secondary'}
                    >
                      {room.status === 'available' ? 'Tersedia' : room.status === 'maintenance' ? 'Perbaikan' : 'Tidak Tersedia'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {room.description || 'Tidak ada deskripsi'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.capacity} orang
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {room.building || '-'} {room.floor ? `Lt.${room.floor}` : ''}
                    </span>
                  </div>

                  {room.facilities && room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {room.facilities.slice(0, 4).map((fac) => (
                        <span
                          key={fac.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {fac.name}
                        </span>
                      ))}
                      {room.facilities.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{room.facilities.length - 4} lainnya</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
