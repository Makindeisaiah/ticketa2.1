-- ==============================================================================
-- TICKETA 2.0 — ATTENDEE & ORGANIZER DATA ISOLATION MIGRATION
-- Migration: 20260814_attendee_organizer_isolation.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ACCOUNT TYPE ENUM & TABLE
-- ------------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE public.account_type AS ENUM ('ATTENDEE', 'ORGANIZER', 'ADMIN');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.account_types (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type public.account_type NOT NULL DEFAULT 'ATTENDEE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. ATTENDEE PROFILES TABLE
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- 3. ORGANIZER PROFILES TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_account_types_type ON public.account_types(account_type);
CREATE INDEX IF NOT EXISTS idx_attendee_profiles_email ON public.attendee_profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_email ON public.organizer_profiles(email);

-- ------------------------------------------------------------------------------
-- 5. DATA MIGRATION FROM public.profiles (PRESERVES EXISTING DATA)
-- ------------------------------------------------------------------------------

DO $$
BEGIN
    -- Only migrate if public.profiles exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN

        -- 5.1 Migrate Attendee records
        INSERT INTO public.attendee_profiles (
            id,
            full_name,
            email,
            phone_number,
            avatar_url,
            is_email_verified,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            p.full_name,
            p.email,
            p.phone_number,
            p.avatar_url,
            COALESCE(p.is_email_verified, FALSE),
            p.created_at,
            p.updated_at
        FROM public.profiles p
        WHERE p.role = 'ATTENDEE'
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            avatar_url = EXCLUDED.avatar_url,
            is_email_verified = EXCLUDED.is_email_verified,
            updated_at = NOW();

        -- 5.2 Migrate Organizer & Admin records
        INSERT INTO public.organizer_profiles (
            id,
            full_name,
            email,
            phone_number,
            avatar_url,
            created_at,
            updated_at
        )
        SELECT
            p.id,
            p.full_name,
            p.email,
            p.phone_number,
            p.avatar_url,
            p.created_at,
            p.updated_at
        FROM public.profiles p
        WHERE p.role IN ('ORGANIZER', 'STAFF', 'ADMIN')
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW();

        -- 5.3 Migrate account_types mapping
        INSERT INTO public.account_types (
            user_id,
            account_type,
            created_at,
            updated_at
        )
        SELECT
            p.id,
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

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC AUTH TRIGGER FUNCTION (UPDATED FOR SEPARATE PROFILES)
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
        -- Insert into account_types
        INSERT INTO public.account_types (user_id, account_type)
        VALUES (NEW.id, 'ORGANIZER'::public.account_type)
        ON CONFLICT (user_id) DO NOTHING;

        -- Insert into organizer_profiles
        INSERT INTO public.organizer_profiles (id, full_name, email, phone_number)
        VALUES (NEW.id, v_full_name, NEW.email, v_phone)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();

        -- Keep public.profiles in sync for backward compatibility
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            INSERT INTO public.profiles (id, full_name, email, phone_number, role, is_email_verified)
            VALUES (NEW.id, v_full_name, NEW.email, v_phone, 'ORGANIZER', FALSE)
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'ORGANIZER', updated_at = NOW();
        END IF;

    ELSE
        -- Default: Attendee
        INSERT INTO public.account_types (user_id, account_type)
        VALUES (NEW.id, 'ATTENDEE'::public.account_type)
        ON CONFLICT (user_id) DO NOTHING;

        -- Insert into attendee_profiles
        INSERT INTO public.attendee_profiles (id, full_name, email, phone_number, is_email_verified)
        VALUES (NEW.id, v_full_name, NEW.email, v_phone, FALSE)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();

        -- Keep public.profiles in sync for backward compatibility
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            INSERT INTO public.profiles (id, full_name, email, phone_number, role, is_email_verified)
            VALUES (NEW.id, v_full_name, NEW.email, v_phone, 'ATTENDEE', FALSE)
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'ATTENDEE', updated_at = NOW();
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

-- 7.1 account_types policies
DROP POLICY IF EXISTS "Account types viewable by authenticated users" ON public.account_types;
CREATE POLICY "Account types viewable by authenticated users"
    ON public.account_types FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own account type" ON public.account_types;
CREATE POLICY "Users can insert their own account type"
    ON public.account_types FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own account type" ON public.account_types;
CREATE POLICY "Users can update their own account type"
    ON public.account_types FOR UPDATE USING (auth.uid() = user_id);

-- 7.2 attendee_profiles policies
DROP POLICY IF EXISTS "Attendees can view their own profile" ON public.attendee_profiles;
CREATE POLICY "Attendees can view their own profile"
    ON public.attendee_profiles FOR SELECT USING (auth.uid() = id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Attendees can insert their own profile" ON public.attendee_profiles;
CREATE POLICY "Attendees can insert their own profile"
    ON public.attendee_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Attendees can update their own profile" ON public.attendee_profiles;
CREATE POLICY "Attendees can update their own profile"
    ON public.attendee_profiles FOR UPDATE USING (auth.uid() = id);

-- 7.3 organizer_profiles policies
DROP POLICY IF EXISTS "Organizer profiles viewable by authenticated users" ON public.organizer_profiles;
CREATE POLICY "Organizer profiles viewable by authenticated users"
    ON public.organizer_profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Organizers can insert their own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can insert their own profile"
    ON public.organizer_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Organizers can update their own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can update their own profile"
    ON public.organizer_profiles FOR UPDATE USING (auth.uid() = id);
