-- ==============================================================================
-- TICKETA 2.0 — DATABASE RLS SECURITY REPAIR & RECURSION ELIMINATION
-- Migration: 20260815_fix_rls_recursion.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER AUTHORIZATION HELPER FUNCTIONS (NON-RECURSIVE)
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
-- 2. REPAIR ATOMIC CHECK-IN FUNCTION
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
-- 3. REPAIR ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- 3.1 public.organizations
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

-- 3.2 public.organization_members (NON-RECURSIVE VIA SECURITY DEFINER HELPERS)
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

-- 3.3 public.events
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

-- 3.4 public.venues
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

-- 3.5 public.ticket_types
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

-- 3.6 public.event_staff_assignments
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

-- 3.7 public.orders & order_items
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

-- 3.8 public.payments & refunds
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

-- 3.9 public.tickets & ticket_holders
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

-- 3.10 public.check_ins
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

-- 3.11 public.payout_accounts & payouts
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

-- 3.12 public.audit_logs
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
-- 4. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
