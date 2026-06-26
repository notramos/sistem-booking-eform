export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  department: string | null;
  position: string | null;
  nip: string | null;
  is_active: boolean;
  roles: { id: number; name: string; pivot?: { model_type: string; model_id: string } }[];
  permissions?: { id: number; name: string }[];
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category?: RoomCategory;
  description: string | null;
  capacity: number;
  floor: string | null;
  building: string | null;
  status: 'available' | 'maintenance' | 'unavailable';
  is_active: boolean;
  facilities?: RoomFacility[];
  images?: RoomImage[];
  primary_image?: RoomImage[];
  bookings?: Booking[];
  created_at: string;
}

export interface RoomCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface RoomFacility {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
}

export interface RoomImage {
  id: string;
  room_id: string;
  image_path: string;
  is_primary: boolean;
  sort_order: number;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  title: string;
  description: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose_type: string | null;
  expected_attendees: number | null;
  contact_person: string | null;
  status: BookingStatus;
  notes: string | null;
  reject_reason: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  is_cancellable?: boolean;
  user?: User;
  room?: Room;
  approval?: BookingApproval;
  logs?: BookingLog[];
  created_at: string;
}

export interface BookingApproval {
  id: string;
  booking_id: string;
  approver_id: string;
  action: 'approved' | 'rejected';
  notes: string | null;
  approver?: User;
  created_at: string;
}

export interface BookingLog {
  id: string;
  booking_id: string;
  user_id: string;
  action: string;
  description: string | null;
  user?: User;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: string;
  data: {
    booking_id?: string;
    title?: string;
    room_name?: string;
    booking_date?: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
    booker_name?: string;
    type: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginatedResponse<unknown>['meta'];
  errors?: Record<string, string[]>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  room: string;
  room_id: string;
  user?: string;
  start: string;
  end: string;
  start_time: string;
  end_time: string;
  status: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  display: string;
  extendedProps: {
    type: 'booking' | 'maintenance';
    status_label?: string;
    description?: string;
  };
}

export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  status?: string;
  room_id?: string;
  user_id?: string;
}
