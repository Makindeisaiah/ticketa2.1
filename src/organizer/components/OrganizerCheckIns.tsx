import React, { useState } from 'react';
import {
  ChevronDown,
  QrCode,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export const OrganizerCheckIns: React.FC<{ events?: any[]; userId?: string }> = ({ events = [] }) => {
  const [selectedEvent, setSelectedEvent] = useState('All Events');

  // Compute real check-in statistics across events
  const totalTicketsSold = events.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0), 0);
  }, 0);

  const totalCheckedIn = events.reduce((acc, evt) => {
    return acc + (Number(evt.checked_in_count) || 0);
  }, 0);

  const stillToCheckIn = Math.max(0, totalTicketsSold - totalCheckedIn);
  const checkInRate = totalTicketsSold > 0 ? ((totalCheckedIn / totalTicketsSold) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Check-Ins
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Monitor event entry and manage guest check-ins
          </p>
        </div>

        <div className="relative self-start sm:self-auto">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-[#111723]/90 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white pr-9 appearance-none focus:outline-none focus:border-[#00b894] cursor-pointer"
          >
            <option value="All Events">All Events</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.title}>
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
          <span className="text-xs font-semibold text-slate-400 block">Total Tickets Sold</span>
          <span className="text-2xl font-black text-white tracking-tight block">{totalTicketsSold.toLocaleString()}</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Checked-In</span>
          <span className="text-2xl font-black text-white tracking-tight block">{totalCheckedIn.toLocaleString()}</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Still to Check-In</span>
          <span className="text-2xl font-black text-white tracking-tight block">{stillToCheckIn.toLocaleString()}</span>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Check-In Rate</span>
          <span className="text-2xl font-black text-white tracking-tight block">{checkInRate}%</span>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Type Check-Ins Table */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Ticket Type Check-Ins
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-bold">
                <th className="pb-3">Ticket Type</th>
                <th className="pb-3">Sold</th>
                <th className="pb-3">Check-In</th>
                <th className="pb-3 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {[
                { type: 'Regular', sold: '15,652', checkIn: '12,994', remaining: '2,658' },
                { type: 'VIP', sold: '3,500', checkIn: '3,257', remaining: '243' },
                { type: 'VVIP', sold: '848', checkIn: '441', remaining: '407' },
                { type: 'Premium', sold: '280', checkIn: '180', remaining: '100' },
              ].map((row) => (
                <tr key={row.type}>
                  <td className="py-3 font-bold text-white">{row.type}</td>
                  <td className="py-3 text-slate-400">{row.sold}</td>
                  <td className="py-3 text-[#00b894] font-bold">{row.checkIn}</td>
                  <td className="py-3 text-right text-slate-400">{row.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Check-In Method Breakdown Donut */}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
            Check-In Method Breakdown
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
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
                  strokeDasharray="82, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.8"
                  strokeDasharray="18, 100"
                  strokeDashoffset="-82"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                16,692
              </div>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#00b894]" />
                <span className="text-slate-300">QR Scan: 82% (13,680)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">Manual Check-In: 18% (3,012)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Check-In Activity Card */}
      <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-base font-extrabold text-white">Live Check-In Activity</h3>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none">
              <option>Last 10 minutes</option>
              <option>Last 30 minutes</option>
              <option>Last 1 hour</option>
            </select>

            <select className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none">
              <option>All Ticket Types</option>
              <option>Regular</option>
              <option>VIP</option>
              <option>VVIP</option>
              <option>Premium</option>
            </select>

            <button className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer">
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>

            <button className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer">
              <UserCheck className="w-4 h-4" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        {/* Live Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-bold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Ticket Type</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Time Checked-In</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {[
                { name: 'Adebayo Johnson', type: 'VIP', method: 'QR Scan', time: '5:45 PM' },
                { name: 'Blessing Okoro', type: 'Regular', method: 'QR Scan', time: '6:00 PM' },
                { name: 'Daniel Musa', type: 'VVIP', method: 'Manual', time: '6:10 PM' },
              ].map((guest, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-bold text-white">{guest.name}</td>
                  <td className="py-3 text-slate-400">{guest.type}</td>
                  <td className="py-3 text-slate-300">{guest.method}</td>
                  <td className="py-3 text-slate-400">{guest.time}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Checked-In</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
