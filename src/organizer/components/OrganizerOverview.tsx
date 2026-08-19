import React, { useState } from 'react';
import {
  DollarSign,
  Ticket,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
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
  orgName?: string;
  onOpenCreateModal?: () => void;
  onNavigateTab: (tab: any) => void;
}

export const OrganizerOverview: React.FC<OrganizerOverviewProps> = ({
  metrics,
  events,
  orgName = 'Organizer',
  onNavigateTab,
}) => {
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Display real revenue & stats formatted cleanly
  const displayRevenue = `₦${(metrics.totalRevenue || 0).toLocaleString()}`;
  const displaySold = `${(metrics.ticketsSold || 0).toLocaleString()}`;
  const displayEvents = metrics.activeEvents || 0;
  const displayCheckIns = `${(metrics.totalCheckedIn || 0).toLocaleString()}`;
  const upcomingEventsList = events || [];
  const hasRevenue = (metrics.totalRevenue || 0) > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Welcome, {orgName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Here are your current event stats
        </p>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue Card */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
            <span className="text-xl font-black text-white tracking-tight block mt-0.5">
              {displayRevenue}
            </span>
          </div>
        </div>

        {/* Total Ticket Sold Card */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Ticket Sold</span>
            <span className="text-xl font-black text-white tracking-tight block mt-0.5">
              {displaySold}
            </span>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Upcoming Events</span>
            <span className="text-xl font-black text-white tracking-tight block mt-0.5">
              {displayEvents}
            </span>
          </div>
        </div>

        {/* Total Check-Ins Card */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Check-Ins</span>
            <span className="text-xl font-black text-white tracking-tight block mt-0.5">
              {displayCheckIns}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Performance Chart Section */}
      <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#00b894]" />
            <h3 className="text-base font-extrabold text-white">Revenue Performance</h3>
          </div>

          {/* Time Filter Toggle */}
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl space-x-1 self-start sm:self-auto">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimeRange(mode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === mode
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {hasRevenue ? (
          <div className="w-full h-64 relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b894" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {[0, 45, 90, 135, 180].map((y, idx) => (
                <line
                  key={idx}
                  x1="60"
                  y1={y}
                  x2="780"
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
              <path
                d="M 80 170 C 150 160, 220 120, 290 100 C 360 80, 430 110, 500 60 C 570 20, 640 40, 710 30 L 710 180 L 80 180 Z"
                fill="url(#revenueGlow)"
              />
              <path
                d="M 80 170 C 150 160, 220 120, 290 100 C 360 80, 430 110, 500 60 C 570 20, 640 40, 710 30"
                fill="none"
                stroke="#00b894"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-2">
            <TrendingUp className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No revenue data recorded yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real-time revenue curves and performance metrics will populate automatically when ticket sales commence.
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h3 className="text-base font-extrabold text-white">Upcoming Events</h3>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-extrabold text-[#00b894] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>More</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingEventsList.length > 0 ? (
          <div className="space-y-3">
            {upcomingEventsList.map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-sm">{evt.title}</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {evt.date || (evt.start_time ? new Date(evt.start_time).toLocaleDateString() : 'N/A')} - {evt.venue || evt.venues?.name || 'Main Venue'}
                  </p>
                </div>

                <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                  <button
                    onClick={() => onNavigateTab('events')}
                    className="px-4 py-2 border border-[#00b894] text-[#00b894] hover:bg-[#00b894]/10 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Manage event
                  </button>
                  <button
                    onClick={() => onNavigateTab('orders')}
                    className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#00b894]/20 transition-colors cursor-pointer"
                  >
                    View sales
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No events yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your published and draft events will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
