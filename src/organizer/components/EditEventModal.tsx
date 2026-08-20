import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { EventCategory, EventStatus } from '../../types/database';
import { getEventCategories, updateOrganizerEvent } from '../services/organizerService';

interface EditEventModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      id?: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      quantity_available: number;
      quantity_sold?: number;
      min_per_order?: number;
      max_per_order?: number;
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
    banner_image_url: '',
    start_time: '',
    end_time: '',
    status: 'PUBLISHED',
    ticket_types: [],
  });

  // Populate form with existing event data
  useEffect(() => {
    async function loadData() {
      const cats = await getEventCategories();
      setCategories(cats);

      if (event) {
        // Format ISO strings for datetime-local input (YYYY-MM-DDTHH:mm)
        const formatForInput = (isoString?: string) => {
          if (!isoString) return '';
          try {
            const d = new Date(isoString);
            return d.toISOString().slice(0, 16);
          } catch {
            return '';
          }
        };

        const existingTicketTypes = (event.ticket_types && event.ticket_types.length > 0)
          ? event.ticket_types.map((tt: any) => ({
              id: tt.id,
              name: tt.name || 'Regular',
              description: tt.description || '',
              price: Number(tt.price) || 0,
              currency: tt.currency || 'NGN',
              quantity_available: Number(tt.quantity_available) || 100,
              quantity_sold: Number(tt.quantity_sold) || 0,
              min_per_order: Number(tt.min_per_order) || 1,
              max_per_order: Number(tt.max_per_order) || 10,
            }))
          : [
              {
                name: 'Regular',
                description: 'Standard event admission',
                price: 5000,
                currency: 'NGN',
                quantity_available: 200,
                quantity_sold: 0,
                min_per_order: 1,
                max_per_order: 10,
              },
            ];

        setForm({
          title: event.title || '',
          slug: event.slug || '',
          description: event.description || '',
          category_id: event.category_id || (cats[0]?.id || ''),
          is_online: Boolean(event.is_online),
          venue_name: event.venues?.name || event.venue || event.venue_name || '',
          venue_address: event.venues?.address || event.venue_address || '',
          venue_city: event.venues?.city || event.venue_city || 'Lagos',
          venue_country: event.venues?.country || event.venue_country || 'Nigeria',
          online_meeting_url: event.online_meeting_url || '',
          banner_image_url: event.banner_image_url || event.image || '',
          start_time: formatForInput(event.start_time),
          end_time: formatForInput(event.end_time),
          status: (event.status as EventStatus) || 'PUBLISHED',
          ticket_types: existingTicketTypes,
        });
      }
    }

    if (isOpen && event) {
      loadData();
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleImageFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setForm((prev) => ({
          ...prev,
          banner_image_url: e.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTicketType = () => {
    setForm((f) => ({
      ...f,
      ticket_types: [
        ...f.ticket_types,
        {
          name: 'VIP Pass',
          description: 'VIP Admission ticket',
          price: 15000,
          currency: 'NGN',
          quantity_available: 50,
          quantity_sold: 0,
          min_per_order: 1,
          max_per_order: 5,
        },
      ],
    }));
  };

  const handleRemoveTicketType = (index: number) => {
    if (form.ticket_types.length <= 1) {
      setError('You must have at least one ticket tier.');
      return;
    }
    setForm((f) => ({
      ...f,
      ticket_types: f.ticket_types.filter((_, idx) => idx !== index),
    }));
  };

  const handleTicketFieldChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setForm((f) => {
      const updated = [...f.ticket_types];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, ticket_types: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Event title is required.');
      return;
    }
    if (!form.is_online && !form.venue_name.trim()) {
      setError('Venue name is required for physical events.');
      return;
    }
    if (form.ticket_types.length === 0) {
      setError('Please configure at least one ticket tier.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await updateOrganizerEvent(event.id, {
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description,
        category_id: form.category_id,
        is_online: form.is_online,
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        venue_city: form.venue_city,
        venue_country: form.venue_country,
        online_meeting_url: form.online_meeting_url,
        banner_image_url: form.banner_image_url,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : new Date().toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : new Date().toISOString(),
        status: form.status,
        ticket_types: form.ticket_types.map((tt) => ({
          id: tt.id,
          name: tt.name,
          description: tt.description,
          price: Number(tt.price) || 0,
          currency: 'NGN',
          quantity_available: Number(tt.quantity_available) || 0,
          quantity_sold: Number(tt.quantity_sold) || 0,
          min_per_order: Number(tt.min_per_order) || 1,
          max_per_order: Number(tt.max_per_order) || 10,
        })),
      });

      if (!res.success) {
        setError(res.error || 'Failed to update event.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="edit-event-modal-dialog"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-xl font-black text-slate-900">Edit Event &amp; Tickets</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Update event information, add more tickets, or adjust pricing &amp; dates.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              1. Event Overview
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Omah Lay Live in Lagos"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#00b894]/20 focus:border-[#00b894] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#00b894] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#00b894] cursor-pointer"
                >
                  <option value="PUBLISHED">Published (Live for Sales)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what attendees should expect..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#00b894]"
              />
            </div>
          </div>

          {/* 2. Banner Image */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              2. Banner Poster
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {form.banner_image_url && (
                <img
                  src={form.banner_image_url}
                  alt="Banner preview"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                />
              )}

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={form.banner_image_url}
                  onChange={(e) => setForm({ ...form, banner_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{selectedFileName ? 'Change Image File' : 'Upload New Banner'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Schedule & Location */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              3. Date, Time &amp; Venue
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Start Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  End Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required={!form.is_online}
                  value={form.venue_name}
                  onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                  placeholder="e.g. Eko Hotel & Suites"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.venue_city}
                  onChange={(e) => setForm({ ...form, venue_city: e.target.value })}
                  placeholder="e.g. Lagos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                />
              </div>
            </div>
          </div>

          {/* 4. Ticket Tiers Management */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  4. Ticket Tiers &amp; Pricing
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Add more tickets, increase capacity, or modify tier prices.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTicketType}
                className="px-3.5 py-2 bg-[#e6faf5] text-[#00b894] hover:bg-[#d0f5ec] border border-[#a3f0db] rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ticket Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {form.ticket_types.map((ticket, index) => (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-black text-slate-700">
                      Tier #{index + 1}: {ticket.name || 'Tier'}
                    </span>
                    {form.ticket_types.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTicketType(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/60 transition-colors cursor-pointer"
                        title="Remove Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        required
                        value={ticket.name}
                        onChange={(e) => handleTicketFieldChange(index, 'name', e.target.value)}
                        placeholder="e.g. Regular, VIP"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Price (₦ NGN)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={ticket.price}
                        onChange={(e) => handleTicketFieldChange(index, 'price', Number(e.target.value))}
                        placeholder="5000"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Quantity Available
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={ticket.quantity_available}
                        onChange={(e) => handleTicketFieldChange(index, 'quantity_available', Number(e.target.value))}
                        placeholder="100"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
