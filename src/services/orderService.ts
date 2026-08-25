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

export interface OrderTicketPass {
  id?: string;
  ticketCode: string;
  ticketType: string;
  passNumber: number;
  totalPasses: number;
  unitPrice: number;
  qrCodeHash: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  isCheckedIn: boolean;
  checkedInAt?: string;
  attendeeName: string;
  attendeeEmail: string;
  seatZone?: string;
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
  tickets: OrderTicketPass[];
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

  // Generate individual ticket passes
  const totalPassCount = payload.items.reduce((s, it) => s + it.quantity, 0);
  let globalPassIndex = 1;
  const generatedTickets: OrderTicketPass[] = [];

  payload.items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      const typeClean = item.ticketTypeName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'TKT';
      const code = `TKT-${orderNumber}-${typeClean}-${String(globalPassIndex).padStart(2, '0')}`;
      const qrHash = `TICKETA_PASS:${code}:${payload.event.id}:${Date.now()}-${globalPassIndex}`;
      const isVip = item.ticketTypeName.toLowerCase().includes('vip') || item.ticketTypeName.toLowerCase().includes('table');

      generatedTickets.push({
        id: `pass-${code}`,
        ticketCode: code,
        ticketType: item.ticketTypeName,
        passNumber: globalPassIndex,
        totalPasses: totalPassCount,
        unitPrice: item.unitPrice,
        qrCodeHash: qrHash,
        status: 'VALID',
        isCheckedIn: false,
        attendeeName: payload.buyer.fullName || 'Guest Attendee',
        attendeeEmail: payload.buyer.email,
        seatZone: isVip ? 'VIP Circle • Priority Access' : 'General Admission • Main Gate',
      });

      globalPassIndex++;
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
              customer_name: payload.buyer.fullName,
              customer_email: payload.buyer.email,
              customer_phone: payload.buyer.phoneNumber,
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
                attendee_name: payload.buyer.fullName,
                attendee_email: payload.buyer.email,
                status: 'VALID',
                is_checked_in: false,
              }));

              const { error: tktErr } = await supabase.from('tickets').insert(ticketsToInsert);
              if (tktErr) console.error('Supabase DB tickets insert error:', tktErr.message);

              // Update ticket_types quantity_sold and quantity_available in database
              try {
                const totalPurchased = payload.items.reduce((s, it) => s + it.quantity, 0);
                const { data: currentTt } = await supabase
                  .from('ticket_types')
                  .select('quantity_sold, quantity_available')
                  .eq('id', dbTicketTypeId)
                  .single();

                if (currentTt) {
                  await supabase
                    .from('ticket_types')
                    .update({
                      quantity_sold: (Number(currentTt.quantity_sold) || 0) + totalPurchased,
                      quantity_available: Math.max(0, (Number(currentTt.quantity_available) || 100) - totalPurchased),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', dbTicketTypeId);
                }
              } catch (ttUpdateErr) {
                console.warn('Error updating ticket_types in DB:', ttUpdateErr);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Supabase DB order insertion notice:', e);
    }
  }

  // 2. Persist locally to storage so organizer dashboard and attendee view instantly update
  try {
    const existingOrders = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
    const updatedUserOrders = [orderResult, ...existingOrders.filter((o: any) => o.id !== orderResult.id)];
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updatedUserOrders));

    // Global order registry for organizers
    const globalOrders = JSON.parse(localStorage.getItem('ticketa_global_orders_v1') || '[]');
    const updatedGlobal = [
      {
        id: orderResult.id,
        order_number: orderResult.orderNumber,
        event_id: payload.event.id,
        event_title: payload.event.title,
        customer_name: payload.buyer.fullName,
        customer_email: payload.buyer.email,
        customer_phone: payload.buyer.phoneNumber,
        total_amount: payload.totalAmount,
        subtotal: payload.subtotal,
        status: 'PAID',
        currency: 'NGN',
        payment_reference: paymentRef,
        created_at: orderResult.createdAt,
        quantity: payload.items.reduce((sum, it) => sum + it.quantity, 0),
        items: payload.items,
        tickets: orderResult.tickets,
      },
      ...globalOrders.filter((o: any) => o.id !== orderResult.id),
    ];
    localStorage.setItem('ticketa_global_orders_v1', JSON.stringify(updatedGlobal));

    // Event sales tracker map (eventId -> sales summary)
    const salesTracker = JSON.parse(localStorage.getItem('ticketa_event_sales_tracker_v1') || '{}');
    const prevEventSales = salesTracker[payload.event.id] || salesTracker[payload.event.title] || {
      sold: 0,
      revenue: 0,
      ticketTypes: {},
    };

    const addedQty = payload.items.reduce((sum, it) => sum + it.quantity, 0);
    const addedRev = payload.totalAmount;

    prevEventSales.sold = (Number(prevEventSales.sold) || 0) + addedQty;
    prevEventSales.revenue = (Number(prevEventSales.revenue) || 0) + addedRev;
    
    payload.items.forEach((it) => {
      prevEventSales.ticketTypes[it.ticketTypeName] = (prevEventSales.ticketTypes[it.ticketTypeName] || 0) + it.quantity;
    });

    salesTracker[payload.event.id] = prevEventSales;
    salesTracker[payload.event.title] = prevEventSales;
    if (payload.event.slug) {
      salesTracker[payload.event.slug] = prevEventSales;
    }
    localStorage.setItem('ticketa_event_sales_tracker_v1', JSON.stringify(salesTracker));

    // Broadcast update events across all components
    window.dispatchEvent(new CustomEvent('ticketa_order_created', { detail: orderResult }));
    window.dispatchEvent(new CustomEvent('ticketa_tickets_updated', { detail: { eventId: payload.event.id, quantity: addedQty, revenue: addedRev } }));
  } catch (err) {
    console.warn('LocalStorage order persistence error:', err);
  }

  return orderResult;
}

export async function updateTicketGuestName(
  orderIdOrNumber: string,
  ticketCode: string,
  newGuestName: string
): Promise<{ success: boolean; error?: string }> {
  if (!ticketCode || !newGuestName.trim()) {
    return { success: false, error: 'Please provide a valid guest name' };
  }

  const cleanName = newGuestName.trim();

  // 1. Update in local storage user orders
  try {
    const userOrders: CompletedOrderResult[] = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
    let updated = false;

    const newOrders = userOrders.map((ord) => {
      if (ord.id === orderIdOrNumber || ord.orderNumber === orderIdOrNumber || ord.tickets?.some((t) => t.ticketCode === ticketCode)) {
        const newTickets = (ord.tickets || []).map((t) => {
          if (t.ticketCode === ticketCode) {
            updated = true;
            return { ...t, attendeeName: cleanName };
          }
          return t;
        });
        return { ...ord, tickets: newTickets };
      }
      return ord;
    });

    if (updated) {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(newOrders));
    }

    // Also update global orders
    const globalOrders = JSON.parse(localStorage.getItem('ticketa_global_orders_v1') || '[]');
    const newGlobal = globalOrders.map((ord: any) => {
      if (ord.id === orderIdOrNumber || ord.orderNumber === orderIdOrNumber || ord.tickets?.some((t: any) => t.ticketCode === ticketCode)) {
        const newTickets = (ord.tickets || []).map((t: any) => {
          if (t.ticketCode === ticketCode) {
            return { ...t, attendeeName: cleanName, attendee_name: cleanName };
          }
          return t;
        });
        return { ...ord, tickets: newTickets };
      }
      return ord;
    });
    localStorage.setItem('ticketa_global_orders_v1', JSON.stringify(newGlobal));

    // Dispatch update events
    window.dispatchEvent(new CustomEvent('ticketa_tickets_updated'));
    window.dispatchEvent(new CustomEvent('ticketa_checkin_updated'));
  } catch (e) {
    console.warn('Local ticket name update error:', e);
  }

  // 2. Update in Supabase if online
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('tickets')
        .update({ attendee_name: cleanName, updated_at: new Date().toISOString() })
        .eq('ticket_code', ticketCode);
    } catch (e) {
      console.warn('Supabase DB ticket name update error:', e);
    }
  }

  return { success: true };
}

export async function getUserOrders(userEmail?: string, userId?: string): Promise<CompletedOrderResult[]> {
  // If user is NOT logged in (no email and no userId), return empty array
  if (!userEmail && !userId) {
    return [];
  }

  let dbOrders: CompletedOrderResult[] = [];

  if (isSupabaseConfigured) {
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
          customer_name,
          customer_email,
          customer_phone,
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
            attendee_name,
            attendee_email,
            ticket_types ( name, price )
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        dbOrders = data.map((ord: any) => {
          const rawTickets = ord.tickets || [];
          const totalPasses = rawTickets.length || 1;
          const mappedTickets: OrderTicketPass[] = rawTickets.map((t: any, idx: number) => ({
            ticketCode: t.ticket_code,
            ticketType: t.ticket_types?.name || 'General Admission',
            passNumber: idx + 1,
            totalPasses: totalPasses,
            unitPrice: Number(t.ticket_types?.price || 0),
            qrCodeHash: t.qr_code_hash,
            status: t.status || 'VALID',
            isCheckedIn: Boolean(t.is_checked_in),
            attendeeName: t.attendee_name || ord.customer_name || 'Guest Attendee',
            attendeeEmail: t.attendee_email || ord.customer_email || userEmail || '',
            seatZone: (t.ticket_types?.name || '').toLowerCase().includes('vip')
              ? 'VIP Circle • Priority Entry'
              : 'General Admission • Main Gate',
          }));

          return {
            id: ord.id,
            orderNumber: ord.order_number,
            eventId: ord.events?.id || '',
            eventTitle: ord.events?.title || 'Event',
            eventDate: ord.events?.start_time || new Date().toISOString(),
            eventVenue: ord.events?.venues ? `${ord.events.venues.name}, ${ord.events.venues.city}` : 'Lagos, Nigeria',
            eventBanner: ord.events?.banner_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            buyerName: ord.customer_name || 'Ticketa Attendee',
            buyerEmail: ord.customer_email || userEmail || '',
            buyerPhone: ord.customer_phone || '',
            paymentMethod: 'CARD',
            items: mappedTickets.reduce((acc: SelectedTicketItem[], curr: OrderTicketPass) => {
              const found = acc.find((i) => i.ticketTypeName === curr.ticketType);
              if (found) {
                found.quantity += 1;
                found.subtotal += curr.unitPrice;
              } else {
                acc.push({
                  ticketTypeName: curr.ticketType,
                  quantity: 1,
                  unitPrice: curr.unitPrice,
                  subtotal: curr.unitPrice,
                });
              }
              return acc;
            }, []),
            subtotal: Number(ord.total_amount),
            discountAmount: 0,
            serviceFee: 0,
            totalAmount: Number(ord.total_amount),
            status: ord.status === 'PAID' ? 'PAID' : 'PENDING',
            createdAt: ord.created_at,
            paymentReference: ord.payment_reference || '',
            tickets: mappedTickets,
          };
        });
      }
    } catch (e) {
      console.warn('Could not fetch user orders from Supabase DB:', e);
    }
  }

  // Merge with local storage orders so instant purchases show up seamlessly
  try {
    const localOrders: CompletedOrderResult[] = JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY) || '[]');
    const normalizedLocal = localOrders.map((ord) => {
      // Ensure all tickets have pass numbers & attendee names
      const totalPasses = ord.tickets?.length || 1;
      const enrichedTickets: OrderTicketPass[] = (ord.tickets || []).map((t, idx) => ({
        ...t,
        passNumber: t.passNumber || idx + 1,
        totalPasses: t.totalPasses || totalPasses,
        attendeeName: t.attendeeName || ord.buyerName || 'Guest Attendee',
        attendeeEmail: t.attendeeEmail || ord.buyerEmail || userEmail || '',
        seatZone: t.seatZone || (t.ticketType.toLowerCase().includes('vip') ? 'VIP Circle • Priority Access' : 'General Admission • Main Gate'),
      }));
      return { ...ord, tickets: enrichedTickets };
    });

    const combined = [...normalizedLocal];
    dbOrders.forEach((dbOrd) => {
      if (!combined.some((o) => o.orderNumber === dbOrd.orderNumber || o.id === dbOrd.id)) {
        combined.push(dbOrd);
      }
    });

    return combined;
  } catch (err) {
    console.warn('Error reading local orders:', err);
    return dbOrders;
  }
}
