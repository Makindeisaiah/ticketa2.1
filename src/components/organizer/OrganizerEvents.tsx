import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Ticket,
  Clock,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { updateEventStatus } from '../../services/organizerService';
import { EventStatus } from '../../types/database';

interface OrganizerEventsProps {
  events: any[];
  orgId: string;
  userId: string;
  onRefresh: () => void;
  onOpenCreateEvent: () => void;
}

export const OrganizerEvents: React.FC<OrganizerEventsProps> = ({
  events,
  orgId,
  userId,
  onRefresh,
  onOpenCreateEvent,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredEvents = events.filter((evt) => {
    if (filterStatus !== 'ALL' && evt.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        (evt.venues?.name || '').toLowerCase().includes(q) ||
        (evt.venues?.city || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleTogglePublish = async (eventId: string, currentStatus: EventStatus) => {
    const nextStatus: EventStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setUpdatingId(eventId);
    await updateEventStatus(eventId, nextStatus, userId, orgId);
    setUpdatingId(null);
    onRefresh();
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Events &amp; Tickets Management</h2>
          <p className="text-xs text-slate-400">
            Create, publish, and inspect event sales directly in PostgreSQL
          </p>
        </div>

        <button
          onClick={onOpenCreateEvent}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'PUBLISHED', 'DRAFT', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#00b894] text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl pl-10 pr-4 py-2 text-white text-xs outline-none"
          />
        </div>
      </div>

      {/* Events List Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No events match your criteria</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or create a new event for this organization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const ticketTypes = evt.ticket_types || [];
            const minPrice =
              ticketTypes.length > 0
                ? Math.min(...ticketTypes.map((t: any) => Number(t.price || 0)))
                : 0;

            const isPublished = evt.status === 'PUBLISHED';

            return (
              <div
                key={evt.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all"
              >
                {/* Image Banner & Status Badge */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={
                      evt.banner_image_url ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-lg ${
                      isPublished
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>

                {/* Event Body Info */}
                <div className="p-5 space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-[#00b894] uppercase tracking-wider block">
                      {evt.event_categories?.name || 'Event'}
                    </span>
                    <h3 className="text-base font-extrabold text-white line-clamp-1">{evt.title}</h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{new Date(evt.start_time).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">
                        {evt.is_online ? 'Online Event' : evt.venues?.name || 'Venue'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Tiers Summary */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">STARTING AT</span>
                      <span className="font-extrabold text-white">{formatMoney(minPrice)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-bold">TICKET TIERS</span>
                      <span className="font-bold text-[#00b894]">{ticketTypes.length} Tiers</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePublish(evt.id, evt.status)}
                    disabled={updatingId === evt.id}
                    className={`flex-1 font-bold text-xs py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                      isPublished
                        ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                        : 'border-[#00b894]/30 text-[#00b894] hover:bg-[#00b894]/10'
                    }`}
                  >
                    {updatingId === evt.id
                      ? 'Updating...'
                      : isPublished
                      ? 'Unpublish to Draft'
                      : 'Publish Event'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
