export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
export type UserRole = 'ATTENDEE' | 'ORGANIZER' | 'STAFF' | 'ADMIN';
export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'MEMBER';
export type OrganizerType = 'INDIVIDUAL' | 'BUSINESS' | 'NON_PROFIT' | 'AGENCY';
export type PayoutAccountType = 'INDIVIDUAL' | 'BUSINESS';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'POSTPONED' | 'CANCELLED' | 'COMPLETED';
export type TicketStatus = 'PENDING' | 'VALID' | 'USED' | 'CANCELLED' | 'REFUNDED';
export type TicketTypeStatus = 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'HIDDEN';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
export type CheckInStatus =
  | 'SUCCESS'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_TICKET'
  | 'WRONG_EVENT'
  | 'CANCELLED_TICKET'
  | 'UNAUTHORIZED_SCANNER';

export interface AccountTypeRecord {
  user_id: string;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface AttendeeProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizerProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  business_name?: string | null;
  business_type?: OrganizerType;
  country?: string;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

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
  slug?: string;
  type: OrganizerType;
  country: string;
  currency?: string;
  phone_number?: string | null;
  logo_url?: string | null;
  description?: string | null;
  website?: string | null;
  bank_name?: string | null;
  bank_code?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  recipient_code?: string | null;
  is_verified?: boolean;
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
  profiles?: Partial<OrganizerProfile>;
}

export interface EventStaffAssignment {
  id: string;
  event_id: string;
  staff_user_id: string;
  assigned_by?: string | null;
  created_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_name?: string | null;
  created_at: string;
}

export interface Venue {
  id: string;
  organization_id?: string | null;
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
  platform_fee_percent?: number;
  platform_fee_fixed?: number;
  fee_bearer?: string;
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
  min_per_order?: number;
  max_per_order?: number;
  sales_start_time?: string | null;
  sales_end_time?: string | null;
  status?: TicketTypeStatus;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  event_id: string;
  subtotal_amount?: number;
  discount_amount?: number;
  platform_fee?: number;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  payment_reference?: string | null;
  idempotency_key?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  transaction_reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string | null;
  raw_payload?: Json | null;
  verified_at?: string | null;
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
  attendee_name?: string | null;
  attendee_email?: string | null;
  status: TicketStatus;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketHolder {
  id: string;
  ticket_id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  ticket_id: string;
  event_id: string;
  scanned_by: string;
  status: CheckInStatus;
  device_info?: string | null;
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

export interface PayoutAccount {
  id: string;
  organization_id: string;
  account_type: PayoutAccountType;
  account_holder_name: string;
  bank_name: string;
  bank_code?: string | null;
  account_number: string;
  business_registration_number?: string | null;
  is_verified: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  organization_id: string;
  payout_account_id?: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  reference?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  reason?: string | null;
  requested_by: string;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  payload?: Json | null;
  is_read: boolean;
  created_at: string;
}
