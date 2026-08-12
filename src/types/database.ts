export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'ATTENDEE' | 'ORGANIZER' | 'STAFF' | 'ADMIN';
export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type OrganizerType = 'INDIVIDUAL' | 'BUSINESS' | 'NON_PROFIT' | 'AGENCY';
export type PayoutAccountType = 'INDIVIDUAL' | 'BUSINESS';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'POSTPONED' | 'CANCELLED' | 'COMPLETED';
export type TicketStatus = 'PENDING' | 'VALID' | 'USED' | 'CANCELLED' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
export type CheckInStatus = 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'INVALID_TICKET' | 'WRONG_EVENT' | 'CANCELLED_TICKET';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizerType;
  country: string;
  phone_number?: string | null;
  logo_url?: string | null;
  description?: string | null;
  website?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  invited_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon_name?: string | null;
  created_at: string;
}

export interface Venue {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description?: string | null;
  category_id?: string | null;
  venue_id?: string | null;
  is_online: boolean;
  online_meeting_url?: string | null;
  banner_image_url?: string | null;
  start_time: string;
  end_time: string;
  status: EventStatus;
  is_featured: boolean;
  published_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  quantity_available: number;
  quantity_sold: number;
  min_per_order: number;
  max_per_order: number;
  sales_start_time?: string | null;
  sales_end_time?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  event_id: string;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  payment_reference?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_code: string;
  qr_code_hash: string;
  order_id: string;
  event_id: string;
  ticket_type_id: string;
  user_id: string;
  status: TicketStatus;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  ticket_id: string;
  event_id: string;
  scanned_by: string;
  status: CheckInStatus;
  notes?: string | null;
  scanned_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  organization_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Json | null;
  created_at: string;
}
