import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, CreditCard, Building, PhoneCall, Check, ChevronRight, Lock, Tag, X, User, LogIn } from 'lucide-react';
import { SeedEventData } from '../data/seedEvents';
import { SelectedTicketItem, PaymentMethodType, validatePromoCode, OrderCheckoutPayload } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';

interface CheckoutPageProps {
  event: SeedEventData;
  selectedQuantities: Record<string, number>;
  onNavigateToBrowse: () => void;
  onSubmitCheckout: (payload: OrderCheckoutPayload) => void;
  onNavigateToSignIn?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  event,
  selectedQuantities,
  onNavigateToBrowse,
  onSubmitCheckout,
  onNavigateToSignIn,
}) => {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Convert selectedQuantities into ticket items list
  const ticketItems: SelectedTicketItem[] = [];
  event.ticket_types.forEach((tt) => {
    const qty = selectedQuantities[tt.name] || 0;
    if (qty > 0) {
      ticketItems.push({
        ticketTypeName: tt.name,
        quantity: qty,
        unitPrice: tt.price,
        subtotal: tt.price * qty,
      });
    }
  });

  const subtotal = ticketItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Buyer Form state auto-populated from user
  const [fullName, setFullName] = useState(user?.fullName || 'Makinde Isaiah O');
  const [email, setEmail] = useState(user?.email || 'info@makindeisaiah.com');
  const [phone, setPhone] = useState(user?.phoneNumber?.replace('+234', '') || '7033295471');
  const [countryCode, setCountryCode] = useState('+234');

  // Update when user loads or changes
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.phoneNumber) setPhone(user.phoneNumber.replace('+234', ''));
    }
  }, [user]);

  // Promo Code state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Payment Method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD');

  // Card fields state
  const [cardName, setCardName] = useState(fullName);
  const [cardNumber, setCardNumber] = useState('5343 6352 4836 3527');
  const [cardExpiry, setCardExpiry] = useState('10/27');
  const [cardCvv, setCardCvv] = useState('608');

  // Service Fee calculation
  const serviceFee = subtotal > 0 ? Math.round(subtotal * 0.027 + 200) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + serviceFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validatePromoCode(promoCodeInput, subtotal);
    if (res.valid) {
      setAppliedPromo(promoCodeInput.toUpperCase());
      setDiscountAmount(res.discountAmount);
      setPromoMessage(res.message);
    } else {
      setPromoMessage(res.message);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCodeInput('');
    setPromoMessage('');
  };

  const executeOrderSubmission = () => {
    const payload: OrderCheckoutPayload = {
      event,
      items: ticketItems,
      buyer: {
        fullName: fullName || user?.fullName || 'Ticketa Buyer',
        email: email || user?.email || 'buyer@example.com',
        phoneNumber: `${countryCode}${phone}`,
        promoCode: appliedPromo || undefined,
      },
      paymentMethod,
      subtotal,
      discountAmount,
      serviceFee,
      totalAmount,
    };

    onSubmitCheckout(payload);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // Prompt user to sign in or create account first
      setIsAuthModalOpen(true);
      return;
    }

    if (!fullName || !email) {
      alert('Please provide your full name and email address.');
      return;
    }

    const hasSoldOutItem = ticketItems.some((item) => {
      const tt = event.ticket_types.find((t) => t.name === item.ticketTypeName);
      const avail = Number(tt?.quantity_available !== undefined ? tt?.quantity_available : 9999);
      return avail <= 0 || item.quantity > avail;
    });

    if (hasSoldOutItem) {
      alert('One or more selected ticket tiers are sold out or have insufficient availability. Please adjust your ticket selection.');
      return;
    }

    executeOrderSubmission();
  };

  const formattedDate = new Date(event.start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  const formattedTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb Navigation matching Figma */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <button onClick={onNavigateToBrowse} className="hover:text-slate-900 cursor-pointer">
          Browse Events
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="truncate max-w-xs">{event.title}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Checkout</span>
      </nav>

      {/* Unauthenticated Notification Banner */}
      {!user && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <LogIn className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold block">Sign in required to save tickets to your wallet</span>
              <p className="text-amber-700">You will be prompted to sign in or create an account before final payment.</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            Sign In / Register Now
          </button>
        </div>
      )}

      {/* Main Checkout Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Order Summary Box matching Figma */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
            Order Summary
          </h2>

          {/* Event Header Banner Thumbnail */}
          <div className="flex items-start space-x-4 border-b border-slate-100 pb-5">
            <img
              src={event.banner_image_url}
              alt={event.title}
              className="w-20 h-28 object-cover rounded-xl border border-slate-200 flex-shrink-0"
            />
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900 text-base leading-snug">{event.title}</h3>
              <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00b894]" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center text-xs text-slate-600 space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00b894]" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-start text-xs text-slate-600 space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00b894] flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{event.venue_name}, {event.venue_city}</span>
              </div>
            </div>
          </div>

          {/* Ticket Line Items list */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Tickets</span>
            
            {ticketItems.map((item) => (
              <div key={item.ticketTypeName} className="flex items-center justify-between text-xs text-slate-800">
                <span className="font-medium">
                  {item.quantity} {item.ticketTypeName} <span className="text-slate-400">x{item.quantity}</span>
                </span>
                <span className="font-bold font-mono">
                  ₦{item.subtotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-slate-900">₦{subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-[#00b894] font-semibold">
                <span>Promo Discount</span>
                <span className="font-mono">-₦{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Service Fee</span>
              <span className="font-mono font-semibold text-slate-900">₦{serviceFee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-3">
              <span>Total:</span>
              <span className="font-mono text-[#00b894]">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Buyer Information & Payment Method matching Figma */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Buyer Information Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Buyer Information
              </h2>
              {user && (
                <span className="bg-emerald-100 text-[#00b894] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Logged in as {user.fullName}</span>
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium text-slate-900 text-xs focus:outline-none"
                  >
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20"
                  />
                </div>
              </div>

              {/* Promo Code Input matching Figma */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Have a promo code?</label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl text-xs text-emerald-800">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-[#00b894]" />
                      <span className="font-bold">{appliedPromo}</span>
                      <span className="text-[11px] text-emerald-600">(-₦{discountAmount.toLocaleString()})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. DAVIDOLIVEINBADALONA)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 uppercase focus:outline-none focus:border-[#00b894]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoMessage && !appliedPromo && (
                  <p className="text-xs text-rose-600 mt-1">{promoMessage}</p>
                )}
              </div>

            </div>
          </div>

          {/* Payment Method Selector Box matching Figma */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
              Payment Method
            </h2>

            <div className="space-y-3">
              
              {/* Option 1: Card */}
              <div
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  paymentMethod === 'CARD'
                    ? 'bg-emerald-50/60 border-[#00b894] ring-1 ring-[#00b894]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'CARD' ? 'border-[#00b894] bg-[#00b894]' : 'border-slate-400'
                  }`}>
                    {paymentMethod === 'CARD' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <CreditCard className="w-5 h-5 text-[#00b894]" />
                  <span className="font-bold text-slate-900 text-sm">Credit Card / Debit Card</span>
                </div>

                {paymentMethod === 'CARD' && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-3 text-xs">
                    <p className="text-[11px] text-slate-500">Securely processed by Paystack. Your card details are encrypted.</p>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Expiry Card</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Bank Transfer */}
              <div
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'bg-emerald-50/60 border-[#00b894] ring-1 ring-[#00b894]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'BANK_TRANSFER' ? 'border-[#00b894] bg-[#00b894]' : 'border-slate-400'
                  }`}>
                    {paymentMethod === 'BANK_TRANSFER' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <Building className="w-5 h-5 text-[#00b894]" />
                  <span className="font-bold text-slate-900 text-sm">Bank Transfer</span>
                </div>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-2 text-xs bg-white p-3 rounded-xl border border-emerald-200">
                    <p className="font-bold text-slate-800">Transfer exact amount to the account below:</p>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <span>Bank Name:</span>
                      <span className="font-bold text-slate-900">Access Bank</span>
                      <span>Account Number:</span>
                      <span className="font-bold text-slate-900 font-mono">2836282631</span>
                      <span>Account Name:</span>
                      <span className="font-bold text-slate-900">Flytimefest Events Ltd</span>
                      <span>Amount:</span>
                      <span className="font-bold text-[#00b894] font-mono">₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: USSD */}
              <div
                onClick={() => setPaymentMethod('USSD')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  paymentMethod === 'USSD'
                    ? 'bg-emerald-50/60 border-[#00b894] ring-1 ring-[#00b894]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'USSD' ? 'border-[#00b894] bg-[#00b894]' : 'border-slate-400'
                  }`}>
                    {paymentMethod === 'USSD' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <PhoneCall className="w-5 h-5 text-[#00b894]" />
                  <span className="font-bold text-slate-900 text-sm">USSD</span>
                </div>

                {paymentMethod === 'USSD' && (
                  <div className="pt-2 border-t border-emerald-200/60 text-xs bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                    <p className="text-slate-600">Dial code below on your mobile phone to pay:</p>
                    <p className="text-lg font-mono font-black text-[#00b894] text-center bg-slate-50 py-2 rounded-lg border border-slate-200">
                      *737*000*{totalAmount}#
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* CTA Submit Button matching Figma */}
            <button
              type="submit"
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-black text-sm py-4 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 transform active:scale-98"
            >
              <Lock className="w-4 h-4" />
              <span>
                {paymentMethod === 'CARD'
                  ? `Pay ₦${totalAmount.toLocaleString()}`
                  : paymentMethod === 'BANK_TRANSFER'
                  ? `I've made the Transfer (₦${totalAmount.toLocaleString()})`
                  : `I've made the USSD Payment`}
              </span>
            </button>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
              <Lock className="w-3 h-3 text-[#00b894]" />
              <span>Your payment is 100% safe and encrypted</span>
            </p>

          </div>

        </div>

      </form>

      {/* Inline Auth Modal for unauthenticated user */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          executeOrderSubmission();
        }}
        actionTitle="Sign In to Complete Ticket Purchase"
      />

    </div>
  );
};
