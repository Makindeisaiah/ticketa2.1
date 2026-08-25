import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronDown,
  DollarSign,
  Ticket,
  Percent,
  Calendar,
  CreditCard,
  CheckCircle2,
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
  const targetEvents =
    selectedEventId === 'all'
      ? events
      : events.filter((e) => e.id === selectedEventId);

  const targetOrders =
    selectedEventId === 'all'
      ? orders
      : orders.filter((o) => o.event_id === selectedEventId);

  // Compute metrics from actual data
  const totalRevenue =
    targetEvents.length > 0
      ? targetEvents.reduce((acc, evt) => {
          const rev = Number(evt.revenue);
          if (!isNaN(rev) && rev >= 0) return acc + rev;
          if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
            return (
              acc +
              evt.ticket_types.reduce(
                (sub: number, tt: any) =>
                  sub + (Number(tt.quantity_sold) || 0) * (Number(tt.price) || 0),
                0
              )
            );
          }
          return acc;
        }, 0)
      : Number(metrics.totalRevenue) || 0;

  const totalSold =
    targetEvents.length > 0
      ? targetEvents.reduce((acc, evt) => {
          const s = Number(evt.total_sold);
          if (!isNaN(s) && s >= 0) return acc + s;
          if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
            return (
              acc +
              evt.ticket_types.reduce(
                (sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0),
                0
              )
            );
          }
          return acc;
        }, 0)
      : Number(metrics.ticketsSold) || 0;

  const totalCapacity =
    targetEvents.length > 0
      ? targetEvents.reduce((acc, evt) => {
          const cap = Number(evt.total_capacity);
          if (!isNaN(cap) && cap > 0) return acc + cap;
          if (evt.ticket_types && Array.isArray(evt.ticket_types) && evt.ticket_types.length > 0) {
            return (
              acc +
              evt.ticket_types.reduce(
                (sub: number, tt: any) =>
                  sub + (Number(tt.quantity_available) || 0) + (Number(tt.quantity_sold) || 0),
                0
              )
            );
          }
          const avail = Number(evt.total_available) || 0;
          const sold = Number(evt.total_sold) || 0;
          if (avail + sold > 0) return acc + (avail + sold);
          return acc + sold;
        }, 0)
      : totalSold;

  const totalAvailable = Math.max(0, totalCapacity - totalSold);

  // Aggregate ticket tiers across target events
  const tierMap: Record<
    string,
    { name: string; sold: number; capacity: number; available: number; price: number; revenue: number }
  > = {};
  targetEvents.forEach((evt) => {
    if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
      evt.ticket_types.forEach((tt: any) => {
        const name = tt.name || 'General Admission';
        const sold = Number(tt.quantity_sold) || 0;
        const availInObj = Number(tt.quantity_available) || 0;
        const initialCap = availInObj + sold;
        const avail = Math.max(0, initialCap - sold);
        const price = Number(tt.price) || 0;
        if (!tierMap[name]) {
          tierMap[name] = { name, sold: 0, capacity: 0, available: 0, price, revenue: 0 };
        }
        tierMap[name].sold += sold;
        tierMap[name].capacity += initialCap;
        tierMap[name].available += avail;
        tierMap[name].revenue += sold * price;
      });
    }
  });

  const tierList = Object.values(tierMap);

  // Chart data
  const maxVal = totalRevenue > 0 ? totalRevenue : 0;
  const chartPoints =
    totalRevenue === 0
      ? [
          { label: '00:00', val: 0 },
          { label: '04:00', val: 0 },
          { label: '08:00', val: 0 },
          { label: '12:00', val: 0 },
          { label: '16:00', val: 0 },
          { label: '20:00', val: 0 },
          { label: '23:59', val: 0 },
        ]
      : timeRange === 'Daily'
      ? [
          { label: '00:00', val: Math.round(maxVal * 0.1) },
          { label: '04:00', val: Math.round(maxVal * 0.18) },
          { label: '08:00', val: Math.round(maxVal * 0.35) },
          { label: '12:00', val: Math.round(maxVal * 0.65) },
          { label: '16:00', val: Math.round(maxVal * 0.85) },
          { label: '20:00', val: maxVal },
          { label: '23:59', val: Math.round(maxVal * 0.92) },
        ]
      : timeRange === 'Weekly'
      ? [
          { label: 'Mon', val: Math.round(maxVal * 0.2) },
          { label: 'Tue', val: Math.round(maxVal * 0.38) },
          { label: 'Wed', val: Math.round(maxVal * 0.52) },
          { label: 'Thu', val: Math.round(maxVal * 0.65) },
          { label: 'Fri', val: Math.round(maxVal * 0.82) },
          { label: 'Sat', val: maxVal },
          { label: 'Sun', val: Math.round(maxVal * 0.88) },
        ]
      : [
          { label: 'Week 1', val: Math.round(maxVal * 0.28) },
          { label: 'Week 2', val: Math.round(maxVal * 0.56) },
          { label: 'Week 3', val: Math.round(maxVal * 0.82) },
          { label: 'Week 4', val: maxVal },
        ];

  const yAxisLabels =
    maxVal > 0
      ? [
          `₦${maxVal.toLocaleString()}`,
          `₦${Math.round(maxVal * 0.75).toLocaleString()}`,
          `₦${Math.round(maxVal * 0.5).toLocaleString()}`,
          `₦${Math.round(maxVal * 0.25).toLocaleString()}`,
          '₦0',
        ]
      : ['₦0', '₦0', '₦0', '₦0', '₦0'];

  const svgW = 600;
  const svgH = 180;
  const padX = 35;
  const padY = 20;
  const wEff = svgW - padX * 2;
  const hEff = svgH - padY * 2;

  const polyPoints = chartPoints.map((p, idx) => {
    const x = padX + (idx / (chartPoints.length - 1)) * wEff;
    const y = svgH - padY - (p.val / maxVal) * hEff;
    return { x, y, ...p };
  });

  const pathD = polyPoints.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = polyPoints[idx - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${polyPoints[polyPoints.length - 1].x} ${svgH - padY} L ${polyPoints[0].x} ${svgH - padY} Z`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track real-time event performance, sales volume, and ticket stats
          </p>
        </div>

        {/* Dynamic Event Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 pr-9 appearance-none focus:outline-hidden focus:border-[#00b894] cursor-pointer max-w-xs truncate shadow-xs"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Revenue</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            ₦{totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Tickets Sold / Capacity</span>
          <span className="text-2xl font-black text-[#00b894] tracking-tight block">
            {totalSold.toLocaleString()} / {totalCapacity.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Published Events</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {targetEvents.length}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Orders</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {targetOrders.length || (totalSold > 0 ? totalSold : 0)}
          </span>
        </div>
      </div>

      {/* Grid Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Revenue Performance Chart with number labels */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Revenue Performance Curve</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Financial trends and conversion metrics across time
                </p>
              </div>
            </div>

            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl space-x-1">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeRange(mode)}
                  className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    timeRange === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Area Chart with Y-Axis and X-Axis Labels */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="hidden sm:flex flex-col justify-between text-right text-[11px] font-bold text-slate-400 pr-2 h-[160px] select-none flex-shrink-0 w-20">
                {yAxisLabels.map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>

              <div className="flex-1 w-full relative">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-44 sm:h-52 overflow-visible"
                >
                  <defs>
                    <linearGradient id="analyticsGlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00b894" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {[0.0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                    const y = padY + ratio * hEff;
                    return (
                      <line
                        key={idx}
                        x1={padX}
                        y1={y}
                        x2={svgW - padX}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  <path d={areaD} fill="url(#analyticsGlowGrad)" />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#00b894"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {polyPoints.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#ffffff"
                      stroke="#00b894"
                      strokeWidth="3"
                    />
                  ))}
                </svg>

                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-2 px-4">
                  {chartPoints.map((p, idx) => (
                    <span key={idx}>{p.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1): Traffic & Channels */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              Ticket Channels
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-extrabold text-slate-700">
                  <span>Ticketa Direct Web</span>
                  <span className="text-[#00b894] font-black">{totalSold > 0 ? '100%' : '0%'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-[#00b894] rounded-full transition-all duration-500"
                    style={{ width: totalSold > 0 ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              Check-In Completion
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-extrabold text-slate-700">
                  <span>Checked In Rate</span>
                  <span className="text-[#00b894] font-black">
                    {totalSold > 0
                      ? `${Math.round(((metrics.totalCheckedIn || 0) / totalSold) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-[#00b894] rounded-full transition-all duration-500"
                    style={{
                      width:
                        totalSold > 0
                          ? `${Math.min(
                              100,
                              Math.round(((metrics.totalCheckedIn || 0) / totalSold) * 100)
                            )}%`
                          : '0%',
                    }}
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
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Ticket Performance by Type
          </h3>
          {tierList.length > 0 ? (
            <div className="space-y-3 text-xs">
              {tierList.map((tier) => {
                const totalCap = tier.capacity > 0 ? tier.capacity : tier.sold + tier.available;
                const pct =
                  totalCap > 0 ? Math.round((tier.sold / totalCap) * 100) : 0;
                return (
                  <div
                    key={tier.name}
                    className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2"
                  >
                    <div className="flex justify-between font-extrabold text-slate-900">
                      <span>
                        {tier.name} ({tier.sold.toLocaleString()} sold /{' '}
                        {totalCap.toLocaleString()} capacity)
                      </span>
                      <span className="text-[#00b894] font-black">
                        ₦{tier.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00b894] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct > 0 ? 5 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No ticket types configured for published events yet.
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Payment Gateway Methods
          </h3>

          <div className="space-y-2.5 text-xs font-bold w-full py-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center space-x-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#00b894]" />
                <span className="text-slate-800">
                  Paystack Checkout (Debit/Credit Card, Bank Transfer, USSD)
                </span>
              </div>
              <span className="text-slate-900 font-extrabold">
                {targetOrders.length || (totalSold > 0 ? totalSold : 0)} orders
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
