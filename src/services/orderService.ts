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
        // Insert order row
        const { data: orderData } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            user_id: currentUserId,
            event_id: payload.event.id.startsWith('evt-') ? null : payload.event.id,
            total_amount: payload.totalAmount,
            currency: 'NGN',
            status: 'PAID',
            payment_reference: paymentRef,
          })
          .select()
          .single();

        if (orderData?.id) {
          // Insert payment row
          await supabase.from('payments').insert({
            order_id: orderData.id,
            provider: 'PAYSTACK',
            transaction_reference: paymentRef,
            amount: payload.totalAmount,
            currency: 'NGN',
            status: 'SUCCESSFUL',
            payment_method: payload.paymentMethod,
          });

          // Insert tickets with user_id attached for RLS
          const ticketsToInsert = generatedTickets.map((t) => ({
            ticket_code: t.ticketCode,
            qr_code_hash: t.qrCodeHash,
            order_id: orderData.id,
            event_id: payload.event.id.startsWith('evt-') ? null : payload.event.id,
            user_id: currentUserId,
            status: 'VALID',
            is_checked_in: false,
          }));

          await supabase.from('tickets').insert(ticketsToInsert);
        }
      }
    } catch (e) {
      console.warn('Supabase DB order insertion notice:', e);
    }
  }

  // 2. Always persist locally for offline access & instant wallet view
  const existingStr = localStorage.getItem(STORAGE_ORDERS_KEY);
  let existingOrders: CompletedOrderResult[] = [];
  if (existingStr) {
    try {
      existingOrders = JSON.parse(existingStr);
    } catch (e) {}
  }

  existingOrders.unshift(orderResult);
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(existingOrders));

  return orderResult;
}

export function getUserOrders(): CompletedOrderResult[] {
  const existingStr = localStorage.getItem(STORAGE_ORDERS_KEY);
  if (!existingStr) return [];
  try {
    return JSON.parse(existingStr);
  } catch (e) {
    return [];
  }
}
