import React, { useState } from 'react';
import { Ticket, Search, CheckCircle2, User, Mail, DollarSign, Clock } from 'lucide-react';

interface OrganizerOrdersAttendeesProps {
  orders: any[];
  attendees: any[];
}

export const OrganizerOrdersAttendees: React.FC<OrganizerOrdersAttendeesProps> = ({
  orders = [],
  attendees = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ORDERS' | 'ATTENDEES'>('ORDERS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = (orders || []).filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      o.id?.toLowerCase().includes(term) ||
      o.customer_name?.toLowerCase().includes(term) ||
      o.customer_email?.toLowerCase().includes(term) ||
      o.event_title?.toLowerCase().includes(term)
    );
  });

  const filteredAttendees = (attendees || []).filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.ticket_code?.toLowerCase().includes(term) ||
      a.attendee_name?.toLowerCase().includes(term) ||
      a.attendee_email?.toLowerCase().includes(term) ||
      a.event_title?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'ORDERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders History ({orders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ATTENDEES')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'ATTENDEES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Issued Tickets &amp; Attendees ({attendees.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-hidden focus:border-[#00b894] transition-colors"
          />
        </div>
      </div>

      {activeSubTab === 'ORDERS' ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">No orders record found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Order Ref</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-extrabold text-slate-900">{ord.id.slice(0, 8)}...</td>
                    <td className="py-3.5 pr-4">
                      <span className="block font-extrabold text-slate-900">{ord.customer_name}</span>
                      <span className="block text-[11px] text-slate-400">{ord.customer_email}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-slate-700">{ord.event_title}</td>
                    <td className="py-3.5 pr-4 font-black text-[#00b894]">
                      ₦{Number(ord.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.status === 'PAID' || ord.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ord.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{new Date(ord.created_at || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs overflow-x-auto">
          {filteredAttendees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">No issued tickets found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Ticket Code</th>
                  <th className="pb-3 pr-4">Attendee</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Tier</th>
                  <th className="pb-3 pr-4">Check-In Status</th>
                  <th className="pb-3">Issued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-extrabold text-[#00b894]">{att.ticket_code}</td>
                    <td className="py-3.5 pr-4">
                      <span className="block font-extrabold text-slate-900">{att.attendee_name}</span>
                      <span className="block text-[11px] text-slate-400">{att.attendee_email}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-slate-700">{att.event_title}</td>
                    <td className="py-3.5 pr-4 font-bold text-slate-500">{att.ticket_type_name}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          att.is_checked_in
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {att.is_checked_in ? 'Checked In' : 'Pending Gate'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{new Date(att.created_at || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
