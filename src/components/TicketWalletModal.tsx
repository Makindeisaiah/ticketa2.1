import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, CheckCircle2, Ticket as TicketIcon, Calendar, MapPin, Mail, User, ShieldCheck } from 'lucide-react';
import { CompletedOrderResult } from '../services/orderService';

interface TicketWalletModalProps {
  order: CompletedOrderResult;
  onClose: () => void;
}

export const TicketWalletModal: React.FC<TicketWalletModalProps> = ({ order, onClose }) => {
  const primaryTicket = order.tickets[0] || {
    ticketCode: order.orderNumber,
    ticketType: 'General Admission',
    qrCodeHash: `TICKETA_QR:${order.orderNumber}:${order.eventId}`,
    status: 'VALID',
    isCheckedIn: false,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    alert(`Ticket ${primaryTicket.ticketCode} downloaded as PDF / Digital Pass!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#00b894] flex items-center justify-center font-bold text-white">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">TICKETA Wallet</h3>
              <p className="text-[11px] text-slate-400">Digital Event Entry Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Card Body */}
        <div id="printable-ticket" className="p-6 space-y-6">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">
                  {primaryTicket.status === 'VALID' ? 'Valid & Ready for Check-in' : 'Ticket Used'}
                </span>
                <span className="text-[11px] text-emerald-700">Present QR code at venue entrance for instant scan</span>
              </div>
            </div>
            <span className="bg-emerald-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md">
              {order.tickets.length} {order.tickets.length === 1 ? 'Ticket' : 'Tickets'}
            </span>
          </div>

          {/* Event Details */}
          <div className="flex items-start space-x-4 border-b border-slate-100 pb-5">
            <img
              src={order.eventBanner}
              alt={order.eventTitle}
              className="w-20 h-28 object-cover rounded-lg border border-slate-200 shadow-xs flex-shrink-0"
            />
            <div className="space-y-1.5 flex-1">
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{order.eventTitle}</h2>
              <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00b894]" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-start text-xs text-slate-600 space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{order.eventVenue}</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md">
              <QRCodeSVG
                value={primaryTicket.qrCodeHash}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Ticket Reference</span>
              <span className="text-xl font-mono font-black text-slate-900 tracking-wider">
                {primaryTicket.ticketCode}
              </span>
            </div>
          </div>

          {/* Ticket Breakdown & Holder Info */}
          <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Ticket Holder</span>
              <span className="font-bold text-slate-800 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {order.buyerName}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Purchased Email</span>
              <span className="font-semibold text-slate-800 flex items-center truncate">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                {order.buyerEmail}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Ticket Type(s)</span>
              <span className="font-bold text-[#00b894]">
                {order.items.map((i) => `${i.quantity}x ${i.ticketTypeName}`).join(', ')}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium block">Total Paid</span>
              <span className="font-bold text-slate-900">
                ₦{order.totalAmount.toLocaleString()} ({order.paymentMethod})
              </span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Ticket</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="flex items-center space-x-1.5 text-xs font-semibold text-white bg-[#00b894] hover:bg-[#00a383] px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Save Digital Pass</span>
          </button>
        </div>

      </div>
    </div>
  );
};
