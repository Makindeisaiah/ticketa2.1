import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SeedEventData } from '../data/seedEvents';

export interface EventFilterOptions {
  searchQuery?: string;
  category?: string;
  location?: string;
  dateFilter?: 'all' | 'today' | 'this-weekend' | 'this-week' | 'this-month' | 'next-month' | 'upcoming';
  priceFilter?: 'all' | 'free' | 'paid' | 'under-50k' | 'over-50k';
  sortBy?: 'trending' | 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';
}

export async function getAllEvents(filters: EventFilterOptions = {}): Promise<SeedEventData[]> {
  let eventsList: SeedEventData[] = [];

  if (isSupabaseConfigured) {
    try {
      // 1. Primary query: fetch all events
      let rawData: any[] = [];
      let fetchError: any = null;

      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            slug,
            description,
            banner_image_url,
            start_time,
            end_time,
            is_featured,
            is_online,
            online_meeting_url,
            status,
            organization_id,
            venue_id,
            category_id,
            venues (
              name,
              address,
              city,
              country
            ),
            event_categories (
              name,
              slug,
              icon_name
            ),
            ticket_types (
              id,
              name,
              description,
              price,
              currency,
              quantity_available,
              quantity_sold
            )
          `)
          .order('start_time', { ascending: true });

        if (!error && data && data.length > 0) {
          rawData = data;
        } else if (error) {
          fetchError = error;
        }
      } catch (err) {
        fetchError = err;
      }

      // Fallback query if joined select errored or returned empty
      if (rawData.length === 0) {
        try {
          const { data: fallbackData, error: fbErr } = await supabase
            .from('events')
            .select('*, venues(*), event_categories(*), ticket_types(*)')
            .order('created_at', { ascending: false });

          if (!fbErr && fallbackData && fallbackData.length > 0) {
            rawData = fallbackData;
            fetchError = null;
          } else {
            const { data: rawEvents } = await supabase.from('events').select('*');
            if (rawEvents && rawEvents.length > 0) {
              rawData = rawEvents;
              fetchError = null;
            }
          }
        } catch (e) {
          console.warn('Fallback event fetch notice:', e);
        }
      }

      // If we have events, fetch missing ticket_types or venues if needed
      if (rawData.length > 0) {
        const eventIds = rawData.map((e) => e.id).filter(Boolean);

        // Fetch ticket types for any events missing them
        const eventsMissingTickets = rawData.filter((e) => !e.ticket_types || e.ticket_types.length === 0);
        let extraTicketTypesByEvent: Record<string, any[]> = {};
        if (eventsMissingTickets.length > 0 && eventIds.length > 0) {
          try {
            const { data: tts } = await supabase
              .from('ticket_types')
              .select('*')
              .in('event_id', eventIds);
            (tts || []).forEach((tt: any) => {
              if (!extraTicketTypesByEvent[tt.event_id]) extraTicketTypesByEvent[tt.event_id] = [];
              extraTicketTypesByEvent[tt.event_id].push(tt);
            });
          } catch (e) {
            // ignore
          }
        }

        // Fetch organizations names if available
        const orgIds = Array.from(new Set(rawData.map((e) => e.organization_id).filter(Boolean)));
        let orgsById: Record<string, any> = {};
        if (orgIds.length > 0) {
          try {
            const { data: orgs } = await supabase
              .from('organizations')
              .select('id, name, logo_url, description')
              .in('id', orgIds);
            (orgs || []).forEach((o: any) => {
              orgsById[o.id] = o;
            });
          } catch (e) {
            // ignore
          }
        }

        eventsList = rawData
          .filter((item: any) => item && (item.id || item.slug))
          .map((item: any) => {
            const org = orgsById[item.organization_id] || item.organizations || null;
            const tts =
              (item.ticket_types && item.ticket_types.length > 0)
                ? item.ticket_types
                : (extraTicketTypesByEvent[item.id] || []);

            const categoryName = item.event_categories?.name || 'Concert';
            const categorySlug = item.event_categories?.slug || 'concert';
            const categoryIcon = item.event_categories?.icon_name || 'Music';

            return {
              id: item.id,
              title: item.title || 'Untitled Event',
              slug: item.slug || `event-${item.id}`,
              description: item.description || '',
              category: categoryName,
              category_slug: categorySlug,
              category_icon: categoryIcon,
              banner_image_url:
                item.banner_image_url ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
              start_time: item.start_time || new Date().toISOString(),
              end_time: item.end_time || new Date(Date.now() + 86400000).toISOString(),
              is_featured: Boolean(item.is_featured),
              is_trending: true,
              is_online: Boolean(item.is_online),
              online_meeting_url: item.online_meeting_url || null,
              venue_name: item.venues?.name || item.venue_name || (item.is_online ? 'Online Event' : 'Main Event Venue'),
              venue_address: item.venues?.address || item.venue_address || (item.is_online ? 'Virtual' : 'Lagos, Nigeria'),
              venue_city: item.venues?.city || item.venue_city || 'Lagos',
              venue_country: item.venues?.country || item.venue_country || 'Nigeria',
              organizer_name: org?.name || 'Ticketa Verified Organizer',
              organizer_logo: org?.logo_url || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80',
              organizer_description: org?.description || 'Verified event organizer on Ticketa.',
              organizer_verified: true,
              status: item.status || 'PUBLISHED',
              ticket_types: (tts && tts.length > 0)
                ? tts.map((tt: any) => {
                    const avail = Number(tt.quantity_available !== undefined && tt.quantity_available !== null ? tt.quantity_available : 0);
                    const sold = Number(tt.quantity_sold || 0);
                    return {
                      id: tt.id,
                      name: tt.name || 'General Admission',
                      description: tt.description || '',
                      price: Number(tt.price || 0),
                      currency: tt.currency || 'NGN',
                      quantity_available: avail,
                      quantity_sold: sold,
                      is_sold_out: avail <= 0 && (avail + sold > 0),
                    };
                  })
                : [
                    {
                      id: `tt-${item.id}-default`,
                      name: 'General Admission',
                      description: 'Standard event admission',
                      price: 0,
                      currency: 'NGN',
                      quantity_available: 100,
                      quantity_sold: 0,
                      is_sold_out: false,
                    },
                  ],
            };
          });
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase:', e);
    }
  }

  // Real data only: if database is empty, eventsList is []
  if (!eventsList || eventsList.length === 0) {
    return [];
  }

  // Live reconciliation with local sales tracker
  try {
    const salesTracker = JSON.parse(localStorage.getItem('ticketa_event_sales_tracker_v1') || '{}');
    eventsList = eventsList.map((item) => {
      const tracker = salesTracker[item.id] || (item.slug ? salesTracker[item.slug] : null);
      const trackerTts = tracker?.ticketTypes || {};

      let totalSoldAgg = 0;
      let totalCapacityAgg = 0;

      const updatedTicketTypes = item.ticket_types.map((tt) => {
        const extraSold = Number(trackerTts[tt.name]) || 0;
        const totalSold = Math.max(Number(tt.quantity_sold || 0), extraSold);
        const originalCapacity = (Number(tt.quantity_available) || 0) + (Number(tt.quantity_sold) || 0);
        const remainingAvail = Math.max(0, originalCapacity - totalSold);
        
        totalSoldAgg += totalSold;
        totalCapacityAgg += originalCapacity;

        return {
          ...tt,
          quantity_sold: totalSold,
          quantity_available: remainingAvail,
          is_sold_out: remainingAvail <= 0 && originalCapacity > 0,
        };
      });

      const isSoldOut =
        Boolean(item.is_sold_out) ||
        item.status === 'SOLD_OUT' ||
        (updatedTicketTypes.length > 0 && updatedTicketTypes.every((tt) => Number(tt.quantity_available) <= 0)) ||
        (totalCapacityAgg > 0 && totalSoldAgg >= totalCapacityAgg);

      return {
        ...item,
        ticket_types: updatedTicketTypes,
        total_sold: totalSoldAgg,
        total_capacity: totalCapacityAgg,
        total_available: Math.max(0, totalCapacityAgg - totalSoldAgg),
        is_sold_out: isSoldOut,
      };
    });
  } catch (e) {
    console.warn('Sales reconciliation notice:', e);
  }

  // Apply filters in memory
  let filtered = [...eventsList];

  if (filters.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.organizer_name.toLowerCase().includes(q) ||
        e.venue_city.toLowerCase().includes(q) ||
        e.venue_name.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== 'all') {
    const cat = filters.category.toLowerCase();
    filtered = filtered.filter((e) => e.category_slug.toLowerCase() === cat || e.category.toLowerCase() === cat);
  }

  if (filters.location && filters.location !== 'all' && filters.location.trim() !== '') {
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’]/g, '');

    const targetLoc = normalize(filters.location);

    filtered = filtered.filter((e) => {
      const city = normalize(e.venue_city || '');
      const country = normalize(e.venue_country || '');
      const venue = normalize(e.venue_name || '');
      const addr = normalize(e.venue_address || '');

      return (
        city.includes(targetLoc) ||
        country.includes(targetLoc) ||
        venue.includes(targetLoc) ||
        addr.includes(targetLoc) ||
        targetLoc.includes(city) ||
        targetLoc.includes(country)
      );
    });
  }

  if (filters.dateFilter && filters.dateFilter !== 'all') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (filters.dateFilter === 'today') {
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_time);
        return d >= startOfToday && d <= endOfToday;
      });
    } else if (filters.dateFilter === 'this-weekend') {
      const dayOfWeek = now.getDay();
      const distToFriday = (5 - dayOfWeek + 7) % 7;
      const fridayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distToFriday, 0, 0, 0);
      const sundayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distToFriday + 2, 23, 59, 59);
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_time);
        return d >= fridayStart && d <= sundayEnd;
      });
    } else if (filters.dateFilter === 'this-week') {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()), 23, 59, 59);
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_time);
        return d >= startOfWeek && d <= endOfWeek;
      });
    } else if (filters.dateFilter === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_time);
        return d >= startOfMonth && d <= endOfMonth;
      });
    } else if (filters.dateFilter === 'next-month') {
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_time);
        return d >= startOfNextMonth && d <= endOfNextMonth;
      });
    }
  }

  if (filters.priceFilter && filters.priceFilter !== 'all') {
    if (filters.priceFilter === 'free') {
      filtered = filtered.filter((e) => e.ticket_types.some((tt) => tt.price === 0));
    } else if (filters.priceFilter === 'paid') {
      filtered = filtered.filter((e) => e.ticket_types.some((tt) => tt.price > 0));
    } else if (filters.priceFilter === 'under-50k') {
      filtered = filtered.filter((e) => e.ticket_types.some((tt) => tt.price <= 50000));
    } else if (filters.priceFilter === 'over-50k') {
      filtered = filtered.filter((e) => e.ticket_types.some((tt) => tt.price > 50000));
    }
  }

  if (filters.sortBy) {
    if (filters.sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    } else if (filters.sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    } else if (filters.sortBy === 'price-asc') {
      filtered.sort((a, b) => {
        const minA = Math.min(...a.ticket_types.map((t) => t.price));
        const minB = Math.min(...b.ticket_types.map((t) => t.price));
        return minA - minB;
      });
    } else if (filters.sortBy === 'price-desc') {
      filtered.sort((a, b) => {
        const minA = Math.min(...a.ticket_types.map((t) => t.price));
        const minB = Math.min(...b.ticket_types.map((t) => t.price));
        return minB - minA;
      });
    }
  }

  return filtered;
}

export async function getEventById(id: string): Promise<SeedEventData | null> {
  const events = await getAllEvents();
  const found = events.find((e) => e.id === id || e.slug === id);
  return found || null;
}
