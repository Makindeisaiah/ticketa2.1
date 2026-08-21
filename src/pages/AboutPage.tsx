import React from 'react';
import {
  Ticket,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  Globe2,
  Lock,
  ArrowRight,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: any) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80"
            alt="Concert crowd"
            className="w-full h-full object-cover opacity-20 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/95" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#00b894]/20 border border-[#00b894]/30 text-[#00b894] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powering Live African Experiences</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            The Modern Standard for <br />
            <span className="text-[#00b894]">Event Ticketing in Africa</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Ticketa connects passionate event creators with millions of attendees across Nigeria, Ghana, and Côte d’Ivoire. Secure payments, fraud-proof digital QR tickets, and instant organizer settlements.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('browse')}
              className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer text-sm flex items-center space-x-2"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                window.location.href = '/organizer';
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer text-sm"
            >
              Host An Event
            </button>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#00b894]">Our Mission</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Empowering creators, elevating live culture.
              </h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Live events are the heartbeat of African culture — from afrobeats concerts in Lagos to tech summits in Accra and cultural festivals in Abidjan.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Ticketa was built to eliminate ticket fraud, long queues, and delayed payouts. With cryptographic QR ticketing, seamless Paystack payments, and high-performance organizer dashboards, we make organizing and attending events effortless.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-2xl font-black text-slate-900 block">100%</span>
                <span className="text-xs text-slate-500 font-medium">Digital &amp; Fraud-Free QR</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-2xl font-black text-[#00b894] block">Direct</span>
                <span className="text-xs text-slate-500 font-medium">Bank Payouts via Paystack</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-4/3">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
              alt="Live stage lighting"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
              <div className="text-white space-y-1">
                <p className="text-sm font-bold">Unforgettable Experiences</p>
                <p className="text-xs text-slate-300">Over 50,000 attendees checked in smoothly</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Ticketa */}
      <section className="bg-slate-50 border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built on Trust, Speed, and Reliability
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Every feature is engineered to provide unmatched security and convenience for both attendees and event organizers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Organizers</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All organizers undergo account and bank verification to ensure legitimate and genuine event listings.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Encrypted QR Tickets</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dynamic QR hashes prevent duplication and unauthorized ticket transfers, stopping scalping at the door.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Fast Paystack Checkout</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pay in seconds using Debit Cards, Direct Bank Transfer, or USSD with instant digital ticket delivery.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Fast Organizer Payouts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Event earnings are settled directly to registered Nigerian, Ghanaian, and Ivorian commercial banks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to experience live events differently?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Discover concerts, tech summits, and live festivals, or sign up as an organizer to sell tickets today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('browse')}
              className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer text-xs sm:text-sm shadow-md"
            >
              Browse Events
            </button>
            <button
              onClick={() => {
                window.location.href = '/organizer/signup';
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer text-xs sm:text-sm border border-white/20"
            >
              Host An Event / Join as Organizer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
