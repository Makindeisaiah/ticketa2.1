import React, { useState } from 'react';
import {
  ChevronDown,
  TrendingUp,
} from 'lucide-react';

export const OrganizerTicketSales: React.FC<{ orders?: any[] }> = ({ orders = [] }) => {
  const [selectedEvent, setSelectedEvent] = useState('All Events');
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ticket Sales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Track and manage your ticket sales
          </p>
        </div>

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

      {/* 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Tickets Sold</span>
          <span className="text-2xl font-black text-white tracking-tight block">20,425 / 75,000</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
          <span className="text-2xl font-black text-white tracking-tight block">#1,524,547,900</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Platform Fees</span>
          <span className="text-2xl font-black text-white tracking-tight block">#100,377,000</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Net Revenue</span>
          <span className="text-2xl font-black text-white tracking-tight block">#1,489,200,000</span>
        </div>
      </div>

      {/* Revenue Performance Chart Card */}
      <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
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

        <div className="w-full h-56 relative pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="salesGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b894" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00b894" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[0, 35, 70, 105, 140].map((y, idx) => (
              <line key={idx} x1="50" y1={y} x2="780" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            <path
              d="M 60 130 C 180 120, 300 70, 420 80 C 540 90, 660 30, 780 20 L 780 140 L 60 140 Z"
              fill="url(#salesGlow)"
            />
            <path
              d="M 60 130 C 180 120, 300 70, 420 80 C 540 90, 660 30, 780 20"
              fill="none"
              stroke="#00b894"
              strokeWidth="3.5"
            />
          </svg>
        </div>
      </div>

      {/* Two Column Tables Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Type Performance Table */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 overflow-x-auto">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Ticket Type Performance
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-bold">
                <th className="pb-3">Ticket Type</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Tickets Sold</th>
                <th className="pb-3">Tickets Left</th>
                <th className="pb-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {[
                { type: 'Regular', price: '#10,000', sold: '23,530', left: '1,750', revenue: '#450,000,000' },
                { type: 'VIP', price: '#30,000', sold: '12,095', left: '405', revenue: '#350,000,000' },
                { type: 'VVIP', price: '#100,000', sold: '2,100', left: '0', revenue: '#350,000,000' },
                { type: 'Premium', price: '#3,500,000', sold: '250', left: '0', revenue: '#369,000,000' },
              ].map((row) => (
                <tr key={row.type}>
                  <td className="py-3 font-bold text-white">{row.type}</td>
                  <td className="py-3 text-slate-400">{row.price}</td>
                  <td className="py-3 text-white font-bold">{row.sold}</td>
                  <td className="py-3 text-slate-400">{row.left}</td>
                  <td className="py-3 text-right text-[#00b894] font-black">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Orders & Buyers Table */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 overflow-x-auto">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Orders &amp; Buyers
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-bold">
                <th className="pb-3">Buyer Name</th>
                <th className="pb-3">Ticket Type</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {[
                { name: 'Jerry Oladipo', type: 'VIP', qty: 1, status: 'Paid', date: 'Dec 1, 2025' },
                { name: 'Sam Joe', type: 'Regular', qty: 2, status: 'Paid', date: 'Dec 2, 2025' },
                { name: 'Janet Ebun', type: 'VVIP', qty: 1, status: 'Paid', date: 'Dec 3, 2025' },
                { name: 'Alex Kate', type: 'Premium', qty: 1, status: 'Paid', date: 'Dec 4, 2025' },
              ].map((b, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-bold text-white">{b.name}</td>
                  <td className="py-3 text-slate-400">{b.type}</td>
                  <td className="py-3 text-white">{b.qty}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-[10px] font-bold">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400 text-[11px]">{b.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
