import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  QrCode,
  Search,
  ChevronRight,
  ChevronDown,
  User,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Edit2,
  Save,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CompletedOrderResult, OrderTicketPass, getUserOrders, updateTicketGuestName } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

interface MyTicketsPageProps {
  onViewTicketWallet: (order: CompletedOrderResult, ticketCode?: string) => void;
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
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Guest name editing in card
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [guestNameDraft, setGuestNameDraft] = useState<string>('');
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetched = await getUserOrders(user.email, user.id);
    setOrders(fetched);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    const handleTicketsUpdated = () => {
      loadOrders();
    };

    window.addEventListener('ticketa_order_created', handleTicketsUpdated);
    window.addEventListener('ticketa_tickets_updated', handleTicketsUpdated);

    return () => {
      window.removeEventListener('ticketa_order_created', handleTicketsUpdated);
      window.removeEventListener('ticketa_tickets_updated', handleTicketsUpdated);
    };
  }, [user]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartEditName = (ticket: OrderTicketPass) => {
    setEditingCode(ticket.ticketCode);
    setGuestNameDraft(ticket.attendeeName || '');
  };

  const handleSaveName = async (orderId: string, ticketCode: string) => {
    if (!guestNameDraft.trim()) return;
    setSavingCode(ticketCode);

    await updateTicketGuestName(orderId, ticketCode, guestNameDraft.trim());

    // Update local UI state
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          const updatedTickets = (ord.tickets || []).map((t) =>
            t.ticketCode === ticketCode ? { ...t, attendeeName: guestNameDraft.trim() } : t
          );
          return { ...ord, tickets: updatedTickets };
        }
        return ord;
      })
    );

    setSavingCode(null);
    setEditingCode(null);
  };

  const handleSharePass = (ord: CompletedOrderResult, ticket: OrderTicketPass) => {
    const text = `🎟️ Here is your entry pass for "${ord.eventTitle}"!\n\nPass #${ticket.passNumber} of ${ticket.totalPasses}\nCode: ${ticket.ticketCode}\nAttendee: ${ticket.attendeeName}\nTier: ${ticket.ticketType}\nVenue: ${ord.eventVenue}\n\nPresent this pass at venue gate.`;
    
    if (navigator.share) {
      navigator.share({ title: ord.eventTitle, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert(`Pass details for ${ticket.attendeeName} copied to clipboard!`);
    }
  };

  const now = new Date();

  const filteredOrders = orders.filter((ord) => {
    const eventDate = new Date(ord.eventDate);
    const isUpcoming = eventDate >= now;

    if (activeTab === 'UPCOMING' && !isUpcoming) return false;
    if (activeTab === 'PAST' && isUpcoming) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder =
        ord.eventTitle.toLowerCase().includes(q) ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.eventVenue.toLowerCase().includes(q) ||
        ord.buyerName.toLowerCase().includes(q);

      const matchTicket = ord.tickets?.some(
        (t) =>
          t.ticketCode.toLowerCase().includes(q) ||
          t.attendeeName?.toLowerCase().includes(q) ||
          t.ticketType.toLowerCase().includes(q)
      );

      return matchOrder || matchTicket;
    }

    return true;
  });

  const totalTicketsInVault = orders.reduce((sum, ord) => sum + (ord.tickets?.length || ord.items.reduce((s, i) => s + i.quantity, 0)), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-[#00b894]/20 border border-[#00b894]/30 px-3 py-1 rounded-full text-xs font-bold text-[#00b894]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Ticket Vault</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">My Passes &amp; Tickets</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            View, manage, and share your individual digital admission passes. Each purchased ticket includes a unique scannable QR code.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Total Passes Owned</span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-[#00b894]">
              {totalTicketsInVault} <span className="text-xs text-slate-400 font-normal">passes</span>
            </span>
          </div>

          <button
            onClick={onNavigateToBrowse}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#00b894]/20 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>Browse More Events</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        
        {/* Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming Events ({orders.filter((o) => new Date(o.eventDate) >= now).length})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PAST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Past Events ({orders.filter((o) => new Date(o.eventDate) < now).length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-80 flex items-center bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-xs shadow-xs focus-within:border-[#00b894] focus-within:ring-1 focus-within:ring-[#00b894]">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by event, code, or guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none text-slate-900 placeholder-slate-400 font-medium"
          />
        </div>

      </div>

      {/* Orders & Passes List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <TicketIcon className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">No tickets found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `No passes matched your search "${searchQuery}".`
                : activeTab === 'UPCOMING'
                ? "You don't have any upcoming event tickets yet."
                : 'You have no past event ticket history.'}
            </p>
          </div>
          <button
            onClick={onNavigateToBrowse}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            Explore Events
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord) => {
            const dateFormatted = new Date(ord.eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const ticketsList: OrderTicketPass[] = ord.tickets && ord.tickets.length > 0
              ? ord.tickets
              : [
                  {
                    ticketCode: ord.orderNumber,
                    ticketType: ord.items[0]?.ticketTypeName || 'General Admission',
                    passNumber: 1,
                    totalPasses: 1,
                    unitPrice: ord.totalAmount,
                    qrCodeHash: `TICKETA_PASS:${ord.orderNumber}:${ord.eventId}:0`,
                    status: 'VALID',
                    isCheckedIn: false,
                    attendeeName: ord.buyerName || 'Guest Attendee',
                    attendeeEmail: ord.buyerEmail || '',
                    seatZone: 'General Admission • Main Gate',
                  },
                ];

            const isExpanded = expandedOrders[ord.id] ?? (ticketsList.length <= 2);
            const totalPasses = ticketsList.length;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Order Top Banner */}
                <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={ord.eventBanner}
                      alt={ord.eventTitle}
                      className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-2xl border border-slate-700 shadow-md flex-shrink-0"
                    />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-lg">
                          Booking #{ord.orderNumber}
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>PAID &amp; CONFIRMED</span>
                        </span>
                      </div>

                      <h3 className="font-extrabold text-white text-base sm:text-xl leading-snug">
                        {ord.eventTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#00b894]" />
                          <span>{dateFormatted}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00b894]" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{ord.eventVenue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Wallet Action Button */}
                  <div className="w-full md:w-auto flex sm:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Included Passes
                      </span>
                      <span className="text-sm font-bold text-white">
                        {totalPasses} {totalPasses === 1 ? 'Individual Pass' : 'Individual Passes'}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewTicketWallet(ord)}
                      className="bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#00b894]/20 transition-all cursor-pointer flex items-center space-x-2 flex-shrink-0"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Open Wallet ({totalPasses})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-header: Expand/Collapse Bar for individual passes */}
                <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                    <Layers className="w-4 h-4 text-[#00b894]" />
                    <span>Individual Guest Entry Passes ({ticketsList.length})</span>
                  </div>

                  <button
                    onClick={() => toggleExpand(ord.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Individual Passes' : 'Show All Passes'}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {/* Individual Pass Cards Grid */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ticketsList.map((ticket, idx) => {
                        const isEditingThis = editingCode === ticket.ticketCode;
                        const isSavingThis = savingCode === ticket.ticketCode;

                        return (
                          <div
                            key={ticket.ticketCode}
                            className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs hover:border-[#00b894]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                          >
                            {/* Pass Top Badge */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                                  PASS #{ticket.passNumber || idx + 1}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  of {ticket.totalPasses || totalPasses}
                                </span>
                              </div>

                              <span className="text-[11px] font-bold text-[#00b894] uppercase tracking-wider bg-[#00b894]/10 px-2 py-0.5 rounded-md">
                                {ticket.ticketType}
                              </span>
                            </div>

                            {/* Center: Attendee Info & Dedicated QR Code */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  Assigned Guest
                                </span>

                                {isEditingThis ? (
                                  <div className="space-y-1.5">
                                    <input
                                      type="text"
                                      value={guestNameDraft}
                                      onChange={(e) => setGuestNameDraft(e.target.value)}
                                      placeholder="Guest name..."
                                      className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00b894]"
                                      autoFocus
                                    />
                                    <div className="flex items-center space-x-1.5">
                                      <button
                                        onClick={() => handleSaveName(ord.id, ticket.ticketCode)}
                                        disabled={isSavingThis}
                                        className="bg-[#00b894] text-white text-[11px] font-bold px-2 py-1 rounded-md hover:bg-[#00a383] transition-colors cursor-pointer flex items-center space-x-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        <span>{isSavingThis ? '...' : 'Save'}</span>
                                      </button>
                                      <button
                                        onClick={() => setEditingCode(null)}
                                        className="text-slate-500 text-[11px] px-1.5 py-1 hover:text-slate-800"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                      {ticket.attendeeName || ord.buyerName || `Guest Attendee ${idx + 1}`}
                                    </p>
                                    <button
                                      onClick={() => handleStartEditName(ticket)}
                                      className="text-[11px] text-[#00b894] hover:text-[#00a383] font-semibold flex items-center space-x-1 mt-0.5 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Change guest</span>
                                    </button>
                                  </div>
                                )}

                                <p className="text-[10px] text-slate-500 font-medium">
                                  {ticket.seatZone || 'General Gate Entry'}
                                </p>
                              </div>

                              {/* Dedicated QR Preview (Clickable to enlarge in Wallet) */}
                              <button
                                onClick={() => onViewTicketWallet(ord, ticket.ticketCode)}
                                className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs hover:border-[#00b894] transition-all cursor-pointer flex-shrink-0 group"
                                title="Click to view full pass & enlarge QR code"
                              >
                                <QRCodeSVG
                                  value={ticket.qrCodeHash || `TICKETA_PASS:${ticket.ticketCode}:${ord.eventId}`}
                                  size={64}
                                  level="M"
                                />
                                <span className="text-[9px] font-bold text-[#00b894] block text-center mt-1 group-hover:underline">
                                  Enlarge
                                </span>
                              </button>
                            </div>

                            {/* Pass Code & Action Controls */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-1 min-w-0">
                                <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-700 truncate">
                                  {ticket.ticketCode}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(ticket.ticketCode)}
                                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Copy Pass Code"
                                >
                                  {copiedCode === ticket.ticketCode ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center space-x-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleSharePass(ord, ticket)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="Share this single pass to guest"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-[#00b894]" />
                                </button>

                                <button
                                  onClick={() => onViewTicketWallet(ord, ticket.ticketCode)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                >
                                  <span>View Pass</span>
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
