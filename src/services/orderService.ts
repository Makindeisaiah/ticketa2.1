import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SeedEventData } from '../data/seedEvents';

export interface SelectedTicketItem {
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BuyerInformation {
  fullName: string;
  email: string;
  phoneNumber: string;
  promoCode?: string;
}

export type PaymentMethodType = 'CARD' | 'BANK_TRANSFER' | 'USSD';

export interface OrderCheckoutPayload {
  event: SeedEventData;
  items: SelectedTicketItem[];
  buyer: BuyerInformation;
  paymentMethod: PaymentMethodType;
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  totalAmount: number;
}

export interface CompletedOrderResult {
  id: string;
  orderNumber: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventBanner: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  paymentMethod: PaymentMethodType;
  items: SelectedTicketItem[];
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  createdAt: string;
  paymentReference: string;
  tickets: {
    ticketCode: string;
    ticketType: string;
    qrCodeHash: string;
    status: 'VALID' | 'USED' | 'CANCELLED';
    isCheckedIn: boolean;
  }[];
}

const STORAGE_ORDERS_KEY = 'ticketa_user_orders_v1';

export function getPROMO_CODES(): Record<string, { discount: number; isPercentage: boolean }> {
  return {
    DAVIDOLIVEINBADALONA: { discount: 10000, isPercentage: false },
    TICKETA10: { discount: 10, isPercentage: true },
    FLYTIME50: { discount: 50000, isPercentage: false },
    EARLYBIRD: { discount: 5000, isPercentage: false },
  };
}

export function validatePromoCode(code: string, subtotal: number): { valid: boolean; discountAmount: number; message: string } {
  const cleanCode = code.trim().toUpperCase();
  const promos = getPROMO_CODES();

  if (!cleanCode) {
    return { valid: false, discountAmount: 0, message: '' };
  }

  if (promos[cleanCode]) {
    const p = promos[cleanCode];
    let discount = p.isPercentage ? Math.round((subtotal * p.discount) / 100) : p.discount;
    discount = Math.min(discount, subtotal);
    return {
      valid: true,
      discountAmount: discount,
      message: `Promo code "${cleanCode}" applied! Saved ₦${discount.toLocaleString()}`,
    };
  }

  return {
    valid: false,
    discountAmount: 0,
    message: 'Invalid promo code. Please check and try again.',
  };
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TKT-DF${rand}`;
}

async function ensureDbEventAndTicketType(
  event: SeedEventData,
  userId: string,
  ticketTypeName: string
): Promise<{ dbEventId: string | null; dbTicketTypeId: string | null }> {
  if (!isSupabaseConfigured || !userId) return { dbEventId: null, dbTicketTypeId: null };

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id);

    let dbEventId: string | null = isUUID ? event.id : null;

    if (!dbEventId) {
      // Find event in Supabase by slug or title
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id')
        .or(`slug.eq.${event.slug || ''},title.eq.${event.title}`)
        .limit(1);

      if (existingEvents && existingEvents.length > 0) {
        dbEventId = existingEvents[0].id;
      }
    }

    // If event does NOT exist in DB yet, create organization, venue, and event
    if (!dbEventId) {
      // 1. Get or create organization
      let orgId: string | null = null;
      const { data: existingOrgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (existingOrgs && existingOrgs.length > 0) {
        orgId = existingOrgs[0].id;
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: event.organizer_name || 'Ticketa Verified Events',
            country: event.venue_country || 'Nigeria',
            created_by: userId,
          })
          .select('id')
          .single();
        if (orgError) console.warn('Org creation notice:', orgError.message);
        orgId = newOrg?.id || null;
      }

      if (orgId) {
        // 2. Insert event
        const { data: newEvent, error: evtError } = await supabase
          .from('events')
          .insert({
            organization_id: orgId,
            title: event.title,
            slug: event.slug || `evt-${Date.now()}`,
            description: event.description,
            banner_image_url: event.banner_image_url,
            start_time: event.start_time || new Date().toISOString(),
            end_time: event.end_time || new Date().toISOString(),
            status: 'PUBLISHED',
            created_by: userId,
          })
          .select('id')
          .single();

        if (evtError) console.warn('Event creation notice:', evtError.message);
        dbEventId = newEvent?.id || null;
      }
    }

    if (!dbEventId) return { dbEventId: null, dbTicketTypeId: null };

    // Find or create ticket_type in DB
    let dbTicketTypeId: string | null = null;
    const { data: existingTicketTypes } = await supabase
      .from('ticket_types')
      .select('id')
      .eq('event_id', dbEventId)
      .limit(1);

    if (existingTicketTypes && existingTicketTypes.length > 0) {
      dbTicketTypeId = existingTicketTypes[0].id;
    } else {
      const { data: newTicketType, error: ttError } = await supabase
        .from('ticket_types')
        .insert({
          event_id: dbEventId,
          name: ticketTypeName || 'General Admission',
          price: event.ticket_types?.[0]?.price || 0,
          currency: 'NGN',
          quantity_available: 1000,
        })
        .select('id')
        .single();
      if (ttError) console.warn('Ticket type creation notice:', ttError.message);
      dbTicketTypeId = newTicketType?.id || null;
    }

    return { dbEventId, dbTicketTypeId };
  } catch (err) {
    console.warn('Could not ensure database event / ticket_type:', err);
    return { dbEventId: null, dbTicketTypeId: null };
  }
}

export async function processPaystackOrder(payload: OrderCheckoutPayload): Promise<CompletedOrderResult> {
  const orderNumber = generateOrderNumber();
  const paymentRef = `PSTK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Generate ticket items
  const generatedTickets: CompletedOrderResult['tickets'] = [];
  payload.items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      const code = `${orderNumber}-${item.ticketTypeName.substring(0, 3).toUpperCase()}-${i + 1}`;
      const qrHash = `TICKETA_QR:${code}:${payload.event.id}:${Date.now()}`;
      generatedTickets.push({
        ticketCode: code,
        ticketType: item.ticketTypeName,
        qrCodeHash: qrHash,
        status: 'VALID',
        isCheckedIn: false,
      });
    }
  });

  const orderResult: CompletedOrderResult = {
    id: `ord-${Date.now()}`,
    orderNumber,
    eventId: payload.event.id,
    eventTitle: payload.event.title,
    eventDate: payload.event.start_time,
    eventVenue: `${payload.event.venue_name}, ${payload.event.venue_city}`,
    eventBanner: payload.event.banner_image_url,
    buyerName: payload.buyer.fullName,
    buyerEmail: payload.buyer.email,
    buyerPhone: payload.buyer.phoneNumber,
    paymentMethod: payload.paymentMethod,
    items: payload.items,
    subtotal: payload.subtotal,
    discountAmount: payload.discountAmount,
    serviceFee: payload.serviceFee,
    totalAmount: payload.totalAmount,
    status: 'PAID',
    createdAt: new Date().toISOString(),
    paymentReference: paymentRef,
    tickets: generatedTickets,
  };

  // 1. Try persisting to Supabase database with authenticated user ID
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (currentUserId) {
        const primaryTicketType = payload.items[0]?.ticketTypeName || 'General Admission';
        const { dbEventId, dbTicketTypeId } = await ensureDbEventAndTicketType(
          payload.event,
          currentUserId,
          primaryTicketType
        );

        if (dbEventId) {
          // Insert order row
          const { data: orderData, error: orderErr } = await supabase
            .from('orders')
            .insert({
              order_number: orderNumber,
              user_id: currentUserId,
              event_id: dbEventId,
              total_amount: payload.totalAmount,
              currency: 'NGN',
              status: 'PAID',
              payment_reference: paymentRef,
            })
            .select()
            .single();

          if (orderErr) {
            console.error('Supabase DB order insert error:', orderErr.message);
          } else if (orderData?.id) {
            // Insert payment row
            const { error: payErr } = await supabase.from('payments').insert({
              order_id: orderData.id,
              provider: 'PAYSTACK',
              transaction_reference: paymentRef,
              amount: payload.totalAmount,
              currency: 'NGN',
              status: 'SUCCESSFUL',
              payment_method: payload.paymentMethod,
            });
            if (payErr) console.error('Supabase DB payment insert error:', payErr.message);

            // Insert tickets with user_id attached for RLS
            if (dbTicketTypeId) {
              const ticketsToInsert = generatedTickets.map((t) => ({
                ticket_code: t.ticketCode,
                qr_code_hash: t.qrCodeHash,
                order_id: orderData.id,
                event_id: dbEventId,
                ticket_type_id: dbTicketTypeId,
                user_id: currentUserId,
                status: 'VALID',
                is_checked_in: false,
              }));

              const { error: tktErr } = await supabase.from('tickets').insert(ticketsToInsert);
              if (tktErr) console.error('Supabase DB tickets insert error:', tktErr.message);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Supabase DB order insertion notice:', e);
    }
  }

  return orderResult;
}

export async function getUserOrders(userEmail?: string, userId?: string): Promise<CompletedOrderResult[]> {
  // If user is NOT logged in (no email and no userId), return empty array
  if (!userEmail && !userId) {
    return [];
  }

  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Unable to fetch user orders from PostgreSQL database.');
    return [];
  }

  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        payment_reference,
        events (
          id,
          title,
          start_time,
          banner_image_url,
          venues ( name, city )
        ),
        tickets (
          ticket_code,
          qr_code_hash,
          status,
          is_checked_in,
          ticket_types ( name )
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying Supabase orders:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((ord: any) => ({
        id: ord.id,
        orderNumber: ord.order_number,
        eventId: ord.events?.id || '',
        eventTitle: ord.events?.title || 'Event',
        eventDate: ord.events?.start_time || new Date().toISOString(),
        eventVenue: ord.events?.venues ? `${ord.events.venues.name}, ${ord.events.venues.city}` : 'Lagos, Nigeria',
        eventBanner: ord.events?.banner_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        buyerName: '',
        buyerEmail: userEmail || '',
        buyerPhone: '',
        paymentMethod: 'CARD',
        items: (ord.tickets || []).map((t: any) => ({
          ticketTypeName: t.ticket_types?.name || 'Ticket',
          quantity: 1,
          unitPrice: Number(ord.total_amount),
          subtotal: Number(ord.total_amount),
        })),
        subtotal: Number(ord.total_amount),
        discountAmount: 0,
        serviceFee: 0,
        totalAmount: Number(ord.total_amount),
        status: ord.status === 'PAID' ? 'PAID' : 'PENDING',
        createdAt: ord.created_at,
        paymentReference: ord.payment_reference || '',
        tickets: (ord.tickets || []).map((t: any) => ({
          ticketCode: t.ticket_code,
          ticketType: t.ticket_types?.name || 'General Admission',
          qrCodeHash: t.qr_code_hash,
          status: t.status || 'VALID',
          isCheckedIn: Boolean(t.is_checked_in),
        })),
      }));
    }
  } catch (e) {
    console.warn('Could not fetch user orders from Supabase DB:', e);
  }

  return [];
}
