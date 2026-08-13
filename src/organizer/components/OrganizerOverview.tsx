import React from 'react';
import {
  DollarSign,
  Ticket,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Plus,
  QrCode,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface OrganizerOverviewProps {
  metrics: {
    totalRevenue: number;
    ticketsSold: number;
    totalEvents: number;
    activeEvents: number;
    totalCheckedIn: number;
  };
  events: any[];
  onOpenCreateModal: () => void;
  onNavigateTab: (tab: any) => void;
}

export const OrganizerOverview: React.FC<OrganizerOverviewProps> = ({
  metrics,
  events,
  onOpenCreateModal,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center space-x-2 bg-[#00b894]/10 border border-[#00b894]/30 text-[#00b894] px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Supabase RLS &amp; PostgreSQL Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Organizer Portal Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Publish events, issue ticket inventory, run real-time QR check-ins, and manage Paystack payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={onOpenCreateModal}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>

          <button
            onClick={() => onNavigateTab('scanner')}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#00b894]" />
            <span>Launch Scanner</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-white block">
              ₦{metrics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold block">Gross Sales via Paystack</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tickets Sold</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-white block">{metrics.ticketsSold}</span>
            <span className="text-[10px] text-slate-400 font-bold block">Issued valid attendee tickets</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Events</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-white block">{metrics.activeEvents}</span>
            <span className="text-[10px] text-purple-400 font-bold block">
              {metrics.totalEvents} total created
            </span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Checked-In</span>
            <div className="w-9 h-9 rounded-xl bg-[#00b894]/10 text-[#00b894] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black text-white block">{metrics.totalCheckedIn}</span>
            <span className="text-[10px] text-[#00b894] font-bold block">Gate scans verified</span>
          </div>
        </div>
      </div>

      {/* Recent Events Overview */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white">Recent Organization Events</h3>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-bold text-[#00b894] hover:underline cursor-pointer"
          >
            View All Events →
          </button>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No events created yet. Click "Create New Event" to start selling tickets!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      evt.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {evt.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(evt.start_time).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs line-clamp-1">{evt.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {evt.venues?.name || evt.venues?.city || 'Main Venue'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
