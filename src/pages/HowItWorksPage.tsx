import React, { useState } from 'react';
import {
  Search,
  CreditCard,
  QrCode,
  CheckCircle2,
  Building2,
  BarChart3,
  Camera,
  Landmark,
  ArrowRight,
  Sparkles,
  Ticket,
  ShieldCheck,
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (view: any) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'attendee' | 'organizer'>('attendee');

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#00b894]/20 border border-[#00b894]/30 text-[#00b894] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step-by-Step Guide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            How Ticketa Works
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Whether you’re buying a ticket for your favorite concert or hosting a 10,000-person summit, Ticketa makes it simple, secure, and fast.
          </p>

          {/* Interactive Persona Tabs */}
          <div className="inline-flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl space-x-2 mt-4">
            <button
              onClick={() => setActiveTab('attendee')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'attendee'
                  ? 'bg-[#00b894] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>For Attendees</span>
            </button>

            <button
              onClick={() => setActiveTab('organizer')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'organizer'
                  ? 'bg-[#00b894] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>For Event Organizers</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Steps Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'attendee' ? (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Buying Tickets in 4 Simple Steps
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Never wait in ticket lines again. Access events with instant encrypted QR codes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  1
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">1. Discover Events</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Explore curated concerts, festivals, comedy shows, and tech meetups by category, city, or date.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  2
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2. Seamless Checkout</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Select your ticket tier and pay instantly via Paystack with Card, Bank Transfer, or USSD.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  3
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">3. Digital QR Wallet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Your unique digital tickets are stored securely in your account with downloadable offline QR codes.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  4
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">4. Fast Check-in</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Present your QR code at the event gate for a sub-second scan by staff and instant access.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => onNavigate('browse')}
                className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer text-sm"
              >
                Browse Published Events
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Hosting &amp; Monetizing with Ticketa
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                End-to-end event infrastructure from ticketing and scanning to direct bank settlements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  1
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">1. Create &amp; Publish</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Set up your organization, customize event details, add banners, venues, and ticket tiers (VIP, Regular, Free).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  2
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2. Track Real-Time Sales</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Monitor ticket sales, revenue graphs, attendee orders, and inventory breakdown live from your organizer dashboard.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  3
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">3. Camera Staff Scanner</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Use our built-in QR scanner on any smartphone or tablet to validate tickets at the door with double-scan prevention.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#00b894] transition-all space-y-4 relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-sm flex items-center justify-center">
                  4
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">4. Direct Bank Payouts</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Connect your commercial bank account and receive revenue settlements automatically via Paystack.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  window.location.href = '/organizer/signup';
                }}
                className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all cursor-pointer text-sm"
              >
                Sign Up as an Organizer
              </button>
            </div>
          </div>
        )}
      </section>

      {/* FAQ or Security Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Quick answers about tickets, payments, and event hosting.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">How do I receive my tickets after payment?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tickets are instantly generated and available in your "My Tickets" tab. You will also receive an order confirmation with your encrypted QR tickets ready for offline saving.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">Can an organizer see attendee information?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes, event organizers can view attendee lists and order summaries specifically for their own published events to manage event logistics and entry lists safely.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">What countries and payment methods are supported?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ticketa supports events and organizers across Nigeria (NGN), Ghana (GHS), and Côte d’Ivoire (XOF), accepting Visa, Mastercard, Verve, direct bank transfers, and mobile money.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
