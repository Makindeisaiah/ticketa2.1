import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  QrCode,
  Users,
  CreditCard,
  FileText,
  Settings,
  Plus,
  Building2,
  ChevronDown,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Search,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { Organization } from '../../types/database';
import { useAuth } from '../../context/AuthContext';

export type OrganizerTab =
  | 'overview'
  | 'events'
  | 'analytics'
  | 'orders'
  | 'scanner'
  | 'settings';

interface OrganizerLayoutProps {
  organizations: Organization[];
  activeOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onOpenCreateOrg: () => void;
  activeTab: OrganizerTab;
  onTabChange: (tab: OrganizerTab) => void;
  onSwitchToAttendee: () => void;
  subpageTitle?: string | null;
  onBackToSettingsHub?: () => void;
  children: React.ReactNode;
}

export const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({
  organizations,
  activeOrg,
  onSelectOrg,
  onOpenCreateOrg,
  activeTab,
  onTabChange,
  onSwitchToAttendee,
  subpageTitle,
  onBackToSettingsHub,
  children,
}) => {
  const { user, signOut } = useAuth();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'overview' as OrganizerTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events' as OrganizerTab, label: 'Events', icon: Calendar },
    { id: 'analytics' as OrganizerTab, label: 'Analytics', icon: TrendingUp },
    { id: 'orders' as OrganizerTab, label: 'Ticket Sales', icon: Ticket },
    { id: 'scanner' as OrganizerTab, label: 'Check-Ins', icon: QrCode },
    { id: 'settings' as OrganizerTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#090d14] border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#00b894] text-white flex items-center justify-center font-black shadow-lg shadow-[#00b894]/20">
                <Ticket className="w-5 h-5 text-white transform -rotate-12" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight text-white">TICKETA</span>
                  <span className="text-[10px] font-black bg-[#00b894]/20 text-[#00b894] px-1.5 py-0.5 rounded uppercase">2.0</span>
                </div>
                <span className="text-[10px] font-bold text-[#00b894] tracking-widest uppercase block -mt-0.5">
                  ORGANIZER
                </span>
              </div>
            </div>
          </div>

          {/* Active Organization Switcher */}
          <div className="p-4 border-b border-slate-800/80 relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
              Active Organization
            </label>
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="w-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 rounded-xl p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-[#00b894]/20 border border-[#00b894]/40 text-[#00b894] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {activeOrg ? activeOrg.name.charAt(0).toUpperCase() : 'F'}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-white truncate">
                    {activeOrg ? activeOrg.name : 'Flytimefest'}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {activeOrg?.type || 'ORGANIZER'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>

            {/* Dropdown items */}
            {isOrgDropdownOpen && (
              <div className="absolute left-4 right-4 top-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Your Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      onSelectOrg(org);
                      setIsOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                      activeOrg?.id === org.id ? 'bg-[#00b894]/10 text-[#00b894] font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {activeOrg?.id === org.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#00b894]" />}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setIsOrgDropdownOpen(false);
                    onOpenCreateOrg();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#00b894] hover:bg-slate-800 font-bold flex items-center space-x-1.5 border-t border-slate-800 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Organization</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00b894] text-white shadow-md shadow-[#00b894]/20 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onSwitchToAttendee}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00b894]" />
            <span>Attendee Storefront</span>
          </button>

          {user && (
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="truncate pr-2">
                <span className="block font-bold text-white text-xs truncate">{user.fullName || activeOrg?.name || 'Flytimefest'}</span>
                <span className="block text-[10px] text-[#00b894] uppercase font-bold">ORGANIZER ADMIN</span>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#0b0f17] overflow-y-auto flex flex-col min-w-0">
        {/* Top Header Bar with Search & Notifications & Profile */}
        <header className="sticky top-0 z-30 bg-[#090d14]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Breadcrumb or Search Bar */}
          <div className="flex items-center space-x-3 flex-1 max-w-md">
            {subpageTitle && onBackToSettingsHub ? (
              <button
                onClick={onBackToSettingsHub}
                className="flex items-center space-x-2 text-xs font-bold text-[#00b894] hover:text-[#00a383] bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Settings / {subpageTitle}</span>
              </button>
            ) : (
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Q Search events, orders, settings..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-colors"
                />
              </div>
            )}
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Notification Bell with Badge */}
            <button className="relative p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            {/* Profile Pill */}
            <div className="flex items-center space-x-2.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#00b894] font-bold text-xs flex items-center justify-center border border-[#00b894]/30">
                {activeOrg?.name ? activeOrg.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <span className="text-xs font-bold text-white hidden sm:inline-block">
                {activeOrg?.name || 'Flytimefest'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
};
