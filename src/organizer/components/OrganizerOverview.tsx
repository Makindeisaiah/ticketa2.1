import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  ChevronRight,
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
  onNavigateTab,
}) => {
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; amount: number } | null>(null);

  // Default sample events if none exist yet, ensuring identical visual to screenshot
  const displayEvents = events.length > 0
    ? events
    : [
        {
          id: 'omah-lay-demo',
          title: 'Omah Lay Live in Lago',
          date: '2026-09-17',
          venue: 'Eko Hotel & Suite',
          banner_image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=400',
        },
        {
          id: 'tyla-pop-demo',
          title: 'Tyla A POP World Tour',
          date: '2026-10-17',
          venue: 'Federal Palace Hotel',
          banner_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
        },
      ];

  // Revenue chart timeline data matching screenshot
  const dailyData = [
    { date: 'Apr 12', amount: 95000, x: 80, y: 170 },
    { date: 'Apr 13', amount: 145000, x: 160, y: 155 },
    { date: 'Apr 14', amount: 230000, x: 245, y: 130 },
    { date: 'Apr 15', amount: 290000, x: 330, y: 115 },
    { date: 'Apr 16', amount: 370000, x: 415, y: 90 },
    { date: 'Apr 17', amount: 440000, x: 500, y: 72 },
    { date: 'Apr 18', amount: 490000, x: 585, y: 58 },
    { date: 'Apr 19', amount: 540000, x: 670, y: 45 },
    { date: 'Apr 20', amount: 585000, x: 755, y: 35 },
  ];

  const weeklyData = [
    { date: 'Week 1', amount: 120000, x: 80, y: 160 },
    { date: 'Week 2', amount: 280000, x: 250, y: 120 },
    { date: 'Week 3', amount: 430000, x: 500, y: 75 },
    { date: 'Week 4', amount: 585000, x: 755, y: 35 },
  ];

  const monthlyData = [
    { date: 'Jan', amount: 150000, x: 80, y: 150 },
    { date: 'Feb', amount: 320000, x: 300, y: 105 },
    { date: 'Mar', amount: 470000, x: 530, y: 65 },
    { date: 'Apr', amount: 585000, x: 755, y: 35 },
  ];

  const chartData = timeRange === 'Daily' ? dailyData : timeRange === 'Weekly' ? weeklyData : monthlyData;

  // Build SVG path
  const pathD = chartData.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${chartData[chartData.length - 1].x} 190 L ${chartData[0].x} 190 Z`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Revenue Performance Card (Identical to IMG_2987.png) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Revenue Performance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Track total earnings timeline across all events
            </p>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl space-x-1 self-start sm:self-auto border border-slate-200/60">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimeRange(mode)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === mode
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Line & Area Graph with Dashed Grid Lines */}
        <div className="w-full relative pt-2 pb-4 overflow-x-auto">
          <div className="min-w-[620px] h-64 relative">
            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute z-20 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 border border-slate-700"
                style={{ left: `${(hoveredPoint.x / 800) * 100}%`, top: `${(hoveredPoint.y / 210) * 100}%` }}
              >
                <div>{hoveredPoint.date}</div>
                <div className="text-[#00b894] font-black">₦{hoveredPoint.amount.toLocaleString()}</div>
              </div>
            )}

            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 800 210"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="mintRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b894" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Dashed Grid Lines & Labels */}
              {[
                { label: '₦585,000', y: 35 },
                { label: '₦351,000', y: 88 },
                { label: '₦175,500', y: 140 },
                { label: '0', y: 190 },
              ].map((grid, idx) => (
                <g key={idx}>
                  <text
                    x="50"
                    y={grid.y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-semibold"
                  >
                    {grid.label}
                  </text>
                  <line
                    x1="65"
                    y1={grid.y}
                    x2="780"
                    y2={grid.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </g>
              ))}

              {/* Gradient Fill under the Curve */}
              <path d={areaD} fill="url(#mintRevenueGlow)" />

              {/* Main Emerald Stroke Curve */}
              <path
                d={pathD}
                fill="none"
                stroke="#00b894"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Circular Interactive Nodes along the curve */}
              {chartData.map((pt, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#00b894"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all hover:r-7"
                  />
                </g>
              ))}

              {/* X-Axis Date Labels */}
              {chartData.map((pt, idx) => (
                <text
                  key={idx}
                  x={pt.x}
                  y="208"
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-bold"
                >
                  {pt.date}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING EVENTS Section (Identical to IMG_2987.png) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase">
              UPCOMING EVENTS
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Quick actions for your live scheduled shows
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('events')}
            className="text-xs sm:text-sm font-black text-[#00b894] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Event List Items */}
        <div className="space-y-3 pt-1">
          {displayEvents.map((evt) => (
            <div
              key={evt.id}
              className="border border-slate-200/80 bg-white hover:border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs"
            >
              {/* Event Image & Meta Info */}
              <div className="flex items-center space-x-4 min-w-0">
                <img
                  src={
                    evt.banner_image_url ||
                    evt.image ||
                    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={evt.title}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                />
                <div className="space-y-1 truncate">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                    {evt.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.date || (evt.start_time ? new Date(evt.start_time).toISOString().split('T')[0] : '2026-09-17')}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{evt.venue || evt.venues?.name || 'Eko Hotel & Suite'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-shrink-0">
                <button
                  onClick={() => onNavigateTab('events')}
                  className="px-4 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
                >
                  Manage event
                </button>
                <button
                  onClick={() => onNavigateTab('tickets')}
                  className="px-4 py-2.5 border border-[#00b894]/40 hover:bg-[#00b894]/10 text-[#00b894] rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  View sales
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

