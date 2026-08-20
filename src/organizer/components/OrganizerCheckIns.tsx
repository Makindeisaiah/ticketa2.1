import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  QrCode,
  UserCheck,
  CheckCircle2,
  Users,
  Ticket,
  Clock,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Filter,
  ShieldCheck,
  ArrowUpDown,
  Mail,
} from 'lucide-react';
import { ScanQRCodeModal } from './ScanQRCodeModal';
import { ManualCheckInModal } from './ManualCheckInModal';
import {
  checkInTicket,
  undoCheckInTicket,
  getEventAttendees,
  getCheckedInMap,
} from '../services/organizerService';

interface OrganizerCheckInsProps {
  events?: any[];
  attendees?: any[];
  orders?: any[];
  userId?: string;
  onRefreshMetrics?: () => void;
}

export const OrganizerCheckIns: React.FC<OrganizerCheckInsProps> = ({
  events = [],
  attendees: initialAttendees = [],
  orders = [],
  userId = '',
  onRefreshMetrics,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'PENDING'>('ALL');
  const [processingCode, setProcessingCode] = useState<string | null>(null);
  const [localAttendees, setLocalAttendees] = useState<any[]>(initialAttendees);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    if (initialAttendees && initialAttendees.length > 0) {
      setLocalAttendees(initialAttendees);
    }
  }, [initialAttendees]);

  // Load attendees for selected event or all events
  const loadAttendeesData = React.useCallback(async () => {
    setIsLoadingAttendees(true);
    try {
      const data = await getEventAttendees(selectedEventId);
      if (data && data.length > 0) {
        setLocalAttendees(data);
      } else if (initialAttendees && initialAttendees.length > 0) {
        setLocalAttendees(initialAttendees);
      }
    } catch (e) {
      console.error('Error loading attendees for check-ins:', e);
    } finally {
      setIsLoadingAttendees(false);
    }
  }, [selectedEventId, initialAttendees]);

  useEffect(() => {
    loadAttendeesData();
  }, [selectedEventId, loadAttendeesData]);

  // Listen to check-in and order events
  useEffect(() => {
    const handleCheckInEvent = () => {
      loadAttendeesData();
      if (onRefreshMetrics) {
        onRefreshMetrics();
      }
    };

    window.addEventListener('ticketa_checkin_updated', handleCheckInEvent);
    window.addEventListener('ticketa_order_created', handleCheckInEvent);
    window.addEventListener('ticketa_order_completed', handleCheckInEvent);
    window.addEventListener('ticketa_tickets_updated', handleCheckInEvent);

    return () => {
      window.removeEventListener('ticketa_checkin_updated', handleCheckInEvent);
      window.removeEventListener('ticketa_order_created', handleCheckInEvent);
      window.removeEventListener('ticketa_order_completed', handleCheckInEvent);
      window.removeEventListener('ticketa_tickets_updated', handleCheckInEvent);
    };
  }, [loadAttendeesData, onRefreshMetrics]);

  const targetEvents = useMemo(() => {
    return selectedEventId === 'all'
      ? events
      : events.filter((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  // Filter attendees for selected event
  const targetAttendees = useMemo(() => {
    const checkedMap = getCheckedInMap();
    let list = localAttendees;

    if (selectedEventId !== 'all') {
      const activeEvt = events.find((e) => e.id === selectedEventId);
      list = localAttendees.filter(
        (a) =>
          a.event_id === selectedEventId ||
          (activeEvt && a.event_title?.toLowerCase() === activeEvt.title?.toLowerCase())
      );
    }

    return list.map((a) => {
      const isChecked = Boolean(
        a.is_checked_in ||
        checkedMap[a.ticket_code] ||
        checkedMap[a.ticketCode] ||
        checkedMap[a.qr_code_hash]
      );
      return {
        ...a,
        is_checked_in: isChecked,
        checked_in_at: a.checked_in_at || (isChecked ? checkedMap[a.ticket_code]?.checked_in_at : undefined),
      };
    });
  }, [localAttendees, selectedEventId, events]);

  // 1. Compute real check-in statistics across target events
  const totalTicketsSold = useMemo(() => {
    if (targetEvents.length === 0) return targetAttendees.length;

    return targetEvents.reduce((acc, evt) => {
      const ttSold = (evt.ticket_types || []).reduce(
        (sub: number, tt: any) => sub + (Number(tt.quantity_sold) || 0),
        0
      );
      const matchingAttendeesCount = localAttendees.filter(
        (a) => a.event_id === evt.id || a.event_title?.toLowerCase() === evt.title?.toLowerCase()
      ).length;

      const evtSold = Math.max(Number(evt.total_sold) || 0, ttSold, matchingAttendeesCount);
      return acc + evtSold;
    }, 0);
  }, [targetEvents, targetAttendees, localAttendees]);

  const checkedInAttendeesCount = useMemo(() => {
    return targetAttendees.filter((a) => a.is_checked_in).length;
  }, [targetAttendees]);

  const totalCheckedIn = useMemo(() => {
    const eventCounts = targetEvents.reduce(
      (sum, e) => sum + (Number(e.checked_in_count) || 0),
      0
    );
    return Math.max(checkedInAttendeesCount, eventCounts);
  }, [checkedInAttendeesCount, targetEvents]);

  const stillToCheckIn = Math.max(0, totalTicketsSold - totalCheckedIn);
  const checkInRate =
    totalTicketsSold > 0
      ? ((totalCheckedIn / totalTicketsSold) * 100).toFixed(1)
      : '0.0';

  // 2. Aggregate ticket tiers across target events & attendees
  const tierRows = useMemo(() => {
    const map: Record<
      string,
      { type: string; sold: number; checkIn: number; remaining: number }
    > = {};

    // First populate from ticket_types configured on target events
    targetEvents.forEach((evt) => {
      if (evt.ticket_types && Array.isArray(evt.ticket_types)) {
        evt.ticket_types.forEach((tt: any) => {
          const type = tt.name || 'General Admission';
          const sold = Number(tt.quantity_sold) || 0;
          if (!map[type]) {
            map[type] = { type, sold: 0, checkIn: 0, remaining: 0 };
          }
          map[type].sold += sold;
        });
      }
    });

    // Tally actual attendee records per ticket type
    targetAttendees.forEach((att) => {
      const type = att.ticket_type_name || att.ticket_type || 'General Admission';
      if (!map[type]) {
        map[type] = { type, sold: 0, checkIn: 0, remaining: 0 };
      }
      // If tier was not populated by ticket_types or has fewer sold than attendee count
      if (map[type].sold < targetAttendees.filter((a) => (a.ticket_type_name || 'General Admission') === type).length) {
        map[type].sold = targetAttendees.filter((a) => (a.ticket_type_name || 'General Admission') === type).length;
      }
      if (att.is_checked_in) {
        map[type].checkIn += 1;
      }
    });

    // Finalize remaining counts
    Object.values(map).forEach((t) => {
      t.remaining = Math.max(0, t.sold - t.checkIn);
    });

    return Object.values(map);
  }, [targetEvents, targetAttendees]);

  // Handle direct check in from table
  const handleToggleCheckIn = async (attendee: any) => {
    const code = attendee.ticket_code || attendee.ticketCode;
    if (!code) return;

    setProcessingCode(code);
    try {
      if (attendee.is_checked_in) {
        // Undo check-in
        await undoCheckInTicket(code, attendee.event_id);
        setLocalAttendees((prev) =>
          prev.map((a) =>
            (a.ticket_code === code || a.id === attendee.id)
              ? { ...a, is_checked_in: false, checked_in_at: undefined }
              : a
          )
        );
      } else {
        // Perform check-in
        const res = await checkInTicket(code, attendee.event_id || selectedEventId, userId);
        if (res.success) {
          setLocalAttendees((prev) =>
            prev.map((a) =>
              (a.ticket_code === code || a.id === attendee.id)
                ? { ...a, is_checked_in: true, checked_in_at: new Date().toISOString() }
                : a
            )
          );
        } else {
          alert(res.message || 'Check-in failed');
        }
      }

      if (onRefreshMetrics) {
        onRefreshMetrics();
      }
    } catch (err: any) {
      alert(err?.message || 'Error processing check-in.');
    } finally {
      setProcessingCode(null);
    }
  };

  // Filtered guest list for display
  const filteredAttendees = useMemo(() => {
    return targetAttendees.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.attendee_name?.toLowerCase().includes(q) ||
        a.attendee_email?.toLowerCase().includes(q) ||
        a.ticket_code?.toLowerCase().includes(q) ||
        a.event_title?.toLowerCase().includes(q) ||
        a.ticket_type_name?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'CHECKED_IN') return a.is_checked_in;
      if (statusFilter === 'PENDING') return !a.is_checked_in;
      return true;
    });
  }, [targetAttendees, searchQuery, statusFilter]);

  const qrScanPct = totalCheckedIn > 0 ? 100 : 0;

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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Ticket Type Check-Ins
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {tierRows.length} tier{tierRows.length === 1 ? '' : 's'}
            </span>
          </div>

          {tierRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-bold">
                    <th className="pb-3 font-bold">Ticket Type</th>
                    <th className="pb-3 font-bold text-center">Sold</th>
                    <th className="pb-3 font-bold text-center">Checked-In</th>
                    <th className="pb-3 font-bold text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {tierRows.map((row) => {
                    const rowRate = row.sold > 0 ? Math.round((row.checkIn / row.sold) * 100) : 0;
                    return (
                      <tr key={row.type} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-extrabold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{row.type}</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {rowRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-slate-600 font-bold">{row.sold.toLocaleString()}</td>
                        <td className="py-3 text-center text-[#00b894] font-black">{row.checkIn.toLocaleString()}</td>
                        <td className="py-3 text-right text-slate-500 font-bold">{row.remaining.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                  QR Gate Scan: {qrScanPct}% ({totalCheckedIn.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 flex-shrink-0" />
                <span className="text-slate-500">
                  Still Pending: {stillToCheckIn.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Check-In Activity & Guest List Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Live Gate Check-In Activity &amp; Guest List
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e6faf5] text-[#00b894]">
                {targetAttendees.length} total guest{targetAttendees.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time gate scan timestamps and complete guest entry management
            </p>
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
              <UserCheck className="w-4 h-4 text-[#00b894]" />
              <span>Manual Check-In</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, email, ticket code..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#00b894]"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({targetAttendees.length})
            </button>
            <button
              onClick={() => setStatusFilter('CHECKED_IN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'CHECKED_IN'
                  ? 'bg-white text-[#00b894] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Checked In ({checkedInAttendeesCount})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({targetAttendees.length - checkedInAttendeesCount})
            </button>
          </div>
        </div>

        {/* Guest List Table */}
        {filteredAttendees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 font-bold">
                  <th className="pb-3">Attendee</th>
                  <th className="pb-3">Event &amp; Tier</th>
                  <th className="pb-3">Ticket Code</th>
                  <th className="pb-3">Gate Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredAttendees.map((att) => {
                  const code = att.ticket_code || att.ticketCode || 'N/A';
                  const isProcessing = processingCode === code;

                  return (
                    <tr key={att.id || code} className="hover:bg-slate-50/70 transition-colors">
                      {/* Attendee Info */}
                      <td className="py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#e6faf5] text-[#00b894] font-black text-xs flex items-center justify-center flex-shrink-0">
                            {(att.attendee_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {att.attendee_name || 'Valued Attendee'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-300 inline mr-1" />
                              {att.attendee_email || 'attendee@example.com'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Event & Tier */}
                      <td className="py-3.5">
                        <span className="font-bold text-slate-800 block truncate max-w-xs">
                          {att.event_title || 'General Event'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 mt-0.5">
                          {att.ticket_type_name || att.ticket_type || 'Standard Pass'}
                        </span>
                      </td>

                      {/* Ticket Code */}
                      <td className="py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md text-[11px] border border-slate-200">
                          {code}
                        </span>
                      </td>

                      {/* Gate Status */}
                      <td className="py-3.5">
                        {att.is_checked_in ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#e6faf5] text-[#00b894] border border-[#00b894]/20">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#00b894]" />
                              Checked In
                            </span>
                            {att.checked_in_at && (
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {new Date(att.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            Pending Entry
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleToggleCheckIn(att)}
                          disabled={isProcessing}
                          className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ml-auto ${
                            att.is_checked_in
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-[#00b894] hover:bg-[#00a383] text-white shadow-xs'
                          }`}
                        >
                          {att.is_checked_in ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              <span>Undo Check-In</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Check In Guest</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {searchQuery ? 'No matching attendees found' : 'No recent check-ins or guests yet'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try refining your search query or ticket code filter.'
                : 'Scan attendee ticket QR codes at the gate or check-in guests manually to see real-time gate entry logs here.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal 1: QR Scanner */}
      <ScanQRCodeModal
        events={events}
        userId={userId}
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onCheckInSuccess={() => {
          loadAttendeesData();
          if (onRefreshMetrics) onRefreshMetrics();
        }}
      />

      {/* Modal 2: Manual Check-in */}
      <ManualCheckInModal
        events={events}
        userId={userId}
        isOpen={isManualCheckInOpen}
        onClose={() => setIsManualCheckInOpen(false)}
        onCheckInSuccess={() => {
          loadAttendeesData();
          if (onRefreshMetrics) onRefreshMetrics();
        }}
      />
    </div>
  );
};

