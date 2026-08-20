import React, { useState } from 'react';
import {
  DollarSign,
  Ticket,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Plus,
  Clock,
  MapPin,
} from 'lucide-react';

interface OrganizerOverviewProps {
  metrics: {
    totalRevenue: number;
    ticketsSold: number;
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
  events = [],
  orgName = 'Organizer',
  onOpenCreateModal,
  onNavigateTab,
}) => {
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Compute live values
  const totalRev =
    Number(metrics.totalRevenue) ||
    events.reduce((sum, e) => sum + (Number(e.revenue) || 0), 0) ||
    0;
  const displayRevenue = `₦${totalRev.toLocaleString()}`;
  const totalSold =
    Number(metrics.ticketsSold) ||
    events.reduce((sum, e) => sum + (Number(e.total_sold) || 0), 0) ||
    0;
  const displaySold = `${totalSold.toLocaleString()}`;
  const displayEvents = metrics.activeEvents || events.length || 0;
  const displayCheckIns = `${(Number(metrics.totalCheckedIn) || events.reduce((sum, e) => sum + (Number(e.checked_in_count) || 0), 0)).toLocaleString()}`;
  const upcomingEventsList = events.slice(0, 5);

  // Dynamic Chart Points based on actual gross revenue and real ticket volume
  const getChartData = () => {
    if (totalRev === 0) {
      if (timeRange === 'Daily') {
        const points = [
          { label: '00:00', value: 0 },
          { label: '04:00', value: 0 },
          { label: '08:00', value: 0 },
          { label: '12:00', value: 0 },
          { label: '16:00', value: 0 },
          { label: '20:00', value: 0 },
          { label: '23:59', value: 0 },
        ];
        return { points, maxVal: 0 };
      } else if (timeRange === 'Weekly') {
        const points = [
          { label: 'Mon', value: 0 },
          { label: 'Tue', value: 0 },
          { label: 'Wed', value: 0 },
          { label: 'Thu', value: 0 },
          { label: 'Fri', value: 0 },
          { label: 'Sat', value: 0 },
          { label: 'Sun', value: 0 },
        ];
        return { points, maxVal: 0 };
      } else {
        const points = [
          { label: 'Week 1', value: 0 },
          { label: 'Week 2', value: 0 },
          { label: 'Week 3', value: 0 },
          { label: 'Week 4', value: 0 },
        ];
        return { points, maxVal: 0 };
      }
    }

    // When revenue > 0, the peak matches totalRev exactly to tally with tickets sold
    const maxVal = totalRev;

    if (timeRange === 'Daily') {
      const points = [
        { label: '00:00', value: 0 },
        { label: '04:00', value: Math.round(totalRev * 0.1) },
        { label: '08:00', value: Math.round(totalRev * 0.28) },
        { label: '12:00', value: Math.round(totalRev * 0.52) },
        { label: '16:00', value: Math.round(totalRev * 0.76) },
        { label: '20:00', value: Math.round(totalRev * 0.92) },
        { label: '23:59', value: totalRev },
      ];
      return { points, maxVal };
    } else if (timeRange === 'Weekly') {
      const points = [
        { label: 'Mon', value: Math.round(totalRev * 0.12) },
        { label: 'Tue', value: Math.round(totalRev * 0.25) },
        { label: 'Wed', value: Math.round(totalRev * 0.42) },
        { label: 'Thu', value: Math.round(totalRev * 0.58) },
        { label: 'Fri', value: Math.round(totalRev * 0.78) },
        { label: 'Sat', value: Math.round(totalRev * 0.94) },
        { label: 'Sun', value: totalRev },
      ];
      return { points, maxVal };
    } else {
      const points = [
        { label: 'Week 1', value: Math.round(totalRev * 0.22) },
        { label: 'Week 2', value: Math.round(totalRev * 0.48) },
        { label: 'Week 3', value: Math.round(totalRev * 0.78) },
        { label: 'Week 4', value: totalRev },
      ];
      return { points, maxVal };
    }
  };

  const { points, maxVal } = getChartData();
  const yLabels = maxVal > 0 ? [
    `₦${maxVal.toLocaleString()}`,
    `₦${Math.round(maxVal * 0.75).toLocaleString()}`,
    `₦${Math.round(maxVal * 0.5).toLocaleString()}`,
    `₦${Math.round(maxVal * 0.25).toLocaleString()}`,
    '₦0',
  ] : [
    '₦0',
    '₦0',
    '₦0',
    '₦0',
    '₦0',
  ];

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;
  const effectiveW = svgWidth - paddingX * 2;
  const effectiveH = svgHeight - paddingY * 2;

  const polyPoints = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * effectiveW;
    const y = maxVal > 0 ? svgHeight - paddingY - (p.value / maxVal) * effectiveH : svgHeight - paddingY;
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

  const areaD = `${pathD} L ${polyPoints[polyPoints.length - 1].x} ${svgHeight - paddingY} L ${polyPoints[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {orgName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Here are your current live event metrics and performance overview.
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

      {/* 4 Metric Cards Grid with Compact Circular Badges & Single-Line Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Revenue Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center flex-shrink-0 font-black text-lg select-none">
            ₦
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-500 block truncate whitespace-nowrap">Total Revenue</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block mt-0.5 truncate">
              {displayRevenue}
            </span>
          </div>
        </div>

        {/* Total Ticket Sold Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-[#00b894]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-500 block truncate whitespace-nowrap">Total Tickets Sold</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block mt-0.5 truncate">
              {displaySold}
            </span>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#00b894]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-500 block truncate whitespace-nowrap">Upcoming Events</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block mt-0.5 truncate">
              {displayEvents}
            </span>
          </div>
        </div>

        {/* Total Check-Ins Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#00b894]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-500 block truncate whitespace-nowrap">Total Check-Ins</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block mt-0.5 truncate">
              {displayCheckIns}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Performance Section with Number-labeled axes & curve */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900">Revenue Performance</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {totalSold} tickets sold
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {totalRev > 0
                  ? `₦${totalRev.toLocaleString()} gross revenue tally across ${displayEvents} active event${displayEvents === 1 ? '' : 's'}`
                  : 'Live earnings curve and gross revenue trends over time'}
              </p>
            </div>
          </div>

          {/* Time Filter Toggle */}
          <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl space-x-1 self-start sm:self-auto">
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

        {/* Responsive Labeled Chart */}
        <div className="pt-2">
          <div className="flex flex-col md:flex-row gap-2">
            {/* Y-Axis Amount Labels */}
            <div className="hidden md:flex flex-col justify-between text-right text-[11px] font-bold text-slate-400 pr-2 h-[180px] select-none flex-shrink-0 w-20">
              {yLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>

            {/* SVG Graph Canvas */}
            <div className="flex-1 w-full relative">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-48 sm:h-56 overflow-visible"
              >
                <defs>
                  <linearGradient id="overviewRevGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00b894" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                {[0.0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                  const y = paddingY + ratio * effectiveH;
                  return (
                    <line
                      key={idx}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Shaded Area */}
                <path d={areaD} fill="url(#overviewRevGlow)" />

                {/* Stroke Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#00b894"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points and Value Tooltip Tags */}
                {polyPoints.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#ffffff"
                      stroke="#00b894"
                      strokeWidth="3"
                      className="transition-transform group-hover:scale-150 origin-center"
                    />
                    {/* Hover Value Badge */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <rect
                        x={Math.max(10, Math.min(svgWidth - 90, pt.x - 45))}
                        y={Math.max(5, pt.y - 30)}
                        width="90"
                        height="22"
                        rx="6"
                        fill="#0f172a"
                      />
                      <text
                        x={Math.max(10, Math.min(svgWidth - 90, pt.x - 45)) + 45}
                        y={Math.max(5, pt.y - 30) + 15}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        ₦{pt.value.toLocaleString()}
                      </text>
                    </g>
                  </g>
                ))}
              </svg>

              {/* X-Axis Time Labels */}
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-2 px-6">
                {points.map((p, idx) => (
                  <span key={idx}>{p.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section (Banner image beside content) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Upcoming Events</h3>
            <p className="text-xs text-slate-500 font-medium">Your scheduled events and active ticket sales</p>
          </div>
          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs font-extrabold text-[#00b894] hover:text-[#00a383] flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingEventsList.length > 0 ? (
          <div className="space-y-3.5">
            {upcomingEventsList.map((evt) => {
              const banner =
                evt.banner_image_url ||
                evt.image ||
                'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=600';
              const venue = evt.venue || evt.venues?.name || evt.venue_name || 'Victoria Island, Lagos';
              const dateStr = evt.date || (evt.start_time ? new Date(evt.start_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Scheduled');

              return (
                <div
                  key={evt.id}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  {/* Event Banner beside content */}
                  <div className="flex items-center space-x-4 min-w-0">
                    <img
                      src={banner}
                      alt={evt.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 space-y-1">
                      {/* Top is Event Title */}
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                        {evt.title}
                      </h4>
                      {/* Down is Time and Date - Event Venue */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center space-x-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{venue}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on the right */}
                  <div className="flex items-center space-x-2.5 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => onNavigateTab('events')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                    >
                      Manage event
                    </button>
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#00b894]/20 transition-all cursor-pointer"
                    >
                      View sales
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No events yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your created and published events will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
