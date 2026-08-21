import React, { useState } from 'react';
import {
  Ticket,
  Send,
  CheckCircle2,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  ArrowRight,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: any, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const handleOrganizerSignupClick = () => {
    window.location.href = '/organizer/signup';
  };

  const handleOrganizerSignInClick = () => {
    window.location.href = '/organizer';
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900">
      {/* Host Events CTA Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Host Events. Sell Tickets. Get Paid Fast.
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Create events, sell tickets, track sales, and withdraw earnings all in one dashboard.
            </p>
          </div>
          <button
            onClick={handleOrganizerSignupClick}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg text-xs sm:text-sm transition-all cursor-pointer transform hover:scale-105 flex items-center space-x-2 flex-shrink-0"
          >
            <span>Create An Event</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10">
          
          {/* Brand & Newsletter Column (Span 2) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00b894] flex items-center justify-center text-white font-black text-lg shadow-md">
                <Ticket className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                TICKETA <span className="text-[#00b894]">2.0</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier live event ticketing and event management platform in Africa. Discover unforgettable concerts, festivals, and summits with verified organizers and encrypted QR tickets.
            </p>

            {/* Newsletter form */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white block">Subscribe to our newsletter</span>
              {subscribed ? (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Thank you! You're subscribed to event updates.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex items-center max-w-sm">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-l-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894]"
                  />
                  <button
                    type="submit"
                    className="bg-[#00b894] hover:bg-[#00a383] text-white px-4 py-2.5 rounded-r-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column: Company */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Careers</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Press &amp; Media</span>
              </li>
            </ul>
          </div>

          {/* Column: Attendee */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Attendee</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-white transition-colors cursor-pointer">
                  Browse Events
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-tickets')} className="hover:text-white transition-colors cursor-pointer">
                  My Tickets &amp; Wallet
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  FAQs &amp; Support
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Organizer */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Organizer</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={handleOrganizerSignupClick} className="hover:text-white transition-colors cursor-pointer text-[#00b894] font-medium">
                  Host an Event / Join as Organizer
                </button>
              </li>
              <li>
                <button onClick={handleOrganizerSignInClick} className="hover:text-white transition-colors cursor-pointer">
                  Organizer Sign In
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  Pricing &amp; Fees
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                  Staff Scanner App
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Legal */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Cookie Policy</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Security Standards</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Social Media & Bottom Copyright */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <a href="#twitter" aria-label="Twitter / X" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#instagram" aria-label="Instagram" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#linkedin" aria-label="LinkedIn" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#facebook" aria-label="Facebook" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
          </div>

          <div className="text-center sm:text-right">
            <span>&copy; 2026 Ticketa Inc. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
