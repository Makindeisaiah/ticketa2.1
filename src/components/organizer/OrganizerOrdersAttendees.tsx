import React, { useState } from 'react';
import {
  Ticket,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  CreditCard,
  QrCode,
} from 'lucide-react';

interface OrganizerOrdersAttendeesProps {
  orders: any[];
  attendees: any[];
  events: any[];
}

export const OrganizerOrdersAttendees: React.FC<OrganizerOrdersAttendeesProps> = ({
  orders,
  attendees,
  events,
}) => {
  const [subTab, setSubTab] = useState<'orders' | 'attendees'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('ALL');

  const filteredOrders = orders.filter((o) => {
    if (selectedEventId !== 'ALL' && o.event_id !== selectedEventId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        o.event_title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredAttendees = attendees.filter((a) => {
    if (selectedEventId !== 'ALL' && a.event_id !== selectedEventId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.ticket_code.toLowerCase().includes(q) ||
        a.attendee_name.toLowerCase().includes(q) ||
        a.attendee_email.toLowerCase().includes(q) ||
        a.event_title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCSV = () => {
    const list = subTab === 'orders' ? filteredOrders : filteredAttendees;
    if (list.length === 0) return;

    let headers = '';
    let rows = '';

    if (subTab === 'orders') {
      headers = 'Order Number,Customer Name,Customer Email,Event,Amount,Status,Date\n';
      rows = list
        .map(
          (o) =>
            `"${o.order_number}","${o.customer_name}","${o.customer_email}","${o.event_title}",${o.total_amount},"${o.status}","${o.created_at}"`
        )
        .join('\n');
    } else {
      headers = 'Ticket Code,Attendee Name,Attendee Email,Event,Ticket Type,Checked In,Check In Time\n';
      rows = list
        .map(
          (a) =>
            `"${a.ticket_code}","${a.attendee_name}","${a.attendee_email}","${a.event_title}","${a.ticket_type_name}",${a.is_checked_in},"${a.checked_in_at || ''}"`
        )
        .join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticketa-${subTab}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Orders &amp; Attendees Directory</h2>
          <p className="text-xs text-slate-400">
            Real-time sales, order breakdown, and ticket check-in statuses
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'orders'
                ? 'bg-[#00b894] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setSubTab('attendees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'attendees'
                ? 'bg-[#00b894] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Attendees / Tickets ({attendees.length})
          </button>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Event Filter */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none cursor-pointer"
          >
            <option value="ALL">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                subTab === 'orders' ? 'Search by order # or email...' : 'Search by ticket code or name...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl pl-10 pr-4 py-2 text-white text-xs outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#00b894]" />
          <span>Export {subTab === 'orders' ? 'Orders' : 'Attendees'} CSV</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
        {subTab === 'orders' ? (
          filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No orders found for this search/filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Order #</th>
                  <th className="pb-3 pr-4">Customer Name &amp; Email</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Total Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#00b894]">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="block font-bold text-white">{ord.customer_name}</span>
                      <span className="block text-[10px] text-slate-500">{ord.customer_email}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-300 font-medium">{ord.event_title}</td>
                    <td className="py-3.5 pr-4 font-extrabold text-white">
                      {formatMoney(Number(ord.total_amount))}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : filteredAttendees.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No attendees or tickets found for this filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Ticket Code</th>
                <th className="pb-3 pr-4">Holder Name &amp; Email</th>
                <th className="pb-3 pr-4">Event</th>
                <th className="pb-3 pr-4">Ticket Type</th>
                <th className="pb-3 pr-4">Check-In Status</th>
                <th className="pb-3">Checked In At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredAttendees.map((tck) => (
                <tr key={tck.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono font-bold text-[#00b894]">
                    {tck.ticket_code}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="block font-bold text-white">{tck.attendee_name}</span>
                    <span className="block text-[10px] text-slate-500">{tck.attendee_email}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-slate-300 font-medium">{tck.event_title}</td>
                  <td className="py-3.5 pr-4 text-slate-300">{tck.ticket_type_name}</td>
                  <td className="py-3.5 pr-4">
                    {tck.is_checked_in ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Not Checked In
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-slate-400">
                    {tck.checked_in_at ? new Date(tck.checked_in_at).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
