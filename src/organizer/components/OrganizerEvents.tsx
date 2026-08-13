import React, { useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Ticket,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface OrganizerEventsProps {
  events: any[];
  orgId: string;
  userId: string;
  onOpenCreateModal: () => void;
  onRefreshEvents: () => void;
}

export const OrganizerEvents: React.FC<OrganizerEventsProps> = ({
  events,
  orgId,
  userId,
  onOpenCreateModal,
  onRefreshEvents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Default events matching Figma design if empty or fallback
  const displayEvents = events.length > 0 ? events : [
    {
      id: 'evt_1',
      title: 'Davido Live in Lagos',
      date: 'Thu 25, Dec - 19:00 PM',
      venue: 'Eko Convention Center',
      progress: 83,
      status: 'Upcoming',
      ticketsSold: '20,000 Tickets',
      checkIns: '16,692 Check-ins',
      tag: 'Selling Fast',
      tagType: 'fast', // fast, average, low
      revenue: '#2,329,909,900',
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'evt_2',
      title: 'Asake Live in Lagos',
      date: 'Fri 26, Dec - 20:00 PM',
      venue: 'Eko Hotel Grounds',
      progress: 52,
      status: 'Upcoming',
      ticketsSold: '20,000 Tickets',
      checkIns: '14,526 Check-ins',
      tag: 'Average Sales',
      tagType: 'average',
      revenue: '#10,545,000',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'evt_3',
      title: 'Burna Boy Live in Lagos',
      date: 'Sat 27, Dec - 19:00 PM',
      venue: 'Balmoral Convention Center, VI',
      progress: 35,
      status: 'Upcoming',
      ticketsSold: '20,000 Tickets',
      checkIns: '8,526 Check-ins',
      tag: 'Low Sales',
      tagType: 'low',
      revenue: '#5,358,000',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Events</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Here are your event seats
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-black text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Event</span>
          <span className="text-2xl font-black text-white tracking-tight block">12</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Active Events</span>
          <span className="text-2xl font-black text-white tracking-tight block">8</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Ticket Sold</span>
          <span className="text-2xl font-black text-white tracking-tight block">65,892</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Net Revenue</span>
          <span className="text-2xl font-black text-white tracking-tight block">#3,134,963,500</span>
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
          placeholder="Q Search events"
          className="w-full bg-[#111723]/90 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-colors"
        />
      </div>

      {/* Event Rows List */}
      <div className="space-y-4">
        {displayEvents.map((evt) => {
          const progressVal = evt.progress || 75;
          return (
            <div
              key={evt.id}
              className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-700/80 transition-all"
            >
              {/* Event Image & Main Info */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <img
                  src={evt.image || evt.banner_image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=600'}
                  alt={evt.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                />
                <div className="space-y-1 truncate">
                  <h3 className="font-black text-white text-base truncate">{evt.title}</h3>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {evt.date || (evt.start_time ? new Date(evt.start_time).toLocaleString() : 'Thu 25, Dec - 19:00 PM')}
                  </p>
                  <p className="text-xs text-slate-500 font-normal truncate">
                    {evt.venue || evt.venues?.name || 'Eko Convention Center, Lagos'}
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
                <span className="px-3 py-1 bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] rounded-full text-xs font-bold">
                  {evt.status || 'Upcoming'}
                </span>

                {/* Tickets & Checkins counts */}
                <div className="text-xs font-medium text-slate-300 space-y-0.5 min-w-[120px]">
                  <div className="font-bold text-white">{evt.ticketsSold || '20,000 Tickets'}</div>
                  <div className="text-slate-400 text-[11px]">{evt.checkIns || '16,692 Check-ins'}</div>
                </div>

                {/* Sales Tag */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black flex items-center space-x-1 ${
                    evt.tagType === 'low'
                      ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                      : evt.tagType === 'average'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  <span>{evt.tagType === 'low' ? '⚡' : evt.tagType === 'average' ? '🔀' : '⚡'}</span>
                  <span>{evt.tag || 'Selling Fast'}</span>
                </span>

                {/* Revenue */}
                <div className="text-right min-w-[120px]">
                  <span className="text-xs text-slate-400 block font-medium">Revenue</span>
                  <span className="text-sm font-black text-white block">{evt.revenue || '#2,329,909,900'}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer">
                    Revenue
                  </button>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <span className="text-xs text-slate-400 font-medium">Showing 1 to 3 of 12</span>

        <div className="flex items-center space-x-2">
          <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center cursor-pointer">
            1
          </button>
          <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer">
            2
          </button>
          <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer">
            3
          </button>
          <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer">
            4
          </button>
          <button className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
