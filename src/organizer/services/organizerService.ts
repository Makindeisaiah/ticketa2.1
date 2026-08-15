import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Organization,
  OrganizationMember,
  Event,
  TicketType,
  Venue,
  EventCategory,
  Order,
  Ticket,
  PayoutAccount,
  Payout,
  AuditLog,
  OrganizerType,
  OrgMemberRole,
  EventStatus,
} from '../../types/database';

export interface CreateOrganizationInput {
  name: string;
  type: OrganizerType;
  country: string;
  phone_number?: string;
  description?: string;
  website?: string;
  logo_url?: string;
}

export interface CreateEventInput {
  title: string;
  slug: string;
  description?: string;
  category_id?: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
  is_online?: boolean;
  online_meeting_url?: string;
  banner_image_url?: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  ticket_types: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    quantity_available: number;
    min_per_order?: number;
    max_per_order?: number;
  }[];
}

export interface PayoutAccountInput {
  account_type: 'INDIVIDUAL' | 'BUSINESS';
  account_holder_name: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  business_registration_number?: string;
}

export function isValidUUID(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

// 1. Get User Organizations
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  if (!userId || !isValidUUID(userId)) return [];

  // Clean up any stale invalid localStorage entries from past sessions
  try {
    const localKey = `organizer_local_orgs_${userId}`;
    localStorage.removeItem(localKey);
  } catch (e) {
    // ignore
  }

  let dbOrgs: Organization[] = [];
  if (isSupabaseConfigured) {
    try {
      const { data: createdOrgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', userId);

      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', userId);

      const memberOrgs = (memberRows || [])
        .map((row: any) => row.organizations)
        .filter((o: any) => o && isValidUUID(o.id));

      const allOrgsMap = new Map<string, Organization>();
      (createdOrgs || []).forEach((org: Organization) => {
        if (org && org.id && isValidUUID(org.id)) allOrgsMap.set(org.id, org);
      });
      memberOrgs.forEach((org: Organization) => {
        if (org && org.id && isValidUUID(org.id)) allOrgsMap.set(org.id, org);
      });

      dbOrgs = Array.from(allOrgsMap.values());

      // If no organization found in database, auto-provision real organization in public.organizations
      if (dbOrgs.length === 0) {
        const { data: newOrg, error: newOrgErr } = await supabase
          .from('organizations')
          .insert({
            name: 'My Organization',
            type: 'AGENCY',
            country: 'Nigeria',
            created_by: userId,
          })
          .select()
          .single();

        if (!newOrgErr && newOrg && isValidUUID(newOrg.id)) {
          dbOrgs = [newOrg as Organization];

          await supabase.from('organization_members').insert({
            organization_id: newOrg.id,
            user_id: userId,
            role: 'OWNER',
          });

          await supabase.from('account_types').upsert({
            user_id: userId,
            account_type: 'ORGANIZER',
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn('Error fetching user organizations from database:', e);
    }
  }

  return dbOrgs.filter((o) => o && isValidUUID(o.id));
}

// 2. Create Organization
export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput
): Promise<{ success: boolean; organization?: Organization; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Database is not configured.' };
  }

  if (!userId || !isValidUUID(userId)) {
    return { success: false, error: 'Valid user ID is required.' };
  }

  try {
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: input.name?.trim() || 'My Organization',
        type: input.type || 'AGENCY',
        country: input.country || 'Nigeria',
        phone_number: input.phone_number || null,
        description: input.description || null,
        website: input.website || null,
        logo_url: input.logo_url || null,
        created_by: userId,
      })
      .select()
      .single();

    if (orgErr || !org || !isValidUUID(org.id)) {
      console.error('Failed to insert organization in database:', orgErr);
      return { success: false, error: orgErr?.message || 'Failed to create organization in database.' };
    }

    try {
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'OWNER',
      });
    } catch (e) {
      console.warn('Failed to create member row:', e);
    }

    try {
      await supabase.from('account_types').upsert({
        user_id: userId,
        account_type: 'ORGANIZER',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to update account_type:', e);
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_id: userId,
        organization_id: org.id,
        action: 'ORGANIZATION_CREATED',
        entity_type: 'ORGANIZATION',
        entity_id: org.id,
        metadata: { name: org.name, type: org.type },
      });
    } catch (e) {
      // ignore
    }

    return { success: true, organization: org as Organization };
  } catch (e: any) {
    console.error('Create organization exception:', e);
    return { success: false, error: e.message || 'Error creating organization' };
  }
}

// 3. Get Organization Metrics
export async function getOrganizationMetrics(orgId: string) {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) {
    return {
      totalRevenue: 0,
      ticketsSold: 0,
      totalEvents: 0,
      activeEvents: 0,
      totalCheckedIn: 0,
    };
  }

  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, status')
      .eq('organization_id', orgId);

    const eventIds = (events || []).map((e) => e.id);
    const totalEvents = events?.length || 0;
    const activeEvents = events?.filter((e) => e.status === 'PUBLISHED').length || 0;

    if (eventIds.length === 0) {
      return {
        totalRevenue: 0,
        ticketsSold: 0,
        totalEvents: 0,
        activeEvents: 0,
        totalCheckedIn: 0,
      };
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status')
      .in('event_id', eventIds);

    const paidOrders = (orders || []).filter((o) => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, is_checked_in, status')
      .in('event_id', eventIds);

    const validTickets = (tickets || []).filter((t) => t.status === 'VALID' || t.status === 'USED');
    const ticketsSold = validTickets.length;
    const totalCheckedIn = (tickets || []).filter((t) => t.is_checked_in).length;

    return {
      totalRevenue,
      ticketsSold,
      totalEvents,
      activeEvents,
      totalCheckedIn,
    };
  } catch (e) {
    console.error('Error calculating metrics:', e);
    return {
      totalRevenue: 0,
      ticketsSold: 0,
      totalEvents: 0,
      activeEvents: 0,
      totalCheckedIn: 0,
    };
  }
}

// 4. Get Organization Events
export async function getOrganizationEvents(orgId: string): Promise<any[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venues (*),
        event_categories (*),
        ticket_types (*)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org events:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Org events exception:', e);
    return [];
  }
}

// 5. Create Event
export async function createOrganizerEvent(
  orgId: string,
  userId: string,
  input: CreateEventInput
): Promise<{ success: boolean; event?: any; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  if (!orgId || !isValidUUID(orgId) || !userId || !isValidUUID(userId)) {
    return { success: false, error: 'Valid organization ID and user ID are required.' };
  }

  try {
    let venueId: string | null = null;

    if (!input.is_online && input.venue_name) {
      const { data: venue } = await supabase
        .from('venues')
        .insert({
          organization_id: orgId,
          name: input.venue_name,
          address: input.venue_address || input.venue_name,
          city: input.venue_city || 'Lagos',
          country: input.venue_country || 'Nigeria',
        })
        .select()
        .single();

      if (venue) {
        venueId = venue.id;
      }
    }

    const { data: event, error: eventErr } = await supabase
      .from('events')
      .insert({
        organization_id: orgId,
        title: input.title,
        slug: input.slug,
        description: input.description || null,
        category_id: input.category_id || null,
        venue_id: venueId,
        is_online: input.is_online || false,
        online_meeting_url: input.online_meeting_url || null,
        banner_image_url:
          input.banner_image_url ||
          'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
        start_time: input.start_time,
        end_time: input.end_time,
        status: input.status,
        published_at: input.status === 'PUBLISHED' ? new Date().toISOString() : null,
        created_by: userId,
      })
      .select()
      .single();

    if (eventErr || !event) {
      console.error('Event insert error:', eventErr);
      return { success: false, error: eventErr?.message || 'Failed to create event.' };
    }

    if (input.ticket_types && input.ticket_types.length > 0) {
      const ticketTypeRows = input.ticket_types.map((tt) => ({
        event_id: event.id,
        name: tt.name,
        description: tt.description || null,
        price: tt.price,
        currency: tt.currency || 'NGN',
        quantity_available: tt.quantity_available,
        min_per_order: tt.min_per_order || 1,
        max_per_order: tt.max_per_order || 10,
      }));

      await supabase.from('ticket_types').insert(ticketTypeRows);
    }

    await supabase.from('audit_logs').insert({
      actor_id: userId,
      organization_id: orgId,
      action: input.status === 'PUBLISHED' ? 'EVENT_PUBLISHED' : 'EVENT_CREATED',
      entity_type: 'EVENT',
      entity_id: event.id,
      metadata: { title: event.title, status: event.status },
    });

    return { success: true, event };
  } catch (e: any) {
    console.error('Create event exception:', e);
    return { success: false, error: e.message || 'Unexpected error' };
  }
}

// 6. Update Event Status
export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
  userId: string,
  orgId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !isValidUUID(eventId) || !isValidUUID(orgId) || !isValidUUID(userId)) return false;

  try {
    const { error } = await supabase
      .from('events')
      .update({
        status,
        published_at: status === 'PUBLISHED' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      console.error('Failed to update event status:', error);
      return false;
    }

    await supabase.from('audit_logs').insert({
      actor_id: userId,
      organization_id: orgId,
      action: `EVENT_STATUS_UPDATED_TO_${status}`,
      entity_type: 'EVENT',
      entity_id: eventId,
    });

    return true;
  } catch (e) {
    console.error('Update event status exception:', e);
    return false;
  }
}

// 7. Get Organization Orders
export async function getOrganizationOrders(orgId: string): Promise<any[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, title')
      .eq('organization_id', orgId);

    if (!events || events.length === 0) return [];

    const eventMap = new Map(events.map((e) => [e.id, e.title]));
    const eventIds = Array.from(eventMap.keys());

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        attendee_profiles:user_id (full_name, email, phone_number),
        order_items (*)
      `)
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org orders:', error);
      return [];
    }

    return (orders || []).map((o: any) => ({
      ...o,
      event_title: eventMap.get(o.event_id) || 'Event',
      customer_name: o.attendee_profiles?.full_name || o.customer_name || 'Attendee',
      customer_email: o.attendee_profiles?.email || o.customer_email || 'N/A',
    }));
  } catch (e) {
    console.error('Org orders exception:', e);
    return [];
  }
}

// 8. Get Organization Attendees / Tickets
export async function getOrganizationAttendees(orgId: string): Promise<any[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, title')
      .eq('organization_id', orgId);

    if (!events || events.length === 0) return [];

    const eventMap = new Map(events.map((e) => [e.id, e.title]));
    const eventIds = Array.from(eventMap.keys());

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        attendee_profiles:user_id (full_name, email),
        ticket_types (name, price)
      `)
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org tickets:', error);
      return [];
    }

    return (tickets || []).map((t: any) => ({
      ...t,
      event_title: eventMap.get(t.event_id) || 'Event',
      attendee_name: t.attendee_name || t.attendee_profiles?.full_name || 'Attendee',
      attendee_email: t.attendee_email || t.attendee_profiles?.email || 'N/A',
      ticket_type_name: t.ticket_types?.name || 'Standard',
      price: t.ticket_types?.price || 0,
    }));
  } catch (e) {
    console.error('Org attendees exception:', e);
    return [];
  }
}

// 9. Atomic QR Code Check-In
export async function checkInTicket(
  codeOrHash: string,
  eventId: string,
  scannedByUserId: string
): Promise<{ success: boolean; status: string; message: string; ticket_code?: string }> {
  if (!isSupabaseConfigured || !codeOrHash) {
    return {
      success: false,
      status: 'UNCONFIGURED',
      message: 'Supabase database is not configured or code is missing.',
    };
  }

  const cleanCode = codeOrHash.trim();

  try {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('check_in_ticket', {
      p_qr_hash: cleanCode,
      p_event_id: eventId,
      p_scanned_by: scannedByUserId,
    });

    if (!rpcErr && rpcRes) {
      return rpcRes;
    }

    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('*')
      .or(`ticket_code.eq.${cleanCode},qr_code_hash.eq.${cleanCode}`)
      .single();

    if (ticketErr || !ticket) {
      return {
        success: false,
        status: 'INVALID_TICKET',
        message: 'No valid ticket found matching code or QR payload.',
      };
    }

    if (eventId && ticket.event_id !== eventId) {
      await supabase.from('check_ins').insert({
        ticket_id: ticket.id,
        event_id: eventId,
        scanned_by: scannedByUserId,
        status: 'WRONG_EVENT',
        notes: 'Ticket belongs to another event',
      });
      return {
        success: false,
        status: 'WRONG_EVENT',
        message: 'Ticket is registered for a different event!',
      };
    }

    if (ticket.is_checked_in) {
      await supabase.from('check_ins').insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        scanned_by: scannedByUserId,
        status: 'ALREADY_CHECKED_IN',
        notes: 'Duplicate check-in attempt',
      });
      return {
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}.`,
        ticket_code: ticket.ticket_code,
      };
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from('tickets')
      .update({
        is_checked_in: true,
        checked_in_at: nowIso,
        status: 'USED',
        updated_at: nowIso,
      })
      .eq('id', ticket.id);

    await supabase.from('check_ins').insert({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      scanned_by: scannedByUserId,
      status: 'SUCCESS',
      notes: 'Check-in verified successfully',
    });

    return {
      success: true,
      status: 'SUCCESS',
      message: 'Check-in verified successfully!',
      ticket_code: ticket.ticket_code,
    };
  } catch (e: any) {
    console.error('Check-in exception:', e);
    return {
      success: false,
      status: 'ERROR',
      message: e.message || 'An error occurred during check-in.',
    };
  }
}

// 10. Get Organization Team Members
export async function getOrganizationMembers(orgId: string): Promise<any[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizer_profiles:user_id (full_name, email, avatar_url)
      `)
      .eq('organization_id', orgId);

    if (error) {
      console.error('Error fetching org members:', error);
      return [];
    }

    return (data || []).map((m: any) => ({
      ...m,
      full_name: m.organizer_profiles?.full_name || 'Team Member',
      email: m.organizer_profiles?.email || 'N/A',
      avatar_url: m.organizer_profiles?.avatar_url,
    }));
  } catch (e) {
    console.error('Org members exception:', e);
    return [];
  }
}

// 11. Invite Organization Member
export async function inviteOrganizationMember(
  orgId: string,
  email: string,
  role: OrgMemberRole,
  invitedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !isValidUUID(orgId) || !isValidUUID(invitedByUserId)) {
    return { success: false, error: 'Valid database connection and identifiers required.' };
  }

  try {
    // 1. Check organizer_profiles
    let targetUserId: string | null = null;
    const { data: orgProfile } = await supabase
      .from('organizer_profiles')
      .select('id, full_name')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (orgProfile) {
      targetUserId = orgProfile.id;
    } else {
      // 2. Check attendee_profiles if user registered as attendee and auto-promote to organizer
      const { data: attProfile } = await supabase
        .from('attendee_profiles')
        .select('id, full_name, phone_number, avatar_url')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (attProfile) {
        targetUserId = attProfile.id;
        // Promote in account_types and organizer_profiles
        await supabase.from('account_types').upsert({
          user_id: attProfile.id,
          account_type: 'ORGANIZER',
          updated_at: new Date().toISOString(),
        });
        await supabase.from('organizer_profiles').upsert({
          id: attProfile.id,
          full_name: attProfile.full_name,
          email: email.trim().toLowerCase(),
          phone_number: attProfile.phone_number,
          avatar_url: attProfile.avatar_url,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (!targetUserId || !isValidUUID(targetUserId)) {
      return {
        success: false,
        error: `No registered user found with email "${email}". User must create an account first.`,
      };
    }

    const { error: insertErr } = await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: targetUserId,
      role,
      invited_by: invitedByUserId,
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: 'User is already a member of this organization.' };
      }
      return { success: false, error: insertErr.message };
    }

    await supabase.from('audit_logs').insert({
      actor_id: invitedByUserId,
      organization_id: orgId,
      action: 'STAFF_INVITED',
      entity_type: 'ORGANIZATION_MEMBER',
      entity_id: targetUserId,
      metadata: { email, role },
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error inviting member' };
  }
}

// 12. Payout Accounts
export async function getPayoutAccounts(orgId: string): Promise<PayoutAccount[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data } = await supabase
      .from('payout_accounts')
      .select('*')
      .eq('organization_id', orgId);

    return data || [];
  } catch (e) {
    return [];
  }
}

export async function addPayoutAccount(
  orgId: string,
  input: PayoutAccountInput
): Promise<{ success: boolean; account?: PayoutAccount; error?: string }> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) {
    return { success: false, error: 'Valid database connection and organization ID required.' };
  }

  try {
    const { data, error } = await supabase
      .from('payout_accounts')
      .insert({
        organization_id: orgId,
        account_type: input.account_type,
        account_holder_name: input.account_holder_name,
        bank_name: input.bank_name,
        bank_code: input.bank_code,
        account_number: input.account_number,
        business_registration_number: input.business_registration_number || null,
        is_verified: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, account: data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// 13. Payout Requests
export async function getPayouts(orgId: string): Promise<Payout[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    return data || [];
  } catch (e) {
    return [];
  }
}

export async function requestPayout(
  orgId: string,
  payoutAccountId: string,
  amount: number
): Promise<{ success: boolean; payout?: Payout; error?: string }> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) {
    return { success: false, error: 'Valid database connection and organization ID required.' };
  }

  try {
    const ref = `PO-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from('payouts')
      .insert({
        organization_id: orgId,
        payout_account_id: payoutAccountId,
        amount,
        currency: 'NGN',
        status: 'PENDING',
        reference: ref,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, payout: data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// 14. Audit Logs
export async function getAuditLogs(orgId: string): Promise<AuditLog[]> {
  if (!isSupabaseConfigured || !orgId || !isValidUUID(orgId)) return [];

  try {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    return data || [];
  } catch (e) {
    return [];
  }
}

// 15. Categories
export async function getEventCategories(): Promise<EventCategory[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data } = await supabase.from('event_categories').select('*').order('name');
    return data || [];
  } catch (e) {
    return [];
  }
}
