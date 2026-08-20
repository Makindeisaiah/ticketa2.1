import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  X,
  UserCheck,
  Clock,
  Ticket,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { checkInTicket, getEventAttendees } from '../services/organizerService';

interface ManualCheckInModalProps {
  events: any[];
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess?: () => void;
}

export const ManualCheckInModal: React.FC<ManualCheckInModalProps> = ({
  events = [],
  userId,
  isOpen,
  onClose,
  onCheckInSuccess,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHECKED_IN' | 'PENDING'>('ALL');

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const loadAttendees = React.useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const data = await getEventAttendees(selectedEventId);
      setAttendees(data);
    } catch (e) {
      console.error('Failed to load attendees for event:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (isOpen && selectedEventId) {
      loadAttendees();
    }
  }, [isOpen, selectedEventId, loadAttendees]);

  if (!isOpen) return null;

  const handleManualCheckIn = async (attendee: any) => {
    const ticketCode = attendee.ticket_code;
    if (!ticketCode) return;

    setProcessingId(attendee.id || ticketCode);
    try {
      const res = await checkInTicket(ticketCode, selectedEventId, userId);
      if (res.success) {
        // Optimistically update list
        setAttendees((prev) =>
          prev.map((a) =>
            a.ticket_code === ticketCode || a.id === attendee.id
              ? { ...a, is_checked_in: true, checked_in_at: new Date().toISOString() }
              : a
          )
        );
        if (onCheckInSuccess) onCheckInSuccess();
      } else {
        alert(res.message || 'Check-in failed');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to check in attendee.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAttendees = attendees.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.attendee_name?.toLowerCase().includes(q) ||
      a.attendee_email?.toLowerCase().includes(q) ||
      a.ticket_code?.toLowerCase().includes(q) ||
      a.ticket_type_name?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterStatus === 'CHECKED_IN') return a.is_checked_in;
    if (filterStatus === 'PENDING') return !a.is_checked_in;
    return true;
  });

  const totalCount = attendees.length;
  const checkedInCount = attendees.filter((a) => a.is_checked_in).length;
  const pendingCount = totalCount - checkedInCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="manual-check-in-modal-dialog"
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Manual Guest Check-In</h3>
              <p className="text-xs text-slate-500 font-medium">
                Admit ticket holders directly by searching attendee names or codes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-3 bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Event Selector */}
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <label className="text-xs font-bold text-slate-600 flex-shrink-0">Event:</label>
              <div className="relative w-full">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3.5 py-2 pr-8 outline-hidden cursor-pointer focus:border-[#00b894] truncate"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Quick Status Count Chips */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('CHECKED_IN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'CHECKED_IN'
                    ? 'bg-[#00b894] text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Checked In ({checkedInCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Pending ({pendingCount})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by attendee name, email address, or ticket code..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#00b894]"
            />
          </div>
        </div>

        {/* Attendees List Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00b894]" />
              <p className="text-xs font-medium">Loading ticket holders...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No ticket holders found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No purchasers matching "${searchQuery}". Try clearing search.`
                  : 'Ticket purchases for this event will appear here for gate check-in.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-3 pr-4">Ticket Holder</th>
                    <th className="pb-3 pr-4">Ticket Code</th>
                    <th className="pb-3 pr-4">Tier</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.map((att) => {
                    const isChecked = att.is_checked_in;
                    const isProcessing = processingId === (att.id || att.ticket_code);

                    return (
                      <tr key={att.id || att.ticket_code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4">
                          <span className="block font-bold text-slate-900 text-xs">
                            {att.attendee_name || 'Guest'}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {att.attendee_email || 'No email provided'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 font-mono font-bold text-slate-700">
                          {att.ticket_code}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold">
                            {att.ticket_type_name || 'Standard'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center space-x-1 ${
                              isChecked
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                : 'bg-amber-50 border border-amber-200 text-amber-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-[#00b894]' : 'bg-amber-500'}`} />
                            <span>{isChecked ? 'Checked In' : 'Pending Entry'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {isChecked ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-xs py-1.5 px-3 bg-emerald-50 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Admitted</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleManualCheckIn(att)}
                              disabled={isProcessing}
                              className="px-4 py-1.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 inline-flex items-center space-x-1 cursor-pointer"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              <span>Check In</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>
            Showing {filteredAttendees.length} of {attendees.length} guests
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
