import React, { useState } from 'react';
import { Ticket, Search, CheckCircle2, User, Mail, DollarSign, Clock } from 'lucide-react';

interface OrganizerOrdersAttendeesProps {
  orders: any[];
  attendees: any[];
}

export const OrganizerOrdersAttendees: React.FC<OrganizerOrdersAttendeesProps> = ({
  orders,
  attendees,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ORDERS' | 'ATTENDEES'>('ORDERS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      o.customer_name?.toLowerCase().includes(term) ||
      o.customer_email?.toLowerCase().includes(term) ||
      o.event_title?.toLowerCase().includes(term)
    );
  });

  const filteredAttendees = attendees.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.ticket_code?.toLowerCase().includes(term) ||
      a.attendee_name?.toLowerCase().includes(term) ||
      a.attendee_email?.toLowerCase().includes(term) ||
      a.event_title?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ORDERS'
                ? 'bg-[#00b894] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orders History ({orders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ATTENDEES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ATTENDEES'
                ? 'bg-[#00b894] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Issued Tickets &amp; Attendees ({attendees.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#00b894]"
          />
        </div>
      </div>

      {activeSubTab === 'ORDERS' ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No orders record found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Order Ref</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-white">{ord.id.slice(0, 8)}...</td>
                    <td className="py-3.5 pr-4">
                      <span className="block font-bold text-slate-200">{ord.customer_name}</span>
                      <span className="block text-[10px] text-slate-400">{ord.customer_email}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-slate-300">{ord.event_title}</td>
                    <td className="py-3.5 pr-4 font-bold text-[#00b894]">
                      ₦{Number(ord.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          {filteredAttendees.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No issued tickets found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Ticket Code</th>
                  <th className="pb-3 pr-4">Attendee</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Tier</th>
                  <th className="pb-3 pr-4">Check-In Status</th>
                  <th className="pb-3">Issued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#00b894]">{att.ticket_code}</td>
                    <td className="py-3.5 pr-4">
                      <span className="block font-bold text-slate-200">{att.attendee_name}</span>
                      <span className="block text-[10px] text-slate-400">{att.attendee_email}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-slate-300">{att.event_title}</td>
                    <td className="py-3.5 pr-4 font-bold text-slate-400">{att.ticket_type_name}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          att.is_checked_in
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {att.is_checked_in ? 'Checked-In' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{new Date(att.created_at).toLocaleDateString()}</td>
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
