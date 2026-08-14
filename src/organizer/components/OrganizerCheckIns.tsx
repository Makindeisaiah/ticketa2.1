import React, { useState } from 'react';
import {
  ChevronDown,
  QrCode,
  UserCheck,
  CheckCircle2,
  Users,
  X,
} from 'lucide-react';
import { OrganizerCheckInScanner } from './OrganizerCheckInScanner';

export const OrganizerCheckIns: React.FC<{ events?: any[]; userId?: string }> = ({ events = [], userId = '' }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const targetEvents = selectedEventId === 'all'
    ? events
    : events.filter((e) => e.id === selectedEventId);

  // Compute real check-in statistics across events
  const totalTicketsSold = targetEvents.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) return acc;
    return acc + evt.ticket_types.reduce((sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0), 0);
  }, 0);

  const totalCheckedIn = targetEvents.reduce((acc, evt) => {
    return acc + (Number(evt.checked_in_count) || 0);
  }, 0);

  const stillToCheckIn = Math.max(0, totalTicketsSold - totalCheckedIn);
  const checkInRate = totalTicketsSold > 0 ? ((totalCheckedIn / totalTicketsSold) * 100).toFixed(1) : '0';

  // Aggregate ticket tiers across target events
  const tierMap: Record<string, { type: string; sold: number; checkIn: number; remaining: number }> = {};
  targetEvents.forEach((evt) => {
    if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
      evt.ticket_types.forEach((tt: any) => {
        const type = tt.name || 'Standard';
        const sold = Number(tt.quantity_sold) || 0;
        if (!tierMap[type]) {
          tierMap[type] = { type, sold: 0, checkIn: 0, remaining: 0 };
        }
        tierMap[type].sold += sold;
        tierMap[type].remaining += sold; // Will adjust if per-tier checkin tracked
      });
    }
  });

  const tierRows = Object.values(tierMap);

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

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="relative">
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

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch Scanner</span>
          </button>
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
          <span className="text-2xl font-black text-[#00b894] tracking-tight block">{totalCheckedIn.toLocaleString()}</span>
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
          {tierRows.length > 0 ? (
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
                {tierRows.map((row) => (
                  <tr key={row.type}>
                    <td className="py-3 font-bold text-white">{row.type}</td>
                    <td className="py-3 text-slate-400">{row.sold.toLocaleString()}</td>
                    <td className="py-3 text-[#00b894] font-bold">{row.checkIn.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-400">{row.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500">
              No ticket types available for the selected event.
            </div>
          )}
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
                  strokeDasharray={`${totalCheckedIn > 0 ? 100 : 0}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                {totalCheckedIn.toLocaleString()}
              </div>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#00b894]" />
                <span className="text-slate-300">QR Scan: {totalCheckedIn > 0 ? '100%' : '0%'} ({totalCheckedIn.toLocaleString()})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-300">Manual Check-In: 0%</span>
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
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>

        {/* Live Activity Empty State / Table */}
        <div className="py-12 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No recent check-ins</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Scan attendee ticket QR codes at the gate or check-in guests manually to see real-time gate entry logs here.
          </p>
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#111723] border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Ticket QR Scanner & Verification</h2>
              <p className="text-xs text-slate-400">Scan QR codes or manually enter ticket IDs for entry validation</p>
            </div>
            <OrganizerCheckInScanner events={events} userId={userId} />
          </div>
        </div>
      )}
    </div>
  );
};
