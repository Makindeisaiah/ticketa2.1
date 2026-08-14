-- ==============================================================================
-- TICKETA 2.0 — ATTENDEE & ORGANIZER ARCHITECTURE RECONCILIATION MIGRATION
-- Migration: 20260814_attendee_organizer_isolation.sql
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('ATTENDEE', 'ORGANIZER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_member_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE organizer_type AS ENUM ('INDIVIDUAL', 'BUSINESS', 'NON_PROFIT', 'AGENCY');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_account_type AS ENUM ('INDIVIDUAL', 'BUSINESS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'POSTPONED', 'CANCELLED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('PENDING', 'VALID', 'USED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_type_status AS ENUM ('ACTIVE', 'PAUSED', 'SOLD_OUT', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE check_in_status AS ENUM ('SUCCESS', 'ALREADY_CHECKED_IN', 'INVALID_TICKET', 'WRONG_EVENT', 'CANCELLED_TICKET', 'UNAUTHORIZED_SCANNER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. CREATE ISOLATED IDENTITY & PROFILE TABLES
CREATE TABLE IF NOT EXISTS public.account_types (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type account_type NOT NULL DEFAULT 'ATTENDEE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendee_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    avatar_url TEXT,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organizer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    avatar_url TEXT,
    business_name TEXT,
    business_type organizer_type DEFAULT 'INDIVIDUAL',
    country TEXT DEFAULT 'NG',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MIGRATE DATA FROM LEGACY public.profiles IF PRESENT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Backfill Attendee Profiles
        INSERT INTO public.attendee_profiles (id, full_name, email, phone_number, avatar_url, is_email_verified, created_at, updated_at)
        SELECT p.id, p.full_name, p.email, p.phone_number, p.avatar_url, COALESCE(p.is_email_verified, FALSE), p.created_at, p.updated_at
        FROM public.profiles p
        WHERE p.role = 'ATTENDEE'
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            avatar_url = EXCLUDED.avatar_url,
            is_email_verified = EXCLUDED.is_email_verified,
            updated_at = NOW();

        -- Backfill Organizer Profiles
        INSERT INTO public.organizer_profiles (id, full_name, email, phone_number, avatar_url, created_at, updated_at)
        SELECT p.id, p.full_name, p.email, p.phone_number, p.avatar_url, p.created_at, p.updated_at
        FROM public.profiles p
        WHERE p.role IN ('ORGANIZER', 'STAFF', 'ADMIN')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW();

        -- Backfill account_types
        INSERT INTO public.account_types (user_id, account_type, created_at, updated_at)
        SELECT p.id,
            CASE 
                WHEN p.role = 'ADMIN' THEN 'ADMIN'::public.account_type
                WHEN p.role IN ('ORGANIZER', 'STAFF') THEN 'ORGANIZER'::public.account_type
                ELSE 'ATTENDEE'::public.account_type
            END,
            p.created_at,
            p.updated_at
        FROM public.profiles p
        ON CONFLICT (user_id) DO UPDATE SET
            account_type = EXCLUDED.account_type,
            updated_at = NOW();
    END IF;
END $$;

-- 4. CREATE TABLES WITH ISOLATED REFERENCES
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type organizer_type NOT NULL DEFAULT 'INDIVIDUAL',
    country TEXT NOT NULL DEFAULT 'NG',
    currency TEXT NOT NULL DEFAULT 'NGN',
    phone_number TEXT,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    bank_name TEXT,
    bank_code TEXT,
    account_number TEXT,
    account_name TEXT,
    recipient_code TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
    role org_member_role NOT NULL DEFAULT 'MEMBER',
    invited_by UUID REFERENCES public.organizer_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL DEFAULT 'NG',
    postal_code TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    capacity INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE RESTRICT,
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
    platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    platform_fee_fixed NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fee_bearer TEXT NOT NULL DEFAULT 'ORGANIZER',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.organizer_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, staff_user_id)
);

CREATE TABLE IF NOT EXISTS public.ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NGN',
    quantity_available INT NOT NULL,
    quantity_sold INT NOT NULL DEFAULT 0,
    min_per_order INT NOT NULL DEFAULT 1,
    max_per_order INT NOT NULL DEFAULT 10,
    sales_start_time TIMESTAMPTZ,
    sales_end_time TIMESTAMPTZ,
    status ticket_type_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.attendee_profiles(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status order_status NOT NULL DEFAULT 'PENDING',
    payment_reference TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'PAYSTACK',
    transaction_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status payment_status NOT NULL DEFAULT 'PENDING',
    payment_method TEXT,
    raw_payload JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL UNIQUE,
    qr_code_hash TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.attendee_profiles(id) ON DELETE RESTRICT,
    attendee_name TEXT,
    attendee_email TEXT,
    status ticket_status NOT NULL DEFAULT 'VALID',
    is_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE RESTRICT,
    status check_in_status NOT NULL DEFAULT 'SUCCESS',
    device_info TEXT,
    notes TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_type payout_account_type NOT NULL DEFAULT 'INDIVIDUAL',
    account_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    business_registration_number TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    payout_account_id UUID REFERENCES public.payout_accounts(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status payout_status NOT NULL DEFAULT 'PENDING',
    reference TEXT UNIQUE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT,
    requested_by UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    payload JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.organizer_profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ATOMIC CHECK-IN FUNCTION
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
    v_scanner_org_role org_member_role;
    v_event_org_id UUID;
    v_is_assigned BOOLEAN := FALSE;
    v_ticket RECORD;
BEGIN
    SELECT organization_id INTO v_event_org_id
    FROM public.events
    WHERE id = p_event_id;

    IF v_event_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'INVALID_TICKET',
            'message', 'Target event does not exist.'
        );
    END IF;

    SELECT om.role INTO v_scanner_org_role
    FROM public.organization_members om
    WHERE om.organization_id = v_event_org_id
      AND om.user_id = p_scanned_by;

    IF v_scanner_org_role IS NULL THEN
        IF EXISTS (SELECT 1 FROM public.organizations WHERE id = v_event_org_id AND created_by = p_scanned_by) THEN
            v_scanner_org_role := 'OWNER';
        END IF;
    END IF;

    IF v_scanner_org_role IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'UNAUTHORIZED_SCANNER',
            'message', 'You do not have permission to scan tickets for this event.'
        );
    ELSIF v_scanner_org_role = 'MEMBER' THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'UNAUTHORIZED_SCANNER',
            'message', 'Members cannot scan tickets. Staff or Manager role required.'
        );
    ELSIF v_scanner_org_role = 'STAFF' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.event_staff_assignments
            WHERE event_id = p_event_id AND staff_user_id = p_scanned_by
        ) INTO v_is_assigned;

        IF NOT v_is_assigned THEN
            RETURN jsonb_build_object(
                'success', false,
                'status', 'UNAUTHORIZED_SCANNER',
                'message', 'Staff member is not assigned to scan this event.'
            );
        END IF;
    END IF;

    SELECT * INTO v_ticket 
    FROM public.tickets
    WHERE (qr_code_hash = p_qr_hash OR ticket_code = p_qr_hash)
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'INVALID_TICKET',
            'message', 'Ticket QR code was not found.'
        );
    END IF;

    IF v_ticket.event_id <> p_event_id THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'WRONG_EVENT', 'Scanned at incorrect event');

        RETURN jsonb_build_object(
            'success', false,
            'status', 'WRONG_EVENT',
            'message', 'Ticket is not valid for this event.'
        );
    END IF;

    IF v_ticket.status <> 'VALID' THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'CANCELLED_TICKET', 'Ticket is ' || v_ticket.status::text);

        RETURN jsonb_build_object(
            'success', false,
            'status', 'CANCELLED_TICKET',
            'message', 'Ticket is ' || v_ticket.status::text || '.'
        );
    END IF;

    IF v_ticket.is_checked_in THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'ALREADY_CHECKED_IN', 'Duplicate scan attempt');

        RETURN jsonb_build_object(
            'success', false,
            'status', 'ALREADY_CHECKED_IN',
            'message', 'Ticket was already checked in at ' || v_ticket.checked_in_at::text,
            'ticket_code', v_ticket.ticket_code
        );
    END IF;

    UPDATE public.tickets
    SET is_checked_in = TRUE,
        checked_in_at = NOW(),
        status = 'USED',
        updated_at = NOW()
    WHERE id = v_ticket.id;

    INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, 'SUCCESS', 'Check-in successful');

    INSERT INTO public.audit_logs(actor_id, organization_id, action, entity_type, entity_id, metadata)
    VALUES (
        p_scanned_by, 
        v_event_org_id,
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

-- 6. AUTH TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_type TEXT;
    v_full_name TEXT;
    v_phone TEXT;
BEGIN
    v_account_type := COALESCE(
        NEW.raw_user_meta_data->>'account_type',
        NEW.raw_user_meta_data->>'role',
        'ATTENDEE'
    );
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Ticketa User');
    v_phone := NEW.raw_user_meta_data->>'phone_number';

    IF UPPER(v_account_type) IN ('ORGANIZER', 'ADMIN') THEN
        INSERT INTO public.account_types (user_id, account_type)
        VALUES (NEW.id, 'ORGANIZER'::public.account_type)
        ON CONFLICT (user_id) DO UPDATE SET
            account_type = 'ORGANIZER'::public.account_type,
            updated_at = NOW();

        INSERT INTO public.organizer_profiles (id, full_name, email, phone_number)
        VALUES (NEW.id, v_full_name, NEW.email, v_phone)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
    ELSE
        INSERT INTO public.account_types (user_id, account_type)
        VALUES (NEW.id, 'ATTENDEE'::public.account_type)
        ON CONFLICT (user_id) DO UPDATE SET
            account_type = 'ATTENDEE'::public.account_type,
            updated_at = NOW();

        INSERT INTO public.attendee_profiles (id, full_name, email, phone_number, is_email_verified)
        VALUES (NEW.id, v_full_name, NEW.email, v_phone, FALSE)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.event_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
