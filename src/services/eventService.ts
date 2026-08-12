import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_SEED_EVENTS, SeedEventData } from '../data/seedEvents';

export interface EventFilterOptions {
  searchQuery?: string;
  category?: string;
  location?: string;
  dateFilter?: 'all' | 'today' | 'this-week' | 'this-month' | 'upcoming';
  priceFilter?: 'all' | 'free' | 'paid' | 'under-50k' | 'over-50k';
  sortBy?: 'trending' | 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';
}

export async function getAllEvents(filters: EventFilterOptions = {}): Promise<SeedEventData[]> {
  let eventsList: SeedEventData[] = [];

  if (isSupabaseConfigured) {
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
          venues (
            name,
            address,
            city,
            country
          ),
          organizations (
            name,
            logo_url,
            description
          ),
          event_categories (
            name,
            slug,
            icon_name
          ),
          ticket_types (
            name,
            description,
            price,
            currency,
            quantity_available,
            quantity_sold
          )
        `)
        .eq('status', 'PUBLISHED');

      if (!error && data && data.length > 0) {
        eventsList = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          description: item.description || '',
          category: (item.event_categories?.name as any) || 'Concert',
          category_slug: item.event_categories?.slug || 'concert',
          category_icon: item.event_categories?.icon_name || 'Music',
          banner_image_url: item.banner_image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
          start_time: item.start_time,
          end_time: item.end_time,
          is_featured: Boolean(item.is_featured),
          is_trending: true,
          is_online: Boolean(item.is_online),
          online_meeting_url: item.online_meeting_url,
          venue_name: item.venues?.name || 'Main Event Venue',
          venue_address: item.venues?.address || 'Lagos, Nigeria',
          venue_city: item.venues?.city || 'Lagos, Nigeria',
          venue_country: item.venues?.country || 'Nigeria',
          organizer_name: item.organizations?.name || 'Ticketa Verified Organizer',
          organizer_logo: item.organizations?.logo_url || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80',
          organizer_description: item.organizations?.description || 'Verified event organizer on Ticketa.',
          organizer_verified: true,
          ticket_types: (item.ticket_types || []).map((tt: any) => ({
            name: tt.name,
            description: tt.description || '',
            price: Number(tt.price || 0),
            currency: tt.currency || 'NGN',
            quantity_available: tt.quantity_available || 1000,
            quantity_sold: tt.quantity_sold || 0,
          })),
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase, falling back to seed dataset:', e);
    }
  }

  if (eventsList.length === 0) {
    eventsList = INITIAL_SEED_EVENTS;
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

  if (filters.location && filters.location !== 'all') {
    const loc = filters.location.toLowerCase();
    filtered = filtered.filter((e) => e.venue_city.toLowerCase().includes(loc) || e.venue_country.toLowerCase().includes(loc));
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
  return found || events[0] || null;
}
