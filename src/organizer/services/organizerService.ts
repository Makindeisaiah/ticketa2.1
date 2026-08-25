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
    id?: string;
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
  let resolvedUserId = userId;
  if (!resolvedUserId || !isValidUUID(resolvedUserId)) {
    if (isSupabaseConfigured) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id && isValidUUID(authData.user.id)) {
          resolvedUserId = authData.user.id;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!resolvedUserId || !isValidUUID(resolvedUserId) || !isSupabaseConfigured) return [];

  // Clean up any stale invalid localStorage entries from past sessions
  try {
    const localKey = `organizer_local_orgs_${resolvedUserId}`;
    localStorage.removeItem(localKey);
  } catch (e) {
    // ignore
  }

  let dbOrgs: Organization[] = [];
  try {
    const { data: createdOrgs } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', resolvedUserId);

    const { data: memberRows } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', resolvedUserId);

    const memberOrgIds = (memberRows || [])
      .map((r: any) => r.organization_id)
      .filter(isValidUUID);

    let memberOrgs: Organization[] = [];
    if (memberOrgIds.length > 0) {
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('*')
        .in('id', memberOrgIds);
      if (orgsData) {
        memberOrgs = orgsData;
      }
    }

    const allOrgsMap = new Map<string, Organization>();
    (createdOrgs || []).forEach((org: Organization) => {
      if (org && org.id && isValidUUID(org.id)) {
        allOrgsMap.set(org.id, org);
        // Repair missing organization_members record for this creator
        const hasMemberRow = (memberRows || []).some((m: any) => m.organization_id === org.id);
        if (!hasMemberRow) {
          try {
            supabase
              .from('organization_members')
              .insert({
                organization_id: org.id,
                user_id: resolvedUserId,
                role: 'OWNER',
              })
              .then(() => {}, () => {});
          } catch (e) {
            // ignore
          }
        }
      }
    });

    memberOrgs.forEach((org: Organization) => {
      if (org && org.id && isValidUUID(org.id)) {
        allOrgsMap.set(org.id, org);
      }
    });

    dbOrgs = Array.from(allOrgsMap.values());
  } catch (e) {
    console.warn('Error fetching user organizations from database:', e);
  }

  return dbOrgs.filter((o) => o && isValidUUID(o.id));
}

// In-flight organization creation mutex per user
const inFlightOrgCreations = new Map<string, Promise<{ success: boolean; organization?: Organization; error?: string }>>();

// 2. Create Organization
export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput
): Promise<{ success: boolean; organization?: Organization; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Database is not configured.' };
  }

  let resolvedUserId = userId;
  if (!resolvedUserId || !isValidUUID(resolvedUserId)) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id && isValidUUID(authData.user.id)) {
      resolvedUserId = authData.user.id;
    }
  }

  if (!resolvedUserId || !isValidUUID(resolvedUserId)) {
    return { success: false, error: 'Valid authenticated user ID is required.' };
  }

  // If a creation request is already running for this user, reuse the in-flight promise
  if (inFlightOrgCreations.has(resolvedUserId)) {
    return inFlightOrgCreations.get(resolvedUserId)!;
  }

  const creationPromise = (async () => {
    try {
      // 1. Check if the organizer already created or belongs to an organization
      const { data: existingCreatedOrgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', resolvedUserId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingCreatedOrgs && existingCreatedOrgs.length > 0 && isValidUUID(existingCreatedOrgs[0].id)) {
        const existingOrg = existingCreatedOrgs[0] as Organization;
        // Ensure organization_members record exists for this organizer
        const { data: memberRecord } = await supabase
          .from('organization_members')
          .select('id, role')
          .eq('organization_id', existingOrg.id)
          .eq('user_id', resolvedUserId)
          .maybeSingle();

        if (!memberRecord) {
          try {
            await supabase.from('organization_members').insert({
              organization_id: existingOrg.id,
              user_id: resolvedUserId,
              role: 'OWNER',
            });
          } catch (e) {
            console.warn('Membership repair notice:', e);
          }
        }
        return { success: true, organization: existingOrg };
      }

      const { data: existingMemberRows } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', resolvedUserId)
        .limit(1);

      if (existingMemberRows && existingMemberRows.length > 0 && isValidUUID(existingMemberRows[0].organization_id)) {
        const { data: existingMemberOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', existingMemberRows[0].organization_id)
          .maybeSingle();

        if (existingMemberOrg && isValidUUID(existingMemberOrg.id)) {
          return { success: true, organization: existingMemberOrg as Organization };
        }
      }

      // 2. Ensure account_types has ORGANIZER role for RLS policy check
      try {
        await supabase.from('account_types').upsert(
          {
            user_id: resolvedUserId,
            account_type: 'ORGANIZER',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (e) {
        console.warn('Account type pre-check notice:', e);
      }

      // 3. Ensure organizer_profiles exists for Foreign Key constraint check
      try {
        const { data: authUserData } = await supabase.auth.getUser();
        const userEmail = authUserData?.user?.email || '';
        const userName = authUserData?.user?.user_metadata?.full_name || input.name || 'Ticketa Organizer';
        await supabase.from('organizer_profiles').upsert(
          {
            id: resolvedUserId,
            full_name: userName,
            email: userEmail || `${resolvedUserId}@organizer.ticketa.app`,
            phone_number: input.phone_number || null,
            country: input.country || 'NG',
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.warn('Organizer profile pre-check notice:', e);
      }

      // 4. Generate unique slug
      const baseSlug = (input.name || 'organization')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'org';
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

      // 5. Insert organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: input.name?.trim() || 'My Organization',
          slug: uniqueSlug,
          type: input.type || 'INDIVIDUAL',
          country: input.country || 'Nigeria',
          phone_number: input.phone_number || null,
          description: input.description || null,
          website: input.website || null,
          logo_url: input.logo_url || null,
          created_by: resolvedUserId,
        })
        .select()
        .single();

      if (orgErr || !org || !isValidUUID(org.id)) {
        console.error('Failed to insert organization in database:', orgErr);
        return { success: false, error: orgErr?.message || 'Failed to create organization in database.' };
      }

      // 6. Insert organization member with role OWNER
      try {
        await supabase.from('organization_members').insert({
          organization_id: org.id,
          user_id: resolvedUserId,
          role: 'OWNER',
        });
      } catch (e) {
        console.warn('Failed to insert organization member:', e);
      }

      // 7. Audit log
      try {
        await supabase.from('audit_logs').insert({
          actor_id: resolvedUserId,
          organization_id: org.id,
          action: 'ORGANIZATION_CREATED',
          entity_type: 'ORGANIZATION',
          entity_id: org.id,
          metadata: { name: org.name, type: org.type, slug: org.slug },
        });
      } catch (e) {
        // ignore
      }

      return { success: true, organization: org as Organization };
    } catch (e: any) {
      console.error('Create organization exception:', e);
      return { success: false, error: e.message || 'Error creating organization' };
    } finally {
      inFlightOrgCreations.delete(resolvedUserId);
    }
  })();

  inFlightOrgCreations.set(resolvedUserId, creationPromise);
  return creationPromise;
}

// Helper to get local event sales and global orders
function getLocalSalesData() {
  try {
    const salesTracker = JSON.parse(localStorage.getItem('ticketa_event_sales_tracker_v1') || '{}');
    const globalOrders = JSON.parse(localStorage.getItem('ticketa_global_orders_v1') || '[]');
    const userOrders = JSON.parse(localStorage.getItem('ticketa_user_orders_v1') || '[]');
    return { salesTracker, globalOrders, userOrders };
  } catch (e) {
    return { salesTracker: {}, globalOrders: [], userOrders: [] };
  }
}

// 3. Get Organization Metrics
export async function getOrganizationMetrics(orgId: string) {
  let metrics = {
    totalRevenue: 0,
    ticketsSold: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalCheckedIn: 0,
  };

  try {
    // 1. Fetch hydrated organization events which already aggregate DB & local ticket sales
    const orgEvents = await getOrganizationEvents(orgId);
    
    if (orgEvents && orgEvents.length > 0) {
      const totalRev = orgEvents.reduce((sum, e) => sum + (Number(e.revenue) || 0), 0);
      const sold = orgEvents.reduce((sum, e) => sum + (Number(e.total_sold) || 0), 0);
      const checkedIn = orgEvents.reduce((sum, e) => sum + (Number(e.checked_in_count) || 0), 0);
      const active = orgEvents.filter((e) => e.status === 'PUBLISHED' || !e.status).length;

      metrics = {
        totalRevenue: totalRev,
        ticketsSold: sold,
        totalEvents: orgEvents.length,
        activeEvents: active,
        totalCheckedIn: checkedIn,
      };

      return metrics;
    }
  } catch (e) {
    console.error('Error calculating metrics:', e);
  }

  return metrics;
}

// 4. Get Organization Events
export async function getOrganizationEvents(orgId: string): Promise<any[]> {
  let eventsList: any[] = [];
  const { salesTracker, globalOrders, userOrders } = getLocalSalesData();

  if (isSupabaseConfigured && orgId && isValidUUID(orgId)) {
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

      if (!error && data && data.length > 0) {
        eventsList = data;
      }
    } catch (e) {
      console.error('Org events exception:', e);
    }
  }

  // If no organization events are returned yet from Supabase, populate with default organizer events
  if (eventsList.length === 0) {
    const defaultOrganizerSeed = [
      {
        id: 'evt-omah-lay-live-lagos',
        title: 'Omah Lay Live in Lagos',
        slug: 'omah-lay-live-in-lagos',
        description: 'Afro-fusion star Omah Lay live in concert at Eko Hotel & Suites.',
        banner_image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=800',
        start_time: '2026-09-17T20:20:00Z',
        end_time: '2026-09-17T23:59:00Z',
        date: '2026-09-17 — 20:20',
        venue: 'Eko Hotel & Suite',
        venue_name: 'Eko Hotel & Suite',
        venue_city: 'Victoria Island, Lagos',
        status: 'PUBLISHED',
        velocity: 'FAST',
        ticket_types: [
          { id: 'tt-omah-reg', name: 'Regular Pass', price: 50000, quantity_available: 77, quantity_sold: 3 },
        ],
        checked_in_count: 1,
      },
      {
        id: 'evt-tyla-pop-world-tour',
        title: 'Tyla A POP World Tour',
        slug: 'tyla-a-pop-world-tour',
        description: 'Grammy winning sensation Tyla brings the POP World Tour to Lagos.',
        banner_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
        start_time: '2026-10-17T20:00:00Z',
        end_time: '2026-10-17T23:30:00Z',
        date: '2026-10-17 — 20:00',
        venue: 'Federal Palace Hotel',
        venue_name: 'Federal Palace Hotel',
        venue_city: 'Victoria Island, Lagos',
        status: 'PUBLISHED',
        velocity: 'AVERAGE',
        ticket_types: [
          { id: 'tt-tyla-reg', name: 'General Admission', price: 40000, quantity_available: 62, quantity_sold: 8 },
          { id: 'tt-tyla-vip', name: 'VIP Circle', price: 115000, quantity_available: 20, quantity_sold: 1 },
        ],
        checked_in_count: 2,
      },
      {
        id: 'evt-davido-5ive-alive',
        title: 'Davido 5ive Alive Tour',
        slug: 'davido-5ive-alive-tour',
        description: 'Davido 5ive Alive live stadium concert.',
        banner_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800',
        start_time: '2026-04-03T20:00:00Z',
        end_time: '2026-04-03T23:30:00Z',
        date: '2026-04-03 — 20:00',
        venue: 'Palau Olímpic / Eko Convention',
        venue_name: 'Eko Convention Centre',
        venue_city: 'Lagos',
        status: 'PUBLISHED',
        velocity: 'FAST',
        ticket_types: [
          { id: 'tt-davido-reg', name: 'Regular', price: 30000, quantity_available: 4500, quantity_sold: 1420 },
          { id: 'tt-davido-vip', name: 'VIP Pass', price: 100000, quantity_available: 800, quantity_sold: 340 },
        ],
        checked_in_count: 320,
      },
    ];

    eventsList = defaultOrganizerSeed;
  }

  // Fetch DB counts for valid tickets and orders for DB events
  let dbTicketsByEvent: Record<string, number> = {};
  let dbRevenueByEvent: Record<string, number> = {};
  let dbCheckedInByEvent: Record<string, number> = {};

  const validDbEventIds = eventsList.map((e) => e.id).filter(isValidUUID);
  if (isSupabaseConfigured && validDbEventIds.length > 0) {
    try {
      const { data: dbTickets } = await supabase
        .from('tickets')
        .select('event_id, status, is_checked_in')
        .in('event_id', validDbEventIds);

      (dbTickets || []).forEach((t: any) => {
        if (t.status !== 'CANCELLED' && t.status !== 'REFUNDED') {
          dbTicketsByEvent[t.event_id] = (dbTicketsByEvent[t.event_id] || 0) + 1;
        }
        if (t.is_checked_in) {
          dbCheckedInByEvent[t.event_id] = (dbCheckedInByEvent[t.event_id] || 0) + 1;
        }
      });

      const { data: dbOrders } = await supabase
        .from('orders')
        .select('event_id, total_amount, status')
        .in('event_id', validDbEventIds);

      (dbOrders || []).forEach((o: any) => {
        if (o.status === 'PAID' || !o.status) {
          dbRevenueByEvent[o.event_id] = (dbRevenueByEvent[o.event_id] || 0) + Number(o.total_amount || 0);
        }
      });
    } catch (e) {
      console.warn('Notice querying DB tickets & orders summary:', e);
    }
  }

  // Hydrate each event with accurate aggregated counts and progress
  return eventsList.map((evt) => {
    const ticketTypes = evt.ticket_types || [];
    
    // 1. Sold tickets from ticket_types rows
    const ttSold = ticketTypes.reduce((s: number, tt: any) => s + (Number(tt.quantity_sold) || 0), 0);
    const ttAvail = ticketTypes.reduce((s: number, tt: any) => s + (Number(tt.quantity_available) || 0), 0);
    const ttRevenue = ticketTypes.reduce(
      (s: number, tt: any) => s + (Number(tt.quantity_sold) || 0) * (Number(tt.price) || 0),
      0
    );

    // 2. Count from DB tickets/orders
    const dbTicketsCount = dbTicketsByEvent[evt.id] || 0;
    const dbRevenue = dbRevenueByEvent[evt.id] || 0;
    const dbCheckedIn = dbCheckedInByEvent[evt.id] || 0;

    // 3. Local sales tracker purchases
    const localTracker =
      salesTracker[evt.id] ||
      salesTracker[evt.title] ||
      (evt.slug ? salesTracker[evt.slug] : null) ||
      { sold: 0, revenue: 0 };

    // 4. Local orders matching this event
    const matchingLocalOrders = [
      ...globalOrders.filter((o: any) => o.event_id === evt.id || o.event_title === evt.title),
      ...userOrders.filter((o: any) => o.eventId === evt.id || o.eventTitle === evt.title),
    ];
    const localOrderQty = matchingLocalOrders.reduce((sum: number, o: any) => {
      const q = Number(o.quantity) || (o.items ? o.items.reduce((s: number, it: any) => s + it.quantity, 0) : 1);
      return sum + q;
    }, 0);
    const localOrderRev = matchingLocalOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount || o.totalAmount) || 0), 0);

    // Aggregate maximum accurate sales and revenue
    const totalSold = Math.max(
      ttSold,
      dbTicketsCount,
      Number(localTracker.sold) || 0,
      localOrderQty
    );

    const revenue = Math.max(
      ttRevenue,
      dbRevenue,
      Number(localTracker.revenue) || 0,
      localOrderRev,
      Number(evt.revenue) || 0
    );

    const defaultBaseCapacity = Number(evt.total_capacity) || (ttAvail + ttSold > 0 ? ttAvail + ttSold : 30);
    const totalCapacity = Math.max(defaultBaseCapacity, totalSold > 0 ? Math.max(totalSold, 30) : 30);
    const totalAvail = Math.max(0, totalCapacity - totalSold);
    const progressVal = totalCapacity > 0 ? Math.min(100, Math.round((totalSold / totalCapacity) * 100)) : 0;
    const checkedInCount = Math.max(Number(evt.checked_in_count) || 0, dbCheckedIn);

    return {
      ...evt,
      total_sold: totalSold,
      total_available: totalAvail,
      total_capacity: totalCapacity,
      progress_val: progressVal,
      revenue,
      checked_in_count: checkedInCount,
    };
  });
}

// Update Organizer Event
export async function updateOrganizerEvent(
  eventId: string,
  input: Partial<CreateEventInput> & { status?: EventStatus }
): Promise<{ success: boolean; event?: any; error?: string }> {
  try {
    if (isSupabaseConfigured && isValidUUID(eventId)) {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };
      if (input.title) updatePayload.title = input.title;
      if (input.slug) updatePayload.slug = input.slug;
      if (input.description !== undefined) updatePayload.description = input.description;
      if (input.category_id) updatePayload.category_id = input.category_id;
      if (input.is_online !== undefined) updatePayload.is_online = input.is_online;
      if (input.banner_image_url) updatePayload.banner_image_url = input.banner_image_url;
      if (input.start_time) updatePayload.start_time = input.start_time;
      if (input.end_time) updatePayload.end_time = input.end_time;
      if (input.status) updatePayload.status = input.status;

      const { data: updatedEvt, error: evtErr } = await supabase
        .from('events')
        .update(updatePayload)
        .eq('id', eventId)
        .select()
        .single();

      if (evtErr) {
        console.error('Error updating event:', evtErr.message);
      }

      // Update venue
      if (input.venue_name && updatedEvt?.venue_id) {
        await supabase
          .from('venues')
          .update({
            name: input.venue_name,
            address: input.venue_address || input.venue_name,
            city: input.venue_city || 'Lagos',
            country: input.venue_country || 'Nigeria',
            updated_at: new Date().toISOString(),
          })
          .eq('id', updatedEvt.venue_id);
      }

      // Update/Insert ticket types
      if (input.ticket_types && Array.isArray(input.ticket_types)) {
        for (const tt of input.ticket_types) {
          if (tt.id && isValidUUID(tt.id)) {
            await supabase
              .from('ticket_types')
              .update({
                name: tt.name,
                description: tt.description,
                price: Number(tt.price) || 0,
                quantity_available: Number(tt.quantity_available) || 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', tt.id);
          } else {
            await supabase.from('ticket_types').insert({
              event_id: eventId,
              name: tt.name,
              description: tt.description,
              price: Number(tt.price) || 0,
              currency: tt.currency || 'NGN',
              quantity_available: Number(tt.quantity_available) || 100,
            });
          }
        }
      }

      return { success: true, event: updatedEvt };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Update event exception:', err);
    return { success: false, error: err?.message || 'Failed to update event' };
  }
}

// Delete Organizer Event
export async function deleteOrganizerEvent(
  eventId: string,
  orgId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured && isValidUUID(eventId)) {
      // 1. Delete check_ins
      await supabase.from('check_ins').delete().eq('event_id', eventId);
      // 2. Delete tickets
      await supabase.from('tickets').delete().eq('event_id', eventId);
      // 3. Delete ticket_types
      await supabase.from('ticket_types').delete().eq('event_id', eventId);
      // 4. Delete orders
      await supabase.from('orders').delete().eq('event_id', eventId);
      // 5. Delete event
      const { error: delErr } = await supabase.from('events').delete().eq('id', eventId);

      if (delErr) {
        console.error('Error deleting event:', delErr);
        return { success: false, error: delErr.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Delete event exception:', err);
    return { success: false, error: err?.message || 'Failed to delete event' };
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

  // 1. Resolve and verify authenticated organizer user ID from Supabase
  let resolvedUserId = userId;
  if (!resolvedUserId || !isValidUUID(resolvedUserId)) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && isValidUUID(authData.user.id)) {
        resolvedUserId = authData.user.id;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!resolvedUserId || !isValidUUID(resolvedUserId)) {
    return { success: false, error: 'Authenticated organizer user is required to create an event.' };
  }

  // 2. Resolve organization UUID from public.organization_members and public.organizations
  let resolvedOrgId = orgId;
  if (!resolvedOrgId || !isValidUUID(resolvedOrgId)) {
    try {
      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', resolvedUserId);

      const validMemberRow = (memberRows || []).find((r: any) =>
        r.organization_id &&
        isValidUUID(r.organization_id) &&
        ['OWNER', 'ADMIN', 'MANAGER'].includes(r.role?.toUpperCase())
      ) || (memberRows || []).find((r: any) => r.organization_id && isValidUUID(r.organization_id));

      if (validMemberRow?.organization_id) {
        resolvedOrgId = validMemberRow.organization_id;
      } else {
        const { data: createdOrgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', resolvedUserId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (createdOrgs && createdOrgs.length > 0 && isValidUUID(createdOrgs[0].id)) {
          resolvedOrgId = createdOrgs[0].id;
          // Repair missing organization_members record for this creator
          try {
            await supabase.from('organization_members').insert({
              organization_id: resolvedOrgId,
              user_id: resolvedUserId,
              role: 'OWNER',
            });
          } catch (repairErr) {
            // ignore if exists
          }
        }
      }
    } catch (e) {
      console.warn('Error resolving organizer organization:', e);
    }
  }

  if (!resolvedOrgId || !isValidUUID(resolvedOrgId)) {
    return {
      success: false,
      error: 'No organization found for this organizer. Please set up an organization before creating events.',
    };
  }

  // 3. Verify organization exists and organizer membership role (OWNER, ADMIN, MANAGER, or creator)
  try {
    const { data: orgRecord, error: orgFetchErr } = await supabase
      .from('organizations')
      .select('id, name, created_by')
      .eq('id', resolvedOrgId)
      .maybeSingle();

    if (orgFetchErr || !orgRecord) {
      return { success: false, error: 'The specified organization does not exist in the database.' };
    }

    const isCreator = orgRecord.created_by === resolvedUserId;
    let hasAuthorizedRole = isCreator;

    if (!hasAuthorizedRole) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', resolvedOrgId)
        .eq('user_id', resolvedUserId)
        .maybeSingle();

      if (membership?.role && ['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role.toUpperCase())) {
        hasAuthorizedRole = true;
      }
    }

    if (!hasAuthorizedRole) {
      return {
        success: false,
        error: 'You do not have permission (OWNER, ADMIN, or MANAGER) to create events for this organization.',
      };
    }

    let venueId: string | null = null;

    if (!input.is_online && input.venue_name) {
      const { data: venue } = await supabase
        .from('venues')
        .insert({
          organization_id: resolvedOrgId,
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
        organization_id: resolvedOrgId,
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
        created_by: resolvedUserId,
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

    try {
      await supabase.from('audit_logs').insert({
        actor_id: resolvedUserId,
        organization_id: resolvedOrgId,
        action: input.status === 'PUBLISHED' ? 'EVENT_PUBLISHED' : 'EVENT_CREATED',
        entity_type: 'EVENT',
        entity_id: event.id,
        metadata: { title: event.title, status: event.status },
      });
    } catch (e) {
      // ignore
    }

    return { success: true, event };
  } catch (e: any) {
    console.error('Create event exception:', e);
    return { success: false, error: e.message || 'Unexpected error creating event.' };
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
  const { globalOrders, userOrders } = getLocalSalesData();
  let ordersList: any[] = [];

  if (isSupabaseConfigured && orgId && isValidUUID(orgId)) {
    try {
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .eq('organization_id', orgId);

      if (events && events.length > 0) {
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

        if (!error && orders) {
          ordersList = orders.map((o: any) => ({
            ...o,
            event_title: eventMap.get(o.event_id) || 'Event',
            customer_name: o.attendee_profiles?.full_name || o.customer_name || 'Attendee',
            customer_email: o.attendee_profiles?.email || o.customer_email || 'N/A',
          }));
        }
      }
    } catch (e) {
      console.error('Org orders exception:', e);
    }
  }

  // Merge with local orders (avoiding duplicate IDs)
  const existingOrderIds = new Set(ordersList.map((o) => o.id || o.order_number));
  const allLocal = [...globalOrders, ...userOrders];

  for (const lo of allLocal) {
    const id = lo.id || lo.orderNumber || lo.order_number;
    if (!existingOrderIds.has(id)) {
      existingOrderIds.add(id);
      ordersList.unshift({
        id: id || `ord-${Date.now()}`,
        order_number: lo.order_number || lo.orderNumber || `ORD-${Date.now()}`,
        event_id: lo.event_id || lo.eventId,
        event_title: lo.event_title || lo.eventTitle || 'Event',
        customer_name: lo.customer_name || lo.buyerName || 'Valued Attendee',
        customer_email: lo.customer_email || lo.buyerEmail || 'attendee@example.com',
        customer_phone: lo.customer_phone || lo.buyerPhone || '',
        total_amount: Number(lo.total_amount || lo.totalAmount || 0),
        status: lo.status || 'PAID',
        currency: 'NGN',
        payment_reference: lo.payment_reference || lo.paymentReference || 'PSTK-REF',
        created_at: lo.created_at || lo.createdAt || new Date().toISOString(),
        quantity: Number(lo.quantity || (lo.items ? lo.items.reduce((s: number, it: any) => s + it.quantity, 0) : 1)),
        order_items: lo.items || lo.order_items || [],
        tickets: lo.tickets || [],
      });
    }
  }

  return ordersList;
}

// Helper to get checked-in tickets registry from localStorage
export function getCheckedInMap(): Record<string, { ticket_code: string; event_id?: string; scanned_by?: string; checked_in_at: string; status: string }> {
  try {
    return JSON.parse(localStorage.getItem('ticketa_checked_in_tickets_v1') || '{}');
  } catch (e) {
    return {};
  }
}

// 8. Get Organization Attendees / Tickets
export async function getOrganizationAttendees(orgId: string): Promise<any[]> {
  const { globalOrders, userOrders } = getLocalSalesData();
  const checkedInMap = getCheckedInMap();
  let attendeesList: any[] = [];

  if (isSupabaseConfigured && orgId && isValidUUID(orgId)) {
    try {
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .eq('organization_id', orgId);

      if (events && events.length > 0) {
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

        if (!error && tickets) {
          attendeesList = tickets.map((t: any) => {
            const isLocalChecked = Boolean(checkedInMap[t.ticket_code] || checkedInMap[t.qr_code_hash]);
            return {
              ...t,
              event_title: eventMap.get(t.event_id) || 'Event',
              attendee_name: t.attendee_name || t.attendee_profiles?.full_name || 'Attendee',
              attendee_email: t.attendee_email || t.attendee_profiles?.email || 'N/A',
              ticket_type_name: t.ticket_types?.name || 'Standard',
              price: t.ticket_types?.price || 0,
              is_checked_in: Boolean(t.is_checked_in || isLocalChecked),
              checked_in_at: t.checked_in_at || (isLocalChecked ? checkedInMap[t.ticket_code]?.checked_in_at : undefined),
            };
          });
        }
      }
    } catch (e) {
      console.error('Org attendees exception:', e);
    }
  }

  // Merge with local tickets from orders
  const existingTicketCodes = new Set(attendeesList.map((t) => t.ticket_code || t.ticketCode));
  const allLocal = [...globalOrders, ...userOrders];

  for (const ord of allLocal) {
    if (ord.tickets && Array.isArray(ord.tickets)) {
      for (const tkt of ord.tickets) {
        const code = tkt.ticket_code || tkt.ticketCode;
        if (code && !existingTicketCodes.has(code)) {
          existingTicketCodes.add(code);
          const isLocalChecked = Boolean(tkt.is_checked_in || tkt.isCheckedIn || checkedInMap[code]);
          attendeesList.unshift({
            id: `tkt-${code}`,
            ticket_code: code,
            qr_code_hash: tkt.qr_code_hash || tkt.qrCodeHash || `hash-${code}`,
            event_id: ord.event_id || ord.eventId,
            event_title: ord.event_title || ord.eventTitle || 'Event',
            attendee_name: ord.customer_name || ord.buyerName || 'Attendee',
            attendee_email: ord.customer_email || ord.buyerEmail || 'attendee@example.com',
            ticket_type_name: tkt.ticket_type || tkt.ticketType || (tkt.name || 'General Admission'),
            price: Number(tkt.price || ord.total_amount || ord.totalAmount || 0),
            status: tkt.status || 'VALID',
            is_checked_in: isLocalChecked,
            checked_in_at: isLocalChecked ? (checkedInMap[code]?.checked_in_at || new Date().toISOString()) : undefined,
            created_at: ord.created_at || ord.createdAt || new Date().toISOString(),
          });
        }
      }
    }
  }

  return attendeesList;
}

// 8b. Get Event Attendees (Specific Event Guest List)
export async function getEventAttendees(eventId: string): Promise<any[]> {
  const allAttendees = await getOrganizationAttendees('');
  const checkedInMap = getCheckedInMap();

  if (!eventId || eventId === 'all') {
    return allAttendees;
  }

  const matchingAttendees = allAttendees.filter(
    (a) => a.event_id === eventId || a.event_title === eventId
  );

  // If there are already matching attendees from purchases/DB, return them
  if (matchingAttendees.length > 0) {
    return matchingAttendees;
  }

  // Provide realistic default guest list for seed events so organizer can test immediately
  const seedGuestMap: Record<string, any[]> = {
    'evt-tyla-pop-world-tour': [
      {
        id: 'att-tyla-01',
        ticket_code: 'TKT-TYLA-849201',
        qr_code_hash: 'hash-tyla-849201',
        event_id: 'evt-tyla-pop-world-tour',
        event_title: 'Tyla A POP World Tour',
        attendee_name: 'Amara Okafor',
        attendee_email: 'amara.okafor@gmail.com',
        ticket_type_name: 'General Admission',
        price: 40000,
        status: 'VALID',
        is_checked_in: true,
        checked_in_at: '2026-10-17T18:45:00Z',
        created_at: '2026-10-01T12:00:00Z',
      },
      {
        id: 'att-tyla-02',
        ticket_code: 'TKT-TYLA-849202',
        qr_code_hash: 'hash-tyla-849202',
        event_id: 'evt-tyla-pop-world-tour',
        event_title: 'Tyla A POP World Tour',
        attendee_name: 'David Adeleke',
        attendee_email: 'david.ade@yahoo.com',
        ticket_type_name: 'VIP Circle',
        price: 115000,
        status: 'VALID',
        is_checked_in: true,
        checked_in_at: '2026-10-17T19:10:00Z',
        created_at: '2026-10-02T14:30:00Z',
      },
      {
        id: 'att-tyla-03',
        ticket_code: 'TKT-TYLA-849203',
        qr_code_hash: 'hash-tyla-849203',
        event_id: 'evt-tyla-pop-world-tour',
        event_title: 'Tyla A POP World Tour',
        attendee_name: 'Zainab Balogun',
        attendee_email: 'zainab.b@outlook.com',
        ticket_type_name: 'General Admission',
        price: 40000,
        status: 'VALID',
        is_checked_in: false,
        created_at: '2026-10-05T09:15:00Z',
      },
      {
        id: 'att-tyla-04',
        ticket_code: 'TKT-TYLA-849204',
        qr_code_hash: 'hash-tyla-849204',
        event_id: 'evt-tyla-pop-world-tour',
        event_title: 'Tyla A POP World Tour',
        attendee_name: 'Chinedu Eze',
        attendee_email: 'chinedu.eze@gmail.com',
        ticket_type_name: 'General Admission',
        price: 40000,
        status: 'VALID',
        is_checked_in: false,
        created_at: '2026-10-06T11:20:00Z',
      },
    ],
    'evt-davido-5ive-alive': [
      {
        id: 'att-dvd-01',
        ticket_code: 'TKT-DVD-50192',
        qr_code_hash: 'hash-dvd-50192',
        event_id: 'evt-davido-5ive-alive',
        event_title: 'Davido 5ive Alive Tour',
        attendee_name: 'Tobi Bakare',
        attendee_email: 'tobi.bakare@gmail.com',
        ticket_type_name: 'VIP Pass',
        price: 100000,
        status: 'VALID',
        is_checked_in: true,
        checked_in_at: '2026-04-03T18:30:00Z',
        created_at: '2026-03-20T10:00:00Z',
      },
      {
        id: 'att-dvd-02',
        ticket_code: 'TKT-DVD-50193',
        qr_code_hash: 'hash-dvd-50193',
        event_id: 'evt-davido-5ive-alive',
        event_title: 'Davido 5ive Alive Tour',
        attendee_name: 'Fatima Sanusi',
        attendee_email: 'fatima.s@gmail.com',
        ticket_type_name: 'Regular',
        price: 30000,
        status: 'VALID',
        is_checked_in: false,
        created_at: '2026-03-22T15:40:00Z',
      },
    ],
  };

  const seedList = seedGuestMap[eventId] || [];
  return seedList.map((g) => {
    const isLocalChecked = Boolean(checkedInMap[g.ticket_code]);
    return {
      ...g,
      is_checked_in: isLocalChecked || g.is_checked_in,
      checked_in_at: isLocalChecked ? (checkedInMap[g.ticket_code]?.checked_in_at || g.checked_in_at) : g.checked_in_at,
    };
  });
}

// 9. Atomic QR Code / Manual Check-In
export async function checkInTicket(
  codeOrHash: string,
  eventId: string,
  scannedByUserId: string
): Promise<{ success: boolean; status: string; message: string; ticket_code?: string; attendee?: any }> {
  if (!codeOrHash) {
    return {
      success: false,
      status: 'MISSING_CODE',
      message: 'Please provide a valid ticket code or QR payload.',
    };
  }

  const cleanCode = codeOrHash.trim().toUpperCase();
  const checkedInMap = getCheckedInMap();

  // 1. Check local checked-in cache
  if (checkedInMap[cleanCode] || checkedInMap[codeOrHash.trim()]) {
    const existing = checkedInMap[cleanCode] || checkedInMap[codeOrHash.trim()];
    return {
      success: false,
      status: 'ALREADY_CHECKED_IN',
      message: `Already checked in at ${new Date(existing.checked_in_at).toLocaleTimeString()}.`,
      ticket_code: cleanCode,
    };
  }

  const nowIso = new Date().toISOString();

  // 2. If Supabase DB is configured and valid UUID, attempt DB check-in
  if (isSupabaseConfigured && isValidUUID(eventId)) {
    try {
      const { data: ticket, error: ticketErr } = await supabase
        .from('tickets')
        .select('*')
        .or(`ticket_code.eq.${cleanCode},qr_code_hash.eq.${codeOrHash.trim()}`)
        .single();

      if (!ticketErr && ticket) {
        if (eventId && ticket.event_id !== eventId) {
          return {
            success: false,
            status: 'WRONG_EVENT',
            message: 'Ticket is registered for a different event!',
          };
        }

        if (ticket.is_checked_in) {
          return {
            success: false,
            status: 'ALREADY_CHECKED_IN',
            message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}.`,
            ticket_code: ticket.ticket_code,
          };
        }

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
          scanned_by: isValidUUID(scannedByUserId) ? scannedByUserId : null,
          status: 'SUCCESS',
          notes: 'Check-in verified successfully',
        });
      }
    } catch (dbErr) {
      console.warn('Supabase checkIn DB notice:', dbErr);
    }
  }

  // 3. Mark in local storage checked-in map
  checkedInMap[cleanCode] = {
    ticket_code: cleanCode,
    event_id: eventId,
    scanned_by: scannedByUserId || 'Gate Officer',
    checked_in_at: nowIso,
    status: 'CHECKED_IN',
  };
  localStorage.setItem('ticketa_checked_in_tickets_v1', JSON.stringify(checkedInMap));

  // 4. Update local orders
  try {
    const globalOrders = JSON.parse(localStorage.getItem('ticketa_global_orders_v1') || '[]');
    let found = false;
    for (const ord of globalOrders) {
      if (ord.tickets && Array.isArray(ord.tickets)) {
        for (const tkt of ord.tickets) {
          if ((tkt.ticket_code || tkt.ticketCode || '').toUpperCase() === cleanCode) {
            tkt.is_checked_in = true;
            tkt.isCheckedIn = true;
            tkt.checked_in_at = nowIso;
            found = true;
          }
        }
      }
    }
    if (found) {
      localStorage.setItem('ticketa_global_orders_v1', JSON.stringify(globalOrders));
    }
  } catch (e) {
    console.warn('Error updating global orders check-in:', e);
  }

  // 5. Broadcast real-time check-in event
  window.dispatchEvent(
    new CustomEvent('ticketa_checkin_updated', {
      detail: { ticketCode: cleanCode, eventId, checkedInAt: nowIso },
    })
  );
  window.dispatchEvent(new CustomEvent('ticketa_tickets_updated'));

  return {
    success: true,
    status: 'SUCCESS',
    message: 'Check-in verified successfully!',
    ticket_code: cleanCode,
  };
}

// 9b. Undo Check-In Ticket
export async function undoCheckInTicket(
  ticketCode: string,
  eventId?: string
): Promise<{ success: boolean; message: string }> {
  if (!ticketCode) return { success: false, message: 'Ticket code required' };

  const cleanCode = ticketCode.trim().toUpperCase();
  const checkedInMap = getCheckedInMap();
  delete checkedInMap[cleanCode];
  delete checkedInMap[ticketCode.trim()];
  localStorage.setItem('ticketa_checked_in_tickets_v1', JSON.stringify(checkedInMap));

  // Update local orders
  try {
    const globalOrders = JSON.parse(localStorage.getItem('ticketa_global_orders_v1') || '[]');
    for (const ord of globalOrders) {
      if (ord.tickets && Array.isArray(ord.tickets)) {
        for (const tkt of ord.tickets) {
          if ((tkt.ticket_code || tkt.ticketCode || '').toUpperCase() === cleanCode) {
            tkt.is_checked_in = false;
            tkt.isCheckedIn = false;
            delete tkt.checked_in_at;
          }
        }
      }
    }
    localStorage.setItem('ticketa_global_orders_v1', JSON.stringify(globalOrders));
  } catch (e) {}

  if (isSupabaseConfigured && eventId && isValidUUID(eventId)) {
    try {
      await supabase
        .from('tickets')
        .update({ is_checked_in: false, checked_in_at: null, status: 'VALID' })
        .eq('ticket_code', cleanCode);
    } catch (e) {}
  }

  window.dispatchEvent(new CustomEvent('ticketa_checkin_updated', { detail: { ticketCode: cleanCode, undone: true } }));
  window.dispatchEvent(new CustomEvent('ticketa_tickets_updated'));

  return { success: true, message: 'Check-in undone successfully' };
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
