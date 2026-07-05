export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  signature?: string | null;
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
  signature_pemohon?: string | null;
  signature_pemohon_at?: string | null;
  signature_petugas?: string | null;
  signature_petugas_at?: string | null;
  signed_petugas_by?: string | null;
  user?: User;
  room?: Room;
  approval?: BookingApproval;
  logs?: BookingLog[];
  service_details?: {
    service_type_label: string;
    contact: string;
    equipment: string[];
    dynamic_fields: Record<string, unknown>;
  } | null;
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

export interface CongregationService {
  id: string;
  user_id: string;
  service_type: string;
  applicant_name: string;
  applicant_gender: string | null;
  baptismal_name: string | null;
  birth_place: string | null;
  birth_date: string | null;
  address: string | null;
  contact: string;
  phone: string | null;
  mobile_phone: string | null;
  neighborhood: string | null;
  region: string | null;
  parish: string | null;
  father_name: string | null;
  father_religion: string | null;
  mother_name: string | null;
  mother_religion: string | null;
  school: string | null;
  grade: string | null;
  occupation: string | null;
  family_card_number: string | null;
  service_date: string | null;
  description: string | null;
  status: string;
  notes: string | null;
  dynamic_fields: Record<string, unknown> | null;
  signature_pemohon?: string | null;
  signature_pemohon_at?: string | null;
  user?: User;
  created_at: string;
}

export interface Lingkungan {
  id: string;
  name: string;
}

export interface Wilayah {
  id: string;
  name: string;
  lingkungan: Lingkungan[];
}

export interface ServiceFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'time' | 'date_range' | 'select' | 'radio' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2 | 3;
  dynamicField?: boolean;
}

export interface ServiceSectionConfig {
  id: string;
  title: string;
  description?: string;
  fields: ServiceFieldConfig[];
}

export interface ServiceStepConfig {
  title: string;
  description?: string;
  sections: ServiceSectionConfig[];
}

export interface ServiceTypeConfig {
  value: string;
  label: string;
  description: string;
  icon: string;
  theme: string;
  steps: ServiceStepConfig[];
}
