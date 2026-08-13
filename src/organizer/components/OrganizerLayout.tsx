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
} from 'lucide-react';
import { Organization } from '../../types/database';
import { useAuth } from '../../context/AuthContext';

export type OrganizerTab =
  | 'overview'
  | 'events'
  | 'orders'
  | 'scanner'
  | 'team'
  | 'finance'
  | 'audit'
  | 'settings';

interface OrganizerLayoutProps {
  organizations: Organization[];
  activeOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onOpenCreateOrg: () => void;
  activeTab: OrganizerTab;
  onTabChange: (tab: OrganizerTab) => void;
  onSwitchToAttendee: () => void;
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
  children,
}) => {
  const { user, signOut } = useAuth();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  const navItems = [
    { id: 'overview' as OrganizerTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'events' as OrganizerTab, label: 'Events & Tickets', icon: Calendar },
    { id: 'orders' as OrganizerTab, label: 'Orders & Attendees', icon: Ticket },
    { id: 'scanner' as OrganizerTab, label: 'QR Scanner', icon: QrCode },
    { id: 'team' as OrganizerTab, label: 'Team Members', icon: Users },
    { id: 'finance' as OrganizerTab, label: 'Finance & Payouts', icon: CreditCard },
    { id: 'audit' as OrganizerTab, label: 'Audit Logs', icon: FileText },
    { id: 'settings' as OrganizerTab, label: 'Org Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00b894] to-emerald-400 text-white font-black flex items-center justify-center text-lg shadow-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white block">TICKETA</span>
                <span className="text-[10px] font-bold text-[#00b894] tracking-widest uppercase -mt-1 block">
                  ORGANIZER PORTAL
                </span>
              </div>
            </div>
          </div>

          {/* Active Organization Switcher Dropdown */}
          <div className="p-4 border-b border-slate-800/80 relative">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
              Active Organization
            </label>
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-[#00b894]/20 border border-[#00b894]/30 text-[#00b894] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {activeOrg ? activeOrg.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-white truncate">
                    {activeOrg ? activeOrg.name : 'Select Organization'}
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
              <div className="absolute left-4 right-4 top-18 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 max-h-56 overflow-y-auto">
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
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00b894] text-white shadow-md shadow-[#00b894]/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onSwitchToAttendee}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00b894]" />
            <span>Attendee Storefront</span>
          </button>

          {user && (
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="truncate pr-2">
                <span className="block font-bold text-white text-xs truncate">{user.fullName}</span>
                <span className="block text-[10px] text-[#00b894] uppercase font-bold">VERIFIED ORGANIZER</span>
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
      <main className="flex-1 bg-slate-900 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white capitalize">
              {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeOrg ? `Managing ${activeOrg.name}` : 'Select or create an organization'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              PostgreSQL Connected
            </span>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
