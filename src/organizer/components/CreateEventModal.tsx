import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  Plus,
  Trash2,
  Globe,
  Image,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { EventCategory, EventStatus } from '../../types/database';
import {
  getEventCategories,
  createOrganizerEvent,
  CreateEventInput,
  isValidUUID,
} from '../services/organizerService';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';

interface CreateEventModalProps {
  orgId: string;
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  orgId,
  userId,
  onSuccess,
  onClose,
}) => {
  const { organization, organizationId, organizations } = useOrganizer();
  const { user } = useAuth();

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveOrgId = (orgId && isValidUUID(orgId))
    ? orgId
    : (organizationId && isValidUUID(organizationId))
    ? organizationId
    : (organization?.id && isValidUUID(organization.id))
    ? organization.id
    : (organizations.find((o) => isValidUUID(o.id))?.id || '');

  const effectiveUserId = (userId && isValidUUID(userId))
    ? userId
    : (user?.id && isValidUUID(user.id))
    ? user.id
    : '';

  const [form, setForm] = useState<{
    title: string;
    slug: string;
    description: string;
    category_id: string;
    is_online: boolean;
    venue_name: string;
    venue_address: string;
    venue_city: string;
    venue_country: string;
    online_meeting_url: string;
    banner_image_url: string;
    start_time: string;
    end_time: string;
    status: EventStatus;
    ticket_types: {
      name: string;
      description: string;
      price: number;
      currency: string;
      quantity_available: number;
      min_per_order: number;
      max_per_order: number;
    }[];
  }>({
    title: '',
    slug: '',
    description: '',
    category_id: '',
    is_online: false,
    venue_name: '',
    venue_address: '',
    venue_city: 'Lagos',
    venue_country: 'Nigeria',
    online_meeting_url: '',
    banner_image_url:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    start_time: '',
    end_time: '',
    status: 'PUBLISHED',
    ticket_types: [
      {
        name: 'Regular',
        description: 'Standard event admission ticket',
        price: 5000,
        currency: 'NGN',
        quantity_available: 200,
        min_per_order: 1,
        max_per_order: 10,
      },
    ],
  });

  useEffect(() => {
    async function loadCats() {
      const cats = await getEventCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setForm((f) => ({ ...f, category_id: cats[0].id }));
      }
    }
    loadCats();

    const now = new Date();
    now.setDate(now.getDate() + 7);
    now.setHours(18, 0, 0, 0);
    const startIso = now.toISOString().slice(0, 16);

    const end = new Date(now);
    end.setHours(23, 0, 0, 0);
    const endIso = end.toISOString().slice(0, 16);

    setForm((f) => ({
      ...f,
      start_time: startIso,
      end_time: endIso,
    }));
  }, []);

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    setForm((f) => ({
      ...f,
      title: val,
      slug: slug || 'event',
    }));
  };

  const addTicketType = () => {
    setForm((f) => ({
      ...f,
      ticket_types: [
        ...f.ticket_types,
        {
          name: 'VIP',
          description: 'VIP admission ticket',
          price: 25000,
          currency: 'NGN',
          quantity_available: 50,
          min_per_order: 1,
          max_per_order: 5,
        },
      ],
    }));
  };

  const removeTicketType = (index: number) => {
    if (form.ticket_types.length <= 1) return;
    setForm((f) => ({
      ...f,
      ticket_types: f.ticket_types.filter((_, i) => i !== index),
    }));
  };

  const updateTicketType = (index: number, key: string, value: any) => {
    setForm((f) => {
      const copy = [...f.ticket_types];
      copy[index] = { ...copy[index], [key]: value };
      return { ...f, ticket_types: copy };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Event title is required.');
      return;
    }
    if (!form.start_time || !form.end_time) {
      setError('Start time and end time are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: CreateEventInput = {
      title: form.title,
      slug: `${form.slug}-${Date.now().toString().slice(-4)}`,
      description: form.description,
      category_id: form.category_id || undefined,
      is_online: form.is_online,
      venue_name: form.venue_name || (form.is_online ? 'Online Event' : 'Main Venue'),
      venue_address: form.venue_address || form.venue_city,
      venue_city: form.venue_city,
      venue_country: form.venue_country,
      online_meeting_url: form.online_meeting_url || undefined,
      banner_image_url: form.banner_image_url,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      status: form.status,
      ticket_types: form.ticket_types,
    };

    const res = await createOrganizerEvent(effectiveOrgId, effectiveUserId, payload);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Failed to create event in Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#00b894]/20 text-[#00b894] font-bold flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Event</h2>
            <p className="text-xs text-slate-400">Add an event and set up ticket tiers in PostgreSQL</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-2">
          {/* General Event Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#00b894] uppercase tracking-wider">1. Basic Details</h3>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Event Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lagos Tech Summit 2026, Afrobeats Live"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="">Concert / General</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Publish Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="PUBLISHED">Published (Visible to attendees immediately)</option>
                  <option value="DRAFT">Draft (Saved to database, unpublished)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Detailed information about speakers, artists, dress code, schedule..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none resize-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Banner Image URL</label>
              <input
                type="url"
                value={form.banner_image_url}
                onChange={(e) => setForm({ ...form, banner_image_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Location / Venue */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#00b894] uppercase tracking-wider">2. Date &amp; Location</h3>
              <label className="flex items-center space-x-2 text-slate-300 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_online}
                  onChange={(e) => setForm({ ...form, is_online: e.target.checked })}
                  className="rounded text-[#00b894] focus:ring-0 cursor-pointer"
                />
                <span>Online Event</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                />
              </div>
            </div>

            {!form.is_online ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Venue Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Eko Convention Centre"
                    value={form.venue_name}
                    onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 1415 Victoria Island"
                    value={form.venue_address}
                    onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={form.venue_city}
                    onChange={(e) => setForm({ ...form, venue_city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-300 mb-1">Online Meeting / Stream URL</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/123456789 or Google Meet"
                  value={form.online_meeting_url}
                  onChange={(e) => setForm({ ...form, online_meeting_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                />
              </div>
            )}
          </div>

          {/* Ticket Types Tiers */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#00b894] uppercase tracking-wider">3. Ticket Types</h3>
              <button
                type="button"
                onClick={addTicketType}
                className="text-xs font-bold text-[#00b894] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ticket Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.ticket_types.map((tt, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-xs">Tier #{idx + 1}</span>
                    {form.ticket_types.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Tier Name</label>
                      <input
                        type="text"
                        required
                        value={tt.name}
                        onChange={(e) => updateTicketType(idx, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Price (NGN)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={tt.price}
                        onChange={(e) => updateTicketType(idx, 'price', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-3 py-2 text-white text-xs outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Quantity Available</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={tt.quantity_available}
                        onChange={(e) => updateTicketType(idx, 'quantity_available', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#00b894] hover:bg-[#00a383] text-white font-bold shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Event to Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
