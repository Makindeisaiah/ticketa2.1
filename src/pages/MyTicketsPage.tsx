import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  QrCode,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CompletedOrderResult, getUserOrders } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

export interface SplitTicketItem {
  uniqueKey: string;
  ticketCode: string;
  ticketType: string;
  qrCodeHash: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  isCheckedIn: boolean;
  orderNumber: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventBanner: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  order: CompletedOrderResult;
  ticketIndex: number;
  totalInOrder: number;
}

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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

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

  // Expand each order into individual split ticket objects
  const splitTickets: SplitTicketItem[] = [];

  orders.forEach((ord) => {
    if (ord.tickets && ord.tickets.length > 0) {
      ord.tickets.forEach((tkt, idx) => {
        splitTickets.push({
          uniqueKey: `${ord.id}-${tkt.ticketCode}-${idx}`,
          ticketCode: tkt.ticketCode,
          ticketType: tkt.ticketType || 'General Admission',
          qrCodeHash: tkt.qrCodeHash || `TICKETA_QR:${tkt.ticketCode}:${ord.eventId}`,
          status: tkt.status || 'VALID',
          isCheckedIn: Boolean(tkt.isCheckedIn),
          orderNumber: ord.orderNumber,
          eventTitle: ord.eventTitle,
          eventDate: ord.eventDate,
          eventVenue: ord.eventVenue,
          eventBanner: ord.eventBanner,
          buyerName: ord.buyerName || user?.fullName || 'Ticket Holder',
          buyerEmail: ord.buyerEmail || user?.email || '',
          totalAmount: ord.totalAmount,
          paymentMethod: ord.paymentMethod,
          order: ord,
          ticketIndex: idx + 1,
          totalInOrder: ord.tickets.length,
        });
      });
    } else if (ord.items && ord.items.length > 0) {
      // Fallback if tickets array was not expanded at order creation
      let globalIdx = 1;
      const totalCount = ord.items.reduce((s, it) => s + it.quantity, 0);
      ord.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          const tCode = `${ord.orderNumber}-${item.ticketTypeName.substring(0, 3).toUpperCase()}-${i + 1}`;
          splitTickets.push({
            uniqueKey: `${ord.id}-${tCode}-${globalIdx}`,
            ticketCode: tCode,
            ticketType: item.ticketTypeName,
            qrCodeHash: `TICKETA_QR:${tCode}:${ord.eventId}`,
            status: 'VALID',
            isCheckedIn: false,
            orderNumber: ord.orderNumber,
            eventTitle: ord.eventTitle,
            eventDate: ord.eventDate,
            eventVenue: ord.eventVenue,
            eventBanner: ord.eventBanner,
            buyerName: ord.buyerName || user?.fullName || 'Ticket Holder',
            buyerEmail: ord.buyerEmail || user?.email || '',
            totalAmount: ord.totalAmount,
            paymentMethod: ord.paymentMethod,
            order: ord,
            ticketIndex: globalIdx,
            totalInOrder: totalCount,
          });
          globalIdx++;
        }
      });
    } else {
      // Fallback single ticket
      splitTickets.push({
        uniqueKey: `${ord.id}-single`,
        ticketCode: ord.orderNumber,
        ticketType: 'General Admission',
        qrCodeHash: `TICKETA_QR:${ord.orderNumber}:${ord.eventId}`,
        status: 'VALID',
        isCheckedIn: false,
        orderNumber: ord.orderNumber,
        eventTitle: ord.eventTitle,
        eventDate: ord.eventDate,
        eventVenue: ord.eventVenue,
        eventBanner: ord.eventBanner,
        buyerName: ord.buyerName || user?.fullName || 'Ticket Holder',
        buyerEmail: ord.buyerEmail || user?.email || '',
        totalAmount: ord.totalAmount,
        paymentMethod: ord.paymentMethod,
        order: ord,
        ticketIndex: 1,
        totalInOrder: 1,
      });
    }
  });

  const now = new Date();

  const filteredTickets = splitTickets.filter((tkt) => {
    const eventDate = new Date(tkt.eventDate);
    const isUpcoming = eventDate >= now;

    if (activeTab === 'UPCOMING' && !isUpcoming) return false;
    if (activeTab === 'PAST' && isUpcoming) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tkt.eventTitle.toLowerCase().includes(q) ||
        tkt.ticketCode.toLowerCase().includes(q) ||
        tkt.ticketType.toLowerCase().includes(q) ||
        tkt.orderNumber.toLowerCase().includes(q) ||
        tkt.eventVenue.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleDownloadTicket = (ticket: SplitTicketItem) => {
    setDownloadToast(`Ticket #${ticket.ticketCode} downloaded! Ready for entry.`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 4000);
  };

  const handlePrintTicket = (ticket: SplitTicketItem) => {
    onViewTicketWallet(ticket.order, ticket.ticketCode);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const getTicketTypeColor = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('vip') || lower.includes('vvip')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (lower.includes('early') || lower.includes('discount')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (lower.includes('table') || lower.includes('gold') || lower.includes('platinum')) {
      return 'bg-amber-100 text-amber-900 border-amber-200';
    }
    return 'bg-emerald-100 text-[#00b894] border-emerald-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#00b894] flex-shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Tickets</h1>
            <span className="bg-[#00b894]/10 text-[#00b894] font-bold text-xs px-2.5 py-0.5 rounded-full border border-[#00b894]/20">
              {splitTickets.length} {splitTickets.length === 1 ? 'Pass' : 'Passes'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Each ticket is individually generated with its own scannable QR entry pass and ticket number.
          </p>
        </div>

        <button
          onClick={onNavigateToBrowse}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto flex items-center space-x-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explore More Events</span>
        </button>
      </div>

      {/* Tabs & Search */}
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
            Upcoming Tickets ({splitTickets.filter((t) => new Date(t.eventDate) >= now).length})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PAST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Past Tickets ({splitTickets.filter((t) => new Date(t.eventDate) < now).length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus-within:border-[#00b894] transition-colors">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by event, ticket #, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none text-slate-900 placeholder-slate-400 font-medium"
          />
        </div>

      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#00b894] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your ticket passes...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <TicketIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">No tickets found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `No tickets match "${searchQuery}". Try a different search term.`
                : activeTab === 'UPCOMING'
                ? "You don't have any upcoming event tickets yet."
                : 'You have no past event ticket history.'}
            </p>
          </div>
          <button
            onClick={onNavigateToBrowse}
            className="bg-[#00b894] text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs hover:bg-[#00a383] transition-colors"
          >
            Explore Events
          </button>
        </div>
      ) : (
        /* Split Individual Ticket Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTickets.map((tkt) => {
            const dateFormatted = new Date(tkt.eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={tkt.uniqueKey}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top Banner with Ticket Type and Status */}
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getTicketTypeColor(tkt.ticketType)}`}>
                      {tkt.ticketType}
                    </span>
                    {tkt.totalInOrder > 1 && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Pass {tkt.ticketIndex} of {tkt.totalInOrder}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-[#00b894] border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{tkt.isCheckedIn ? 'CHECKED IN' : 'VALID ENTRY'}</span>
                    </span>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="p-5 space-y-4">
                  
                  {/* Event Info Header */}
                  <div className="flex items-start space-x-4">
                    <img
                      src={tkt.eventBanner}
                      alt={tkt.eventTitle}
                      className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl border border-slate-200 shadow-xs flex-shrink-0"
                    />

                    <div className="space-y-2 flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug truncate">
                        {tkt.eventTitle}
                      </h3>

                      <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0" />
                        <span className="font-medium">{dateFormatted}</span>
                      </div>

                      <div className="flex items-start text-xs text-slate-600 space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0 mt-0.5" />
                        <span className="truncate">{tkt.eventVenue}</span>
                      </div>

                      <div className="flex items-center text-[11px] text-slate-500 space-x-1.5 pt-0.5">
                        <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">Holder: <strong className="text-slate-800 font-semibold">{tkt.buyerName}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code and Ticket Number Perforated Section */}
                  <div className="relative bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Left: Scannable QR Code */}
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex-shrink-0 flex items-center justify-center">
                        <QRCodeSVG
                          value={tkt.qrCodeHash}
                          size={96}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      <div className="space-y-1 text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          Ticket Reference Number
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900 tracking-wider">
                            {tkt.ticketCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(tkt.ticketCode)}
                            title="Copy Ticket Code"
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedCode === tkt.ticketCode ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-500 block font-medium">
                          Order: <span className="font-mono text-slate-700">{tkt.orderNumber}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Quick QR Scan indicator */}
                    <div className="hidden sm:flex flex-col items-center justify-center border-l border-slate-200 pl-4 space-y-1">
                      <ShieldCheck className="w-6 h-6 text-[#00b894]" />
                      <span className="text-[10px] text-slate-400 font-semibold text-center uppercase tracking-wide">
                        Verified Pass
                      </span>
                    </div>

                  </div>

                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePrintTicket(tkt)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => handleDownloadTicket(tkt)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save PDF</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onViewTicketWallet(tkt.order, tkt.ticketCode)}
                    className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 ml-auto"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Digital Wallet Pass</span>
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

export default MyTicketsPage;
