import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronDown,
  DollarSign,
  Ticket,
  Percent,
  RefreshCw,
  Share2,
  Users,
} from 'lucide-react';

export const OrganizerAnalytics: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState('All Events');
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Track your event performance, sales, event activity.
          </p>
        </div>

        {/* Dropdown filter */}
        <div className="relative self-start sm:self-auto">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-[#111723]/90 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white pr-9 appearance-none focus:outline-none focus:border-[#00b894] cursor-pointer"
          >
            <option value="All Events">All Events</option>
            <option value="Davido Live in Lagos">Davido Live in Lagos</option>
            <option value="Asake Live in Lagos">Asake Live in Lagos</option>
            <option value="Burna Boy Live in Lagos">Burna Boy Live in Lagos</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
          <span className="text-2xl font-black text-white tracking-tight block">#545,960,000</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Tickets Sold / Remaining</span>
          <span className="text-2xl font-black text-white tracking-tight block">18,200 / 2,718</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Conversion Rate</span>
          <span className="text-2xl font-black text-white tracking-tight block">4.6%</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Refund Issued</span>
          <span className="text-2xl font-black text-white tracking-tight block">#1,200,000</span>
        </div>
      </div>

      {/* Grid Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Revenue Performance Chart */}
        <div className="lg:col-span-2 bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#00b894]" />
              <h3 className="text-base font-extrabold text-white">Revenue Performance</h3>
            </div>

            <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl space-x-1">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeRange(mode)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeRange === mode
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="w-full h-64 relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="analyticsGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b894" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 40, 80, 120, 160].map((y, idx) => (
                <line
                  key={idx}
                  x1="50"
                  y1={y}
                  x2="490"
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              <path
                d="M 60 150 C 120 140, 180 90, 240 80 C 300 70, 360 110, 420 50 L 480 30 L 480 160 L 60 160 Z"
                fill="url(#analyticsGlow)"
              />
              <path
                d="M 60 150 C 120 140, 180 90, 240 80 C 300 70, 360 110, 420 50 L 480 30"
                fill="none"
                stroke="#00b894"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {['Apr 12', 'Apr 14', 'Apr 16', 'Apr 18', 'Apr 20'].map((d, i) => (
                <text key={i} x={60 + i * 105} y="185" fill="#64748b" fontSize="10" fontWeight="bold">
                  {d}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Right Column (Span 1): Traffic Source & Orders */}
        <div className="space-y-6">
          {/* Traffic Source Card */}
          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-white border-b border-slate-800 pb-2">
              Traffic Source
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Direct Link', pct: 30 },
                { label: 'Social Media', pct: 28 },
                { label: 'QR Code', pct: 28 },
                { label: 'Search', pct: 28 },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>{item.label}</span>
                    <span className="text-[#00b894]">{item.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00b894] rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders & Buyers Card */}
          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-white border-b border-slate-800 pb-2">
              Orders &amp; Buyers Social
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Instagram', pct: 30 },
                { label: 'WhatsApp', pct: 25 },
                { label: 'X (Twitter)', pct: 10 },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>{item.label}</span>
                    <span className="text-amber-400">{item.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Ticket Performance & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Performance by Type Table */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Ticket Performance by Type
          </h3>
          <div className="space-y-3 text-xs">
            {[
              { type: 'Regular', sold: '13,600', pct: 75, revenue: '#535,000.00' },
              { type: 'VIP', sold: '3,797', pct: 50, revenue: '#252,000.00' },
              { type: 'VVIP', sold: '1,235', pct: 30, revenue: '#150,000.00' },
              { type: 'Premium', sold: '100', pct: 15, revenue: '#180,000.00' },
            ].map((tier) => (
              <div key={tier.type} className="bg-slate-900/80 p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between font-bold text-white">
                  <span>{tier.type} ({tier.sold})</span>
                  <span className="text-[#00b894] font-black">{tier.revenue}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00b894] rounded-full" style={{ width: `${tier.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Used Donut Chart */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Payment Method Used
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* SVG Donut */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#00b894"
                  strokeWidth="3.8"
                  strokeDasharray="55, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.8"
                  strokeDasharray="38, 100"
                  strokeDashoffset="-55"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                100%
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#00b894]" />
                <span className="text-slate-300">Card Payment (55%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">Bank Transfer (38%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-300">USSD (7%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
