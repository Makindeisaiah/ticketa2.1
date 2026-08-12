import React from 'react';
import { Ticket, Search, User, Globe, Layers } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'browse' | 'my-tickets' | 'architecture';
  onNavigate: (view: 'home' | 'browse' | 'my-tickets' | 'architecture', params?: any) => void;
  myTicketsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, myTicketsCount = 0 }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2.5 group text-left cursor-pointer focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00b894] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <Ticket className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                TICKETA
              </span>
              <span className="text-[10px] block text-[#00b894] font-bold tracking-widest uppercase -mt-1">
                2.0 ATTENDEE
              </span>
            </div>
          </button>

          {/* Navigation items */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('browse')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'browse' ? 'text-[#00b894] font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Browse Events
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Help
            </button>
            <button
              onClick={() => onNavigate('my-tickets')}
              className={`text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'my-tickets' ? 'text-[#00b894] font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>My Tickets</span>
              {myTicketsCount > 0 && (
                <span className="bg-[#00b894] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {myTicketsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('architecture')}
              className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer font-medium"
              title="View Architecture & Database Specs"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Docs & Specs</span>
            </button>

            <button 
              onClick={() => onNavigate('browse')}
              className="bg-[#00b894] hover:bg-[#00a383] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              Sell Tickets
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
