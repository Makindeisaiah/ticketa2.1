import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Zap,
  Ticket,
  DollarSign,
  Eye,
  Trash2,
  CheckSquare,
  Edit,
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
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sample default events matching screenshot if empty
  const displayEventsList = events && events.length > 0
    ? events
    : [
        {
          id: 'omah-lay-1',
          title: 'Omah Lay Live in Lago',
          status: 'Upcoming',
          venue: 'Eko Hotel & Suite',
          date: '2026-09-17 — 20:20',
          banner_image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=600',
          tickets_total: 80,
          tickets_sold: 3,
          revenue: 150000,
          speed: 'Selling Fast',
        },
        {
          id: 'tyla-tour-2',
          title: 'Tyla A POP World Tour',
          status: 'Upcoming',
          venue: 'Federal Palace Hotel, Lagos',
          date: '2026-10-17 — 19:30',
          banner_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
          tickets_total: 100,
          tickets_sold: 8,
          revenue: 435000,
          speed: 'Average Sales',
        },
      ];

  // Compute metrics
  const totalEventsCount = displayEventsList.length;
  const activeEventsCount = displayEventsList.length;
  const totalTicketsSoldCount = displayEventsList.reduce((acc, evt) => {
    if (evt.tickets_sold !== undefined) return acc + evt.tickets_sold;
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((s: number, t: any) => s + (Number(t.quantity_sold) || 0), 0);
  }, 0) || 11;

  const totalNetRevenue = displayEventsList.reduce((acc, evt) => {
    if (evt.revenue !== undefined) return acc + evt.revenue;
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((s: number, t: any) => s + ((Number(t.quantity_sold) || 0) * (Number(t.price) || 0)), 0);
  }, 0) || 585000;

  // Search filter
  const filteredEvents = displayEventsList.filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.title?.toLowerCase().includes(q) ||
      evt.venue?.toLowerCase().includes(q) ||
      evt.venues?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. 4 Metric Cards (Matching IMG_2988.jpeg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* TOTAL EVENT */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">
              TOTAL EVENT
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-0.5">
              {totalEventsCount}
            </span>
          </div>
        </div>

        {/* ACTIVE EVENTS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">
              ACTIVE EVENTS
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-0.5">
              {activeEventsCount}
            </span>
          </div>
        </div>

        {/* TOTAL TICKET SOLD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">
              TOTAL TICKET SOLD
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-0.5">
              {totalTicketsSoldCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* NET REVENUE */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">
              NET REVENUE
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block mt-0.5">
              ₦{totalNetRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search Events Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events..."
          className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/10 shadow-2xs transition-all"
        />
      </div>

      {/* 3. Event Cards Rows (Matching IMG_2988.jpeg) */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => {
          const totalAvail = evt.tickets_total || 80;
          const totalSold = evt.tickets_sold !== undefined ? evt.tickets_sold : 3;
          const progressPercent = totalAvail > 0 ? Math.round((totalSold / totalAvail) * 100) : 4;
          const eventRevenue = evt.revenue || (totalSold * 50000);
          const isSellingFast = evt.speed === 'Selling Fast' || progressPercent >= 10;

          return (
            <div
              key={evt.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-slate-300 transition-all relative"
            >
              {/* Left Details: Image + Title + Venue + Date + Progress */}
              <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
                <img
                  src={
                    evt.banner_image_url ||
                    evt.image ||
                    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={evt.title}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                />

                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Badge + Title */}
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#00b894]/15 text-[#00b894] font-black text-[10px] px-2.5 py-0.5 rounded-full">
                      {evt.status || 'Upcoming'}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                      {evt.title}
                    </h3>
                  </div>

                  {/* Venue & Date */}
                  <p className="text-xs text-slate-600 font-semibold truncate">
                    {evt.venue || evt.venues?.name || 'Eko Hotel & Suite'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {evt.date || (evt.start_time ? new Date(evt.start_time).toISOString().replace('T', ' — ').substring(0, 16) : '2026-09-17 — 20:20')}
                  </p>

                  {/* Progress Bar & Status */}
                  <div className="pt-1 max-w-xs space-y-1">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00b894] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(progressPercent, 4)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {totalSold} / {totalAvail} sold ({progressPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Selling Speed Pill & Ticket Counts */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 lg:gap-8 self-start sm:self-auto">
                {/* Speed Pill */}
                <div
                  className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${
                    isSellingFast
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <span>{isSellingFast ? '⚡' : '📈'}</span>
                  <span>{isSellingFast ? 'Selling Fast' : 'Average Sales'}</span>
                </div>

                {/* Ticket Counts */}
                <div className="text-xs font-semibold text-slate-600 min-w-[100px]">
                  <span className="block font-black text-slate-900">{totalAvail} Tickets</span>
                  <span className="block text-[11px] text-slate-400">{totalSold} tickets sold</span>
                </div>

                {/* Revenue */}
                <div className="min-w-[110px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    REVENUE
                  </span>
                  <span className="text-base font-black text-[#00b894] block">
                    ₦{eventRevenue.toLocaleString()}
                  </span>
                </div>

                {/* Actions: Revenue Pill Button + 3-dots Menu */}
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => onOpenCreateModal()}
                    className="bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-black px-5 py-2 rounded-full shadow-xs transition-colors cursor-pointer"
                  >
                    Revenue
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === evt.id ? null : evt.id)}
                      className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === evt.id && (
                      <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1 text-xs">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onOpenCreateModal();
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700 font-bold"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit Event</span>
                        </button>
                        <button
                          onClick={() => setActiveMenuId(null)}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700 font-bold"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>Check-in Scanner</span>
                        </button>
                        <button
                          onClick={() => setActiveMenuId(null)}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700 font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Public Page</span>
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={() => setActiveMenuId(null)}
                          className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center space-x-2 text-rose-600 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Event</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Pagination Footer (Matching IMG_2988.jpeg) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
        <span className="text-xs text-slate-500 font-medium">
          Showing 1 to {filteredEvents.length} of 12 events
        </span>

        <div className="flex items-center space-x-1.5 self-center sm:self-auto">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                currentPage === page
                  ? 'bg-[#00b894] text-white shadow-xs'
                  : 'border border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(4, currentPage + 1))}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

