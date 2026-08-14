import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  FileText,
  Bell,
  Sliders,
  Share2,
  Lock,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Pencil,
  MoreVertical,
  Plus,
  Search,
  Key,
  ExternalLink,
  Check,
  Globe,
  Mail,
  Phone,
  Smartphone,
  Info,
} from 'lucide-react';
import { Organization } from '../../types/database';

export type SettingsSubSection =
  | null
  | 'org_profile'
  | 'team'
  | 'security'
  | 'payments'
  | 'billing'
  | 'notifications'
  | 'defaults'
  | 'integrations'
  | 'legal';

interface OrganizerSettingsProps {
  activeOrg: Organization;
  onRefreshOrg: () => void;
  subSection?: SettingsSubSection;
  onSubSectionChange?: (sub: SettingsSubSection, title: string | null) => void;
}

export const OrganizerSettings: React.FC<OrganizerSettingsProps> = ({
  activeOrg,
  onRefreshOrg,
  subSection = null,
  onSubSectionChange,
}) => {
  const [activeSub, setActiveSub] = useState<SettingsSubSection>(subSection);
  const [payoutTab, setPayoutTab] = useState<'overview' | 'payouts' | 'refunds'>('overview');

  useEffect(() => {
    setActiveSub(subSection);
  }, [subSection]);

  const setSubSection = (sub: SettingsSubSection, title: string | null) => {
    setActiveSub(sub);
    if (onSubSectionChange) {
      onSubSectionChange(sub, title);
    }
  };

  const renderBackHeader = (title: string) => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
      <button
        onClick={() => setSubSection(null, null)}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 text-[#00b894]" />
        <span>Back to Settings</span>
      </button>
      <span className="text-xs font-bold text-slate-400">Settings / {title}</span>
    </div>
  );

  // Main Settings Hub (9 Cards Grid)
  if (!activeSub) {
    const settingsHubItems = [
      {
        id: 'org_profile' as SettingsSubSection,
        title: 'Organization Profile',
        desc: 'Manage your organization details and public organizer information.',
        btnText: 'Update Profile',
        icon: Building2,
      },
      {
        id: 'team' as SettingsSubSection,
        title: 'Team & Permissions',
        desc: 'Invite team member and control access across your event.',
        btnText: 'Manage Team',
        icon: Users,
      },
      {
        id: 'security' as SettingsSubSection,
        title: 'Account & Security',
        desc: 'Secure your account and manage login preferences.',
        btnText: 'Security Settings',
        icon: ShieldCheck,
      },
      {
        id: 'payments' as SettingsSubSection,
        title: 'Payments & Payouts',
        desc: 'Setup how you receive earnings from ticket sales.',
        btnText: 'Configure Payments',
        icon: CreditCard,
      },
      {
        id: 'billing' as SettingsSubSection,
        title: 'Billing & Subscription',
        desc: 'Manage your subscription plan and billing information.',
        btnText: 'Manage Subscription',
        icon: FileText,
      },
      {
        id: 'notifications' as SettingsSubSection,
        title: 'Notifications',
        desc: 'Choose how and when you want to receive updates.',
        btnText: 'Manage Notifications',
        icon: Bell,
      },
      {
        id: 'defaults' as SettingsSubSection,
        title: 'Default Event Settings',
        desc: 'Set pre-configured options for faster event creation.',
        btnText: 'Edit Defaults',
        icon: Sliders,
      },
      {
        id: 'integrations' as SettingsSubSection,
        title: 'Integrations & API',
        desc: 'Connect your favorite tools and access the Ticketa API.',
        btnText: 'View Integrations',
        icon: Share2,
      },
      {
        id: 'legal' as SettingsSubSection,
        title: 'Legal & Compliance',
        desc: 'Review terms, policies, and data processing agreements.',
        btnText: 'Review Legal',
        icon: Lock,
      },
    ];

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Manage your organization settings and preferences
          </p>
        </div>

        {/* 9 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsHubItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-white text-base">{item.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => setSubSection(item.id, item.title)}
                  className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {item.btnText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SUBPAGE 1: Organization Profile
  if (activeSub === 'org_profile') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {renderBackHeader('Organization Profile')}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Organization Info Card */}
            <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
                Organization Info
              </h3>

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-[#00b894]">
                  {activeOrg.name ? activeOrg.name.charAt(0).toUpperCase() : 'F'}
                </div>
                <div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer">
                    Upload New Logo
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, or GIF. 500x500px recommend</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Organization Name</label>
                  <input
                    type="text"
                    defaultValue={activeOrg.name || 'Flytimefest'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00b894]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Organizer Type</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00b894]">
                    <option>Company</option>
                    <option>Individual</option>
                    <option>Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Description</label>
                  <textarea
                    rows={4}
                    defaultValue="Flytimefest Official Organizer Profile on Ticketa"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00b894] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Country</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none">
                    <option>🇳🇬 Nigeria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">City / State</label>
                  <input
                    type="text"
                    defaultValue="Lagos"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Business Address</label>
                  <input
                    type="text"
                    defaultValue="Victoria Island, Lagos"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Span 1) */}
          <div className="space-y-6">
            <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">
                Contact &amp; Social Links
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="info@flytimefest.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    defaultValue="+2349048372638"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Website</label>
                  <input
                    type="text"
                    defaultValue="flytimefest.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-[#00b894]">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-white">Verification Status</h3>
              </div>
              <div className="space-y-2 text-xs text-slate-300 pt-2">
                {['Email verified', 'Phone number verified', 'Website verified', 'All social account verified'].map(
                  (item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 2: Team & Permissions
  if (activeSub === 'team') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {renderBackHeader('Team & Permissions')}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Q Search team members...."
              className="w-full bg-[#111723]/90 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button className="px-5 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members List (Span 2) */}
          <div className="lg:col-span-2 bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Team Members</h3>
            <div className="space-y-3">
              {[
                { name: 'Makinde Isaiah', email: 'info@makindeisaiah.com', role: 'Admin', roleColor: 'bg-slate-800 text-slate-200', status: 'Active' },
                { name: 'Tolani Abiodun', email: 'tolani@flytimefest.com', role: 'Organizer', roleColor: 'bg-emerald-500/20 text-emerald-400', status: 'Active' },
                { name: 'Kola Ojo', email: 'finance@flytimefest.com', role: 'Finance', roleColor: 'bg-purple-500/20 text-purple-400', status: 'Active' },
                { name: 'Funke Akindele', email: 'staff@flytimefest.com', role: 'Gate Staff', roleColor: 'bg-pink-500/20 text-pink-400', status: 'Active' },
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-sm border border-slate-700">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <span className="block font-bold text-white text-xs">{m.name}</span>
                      <span className="block text-[11px] text-slate-400">{m.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${m.roleColor}`}>
                      {m.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission Levels (Span 1) */}
          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Permission Levels</h3>
            <div className="space-y-3 text-xs">
              {[
                { label: 'Admin', desc: 'Full platform access, Manage organization & billing, Add / remove team members' },
                { label: 'Organizer', desc: 'Create & manage events, Manage tickets & pricing, View sales analytics' },
                { label: 'Finance / Accountant', desc: 'View revenue & payouts, Process refunds, Access financial reports' },
                { label: 'Check-in Staff', desc: 'Scan tickets, Manual check-ins, View attendee list (read-only)' },
              ].map((p, idx) => (
                <div key={idx} className="bg-slate-900/80 p-3 rounded-xl space-y-1">
                  <span className="font-extrabold text-white block">{p.label}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 3: Account & Security
  if (activeSub === 'security') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {renderBackHeader('Account & Security')}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Account Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Full Name</label>
              <input type="text" defaultValue="Organizer Admin" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Email Address</label>
              <input type="email" defaultValue="admin@flytimefest.com" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-base font-extrabold text-white">Password</h3>
          <p className="text-xs text-slate-400">Use a strong, unique password to secure your organizer account.</p>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer">
            Change Password
          </button>
        </div>

        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-slate-400 mt-1">Status: Enabled - Via Authenticator App</p>
            </div>
            <button className="px-4 py-2 bg-[#00b894] text-white font-extrabold text-xs rounded-xl cursor-pointer">
              Manage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 4: Payments & Payouts
  if (activeSub === 'payments') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {renderBackHeader('Payments & Payouts')}
        {/* Sub-tabs */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-2">
          {(['overview', 'payouts', 'refunds'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPayoutTab(tab)}
              className={`text-xs font-extrabold pb-2 capitalize cursor-pointer transition-colors ${
                payoutTab === tab
                  ? 'text-[#00b894] border-b-2 border-[#00b894]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'refunds' ? 'Refunds & Fees' : tab}
            </button>
          ))}
        </div>

        {/* QuickPay Banner */}
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300 font-bold">
          <span>QP QuickPay is connected for processing payments</span>
          <button className="px-3 py-1.5 bg-[#00b894] text-white rounded-xl text-xs font-black cursor-pointer">
            Manage QuickPay Account
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Payout Destination</h3>
            <div className="bg-slate-900 p-4 rounded-xl space-y-2 text-xs">
              <span className="font-extrabold text-white block text-sm">Nigerian Bank Account</span>
              <span className="text-slate-400 block">Organization Account: {activeOrg?.name || 'Flytimefest'}</span>
            </div>
          </div>

          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Payment History</h3>
            <div className="text-xs text-slate-400 py-4 text-center">Payout settlements processed automatically</div>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 5: Billing & Subscription
  if (activeSub === 'billing') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {renderBackHeader('Billing & Subscription')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#00b894]/20 border-2 border-[#00b894] rounded-2xl p-6 shadow-xl space-y-4">
            <span className="px-3 py-1 bg-[#00b894] text-white font-black rounded-full text-xs inline-block">Pro ₦250,000</span>
            <h3 className="text-lg font-black text-white">Pro Organizer Plan</h3>
            <ul className="space-y-2 text-xs text-slate-200">
              <li>✓ Multiple active events</li>
              <li>✓ Reduced ticket fees</li>
              <li>✓ Advanced check-ins (QR + manual)</li>
              <li>✓ Team &amp; permissions</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="w-full py-2.5 bg-[#00b894] text-white font-extrabold rounded-xl text-xs cursor-pointer">
              Current Plan
            </button>
          </div>

          <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <span className="px-3 py-1 bg-slate-800 text-slate-300 font-black rounded-full text-xs inline-block">Starter FREE</span>
            <h3 className="text-lg font-black text-white">Starter Plan</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• 1 active event</li>
              <li>• Basic ticket sales</li>
              <li>• Standard Ticketa fees</li>
            </ul>
            <button className="w-full py-2.5 bg-slate-800 text-slate-300 font-extrabold rounded-xl text-xs cursor-pointer">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 6: Notification
  if (activeSub === 'notifications') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {renderBackHeader('Notifications')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Event Notifications', items: ['Event published/ unpublished', 'Event approved / rejected', 'Event starting soon', 'Low ticket warnings'] },
            { title: 'Sales & Payment Notification', items: ['Ticket sold', 'Ticket refunded', 'Payment failed', 'Payout processed'] },
            { title: 'Team & Security Notifications', items: ['New team member invited', 'Team invite accepted', 'Team role changed'] },
            { title: 'System Notifications', items: ['Feature updates', 'Maintenance alerts', 'Policy & terms updates'] },
          ].map((cat, idx) => (
            <div key={idx} className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">{cat.title}</h3>
              <div className="space-y-3 text-xs">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300">
                    <span>{item}</span>
                    <input type="checkbox" defaultChecked className="accent-[#00b894] w-4 h-4 cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SUBPAGE 7: Default Event Settings
  if (activeSub === 'defaults') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {renderBackHeader('Default Event Settings')}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Event Basics Defaults</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Default Ticket Type</label>
              <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white">
                <option>Paid</option>
                <option>Free</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Default Ticket Quantity</label>
              <input type="number" defaultValue={100} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 8: Integrations
  if (activeSub === 'integrations') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {renderBackHeader('Integrations & API')}
        <div className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-white border-b border-slate-800 pb-3">Payment Gateways</h3>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between">
              <span className="font-bold text-white">QuickPay</span>
              <span className="px-3 py-1 bg-[#00b894]/20 text-[#00b894] font-bold rounded-full">Connected</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between">
              <span className="font-bold text-white">Paystack</span>
              <button className="px-3 py-1 bg-slate-800 text-slate-300 font-bold rounded-xl">Manage</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 9: Legal & Compliance
  if (activeSub === 'legal') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {renderBackHeader('Legal & Compliance')}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            'GDPR Compliance',
            'Privacy Policy & Terms',
            'Attendee Consent',
            'Data Protection',
            'Refund & Cancellation Policy',
            'Anti-Spam & Opt-In Preferences',
          ].map((title, idx) => (
            <div key={idx} className="bg-[#111723]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-extrabold text-white">{title}</h3>
              <button className="text-xs font-bold text-[#00b894] hover:underline cursor-pointer">View Details →</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
