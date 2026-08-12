import React from 'react';
import { Ticket } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'home' | 'browse' | 'my-tickets' | 'architecture') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Host Events CTA Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Host Events. Sell Tickets . Get Paid Fast.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Create event, sell ticket, track sales, and withdrawal earning all in one dashboard
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-semibold px-6 py-3 rounded-lg shadow-lg text-sm transition-all cursor-pointer transform hover:scale-105"
          >
            Create An Event
          </button>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="bg-[#00b894] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center md:justify-start space-x-8 text-sm font-medium">
          <button onClick={() => onNavigate('browse')} className="hover:underline cursor-pointer">
            About
          </button>
          <button onClick={() => onNavigate('browse')} className="hover:underline cursor-pointer">
            Help Center
          </button>
          <button onClick={() => onNavigate('browse')} className="hover:underline cursor-pointer">
            Contact
          </button>
          <button onClick={() => onNavigate('browse')} className="hover:underline cursor-pointer">
            Privacy
          </button>
        </div>
      </div>

      {/* Bottom info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center space-x-2">
          <Ticket className="w-4 h-4 text-[#00b894]" />
          <span className="font-semibold text-slate-400">TICKETA 2.0</span>
          <span>© 2026 Ticketa Inc. All rights reserved.</span>
        </div>
        <div>
          Powered by Supabase & Paystack Integration
        </div>
      </div>
    </footer>
  );
};
