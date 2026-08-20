import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Settings2,
  Edit3,
  DollarSign,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { EditEventModal } from './EditEventModal';
import { DeleteEventModal } from './DeleteEventModal';
import { WithdrawEarningsModal } from './WithdrawEarningsModal';
import { deleteOrganizerEvent } from '../services/organizerService';

interface OrganizerEventsProps {
  events: any[];
  orgId?: string;
  userId?: string;
  onOpenCreateModal?: () => void;
  onRefreshEvents?: () => void;
}

export const OrganizerEvents: React.FC<OrganizerEventsProps> = ({
  events = [],
  orgId,
  userId,
  onOpenCreateModal,
  onRefreshEvents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuEventId, setOpenMenuEventId] = useState<string | null>(null);

  // Modals state
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<any | null>(null);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState<any | null>(null);
  const [selectedEventForWithdraw, setSelectedEventForWithdraw] = useState<any | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.event-menu-container')) {
        setOpenMenuEventId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Compute real metrics from events array
  const totalEventsCount = events.length;
  const activeEventsCount = events.filter(
    (e) => e.status === 'PUBLISHED' || e.status === 'ACTIVE' || !e.status
  ).length;

  const totalTicketsSoldCount = events.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) {
      return acc + (Number(evt.total_sold) || 0);
    }
    const evtSold = evt.ticket_types.reduce(
      (sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0),
      0
    );
    return acc + evtSold;
  }, 0);

  const totalNetRevenue = events.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) {
      return acc + (Number(evt.revenue) || 0);
    }
    const evtRev = evt.ticket_types.reduce(
      (sub: number, tt: any) =>
        sub + (Number(tt.quantity_sold) || 0) * (Number(tt.price) || 0),
      0
    );
    return acc + evtRev;
  }, 0);

  // Filter events by search
  const filteredEvents = events.filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = evt.title?.toLowerCase().includes(q);
    const venueMatch =
      evt.venues?.name?.toLowerCase().includes(q) ||
      evt.venue?.toLowerCase().includes(q) ||
      evt.venue_name?.toLowerCase().includes(q);
    return titleMatch || venueMatch;
  });

  const handleDeleteEventConfirm = async (eventId: string) => {
    const res = await deleteOrganizerEvent(eventId, orgId);
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete event');
    }
    setActionSuccessMsg('Event deleted successfully.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
    if (onRefreshEvents) onRefreshEvents();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Events</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage your organization events, ticket tiers, and live gate performance
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#00b894] flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Events</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {totalEventsCount}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Active Events</span>
          <span className="text-2xl font-black text-[#00b894] tracking-tight block">
            {activeEventsCount}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Tickets Sold</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {totalTicketsSoldCount.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Net Revenue</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            ₦{totalNetRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events by title or venue..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#00b894] transition-colors shadow-xs"
        />
      </div>

      {/* Event Rows List */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => {
            const ticketTypes = evt.ticket_types || [];
            const totalAvail = ticketTypes.reduce(
              (s: number, t: any) => s + (Number(t.quantity_available) || 0),
              0
            );
            const totalSold = ticketTypes.reduce(
              (s: number, t: any) => s + (Number(t.quantity_sold) || 0),
              0
            );
            const totalCapacity = totalAvail + totalSold > 0 ? totalAvail + totalSold : (evt.total_capacity || 30);
            
            // Accurate progress bar percentage
            const progressVal =
              totalCapacity > 0
                ? Math.min(100, Math.round((totalSold / totalCapacity) * 100))
                : evt.progress_val || 0;

            const eventRevenue = ticketTypes.reduce(
              (s: number, t: any) =>
                s + (Number(t.quantity_sold) || 0) * (Number(t.price) || 0),
              0
            ) || Number(evt.revenue) || 0;

            const isMenuOpen = openMenuEventId === evt.id;
            const venueName =
              evt.venues?.name ||
              evt.venue ||
              evt.venue_name ||
              (evt.is_online ? 'Online Event' : 'Victoria Island, Lagos');

            const dateStr = evt.start_time
              ? new Date(evt.start_time).toLocaleString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : evt.date || 'Date & Time TBD';

            const bannerImg =
              evt.banner_image_url ||
              evt.image ||
              'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=600';

            return (
              <div
                key={evt.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#00b894]/40 transition-all relative"
              >
                {/* Event Image + Info Block */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 flex-1 min-w-0">
                  {/* Event Image with Top Upcoming Badge */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={bannerImg}
                      alt={evt.title}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-[#00b894] text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs">
                      {evt.status === 'PUBLISHED' || !evt.status ? 'Upcoming' : evt.status}
                    </span>
                  </div>

                  {/* Info: Title, Venue - Date and Time, Progress Bar */}
                  <div className="space-y-2.5 flex-1 min-w-0 w-full sm:w-auto">
                    {/* Event Title */}
                    <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight truncate">
                      {evt.title}
                    </h3>

                    {/* Venue - Date & Time */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="inline-flex items-center space-x-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{venueName}</span>
                      </span>
                      <span className="text-slate-300 font-bold">-</span>
                      <span className="inline-flex items-center space-x-1 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    {/* Progress Bar with 0/30 tickets and percentage */}
                    <div className="space-y-1.5 max-w-md pt-1">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                        <div
                          className="h-full bg-[#00b894] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(progressVal > 0 ? 3 : 0, progressVal)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="text-slate-600 font-medium">
                          <span className="text-slate-900 font-black">{totalSold}</span>/{totalCapacity} Tickets
                        </span>
                        <span className="text-[#00b894] font-black">{progressVal}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Revenue Top, Amount Underneath, 3 Dots Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-shrink-0 gap-3 sm:gap-2 sm:pl-4">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Revenue
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block">
                      ₦{eventRevenue.toLocaleString()}
                    </span>
                  </div>

                  {/* 3 Dots Menu Button and Dropdown */}
                  <div className="relative event-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuEventId(isMenuOpen ? null : evt.id);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 cursor-pointer shadow-xs"
                      title="Event Actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* 4-Item Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                        {/* 1. Manage Event */}
                        <button
                          onClick={() => {
                            setOpenMenuEventId(null);
                            setSelectedEventForEdit(evt);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Settings2 className="w-4 h-4 text-slate-400" />
                          <span>Manage Event</span>
                        </button>

                        {/* 2. Edit Event */}
                        <button
                          onClick={() => {
                            setOpenMenuEventId(null);
                            setSelectedEventForEdit(evt);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-[#00b894]" />
                          <span>Edit Event</span>
                        </button>

                        {/* 3. Withdraw Earnings */}
                        <button
                          onClick={() => {
                            setOpenMenuEventId(null);
                            setSelectedEventForWithdraw(evt);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          <span>Withdraw Earnings</span>
                        </button>

                        <div className="border-t border-slate-100 my-1" />

                        {/* 4. Delete Events */}
                        <button
                          onClick={() => {
                            setOpenMenuEventId(null);
                            setSelectedEventForDelete(evt);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          <span>Delete Event</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4 bg-white border border-slate-200/90 rounded-3xl space-y-4">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {searchQuery ? 'No matching events found' : 'No events created yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No events matching "${searchQuery}". Try a different keyword.`
                  : 'Start by creating your first event to publish tickets, manage attendees, and track revenue.'}
              </p>
            </div>
            {!searchQuery && onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="px-5 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#00b894]/20 transition-all inline-flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Event</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredEvents.length} of {events.length} events
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">Page 1 of 1</span>
            <button
              disabled
              className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedEventForEdit && (
        <EditEventModal
          event={selectedEventForEdit}
          isOpen={Boolean(selectedEventForEdit)}
          onClose={() => setSelectedEventForEdit(null)}
          onSuccess={() => {
            setSelectedEventForEdit(null);
            setActionSuccessMsg('Event details updated successfully!');
            setTimeout(() => setActionSuccessMsg(null), 4000);
            if (onRefreshEvents) onRefreshEvents();
          }}
        />
      )}

      {selectedEventForDelete && (
        <DeleteEventModal
          event={selectedEventForDelete}
          isOpen={Boolean(selectedEventForDelete)}
          onClose={() => setSelectedEventForDelete(null)}
          onConfirmDelete={handleDeleteEventConfirm}
        />
      )}

      {selectedEventForWithdraw && (
        <WithdrawEarningsModal
          event={selectedEventForWithdraw}
          isOpen={Boolean(selectedEventForWithdraw)}
          onClose={() => setSelectedEventForWithdraw(null)}
          onSuccess={() => {
            if (onRefreshEvents) onRefreshEvents();
          }}
        />
      )}
    </div>
  );
};
