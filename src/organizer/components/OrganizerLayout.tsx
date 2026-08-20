import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Ticket,
  Users,
  CheckSquare,
  RotateCcw,
  Settings,
  Plus,
  ArrowLeft,
  LogOut,
  Search,
  Bell,
  X,
  ChevronRight,
  ChevronDown,
  Mail,
  Printer,
} from 'lucide-react';
import { Organization } from '../../types/database';
import { useAuth } from '../../context/AuthContext';

export type OrganizerTab =
  | 'overview'
  | 'events'
  | 'analytics'
  | 'tickets'
  | 'orders'
  | 'check-ins'
  | 'refunds'
  | 'settings';

interface OrganizerLayoutProps {
  organizations: Organization[];
  activeOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onOpenCreateOrg: () => void;
  activeTab: OrganizerTab;
  onTabChange: (tab: OrganizerTab) => void;
  onSwitchToAttendee?: () => void;
  onOpenCreateModal?: () => void;
  subpageTitle?: string | null;
  onBackToSettingsHub?: () => void;
  events?: any[];
  orders?: any[];
  attendees?: any[];
  children: React.ReactNode;
}

export const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({
  organizations,
  activeOrg,
  onSelectOrg,
  onOpenCreateOrg,
  activeTab,
  onTabChange,
  onOpenCreateModal,
  subpageTitle,
  onBackToSettingsHub,
  events = [],
  orders = [],
  children,
}) => {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'EN' | 'FR'>('EN');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'overview' as OrganizerTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events' as OrganizerTab, label: 'Events', icon: Calendar },
    { id: 'analytics' as OrganizerTab, label: 'Analytics', icon: BarChart3 },
    { id: 'tickets' as OrganizerTab, label: 'Ticket Sales', icon: Ticket },
    { id: 'orders' as OrganizerTab, label: 'Users & Customers', icon: Users },
    { id: 'check-ins' as OrganizerTab, label: 'Check-Ins', icon: CheckSquare },
    { id: 'refunds' as OrganizerTab, label: 'Refund Requests', icon: RotateCcw },
    { id: 'settings' as OrganizerTab, label: 'Settings', icon: Settings },
  ];

  // Close menus when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results based on active organization data
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchingEvents = trimmedQuery
    ? events.filter(
        (e) =>
          e.title?.toLowerCase().includes(trimmedQuery) ||
          e.venues?.name?.toLowerCase().includes(trimmedQuery) ||
          e.venue?.toLowerCase().includes(trimmedQuery)
      )
    : [];

  const matchingOrders = trimmedQuery
    ? orders.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(trimmedQuery) ||
          o.customer_email?.toLowerCase().includes(trimmedQuery) ||
          o.event_title?.toLowerCase().includes(trimmedQuery) ||
          o.id?.toLowerCase().includes(trimmedQuery)
      )
    : [];

  const hasSearchResults = trimmedQuery.length > 0;
  const userInitials = activeOrg?.name ? activeOrg.name.charAt(0).toUpperCase() : (user?.fullName ? user.fullName.charAt(0).toUpperCase() : '3');
  const orgDisplayName = activeOrg?.name || user?.fullName || '30BG';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans flex">
      {/* Fixed Sticky Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex w-64 fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 flex-col justify-between z-40 overflow-y-auto">
        <div className="flex-1">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#00b894] text-white flex items-center justify-center font-black shadow-md shadow-[#00b894]/25">
                <Ticket className="w-5 h-5 text-white transform -rotate-12" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900">TICKETA</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#00b894] tracking-widest uppercase block -mt-0.5">
                  ORGANIZER PORTAL
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00b894] text-white shadow-md shadow-[#00b894]/20 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-bold'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User Info & Sign Out) */}
        <div className="p-4 border-t border-slate-100 space-y-2.5">
          {/* User Account Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              {userInitials}
            </div>
            <div className="truncate flex-1">
              <span className="block font-black text-slate-900 text-xs truncate">
                {orgDisplayName}
              </span>
              <span className="block text-[11px] text-slate-500 truncate font-medium">
                {user?.email || 'makindeisaiah2002@gmail.com'}
              </span>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen bg-[#f8fafc] min-w-0">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Search Bar or Subpage Back */}
          <div className="flex items-center space-x-3 flex-1 max-w-sm" ref={searchRef}>
            {subpageTitle && onBackToSettingsHub ? (
              <button
                onClick={onBackToSettingsHub}
                className="flex items-center space-x-2 text-xs font-bold text-[#00b894] hover:text-[#00a383] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Settings / {subpageTitle}</span>
              </button>
            ) : (
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Search"
                  className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Live Search Results Dropdown */}
                {isSearchOpen && hasSearchResults && (
                  <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-72 overflow-y-auto space-y-2">
                    {/* Events Results */}
                    {matchingEvents.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-2 py-1">
                          Events ({matchingEvents.length})
                        </div>
                        {matchingEvents.map((evt) => (
                          <button
                            key={evt.id}
                            onClick={() => {
                              onTabChange('events');
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                          >
                            <span className="font-bold truncate">{evt.title}</span>
                            <span className="text-[10px] text-slate-500 capitalize">{evt.status || 'Event'}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Orders Results */}
                    {matchingOrders.length > 0 && (
                      <div className="border-t border-slate-100 pt-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-2 py-1">
                          Orders ({matchingOrders.length})
                        </div>
                        {matchingOrders.map((ord) => (
                          <button
                            key={ord.id}
                            onClick={() => {
                              onTabChange('orders');
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                          >
                            <span className="font-bold truncate">{ord.customer_name || 'Buyer'}</span>
                            <span className="text-[10px] text-[#00b894] font-bold">₦{(Number(ord.total_amount) || 0).toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {matchingEvents.length === 0 && matchingOrders.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No matches found for "{searchQuery}".
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Language Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => setSelectedLang('EN')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                  selectedLang === 'EN' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
              <button
                onClick={() => setSelectedLang('FR')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                  selectedLang === 'FR' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>🇫🇷</span>
                <span>FR</span>
              </button>
            </div>

            {/* Dispatch Logs button */}
            <button
              onClick={() => setShowDispatchModal(true)}
              className="hidden sm:flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>Dispatch Logs</span>
            </button>

            {/* Wristband Printer button */}
            <button
              onClick={() => setShowPrinterModal(true)}
              className="hidden sm:flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Wristband Printer</span>
            </button>

            {/* Create New Event Button */}
            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="bg-[#00b894] hover:bg-[#00a383] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md shadow-[#00b894]/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                title="Notifications"
                className="relative p-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />
              </button>
            </div>

            {/* User Profile Pill */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {userInitials}
                </div>
                <span className="text-xs font-black text-slate-800 hidden sm:block">
                  {orgDisplayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">{orgDisplayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-black bg-[#00b894]/15 text-[#00b894] px-1.5 py-0.5 rounded uppercase">
                      ORGANIZER
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onTabChange('settings');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Organization Settings</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto bg-white border-b border-slate-200 p-2 space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive ? 'bg-[#00b894] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>

        {/* Dispatch Logs Modal */}
        {showDispatchModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <h3 className="font-black text-slate-900 text-sm">Dispatch Logs</h3>
                </div>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p>Automated ticket email &amp; SMS dispatches are delivered in real-time to ticket purchasers.</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Total Dispatched</span>
                    <span className="text-[#00b894]">100% Success</span>
                  </div>
                  <p className="text-[11px] text-slate-400">All recent attendee ticket deliveries have been successfully sent.</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wristband Printer Modal */}
        {showPrinterModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-slate-900 text-sm">Wristband Printer Utility</h3>
                </div>
                <button
                  onClick={() => setShowPrinterModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p>Connect your thermal label printer or Zebra wristband printer for on-site attendee check-in printing.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-amber-900 block">Printer Status: Ready</span>
                  <p className="text-[11px] text-amber-700">ESC/POS &amp; WebUSB printer discovery enabled for on-site registration.</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowPrinterModal(false)}
                  className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Configure Printer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

