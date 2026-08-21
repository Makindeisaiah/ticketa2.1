import React, { useState, useRef, useEffect } from 'react';
import { Ticket, User, Layers, LogOut, ChevronDown, ShieldCheck, Menu, X, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: any, params?: any) => void;
  myTicketsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, myTicketsCount = 0 }) => {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
    onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2.5 group text-left cursor-pointer focus:outline-none"
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

          {/* Center Navigation links */}
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
              onClick={() => onNavigate('about')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'about' ? 'text-[#00b894] font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              About
            </button>

            <button
              onClick={() => onNavigate('how-it-works')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'how-it-works' ? 'text-[#00b894] font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              How It Works
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

            <button
              onClick={() => { window.location.href = '/organizer/signup'; }}
              className="text-xs font-bold text-[#00b894] hover:text-[#00a383] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Join as Organizer</span>
            </button>
          </nav>

          {/* Right Navigation & Authentication buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              /* Authenticated User Profile Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#00b894] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                    <span className="block text-[10px] text-[#00b894] font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { setIsDropdownOpen(false); onNavigate('my-tickets'); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium cursor-pointer"
                    >
                      <Ticket className="w-4 h-4 text-[#00b894]" />
                      <span>My Tickets &amp; Wallet</span>
                    </button>

                    <button
                      onClick={() => { setIsDropdownOpen(false); onNavigate('profile'); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-medium cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#00b894]" />
                      <span>Profile &amp; Settings</span>
                    </button>

                    <button
                      onClick={() => { setIsDropdownOpen(false); window.location.href = '/organizer/signup'; }}
                      className="w-full text-left px-4 py-2 text-xs text-[#00b894] hover:bg-emerald-50 flex items-center space-x-2 font-bold cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Join as Organizer</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated User Navigation Buttons */
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('signin')}
                  className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="bg-[#00b894] hover:bg-[#00a383] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer transform active:scale-98"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
          <button
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('browse'); }}
            className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl ${
              currentView === 'browse' ? 'text-[#00b894] bg-emerald-50' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Browse Events
          </button>

          <button
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('about'); }}
            className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl ${
              currentView === 'about' ? 'text-[#00b894] bg-emerald-50' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            About
          </button>

          <button
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('how-it-works'); }}
            className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl ${
              currentView === 'how-it-works' ? 'text-[#00b894] bg-emerald-50' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            How It Works
          </button>

          <button
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('my-tickets'); }}
            className={`w-full text-left px-3 py-2 text-sm font-bold rounded-xl flex items-center justify-between ${
              currentView === 'my-tickets' ? 'text-[#00b894] bg-emerald-50' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>My Tickets</span>
            {myTicketsCount > 0 && (
              <span className="bg-[#00b894] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {myTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setIsMobileMenuOpen(false); window.location.href = '/organizer/signup'; }}
            className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl text-[#00b894] bg-emerald-50 hover:bg-emerald-100 flex items-center space-x-2"
          >
            <Building2 className="w-4 h-4" />
            <span>Join as Organizer</span>
          </button>

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-slate-50 rounded-xl flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00b894] text-white font-bold flex items-center justify-center text-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">{user.fullName}</span>
                    <span className="block text-[10px] text-slate-500">{user.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('profile'); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center space-x-2"
                >
                  <User className="w-4 h-4 text-[#00b894]" />
                  <span>Profile &amp; Settings</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('signin'); }}
                  className="w-full bg-slate-100 text-slate-900 font-bold text-xs py-2.5 rounded-xl text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('signup'); }}
                  className="w-full bg-[#00b894] text-white font-bold text-xs py-2.5 rounded-xl text-center"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

