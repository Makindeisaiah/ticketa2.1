import React, { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Calendar, MapPin, QrCode, Search, ChevronRight, Loader2 } from 'lucide-react';
import { CompletedOrderResult, getUserOrders } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

interface MyTicketsPageProps {
  onViewTicketWallet: (order: CompletedOrderResult) => void;
  onNavigateToBrowse: () => void;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({
  onViewTicketWallet,
  onNavigateToBrowse,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CompletedOrderResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      setLoading(true);
      if (!user) {
        if (isMounted) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      const fetched = await getUserOrders(user.email, user.id);
      if (isMounted) {
        setOrders(fetched);
        setLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const now = new Date();

  const filteredOrders = orders.filter((ord) => {
    const eventDate = new Date(ord.eventDate);
    const isUpcoming = eventDate >= now;

    if (activeTab === 'UPCOMING' && !isUpcoming) return false;
    if (activeTab === 'PAST' && isUpcoming) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ord.eventTitle.toLowerCase().includes(q) ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.eventVenue.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your digital event tickets and QR entry passes</p>
        </div>

        <button
          onClick={onNavigateToBrowse}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          Browse Events
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        
        {/* Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming Events ({orders.filter((o) => new Date(o.eventDate) >= now).length})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PAST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Past Events ({orders.filter((o) => new Date(o.eventDate) < now).length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search my tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none text-slate-900 placeholder-slate-400 font-medium"
          />
        </div>

      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <TicketIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">No tickets found</h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'UPCOMING'
                ? "You don't have any upcoming event tickets yet."
                : 'You have no past event ticket history.'}
            </p>
          </div>
          <button
            onClick={onNavigateToBrowse}
            className="bg-[#00b894] text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs"
          >
            Explore Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((ord) => {
            const dateFormatted = new Date(ord.eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={ord.eventBanner}
                    alt={ord.eventTitle}
                    className="w-20 h-28 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                  />
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {ord.orderNumber}
                      </span>
                      <span className="bg-emerald-100 text-[#00b894] font-bold text-[10px] px-2 py-0.5 rounded-full">
                        VALID
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{ord.eventTitle}</h3>

                    <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00b894]" />
                      <span>{dateFormatted}</span>
                    </div>

                    <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0" />
                      <span className="truncate">{ord.eventVenue}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">
                      {ord.items.map((i) => `${i.quantity}x ${i.ticketTypeName}`).join(', ')}
                    </span>
                  </div>

                  <button
                    onClick={() => onViewTicketWallet(ord)}
                    className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Ticket &amp; QR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
