-- ==============================================================================
-- TICKETA 2.0 — CANONICAL DATABASE SCHEMA & COMPLETE DDL
-- Target: Supabase PostgreSQL (PostgREST)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUM DEFINITIONS
-- ------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('ATTENDEE', 'ORGANIZER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ATTENDEE', 'ORGANIZER', 'STAFF', 'ADMIN');
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

-- ------------------------------------------------------------------------------
-- 2. CORE IDENTITY & ACCOUNT TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Account Types (Determines Portal Authority: ATTENDEE vs ORGANIZER vs ADMIN)
CREATE TABLE IF NOT EXISTS public.account_types (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type account_type NOT NULL DEFAULT 'ATTENDEE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Attendee Profiles (Dedicated Attendee Identity Store)
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

-- 2.3 Organizer Profiles (Dedicated Organizer Identity Store)
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

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATIONS, VENUES & CATEGORIES
-- ------------------------------------------------------------------------------

-- 3.1 Organizations
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

-- 3.2 Organization Members (Team Roles: OWNER, ADMIN, MANAGER, STAFF, MEMBER)
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

-- 3.3 Event Categories
CREATE TABLE IF NOT EXISTS public.event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Venues
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

-- ------------------------------------------------------------------------------
-- 4. EVENTS & TICKETING ARCHITECTURE
-- ------------------------------------------------------------------------------

-- 4.1 Canonical Events Table
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

-- 4.2 Event Staff Assignments (Event-Specific Scanner Access)
CREATE TABLE IF NOT EXISTS public.event_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.organizer_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, staff_user_id)
);

-- 4.3 Ticket Types
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

-- 4.4 Orders (Belongs to Attendee)
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

-- 4.5 Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.6 Payments
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

-- 4.7 Tickets (Issued Tickets Belong to Attendee)
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

-- 4.8 Ticket Holders
CREATE TABLE IF NOT EXISTS public.ticket_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. OPERATIONS, CHECK-INS & FINANCIALS
-- ------------------------------------------------------------------------------

-- 5.1 Check-Ins
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

-- 5.2 Payout Accounts
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

-- 5.3 Payouts
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

-- 5.4 Refunds
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

-- 5.5 Notifications
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

-- 5.6 Audit Logs
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

-- ------------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_account_types_user ON public.account_types(user_id);
CREATE INDEX IF NOT EXISTS idx_attendee_profiles_email ON public.attendee_profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_email ON public.organizer_profiles(email);
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
-- 7. ATOMIC SCANNER-VALIDATED CHECK-IN FUNCTION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_in_ticket(
    p_qr_hash TEXT,
    p_event_id UUID,
    p_scanned_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_scanner_org_role org_member_role;
    v_event_org_id UUID;
    v_is_assigned BOOLEAN := FALSE;
    v_ticket RECORD;
BEGIN
    -- 1. Get Event's Organization ID
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

    -- 2. Verify Scanner Authorization
    -- Check if scanner is organization OWNER, ADMIN, MANAGER, or STAFF
    SELECT om.role INTO v_scanner_org_role
    FROM public.organization_members om
    WHERE om.organization_id = v_event_org_id
      AND om.user_id = p_scanned_by;

    -- If not directly in organization_members, check if scanner is the organization creator
    IF v_scanner_org_role IS NULL THEN
        IF EXISTS (SELECT 1 FROM public.organizations WHERE id = v_event_org_id AND created_by = p_scanned_by) THEN
            v_scanner_org_role := 'OWNER';
        END IF;
    END IF;

    -- Authorization Evaluation
    IF v_scanner_org_role IS NULL THEN
        -- Scanner does not belong to the organization
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
        -- STAFF must be explicitly assigned to this specific event
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
    -- OWNER, ADMIN, MANAGER, and verified assigned STAFF proceed!

    -- 3. Atomic Lock & Validation
    SELECT * INTO v_ticket 
    FROM public.tickets
    WHERE (qr_code_hash = p_qr_hash OR ticket_code = p_qr_hash)
    FOR UPDATE;

    -- Ticket not found
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'INVALID_TICKET',
            'message', 'Ticket QR code was not found.'
        );
    END IF;

    -- Wrong event
    IF v_ticket.event_id <> p_event_id THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'WRONG_EVENT', 'Scanned at incorrect event');

        RETURN jsonb_build_object(
            'success', false,
            'status', 'WRONG_EVENT',
            'message', 'Ticket is not valid for this event.'
        );
    END IF;

    -- Invalid status (Cancelled or Refunded)
    IF v_ticket.status <> 'VALID' THEN
        INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
        VALUES (v_ticket.id, p_event_id, p_scanned_by, 'CANCELLED_TICKET', 'Ticket is ' || v_ticket.status::text);

        RETURN jsonb_build_object(
            'success', false,
            'status', 'CANCELLED_TICKET',
            'message', 'Ticket is ' || v_ticket.status::text || '.'
        );
    END IF;

    -- Already checked in
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

    -- 4. Valid check-in: Atomic update
    UPDATE public.tickets
    SET is_checked_in = TRUE,
        checked_in_at = NOW(),
        status = 'USED',
        updated_at = NOW()
    WHERE id = v_ticket.id;

    -- Record check-in log
    INSERT INTO public.check_ins(ticket_id, event_id, scanned_by, status, notes)
    VALUES (v_ticket.id, p_event_id, p_scanned_by, 'SUCCESS', 'Check-in successful');

    -- Record audit log
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

-- ------------------------------------------------------------------------------
-- 8. AUTOMATIC AUTH TRIGGER (ISOLATED PROFILES)
-- ------------------------------------------------------------------------------

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
        -- 1. Insert into account_types
        INSERT INTO public.account_types (user_id, account_type)
        VALUES (NEW.id, 'ORGANIZER'::public.account_type)
        ON CONFLICT (user_id) DO UPDATE SET
            account_type = 'ORGANIZER'::public.account_type,
            updated_at = NOW();

        -- 2. Insert into organizer_profiles
        INSERT INTO public.organizer_profiles (id, full_name, email, phone_number)
        VALUES (NEW.id, v_full_name, NEW.email, v_phone)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
    ELSE
        -- 1. Insert into account_types
        INSERT INTO public.account_types (user_id, account_type)
        VALUES (NEW.id, 'ATTENDEE'::public.account_type)
        ON CONFLICT (user_id) DO UPDATE SET
            account_type = 'ATTENDEE'::public.account_type,
            updated_at = NOW();

        -- 2. Insert into attendee_profiles
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

-- ------------------------------------------------------------------------------
-- 9. SECURITY DEFINER AUTHORIZATION HELPER FUNCTIONS (NON-RECURSIVE)
-- ------------------------------------------------------------------------------

-- Helper 1: Check organization membership (ANY role: OWNER, ADMIN, MANAGER, STAFF, MEMBER, or creator)
CREATE OR REPLACE FUNCTION public.is_org_member(
    p_organization_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        p_user_id IS NOT NULL 
        AND p_organization_id IS NOT NULL 
        AND (
            EXISTS (
                SELECT 1
                FROM public.organization_members om
                WHERE om.organization_id = p_organization_id
                  AND om.user_id = p_user_id
            ) OR EXISTS (
                SELECT 1
                FROM public.organizations o
                WHERE o.id = p_organization_id
                  AND o.created_by = p_user_id
            )
        )
    );
$$;

-- Helper 2: Check organization management permission (OWNER, ADMIN, MANAGER, or creator)
CREATE OR REPLACE FUNCTION public.is_org_manager(
    p_organization_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        p_user_id IS NOT NULL 
        AND p_organization_id IS NOT NULL 
        AND (
            EXISTS (
                SELECT 1
                FROM public.organization_members om
                WHERE om.organization_id = p_organization_id
                  AND om.user_id = p_user_id
                  AND om.role IN ('OWNER', 'ADMIN', 'MANAGER')
            ) OR EXISTS (
                SELECT 1
                FROM public.organizations o
                WHERE o.id = p_organization_id
                  AND o.created_by = p_user_id
            )
        )
    );
$$;

-- Helper 3: Check organization administrative ownership (OWNER, ADMIN, or creator)
CREATE OR REPLACE FUNCTION public.is_org_admin(
    p_organization_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        p_user_id IS NOT NULL 
        AND p_organization_id IS NOT NULL 
        AND (
            EXISTS (
                SELECT 1
                FROM public.organization_members om
                WHERE om.organization_id = p_organization_id
                  AND om.user_id = p_user_id
                  AND om.role IN ('OWNER', 'ADMIN')
            ) OR EXISTS (
                SELECT 1
                FROM public.organizations o
                WHERE o.id = p_organization_id
                  AND o.created_by = p_user_id
            )
        )
    );
$$;

-- Helper 4: Check event management authorization (event creator, or org OWNER/ADMIN/MANAGER)
CREATE OR REPLACE FUNCTION public.can_manage_event(
    p_event_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        p_user_id IS NOT NULL 
        AND p_event_id IS NOT NULL 
        AND EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = p_event_id
              AND (
                e.created_by = p_user_id
                OR public.is_org_manager(e.organization_id, p_user_id)
              )
        )
    );
$$;

-- Helper 5: Check event access authorization (event creator, org OWNER/ADMIN/MANAGER, or assigned STAFF)
CREATE OR REPLACE FUNCTION public.can_access_event(
    p_event_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        p_user_id IS NOT NULL 
        AND p_event_id IS NOT NULL 
        AND EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = p_event_id
              AND (
                e.created_by = p_user_id
                OR public.is_org_manager(e.organization_id, p_user_id)
                OR EXISTS (
                    SELECT 1
                    FROM public.event_staff_assignments esa
                    WHERE esa.event_id = p_event_id
                      AND esa.staff_user_id = p_user_id
                      AND public.is_org_member(e.organization_id, p_user_id)
                )
              )
        )
    );
$$;

-- Grant execution to authenticated, anon, and service_role
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_manager(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_event(UUID, UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_event(UUID, UUID) TO authenticated, anon, service_role;

-- ------------------------------------------------------------------------------
-- 10. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
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

-- 9.1 account_types
DROP POLICY IF EXISTS "Account types viewable by authenticated users" ON public.account_types;
CREATE POLICY "Account types viewable by authenticated users"
    ON public.account_types FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own account type" ON public.account_types;
CREATE POLICY "Users can insert their own account type"
    ON public.account_types FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own account type" ON public.account_types;
CREATE POLICY "Users can update their own account type"
    ON public.account_types FOR UPDATE USING (auth.uid() = user_id);

-- 9.2 attendee_profiles
DROP POLICY IF EXISTS "Attendees can view their own profile" ON public.attendee_profiles;
CREATE POLICY "Attendees can view their own profile"
    ON public.attendee_profiles FOR SELECT USING (auth.uid() = id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Attendees can insert their own profile" ON public.attendee_profiles;
CREATE POLICY "Attendees can insert their own profile"
    ON public.attendee_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Attendees can update their own profile" ON public.attendee_profiles;
CREATE POLICY "Attendees can update their own profile"
    ON public.attendee_profiles FOR UPDATE USING (auth.uid() = id);

-- 9.3 organizer_profiles
DROP POLICY IF EXISTS "Organizer profiles viewable by authenticated users" ON public.organizer_profiles;
CREATE POLICY "Organizer profiles viewable by authenticated users"
    ON public.organizer_profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Organizers can insert their own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can insert their own profile"
    ON public.organizer_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Organizers can update their own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can update their own profile"
    ON public.organizer_profiles FOR UPDATE USING (auth.uid() = id);

-- 9.4 organizations
DROP POLICY IF EXISTS "Organizations are viewable by anyone" ON public.organizations;
CREATE POLICY "Organizations are viewable by anyone"
    ON public.organizations FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Organizers can create organizations" ON public.organizations;
CREATE POLICY "Organizers can create organizations"
    ON public.organizations FOR INSERT WITH CHECK (
        auth.uid() = created_by AND EXISTS (
            SELECT 1 FROM public.account_types
            WHERE user_id = auth.uid() AND account_type IN ('ORGANIZER', 'ADMIN')
        )
    );

DROP POLICY IF EXISTS "Organizers can update their own organizations" ON public.organizations;
CREATE POLICY "Organizers can update their own organizations"
    ON public.organizations FOR UPDATE USING (
        created_by = auth.uid() OR public.is_org_admin(id, auth.uid())
    );

-- 10.5 organization_members (NON-RECURSIVE VIA SECURITY DEFINER HELPERS)
DROP POLICY IF EXISTS "Organization members are viewable by org team" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view co-members in their organization" ON public.organization_members;
CREATE POLICY "Organization members are viewable by org team"
    ON public.organization_members FOR SELECT USING (
        user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners and Admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and Admins can insert members" ON public.organization_members;
CREATE POLICY "Owners and Admins can insert members"
    ON public.organization_members FOR INSERT WITH CHECK (
        public.is_org_admin(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners and Admins can update members" ON public.organization_members;
CREATE POLICY "Owners and Admins can update members"
    ON public.organization_members FOR UPDATE USING (
        public.is_org_admin(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners and Admins can delete members" ON public.organization_members;
CREATE POLICY "Owners and Admins can delete members"
    ON public.organization_members FOR DELETE USING (
        public.is_org_admin(organization_id, auth.uid()) OR user_id = auth.uid()
    );

-- 9.6 event_categories & venues
DROP POLICY IF EXISTS "Event categories viewable by everyone" ON public.event_categories;
CREATE POLICY "Event categories viewable by everyone"
    ON public.event_categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Venues viewable by everyone" ON public.venues;
CREATE POLICY "Venues viewable by everyone"
    ON public.venues FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Organizers can create venues" ON public.venues;
CREATE POLICY "Organizers can create venues"
    ON public.venues FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Organizers can update their venues" ON public.venues;
CREATE POLICY "Organizers can update their venues"
    ON public.venues FOR UPDATE USING (
        public.is_org_manager(organization_id, auth.uid())
    );

-- 10.7 events
DROP POLICY IF EXISTS "Published events are publicly readable" ON public.events;
DROP POLICY IF EXISTS "Events viewable by public if published or org team" ON public.events;
CREATE POLICY "Events viewable by public if published or org team"
    ON public.events FOR SELECT USING (
        status = 'PUBLISHED'
        OR created_by = auth.uid()
        OR public.can_access_event(id, auth.uid())
    );

DROP POLICY IF EXISTS "Organizers can insert events for their organizations" ON public.events;
CREATE POLICY "Organizers can insert events for their organizations"
    ON public.events FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            created_by = auth.uid()
            OR public.is_org_manager(organization_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Organizers can update their organization events" ON public.events;
CREATE POLICY "Organizers can update their organization events"
    ON public.events FOR UPDATE USING (
        created_by = auth.uid()
        OR public.is_org_manager(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Organizers can delete their organization events" ON public.events;
CREATE POLICY "Organizers can delete their organization events"
    ON public.events FOR DELETE USING (
        created_by = auth.uid()
        OR public.is_org_admin(organization_id, auth.uid())
    );

-- 10.8 ticket_types
DROP POLICY IF EXISTS "Ticket types viewable by everyone" ON public.ticket_types;
CREATE POLICY "Ticket types viewable by everyone"
    ON public.ticket_types FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Organizers can manage ticket types" ON public.ticket_types;
CREATE POLICY "Organizers can manage ticket types"
    ON public.ticket_types FOR ALL USING (
        public.can_manage_event(event_id, auth.uid())
    ) WITH CHECK (
        public.can_manage_event(event_id, auth.uid())
    );

-- 10.9 event_staff_assignments
DROP POLICY IF EXISTS "Staff assignments viewable by org & staff" ON public.event_staff_assignments;
DROP POLICY IF EXISTS "Staff assignments viewable by org managers & assigned staff" ON public.event_staff_assignments;
CREATE POLICY "Staff assignments viewable by org managers & assigned staff"
    ON public.event_staff_assignments FOR SELECT USING (
        staff_user_id = auth.uid()
        OR public.can_manage_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Organizers can manage staff assignments" ON public.event_staff_assignments;
DROP POLICY IF EXISTS "Org managers can assign org members to events" ON public.event_staff_assignments;
CREATE POLICY "Org managers can assign org members to events"
    ON public.event_staff_assignments FOR INSERT WITH CHECK (
        public.can_manage_event(event_id, auth.uid())
        AND assigned_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = event_staff_assignments.event_id
              AND public.is_org_member(e.organization_id, event_staff_assignments.staff_user_id)
        )
    );

DROP POLICY IF EXISTS "Org managers can update staff assignments" ON public.event_staff_assignments;
CREATE POLICY "Org managers can update staff assignments"
    ON public.event_staff_assignments FOR UPDATE USING (
        public.can_manage_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Org managers can remove staff assignments" ON public.event_staff_assignments;
CREATE POLICY "Org managers can remove staff assignments"
    ON public.event_staff_assignments FOR DELETE USING (
        public.can_manage_event(event_id, auth.uid())
    );

-- 10.10 orders & order_items
DROP POLICY IF EXISTS "Attendees can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Organizers can view orders for their events" ON public.orders;
DROP POLICY IF EXISTS "Orders viewable by purchaser or event managers" ON public.orders;
CREATE POLICY "Orders viewable by purchaser or event managers"
    ON public.orders FOR SELECT USING (
        user_id = auth.uid()
        OR public.can_manage_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Attendees can create orders" ON public.orders;
CREATE POLICY "Attendees can create orders"
    ON public.orders FOR INSERT WITH CHECK (
        user_id = auth.uid() OR auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Attendees can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders updatable by purchaser or event managers" ON public.orders;
CREATE POLICY "Orders updatable by purchaser or event managers"
    ON public.orders FOR UPDATE USING (
        user_id = auth.uid()
        OR public.can_manage_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Order items viewable by order owner or organizer" ON public.order_items;
DROP POLICY IF EXISTS "Order items viewable by purchaser or event managers" ON public.order_items;
CREATE POLICY "Order items viewable by purchaser or event managers"
    ON public.order_items FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND (o.user_id = auth.uid() OR public.can_manage_event(o.event_id, auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Order items can be inserted with order" ON public.order_items;
DROP POLICY IF EXISTS "Order items insertable on checkout" ON public.order_items;
CREATE POLICY "Order items insertable on checkout"
    ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10.11 payments & refunds
DROP POLICY IF EXISTS "Payments viewable by order owner or organizer" ON public.payments;
DROP POLICY IF EXISTS "Payments viewable by order owner or event managers" ON public.payments;
CREATE POLICY "Payments viewable by order owner or event managers"
    ON public.payments FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
              AND (o.user_id = auth.uid() OR public.can_manage_event(o.event_id, auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Payments insertable on checkout" ON public.payments;
CREATE POLICY "Payments insertable on checkout"
    ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Refunds viewable by payment owner or event managers" ON public.refunds;
CREATE POLICY "Refunds viewable by payment owner or event managers"
    ON public.refunds FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            JOIN public.orders o ON o.id = p.order_id
            WHERE p.id = refunds.payment_id
              AND (o.user_id = auth.uid() OR public.can_manage_event(o.event_id, auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Refunds requestable by org managers" ON public.refunds;
CREATE POLICY "Refunds requestable by org managers"
    ON public.refunds FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.payments p
            JOIN public.orders o ON o.id = p.order_id
            WHERE p.id = refunds.payment_id
              AND public.can_manage_event(o.event_id, auth.uid())
        )
    );

-- 10.12 tickets & ticket_holders
DROP POLICY IF EXISTS "Attendees can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;
DROP POLICY IF EXISTS "Assigned staff can view tickets for their events" ON public.tickets;
DROP POLICY IF EXISTS "Tickets viewable by owner or authorized event staff" ON public.tickets;
CREATE POLICY "Tickets viewable by owner or authorized event staff"
    ON public.tickets FOR SELECT USING (
        user_id = auth.uid()
        OR public.can_access_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Attendees can insert tickets on order completion" ON public.tickets;
DROP POLICY IF EXISTS "Tickets insertable on order completion" ON public.tickets;
CREATE POLICY "Tickets insertable on order completion"
    ON public.tickets FOR INSERT WITH CHECK (
        user_id = auth.uid() OR auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Tickets updatable by owner or authorized event staff" ON public.tickets;
CREATE POLICY "Tickets updatable by owner or authorized event staff"
    ON public.tickets FOR UPDATE USING (
        user_id = auth.uid()
        OR public.can_access_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Ticket holders viewable by ticket owner or organizer" ON public.ticket_holders;
DROP POLICY IF EXISTS "Ticket holders viewable by ticket owner or event staff" ON public.ticket_holders;
CREATE POLICY "Ticket holders viewable by ticket owner or event staff"
    ON public.ticket_holders FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_holders.ticket_id
              AND (t.user_id = auth.uid() OR public.can_access_event(t.event_id, auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Ticket holders insertable on ticket generation" ON public.ticket_holders;
CREATE POLICY "Ticket holders insertable on ticket generation"
    ON public.ticket_holders FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10.13 check_ins
DROP POLICY IF EXISTS "Check-ins viewable by event organizers and staff" ON public.check_ins;
DROP POLICY IF EXISTS "Check-ins viewable by scanner or authorized event staff" ON public.check_ins;
CREATE POLICY "Check-ins viewable by scanner or authorized event staff"
    ON public.check_ins FOR SELECT USING (
        scanned_by = auth.uid()
        OR public.can_access_event(event_id, auth.uid())
    );

DROP POLICY IF EXISTS "Check-ins insertable by scanner or authorized event staff" ON public.check_ins;
CREATE POLICY "Check-ins insertable by scanner or authorized event staff"
    ON public.check_ins FOR INSERT WITH CHECK (
        scanned_by = auth.uid()
        OR public.can_access_event(event_id, auth.uid())
    );

-- 10.14 payout_accounts & payouts
DROP POLICY IF EXISTS "Payout accounts viewable by org owners & admins" ON public.payout_accounts;
DROP POLICY IF EXISTS "Payout accounts viewable by org admins" ON public.payout_accounts;
CREATE POLICY "Payout accounts viewable by org admins"
    ON public.payout_accounts FOR SELECT USING (
        public.is_org_admin(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners & admins can manage payout accounts" ON public.payout_accounts;
DROP POLICY IF EXISTS "Org admins can manage payout accounts" ON public.payout_accounts;
CREATE POLICY "Org admins can manage payout accounts"
    ON public.payout_accounts FOR ALL USING (
        public.is_org_admin(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Payouts viewable by org owners & admins" ON public.payouts;
DROP POLICY IF EXISTS "Payouts viewable by org admins" ON public.payouts;
CREATE POLICY "Payouts viewable by org admins"
    ON public.payouts FOR SELECT USING (
        public.is_org_admin(organization_id, auth.uid())
    );

DROP POLICY IF EXISTS "Owners & admins can request payouts" ON public.payouts;
DROP POLICY IF EXISTS "Org admins can request payouts" ON public.payouts;
CREATE POLICY "Org admins can request payouts"
    ON public.payouts FOR INSERT WITH CHECK (
        public.is_org_admin(organization_id, auth.uid())
    );

-- 10.15 notifications & audit_logs
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Audit logs viewable by organization team" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs viewable by actor or org managers" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by actor or org managers"
    ON public.audit_logs FOR SELECT USING (
        actor_id = auth.uid()
        OR (
            organization_id IS NOT NULL 
            AND public.is_org_manager(organization_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Audit logs insertable by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated users"
    ON public.audit_logs FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- ------------------------------------------------------------------------------
-- 11. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
