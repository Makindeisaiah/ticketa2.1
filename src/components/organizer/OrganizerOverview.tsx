import React from 'react';
import {
  DollarSign,
  Ticket,
  Calendar,
  QrCode,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface OrganizerOverviewProps {
  metrics: {
    totalRevenue: number;
    ticketsSold: number;
    totalEvents: number;
    activeEvents: number;
    totalCheckedIn: number;
  };
  recentOrders: any[];
  events: any[];
  onNavigateTab: (tab: any) => void;
  onOpenCreateEvent: () => void;
}

export const OrganizerOverview: React.FC<OrganizerOverviewProps> = ({
  metrics,
  recentOrders,
  events,
  onNavigateTab,
  onOpenCreateEvent,
}) => {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <span className="bg-[#00b894]/20 border border-[#00b894]/30 text-[#00b894] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
            REAL SUPABASE DATA ENGINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Organizer Dashboard</h2>
          <p className="text-slate-400 text-xs max-w-lg">
            Monitor real-time event performance, ticket sales, check-in analytics, and payout management directly backed by PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={onOpenCreateEvent}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>

          <button
            onClick={() => onNavigateTab('scanner')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#00b894]" />
            <span>Open Scanner</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {formatMoney(metrics.totalRevenue)}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Verified Paystack / Supabase
            </span>
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tickets Sold</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {metrics.ticketsSold.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-bold block mt-1">
              Across {metrics.totalEvents} created events
            </span>
          </div>
        </div>

        {/* Active Events */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Events</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {metrics.activeEvents}
            </span>
            <span className="text-[11px] text-slate-400 font-bold block mt-1">
              Out of {metrics.totalEvents} total events
            </span>
          </div>
        </div>

        {/* Total Checked In */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Checked-In Attendees</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {metrics.totalCheckedIn.toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-400 font-bold block mt-1">
              Atomic QR scanner logs
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Events Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Ticket Orders</h3>
              <p className="text-xs text-slate-400">Latest completed purchases across your events</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#00b894] hover:underline flex items-center cursor-pointer"
            >
              View All Orders
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No orders recorded yet. Create an event and share the ticket link!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3 pr-4">Order #</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Event</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentOrders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 pr-4 font-mono font-bold text-[#00b894]">
                        {order.order_number}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="block font-bold text-slate-200">{order.customer_name}</span>
                        <span className="block text-[10px] text-slate-500">{order.customer_email}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300 font-medium truncate max-w-[140px]">
                        {order.event_title}
                      </td>
                      <td className="py-3 pr-4 font-bold text-white">
                        {formatMoney(Number(order.total_amount))}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Events Quick Overview Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Events</h3>
              <p className="text-xs text-slate-400">Quick list of your events</p>
            </div>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs font-bold text-[#00b894] hover:underline flex items-center cursor-pointer"
            >
              Manage Events
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs space-y-3">
              <p>No events found for this organization.</p>
              <button
                onClick={onOpenCreateEvent}
                className="bg-[#00b894] text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between space-x-3"
                >
                  <div className="truncate">
                    <span className="block font-bold text-white text-xs truncate">{evt.title}</span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(evt.start_time).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      evt.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
