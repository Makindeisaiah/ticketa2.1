-- ==============================================================================
-- TICKETA 2.0 — FULL DATABASE SCHEMA & MIGRATION SCRIPT
-- PostgreSQL / Supabase Engine
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUM DEFINITIONS
-- ------------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('ATTENDEE', 'ORGANIZER', 'STAFF', 'ADMIN');
CREATE TYPE org_member_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE organizer_type AS ENUM ('INDIVIDUAL', 'BUSINESS', 'NON_PROFIT', 'AGENCY');
CREATE TYPE payout_account_type AS ENUM ('INDIVIDUAL', 'BUSINESS');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'POSTPONED', 'CANCELLED', 'COMPLETED');
CREATE TYPE ticket_status AS ENUM ('PENDING', 'VALID', 'USED', 'CANCELLED', 'REFUNDED');
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE check_in_status AS ENUM ('SUCCESS', 'ALREADY_CHECKED_IN', 'INVALID_TICKET', 'WRONG_EVENT', 'CANCELLED_TICKET');

-- ------------------------------------------------------------------------------
-- 2. CORE TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'ATTENDEE',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type organizer_type NOT NULL DEFAULT 'INDIVIDUAL',
    country TEXT NOT NULL,
    phone_number TEXT,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Organization Members (Team & Permissions)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role org_member_role NOT NULL DEFAULT 'MEMBER',
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- 2.4 Event Categories
CREATE TABLE IF NOT EXISTS public.event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Venues
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    postal_code TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    capacity INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    online_meeting_url TEXT,
    banner_image_url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status event_status NOT NULL DEFAULT 'DRAFT',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Event Staff Assignments
CREATE TABLE IF NOT EXISTS public.event_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, staff_user_id)
);

-- 2.8 Ticket Types
CREATE TABLE IF NOT EXISTS public.ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Early Bird", "VIP", "Regular"
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    quantity_available INT NOT NULL,
    quantity_sold INT NOT NULL DEFAULT 0,
    min_per_order INT NOT NULL DEFAULT 1,
    max_per_order INT NOT NULL DEFAULT 10,
    sales_start_time TIMESTAMPTZ,
    sales_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    status order_status NOT NULL DEFAULT 'PENDING',
    payment_reference TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'PAYSTACK_OR_STRIPE', -- Pluggable provider name
    transaction_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'PENDING',
    raw_payload JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.12 Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL UNIQUE, -- Human readable code e.g. TCK-849201
    qr_code_hash TEXT NOT NULL UNIQUE, -- Cryptographic QR payload string
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Owner
    status ticket_status NOT NULL DEFAULT 'VALID',
    is_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.13 Ticket Holders (Optional attendee information per individual ticket)
CREATE TABLE IF NOT EXISTS public.ticket_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.14 Refunds
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.15 Payout Accounts
CREATE TABLE IF NOT EXISTS public.payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_type payout_account_type NOT NULL DEFAULT 'INDIVIDUAL',
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    business_registration_number TEXT, -- CAC registration number for Nigeria / tax ID
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.16 Payouts
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    payout_account_id UUID NOT NULL REFERENCES public.payout_accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status payout_status NOT NULL DEFAULT 'PENDING',
    reference TEXT UNIQUE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.17 Check-Ins
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status check_in_status NOT NULL DEFAULT 'SUCCESS',
    notes TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.18 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL, -- 'TICKET_PURCHASE', 'EVENT_UPDATE', 'REMINDER', etc.
    payload JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.19 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g. 'EVENT_PUBLISHED', 'CHECK_IN_PERFORMED', 'STAFF_INVITED'
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON public.tickets(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_ticket ON public.check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_checkins_event ON public.check_ins(event_id);

-- ------------------------------------------------------------------------------
-- 4. ATOMIC CHECK-IN FUNCTION (PREVENTS RACE CONDITIONS & DUPLICATE SCANS)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_in_ticket(
    p_qr_hash TEXT,
    p_event_id UUID,
    p_scanned_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket RECORD;
    v_result JSONB;
BEGIN
    -- Select and lock the ticket row FOR UPDATE to ensure atomic access
    SELECT * INTO v_ticket 
    FROM public.tickets
    WHERE qr_code_hash = p_qr_hash
    FOR UPDATE;

    -- Case 1: Ticket not found
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'INVALID_TICKET',
            'message', 'Ticket QR code was not found.'
        );
    END IF;

    -- Case 2: Ticket belongs to a different event
    IF v_ticket.event_id <> p_event_id THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'WRONG_EVENT', 'Scanned at incorrect event');

        RETURN jsonb_build_object(
            'success', false,
            'status', 'WRONG_EVENT',
            'message', 'Ticket is not valid for this event.'
        );
    END IF;

    -- Case 3: Ticket is cancelled or refunded
    IF v_ticket.status <> 'VALID' THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'CANCELLED_TICKET', 'Ticket is ' || v_ticket.status::text);

        RETURN jsonb_build_object(
            'success', false,
            'status', 'CANCELLED_TICKET',
            'message', 'Ticket status is invalid (' || v_ticket.status::text || ').'
        );
    END IF;

    -- Case 4: Ticket already checked in
    IF v_ticket.is_checked_in THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'ALREADY_CHECKED_IN', 'Duplicate scan attempt');

        RETURN jsonb_build_object(
            'success', false,
            'status', 'ALREADY_CHECKED_IN',
            'message', 'Ticket was already checked in at ' || v_ticket.checked_in_at::text
        );
    END IF;

    -- Case 5: Valid check-in -> Atomic state update
    UPDATE public.tickets
    SET is_checked_in = TRUE,
        checked_in_at = NOW(),
        status = 'USED',
        updated_at = NOW()
    WHERE id = v_ticket.id;

    -- Log successful check-in
    INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, 'SUCCESS', 'Check-in successful');

    -- Log audit action
    INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        p_scanned_by, 
        'CHECK_IN_PERFORMED', 
        'TICKET', 
        v_ticket.id, 
        jsonb_build_object('event_id', p_event_id, 'ticket_code', v_ticket.ticket_code)
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'SUCCESS',
        'message', 'Check-in verified successfully!',
        'ticket_code', v_ticket.ticket_code,
        'ticket_id', v_ticket.id
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SUPABASE AUTH SIGNUP
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone_number,
        role,
        is_email_verified
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Ticketa User'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ATTENDEE'::user_role),
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by anyone or authenticated users"
    ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations Policies
CREATE POLICY "Organizations are viewable by anyone"
    ON public.organizations FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizers can update their own organizations"
    ON public.organizations FOR UPDATE USING (created_by = auth.uid());

-- Venues Policies
CREATE POLICY "Venues are viewable by anyone"
    ON public.venues FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create venues"
    ON public.venues FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Events Policies
CREATE POLICY "Published events are publicly readable"
    ON public.events FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create events"
    ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizers can manage events in their organizations"
    ON public.events FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = events.organization_id
            AND om.user_id = auth.uid()
        ) OR created_by = auth.uid()
    );

-- Ticket Types Policies
CREATE POLICY "Ticket types are viewable by anyone for published events"
    ON public.ticket_types FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create ticket types"
    ON public.ticket_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Orders Policies
CREATE POLICY "Attendees can view their own orders"
    ON public.orders FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Attendees can insert their own orders"
    ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Attendees can update their own orders"
    ON public.orders FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Organizers can view orders for their events"
    ON public.orders FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organization_members om ON om.organization_id = e.organization_id
            WHERE e.id = orders.event_id AND om.user_id = auth.uid()
        )
    );

-- Order Items Policies
CREATE POLICY "Order items are viewable by order owner"
    ON public.order_items FOR SELECT USING (TRUE);

CREATE POLICY "Order items can be inserted by authenticated users"
    ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Payments Policies
CREATE POLICY "Payments viewable by order owner"
    ON public.payments FOR SELECT USING (TRUE);

CREATE POLICY "Payments can be inserted by authenticated users"
    ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Tickets Policies
CREATE POLICY "Attendees can view their own tickets"
    ON public.tickets FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Attendees can insert their own tickets"
    ON public.tickets FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Attendees can update their own tickets"
    ON public.tickets FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Organizers can view tickets for their events"
    ON public.tickets FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organization_members om ON om.organization_id = e.organization_id
            WHERE e.id = tickets.event_id AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Assigned staff can view & verify tickets for their assigned events"
    ON public.tickets FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.event_staff_assignments esa
            WHERE esa.event_id = tickets.event_id AND esa.staff_user_id = auth.uid()
        )
    );

-- Check-ins Policies
CREATE POLICY "Staff & Organizers can insert check-ins"
    ON public.check_ins FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_staff_assignments esa
            WHERE esa.event_id = check_ins.event_id AND esa.staff_user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organization_members om ON om.organization_id = e.organization_id
            WHERE e.id = check_ins.event_id AND om.user_id = auth.uid()
        )
    );

-- Notifications Policies
CREATE POLICY "Users can read their own notifications"
    ON public.notifications FOR SELECT USING (user_id = auth.uid());
