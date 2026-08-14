import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronDown,
  DollarSign,
  Ticket,
  Percent,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface OrganizerAnalyticsProps {
  events?: any[];
  orders?: any[];
  metrics?: {
    totalRevenue: number;
    ticketsSold: number;
    totalEvents: number;
    activeEvents: number;
    totalCheckedIn: number;
  };
}

export const OrganizerAnalytics: React.FC<OrganizerAnalyticsProps> = ({
  events = [],
  orders = [],
  metrics = {
    totalRevenue: 0,
    ticketsSold: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalCheckedIn: 0,
  },
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Filter events and orders based on selection
  const targetEvents = selectedEventId === 'all' 
    ? events 
    : events.filter((e) => e.id === selectedEventId);

  const targetOrders = selectedEventId === 'all'
    ? orders
    : orders.filter((o) => o.event_id === selectedEventId);

  // Compute metrics from actual data
  const totalRevenue = targetEvents.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((sub: number, tt: any) => sub + ((Number(tt.quantity_sold) || 0) * (Number(tt.price) || 0)), 0);
  }, 0);

  const totalSold = targetEvents.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0), 0);
  }, 0);

  const totalAvailable = targetEvents.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((sub: number, tt: any) => sub + (Number(tt.quantity_available) || 0), 0);
  }, 0);

  // Aggregate ticket tiers across target events
  const tierMap: Record<string, { name: string; sold: number; available: number; price: number; revenue: number }> = {};
  targetEvents.forEach((evt) => {
    if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
      evt.ticket_types.forEach((tt: any) => {
        const name = tt.name || 'General';
        const sold = Number(tt.quantity_sold) || 0;
        const available = Number(tt.quantity_available) || 0;
        const price = Number(tt.price) || 0;
        if (!tierMap[name]) {
          tierMap[name] = { name, sold: 0, available: 0, price, revenue: 0 };
        }
        tierMap[name].sold += sold;
        tierMap[name].available += available;
        tierMap[name].revenue += sold * price;
      });
    }
  });

  const tierList = Object.values(tierMap);

  // Payment methods breakdown from real orders
  const paymentMethodsMap: Record<string, number> = {};
  targetOrders.forEach((o) => {
    const method = o.payment_method || 'Paystack (Card/Transfer)';
    paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + 1;
  });
  const totalOrdersCount = targetOrders.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Track real-time event performance, sales volume, and ticket stats.
          </p>
        </div>

        {/* Dynamic Event Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-[#111723]/90 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white pr-9 appearance-none focus:outline-none focus:border-[#00b894] cursor-pointer max-w-xs truncate"
          >
            <option value="all">All Events ({events.length})</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
          <span className="text-2xl font-black text-white tracking-tight block">
            ₦{totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Tickets Sold / Remaining</span>
          <span className="text-2xl font-black text-white tracking-tight block">
            {totalSold.toLocaleString()} / {totalAvailable.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Published Events</span>
          <span className="text-2xl font-black text-white tracking-tight block">
            {targetEvents.length}
          </span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Orders</span>
          <span className="text-2xl font-black text-white tracking-tight block">
            {targetOrders.length}
          </span>
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
          {totalRevenue > 0 ? (
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

                {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Today'].map((d, i) => (
                  <text key={i} x={60 + i * 105} y="185" fill="#64748b" fontSize="10" fontWeight="bold">
                    {d}
                  </text>
                ))}
              </svg>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No sales activity recorded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Revenue trends and daily performance will generate here once attendees start purchasing tickets.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (Span 1): Traffic & Channels */}
        <div className="space-y-6">
          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-white border-b border-slate-800 pb-2">
              Ticket Channels
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Ticketa Website</span>
                  <span className="text-[#00b894]">{totalSold > 0 ? '100%' : '0%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00b894] rounded-full" style={{ width: totalSold > 0 ? '100%' : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-white border-b border-slate-800 pb-2">
              Check-In Completion
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Checked In</span>
                  <span className="text-amber-400">
                    {totalSold > 0 ? `${Math.round(((metrics.totalCheckedIn || 0) / totalSold) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: totalSold > 0 ? `${Math.min(100, Math.round(((metrics.totalCheckedIn || 0) / totalSold) * 100))}%` : '0%' }}
                  />
                </div>
              </div>
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
          {tierList.length > 0 ? (
            <div className="space-y-3 text-xs">
              {tierList.map((tier) => {
                const totalCap = tier.sold + tier.available;
                const pct = totalCap > 0 ? Math.round((tier.sold / totalCap) * 100) : 0;
                return (
                  <div key={tier.name} className="bg-slate-900/80 p-3 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>{tier.name} ({tier.sold.toLocaleString()} sold / {tier.available.toLocaleString()} remaining)</span>
                      <span className="text-[#00b894] font-black">₦{tier.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00b894] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No ticket types configured for published events yet.
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Payment Gateway Methods
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="space-y-2 text-xs font-bold w-full">
              <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#00b894]" />
                  <span className="text-slate-300">Paystack Checkout (Card / Transfer / USSD)</span>
                </div>
                <span className="text-white font-extrabold">{targetOrders.length} orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
