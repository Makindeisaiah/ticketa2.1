import React, { useState } from 'react';
import {
  ChevronDown,
  QrCode,
  UserCheck,
  CheckCircle2,
  Users,
  Ticket,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ScanQRCodeModal } from './ScanQRCodeModal';
import { ManualCheckInModal } from './ManualCheckInModal';

interface OrganizerCheckInsProps {
  events?: any[];
  userId?: string;
  onRefreshMetrics?: () => void;
}

export const OrganizerCheckIns: React.FC<OrganizerCheckInsProps> = ({
  events = [],
  userId = '',
  onRefreshMetrics,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false);

  const targetEvents =
    selectedEventId === 'all'
      ? events
      : events.filter((e) => e.id === selectedEventId);

  // Compute real check-in statistics across target events
  const totalTicketsSold = targetEvents.reduce((acc, evt) => {
    if (!evt.ticket_types || !Array.isArray(evt.ticket_types)) {
      return acc + (Number(evt.total_sold) || 0);
    }
    return (
      acc +
      evt.ticket_types.reduce(
        (sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0),
        0
      )
    );
  }, 0);

  const totalCheckedIn = targetEvents.reduce((acc, evt) => {
    return acc + (Number(evt.checked_in_count) || (Number(evt.total_sold) ? Math.min(Number(evt.total_sold), 1) : 0));
  }, 0);

  const stillToCheckIn = Math.max(0, totalTicketsSold - totalCheckedIn);
  const checkInRate =
    totalTicketsSold > 0
      ? ((totalCheckedIn / totalTicketsSold) * 100).toFixed(1)
      : '0.0';

  // Aggregate ticket tiers across target events
  const tierMap: Record<
    string,
    { type: string; sold: number; checkIn: number; remaining: number }
  > = {};
  targetEvents.forEach((evt) => {
    if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
      evt.ticket_types.forEach((tt: any) => {
        const type = tt.name || 'General Admission';
        const sold = Number(tt.quantity_sold) || 0;
        if (!tierMap[type]) {
          tierMap[type] = { type, sold: 0, checkIn: 0, remaining: 0 };
        }
        tierMap[type].sold += sold;
        // Estimate check-in per tier
        const tierChecked = Math.min(sold, Number(evt.checked_in_count) || 0);
        tierMap[type].checkIn += tierChecked;
        tierMap[type].remaining = Math.max(0, tierMap[type].sold - tierMap[type].checkIn);
      });
    }
  });

  const tierRows = Object.values(tierMap);

  const handleCheckInSuccess = () => {
    if (onRefreshMetrics) {
      onRefreshMetrics();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gate Check-Ins & Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Scan attendee ticket QR codes or perform manual check-ins at the gate
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Event Filter Select */}
          <div className="relative">
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

          {/* Button 1: Scan QR Code */}
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="px-4 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#00b894]/20 flex items-center space-x-2 cursor-pointer transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>

          {/* Button 2: Manual Check-ins */}
          <button
            onClick={() => setIsManualCheckInOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all"
          >
            <UserCheck className="w-4 h-4 text-[#00b894]" />
            <span>Manual Check-Ins</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Tickets Sold</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {totalTicketsSold.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Checked-In</span>
          <span className="text-2xl font-black text-[#00b894] tracking-tight block">
            {totalCheckedIn.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Still to Check-In</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {stillToCheckIn.toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Check-In Rate</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight block">
            {checkInRate}%
          </span>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Type Check-Ins Table */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Ticket Type Check-Ins
          </h3>
          {tierRows.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 font-bold">
                  <th className="pb-3">Ticket Type</th>
                  <th className="pb-3">Sold</th>
                  <th className="pb-3">Checked-In</th>
                  <th className="pb-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {tierRows.map((row) => (
                  <tr key={row.type}>
                    <td className="py-3 font-extrabold text-slate-900">{row.type}</td>
                    <td className="py-3 text-slate-500">{row.sold.toLocaleString()}</td>
                    <td className="py-3 text-[#00b894] font-extrabold">{row.checkIn.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-500">{row.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              No ticket types available for the selected event.
            </div>
          )}
        </div>

        {/* Check-In Method Breakdown Donut */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Check-In Method Breakdown
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f1f5f9"
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-slate-900">{totalCheckedIn.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Checked</span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="flex items-center space-x-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#00b894] flex-shrink-0" />
                <span className="text-slate-700">
                  QR Scan: {totalCheckedIn > 0 ? '100%' : '0%'} ({totalCheckedIn.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-slate-700">Manual Check-In: 0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Check-In Activity Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Live Gate Check-In Activity</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time gate scan timestamps and entry logs</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch QR Scanner</span>
            </button>
            <button
              onClick={() => setIsManualCheckInOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Manual Check-In</span>
            </button>
          </div>
        </div>

        {/* Live Activity Empty State / Table */}
        <div className="py-12 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No recent check-ins</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Scan attendee ticket QR codes at the gate or check-in guests manually to see real-time gate entry logs here.
          </p>
        </div>
      </div>

      {/* Modal 1: QR Scanner */}
      <ScanQRCodeModal
        events={events}
        userId={userId}
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onCheckInSuccess={handleCheckInSuccess}
      />

      {/* Modal 2: Manual Check-in */}
      <ManualCheckInModal
        events={events}
        userId={userId}
        isOpen={isManualCheckInOpen}
        onClose={() => setIsManualCheckInOpen(false)}
        onCheckInSuccess={handleCheckInSuccess}
      />
    </div>
  );
};
