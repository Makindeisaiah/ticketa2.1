import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Ticket as TicketIcon, Lock, ArrowRight, Download, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { CompletedOrderResult, OrderCheckoutPayload, processPaystackOrder } from '../services/orderService';

interface PaymentProcessingModalProps {
  payload: OrderCheckoutPayload;
  onSuccess: (order: CompletedOrderResult) => void;
  onViewTickets: (order: CompletedOrderResult) => void;
  onClose: () => void;
}

type ModalStage = 'PROCESSING' | 'SUCCESS' | 'FAILED';

export const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  payload,
  onSuccess,
  onViewTickets,
  onClose,
}) => {
  const [stage, setStage] = useState<ModalStage>('PROCESSING');
  const [completedOrder, setCompletedOrder] = useState<CompletedOrderResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function executePayment() {
      // Simulate Paystack server verification latency (1.8 seconds)
      await new Promise((res) => setTimeout(res, 1800));

      if (!isMounted) return;

      try {
        const result = await processPaystackOrder(payload);
        setCompletedOrder(result);
        setStage('SUCCESS');
        onSuccess(result);
      } catch (e) {
        setStage('FAILED');
      }
    }

    executePayment();

    return () => {
      isMounted = false;
    };
  }, [payload]);

  const formattedDate = new Date(payload.event.start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  const formattedTime = new Date(payload.event.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8 p-6 sm:p-8 space-y-6 text-center border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Top Logo */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#00b894] flex items-center justify-center text-white font-bold">
            <TicketIcon className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">TICKETA</span>
        </div>

        {/* STAGE 1: PROCESSING matching Figma */}
        {stage === 'PROCESSING' && (
          <div className="space-y-6">
            <div className="py-4">
              <div className="w-16 h-16 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Processing your payment...</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please wait while we confirm your payment. Do not refresh or close this page.
              </p>
            </div>

            {/* Pending Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">{payload.event.title}</h3>
              <p className="text-slate-600">{formattedDate} &bull; {formattedTime}</p>
              <p className="text-slate-600">{payload.event.venue_name}</p>

              <div className="bg-[#00b894] text-white p-4 rounded-xl space-y-2 font-medium mt-3">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-bold font-mono">₦{payload.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-bold">{payload.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[11px] opacity-90">
                  <span>Reference:</span>
                  <span className="font-mono font-bold">PAYSTACK-PENDING</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: SUCCESS matching Figma */}
        {stage === 'SUCCESS' && completedOrder && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-[#00b894] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your order is confirmed. Your tickets have been sent to you at{' '}
                <span className="text-[#00b894] font-bold">{completedOrder.buyerEmail}</span>
              </p>
            </div>

            {/* Order Receipt Card matching Figma */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-4 shadow-sm">
              <div className="flex items-start space-x-3 border-b border-slate-100 pb-3">
                <img
                  src={completedOrder.eventBanner}
                  alt={completedOrder.eventTitle}
                  className="w-16 h-20 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{completedOrder.eventTitle}</h3>
                  <div className="flex items-center text-[11px] text-slate-500 space-x-1">
                    <Calendar className="w-3 h-3 text-[#00b894]" />
                    <span>{formattedDate} &bull; {formattedTime}</span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 space-x-1">
                    <MapPin className="w-3 h-3 text-[#00b894]" />
                    <span className="truncate">{completedOrder.eventVenue}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-700">
                {completedOrder.items.map((item) => (
                  <div key={item.ticketTypeName} className="flex justify-between">
                    <span>{item.quantity} {item.ticketTypeName}</span>
                    <span className="font-mono font-bold">₦{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                {completedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[#00b894]">
                    <span>Promo Discount</span>
                    <span className="font-mono">-₦{completedOrder.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Service Fee</span>
                  <span className="font-mono">₦{completedOrder.serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Total</span>
                  <span className="font-mono text-[#00b894]">₦{completedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
                <div>Buyer: <span className="font-semibold text-slate-800">{completedOrder.buyerEmail}</span></div>
                <div>Order ID: <span className="font-mono font-bold text-slate-900">{completedOrder.orderNumber}</span></div>
              </div>
            </div>

            {/* Action Buttons matching Figma */}
            <div className="space-y-2">
              <button
                onClick={() => onViewTickets(completedOrder)}
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Tickets</span>
              </button>

              <button
                onClick={onClose}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                Browse More Events
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: FAILED matching Figma */}
        {stage === 'FAILED' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Payment Failed</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                We couldn't complete your payment. Please try again or use a different payment method.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
              <h3 className="font-bold text-slate-900">{payload.event.title}</h3>
              <div className="flex justify-between text-slate-600">
                <span>Amount</span>
                <span className="font-bold font-mono">₦{payload.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStage('PROCESSING')}
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-white border border-slate-300 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Change Payment
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
