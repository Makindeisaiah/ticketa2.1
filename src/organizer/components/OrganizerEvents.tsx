import React, { useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Ticket,
  Calendar,
} from 'lucide-react';

interface OrganizerEventsProps {
  events: any[];
  orgId?: string;
  userId?: string;
  onOpenCreateModal?: () => void;
  onRefreshEvents?: () => void;
}

export const OrganizerEvents: React.FC<OrganizerEventsProps> = ({
  events,
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Compute real metrics from events array
  const totalEventsCount = events.length;
  const activeEventsCount = events.filter((e) => e.status === 'PUBLISHED' || e.status === 'ACTIVE' || !e.status).length;

  const totalTicketsSoldCount = events.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    const evtSold = evt.ticket_types.reduce((sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0), 0);
    return acc + evtSold;
  }, 0);

  const totalNetRevenue = events.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    const evtRev = evt.ticket_types.reduce((sub: number, tt: any) => sub + ((Number(tt.quantity_sold) || 0) * (Number(tt.price) || 0)), 0);
    return acc + evtRev;
  }, 0);

  // Filter events by search
  const filteredEvents = events.filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = evt.title?.toLowerCase().includes(q);
    const venueMatch = evt.venues?.name?.toLowerCase().includes(q) || evt.venue?.toLowerCase().includes(q);
    return titleMatch || venueMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Events</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Manage your organization events and ticketing
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-black text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Event</span>
          <span className="text-2xl font-black text-white tracking-tight block">{totalEventsCount}</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Active Events</span>
          <span className="text-2xl font-black text-white tracking-tight block">{activeEventsCount}</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Ticket Sold</span>
          <span className="text-2xl font-black text-white tracking-tight block">{totalTicketsSoldCount.toLocaleString()}</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Net Revenue</span>
          <span className="text-2xl font-black text-white tracking-tight block">₦{totalNetRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events..."
          className="w-full bg-[#111723]/90 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-colors"
        />
      </div>

      {/* Event Rows List */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => {
            const ticketTypes = evt.ticket_types || [];
            const totalAvail = ticketTypes.reduce((s: number, t: any) => s + (Number(t.quantity_available) || 0), 0);
            const totalSold = ticketTypes.reduce((s: number, t: any) => s + (Number(t.quantity_sold) || 0), 0);
            const totalCapacity = totalAvail + totalSold;
            const progressVal = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
            const eventRevenue = ticketTypes.reduce((s: number, t: any) => s + ((Number(t.quantity_sold) || 0) * (Number(t.price) || 0)), 0);

            const isFastSelling = progressVal >= 70;
            const isAverageSelling = progressVal >= 30 && progressVal < 70;

            return (
              <div
                key={evt.id}
                className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-700/80 transition-all"
              >
                {/* Event Image & Main Info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <img
                    src={evt.banner_image_url || evt.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=600'}
                    alt={evt.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                  />
                  <div className="space-y-1 truncate">
                    <h3 className="font-black text-white text-base truncate">{evt.title}</h3>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {evt.start_time
                        ? new Date(evt.start_time).toLocaleString('en-US', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : evt.date || 'Date TBD'}
                    </p>
                    <p className="text-xs text-slate-500 font-normal truncate">
                      {evt.venues?.name || evt.venue || (evt.is_online ? 'Online Event' : 'Venue TBD')}
                    </p>
                  </div>
                </div>

                {/* Progress & Status Badges */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                  {/* Progress bar */}
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>Sold</span>
                      <span>{progressVal}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00b894] rounded-full"
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Tag */}
                  <span className="px-3 py-1 bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] rounded-full text-xs font-bold capitalize">
                    {evt.status || 'Published'}
                  </span>

                  {/* Tickets counts */}
                  <div className="text-xs font-medium text-slate-300 space-y-0.5 min-w-[120px]">
                    <div className="font-bold text-white">{totalSold.toLocaleString()} Tickets Sold</div>
                    <div className="text-slate-400 text-[11px]">{totalAvail.toLocaleString()} Available</div>
                  </div>

                  {/* Sales Tag */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black flex items-center space-x-1 ${
                      isFastSelling
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : isAverageSelling
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{isFastSelling ? '⚡' : isAverageSelling ? '📈' : '📊'}</span>
                    <span>{isFastSelling ? 'Selling Fast' : isAverageSelling ? 'Average Sales' : 'Standard'}</span>
                  </span>

                  {/* Revenue */}
                  <div className="text-right min-w-[120px]">
                    <span className="text-xs text-slate-400 block font-medium">Revenue</span>
                    <span className="text-sm font-black text-white block">₦{eventRevenue.toLocaleString()}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2">
                    {onOpenCreateModal && (
                      <button
                        onClick={() => onOpenCreateModal()}
                        className="px-3 py-1.5 bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4 bg-[#111723]/90 border border-slate-800/80 rounded-2xl space-y-4">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {searchQuery ? 'No matching events found' : 'No events created yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No events matching "${searchQuery}". Try a different keyword.`
                  : 'Start by creating your first event to publish tickets, manage attendees, and track revenue.'}
              </p>
            </div>
            {!searchQuery && onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="px-5 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#00b894]/20 transition-all inline-flex items-center space-x-2 cursor-pointer"
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
          <span className="text-xs text-slate-400 font-medium">
            Showing 1 to {filteredEvents.length} of {filteredEvents.length}
          </span>

          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-xl bg-[#00b894] text-white font-black text-xs flex items-center justify-center cursor-pointer">
              1
            </button>
            <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
