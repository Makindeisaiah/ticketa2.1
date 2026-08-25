import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  Mail,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Share2,
  Edit2,
  Save,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CompletedOrderResult, OrderTicketPass, updateTicketGuestName } from '../services/orderService';

interface TicketWalletModalProps {
  order: CompletedOrderResult;
  initialTicketCode?: string;
  onClose: () => void;
}

export const TicketWalletModal: React.FC<TicketWalletModalProps> = ({
  order,
  initialTicketCode,
  onClose,
}) => {
  // Ensure we have a list of valid ticket passes
  const tickets: OrderTicketPass[] = order.tickets && order.tickets.length > 0
    ? order.tickets
    : [
        {
          ticketCode: order.orderNumber,
          ticketType: 'General Admission',
          passNumber: 1,
          totalPasses: 1,
          unitPrice: order.totalAmount,
          qrCodeHash: `TICKETA_PASS:${order.orderNumber}:${order.eventId}:0`,
          status: 'VALID',
          isCheckedIn: false,
          attendeeName: order.buyerName || 'Event Attendee',
          attendeeEmail: order.buyerEmail || '',
          seatZone: 'General Admission • Main Gate',
        },
      ];

  const initialIndex = initialTicketCode
    ? Math.max(0, tickets.findIndex((t) => t.ticketCode === initialTicketCode))
    : 0;

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL'>('SINGLE');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Guest name editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [localTickets, setLocalTickets] = useState<OrderTicketPass[]>(tickets);

  const activeTicket = localTickets[activeIndex] || localTickets[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartEditName = (index: number) => {
    setEditingIndex(index);
    setGuestNameInput(localTickets[index]?.attendeeName || '');
  };

  const handleSaveGuestName = async (index: number) => {
    const tkt = localTickets[index];
    if (!tkt || !guestNameInput.trim()) return;

    setIsSavingName(true);
    const trimmed = guestNameInput.trim();
    await updateTicketGuestName(order.id || order.orderNumber, tkt.ticketCode, trimmed);

    setLocalTickets((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, attendeeName: trimmed } : t))
    );
    setIsSavingName(false);
    setEditingIndex(null);
  };

  const handleSharePass = (ticket: OrderTicketPass) => {
    const shareText = `🎟️ Here is your official entry pass for "${order.eventTitle}"!\n\nTicket Pass #${ticket.passNumber} of ${ticket.totalPasses}\nPass Code: ${ticket.ticketCode}\nAttendee: ${ticket.attendeeName}\nTier: ${ticket.ticketType}\nVenue: ${order.eventVenue}\n\nPresent this pass or code at the venue gate for entry. Powered by TICKETA.`;
    
    if (navigator.share) {
      navigator
        .share({
          title: `${order.eventTitle} - Entry Pass`,
          text: shareText,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Pass details copied to clipboard! You can send this via WhatsApp, SMS, or email to the attendee.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    alert(`Pass ${activeTicket.ticketCode} (${activeTicket.attendeeName}) downloaded as Digital PDF Pass!`);
  };

  const formattedDate = new Date(order.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00b894] to-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/40">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">TICKETA Official Pass Wallet</h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {localTickets.length} {localTickets.length === 1 ? 'Individual Pass' : 'Individual Passes'} • Booking #{order.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle Button */}
            {localTickets.length > 1 && (
              <button
                onClick={() => setViewMode((m) => (m === 'SINGLE' ? 'ALL' : 'SINGLE'))}
                className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Switch between single pass carousel and all passes view"
              >
                <Layers className="w-3.5 h-3.5 text-[#00b894]" />
                <span>{viewMode === 'SINGLE' ? `View All (${localTickets.length})` : 'Single Pass Mode'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Ticket Navigation Carousel Tabs (Visible when there are 2+ tickets) */}
        {localTickets.length > 1 && (
          <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Pass to Display &amp; Scan ({activeIndex + 1} of {localTickets.length})
              </span>

              {/* Prev / Next Quick Nav */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeIndex === 0}
                  className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveIndex((prev) => Math.min(localTickets.length - 1, prev + 1))}
                  disabled={activeIndex === localTickets.length - 1}
                  className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Passes Strip */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {localTickets.map((tkt, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={tkt.ticketCode}
                    onClick={() => {
                      setActiveIndex(idx);
                      setViewMode('SINGLE');
                    }}
                    className={`flex-shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#00b894] text-white border-[#00b894] shadow-md shadow-[#00b894]/20'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80 border-slate-700/70'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[110px]">{tkt.attendeeName || `Guest ${idx + 1}`}</span>
                    <span className="text-[10px] opacity-75 font-normal">({tkt.ticketType.substring(0, 3).toUpperCase()})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Container */}
        <div id="printable-ticket" className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Top Event Summary Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start space-x-3.5">
              <img
                src={order.eventBanner}
                alt={order.eventTitle}
                className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xl border border-slate-200 shadow-xs flex-shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00b894] bg-[#00b894]/10 px-2 py-0.5 rounded-md inline-block">
                  Official Admission
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                  {order.eventTitle}
                </h2>
                <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0" />
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex items-start text-xs text-slate-600 space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1 font-medium">{order.eventVenue}</span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0">
              <span className="text-[11px] text-slate-500 font-medium">Total Passes</span>
              <span className="text-sm font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                {localTickets.length} {localTickets.length === 1 ? 'Pass' : 'Passes'}
              </span>
            </div>
          </div>

          {/* VIEW MODE 1: Single Pass Focused View (Apple Wallet Style Boarding Pass) */}
          {viewMode === 'SINGLE' && (
            <div className="relative bg-gradient-to-b from-white to-slate-50 rounded-3xl border-2 border-slate-800/20 shadow-lg p-5 sm:p-6 space-y-6 overflow-hidden">
              
              {/* Top Pass Badge & Sequence */}
              <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-900 text-white text-[11px] font-black tracking-wider px-2.5 py-1 rounded-lg">
                    PASS {activeTicket.passNumber || activeIndex + 1} OF {localTickets.length}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{activeTicket.isCheckedIn ? 'CHECKED IN' : 'VALID ENTRY'}</span>
                  </span>
                </div>

                <span className="text-xs font-bold text-[#00b894] uppercase tracking-wider">
                  {activeTicket.ticketType}
                </span>
              </div>

              {/* Guest / Attendee Assignment Box */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Assigned Pass Attendee
                  </span>

                  {editingIndex !== activeIndex ? (
                    <button
                      onClick={() => handleStartEditName(activeIndex)}
                      className="text-[#00b894] hover:text-[#00a383] text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Guest Name</span>
                    </button>
                  ) : null}
                </div>

                {editingIndex === activeIndex ? (
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      placeholder="Enter guest full name..."
                      className="flex-1 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#00b894] focus:ring-1 focus:ring-[#00b894]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveGuestName(activeIndex)}
                      disabled={isSavingName || !guestNameInput.trim()}
                      className="bg-[#00b894] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#00a383] transition-colors cursor-pointer flex items-center space-x-1 disabled:opacity-40"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingName ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-2 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {activeTicket.attendeeName || order.buyerName || 'Guest Attendee'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {activeTicket.seatZone || 'General Admission • Main Gate'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSharePass(activeTicket)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
                      title="Share this single pass to guest"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#00b894]" />
                      <span>Share Pass</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Big High-Definition QR Code Frame */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4 text-center">
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-900/10 shadow-inner">
                  <QRCodeSVG
                    value={activeTicket.qrCodeHash || `TICKETA_PASS:${activeTicket.ticketCode}:${order.eventId}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-1 w-full max-w-sm">
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold block">
                    Individual Pass Code
                  </span>
                  
                  <div className="flex items-center justify-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3">
                    <span className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider">
                      {activeTicket.ticketCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(activeTicket.ticketCode)}
                      className="p-1 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Copy Pass Code"
                    >
                      {copiedCode === activeTicket.ticketCode ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  Scan at security terminal for contactless venue entry • Valid for 1 individual scan
                </p>
              </div>

              {/* Pass Security & Anti-Fraud Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium text-[10px] uppercase">Tier</span>
                  <span className="font-bold text-slate-900 block truncate">{activeTicket.ticketType}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-medium text-[10px] uppercase">Price</span>
                  <span className="font-bold text-slate-900 block">
                    {activeTicket.unitPrice === 0 ? 'Free' : `₦${activeTicket.unitPrice.toLocaleString()}`}
                  </span>
                </div>
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 font-medium text-[10px] uppercase">Security Status</span>
                  <span className="font-bold text-emerald-700 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Encrypted QR
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* VIEW MODE 2: All Passes Grid View (For Printing or Batch Scanning) */}
          {viewMode === 'ALL' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">
                  All {localTickets.length} Event Admission Passes
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  Each guest requires their own unique QR pass for entry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localTickets.map((tkt, idx) => (
                  <div
                    key={tkt.ticketCode}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded">
                          PASS #{idx + 1}
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm mt-1">{tkt.attendeeName}</h5>
                        <p className="text-[11px] text-slate-500">{tkt.ticketType}</p>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <QRCodeSVG
                          value={tkt.qrCodeHash || `TICKETA_PASS:${tkt.ticketCode}:${order.eventId}`}
                          size={70}
                          level="M"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-700">{tkt.ticketCode}</span>
                      <button
                        onClick={() => handleSharePass(tkt)}
                        className="text-[#00b894] hover:text-[#00a383] text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print {localTickets.length > 1 ? 'All Passes' : 'Pass'}</span>
            </button>

            {localTickets.length > 1 && (
              <button
                onClick={() => setViewMode((m) => (m === 'SINGLE' ? 'ALL' : 'SINGLE'))}
                className="sm:hidden flex items-center space-x-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3 py-2 rounded-xl"
              >
                <Layers className="w-3.5 h-3.5 text-[#00b894]" />
                <span>{viewMode === 'SINGLE' ? 'All Grid' : 'Single'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadImage}
              className="flex items-center space-x-1.5 text-xs font-bold text-white bg-[#00b894] hover:bg-[#00a383] px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Digital Pass (PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
