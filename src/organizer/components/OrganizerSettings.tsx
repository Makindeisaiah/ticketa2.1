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
    <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
      <button
        onClick={() => setSubSection(null, null)}
        className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
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
        desc: 'Manage your organization details, logo, and public organizer information.',
        btnText: 'Update Profile',
        icon: Building2,
      },
      {
        id: 'team' as SettingsSubSection,
        title: 'Team & Permissions',
        desc: 'Invite team members and control role-based access across events.',
        btnText: 'Manage Team',
        icon: Users,
      },
      {
        id: 'security' as SettingsSubSection,
        title: 'Account & Security',
        desc: 'Secure your account, manage 2FA, and update password credentials.',
        btnText: 'Security Settings',
        icon: ShieldCheck,
      },
      {
        id: 'payments' as SettingsSubSection,
        title: 'Payments & Payouts',
        desc: 'Configure bank settlement accounts and earnings withdrawal preferences.',
        btnText: 'Configure Payments',
        icon: CreditCard,
      },
      {
        id: 'billing' as SettingsSubSection,
        title: 'Billing & Subscription',
        desc: 'Manage your organizer tier subscription, invoices, and service limits.',
        btnText: 'Manage Subscription',
        icon: FileText,
      },
      {
        id: 'notifications' as SettingsSubSection,
        title: 'Notifications',
        desc: 'Set real-time alerts for ticket sales, check-ins, and team activities.',
        btnText: 'Manage Notifications',
        icon: Bell,
      },
      {
        id: 'defaults' as SettingsSubSection,
        title: 'Default Event Settings',
        desc: 'Set pre-configured options and templates for faster event publishing.',
        btnText: 'Edit Defaults',
        icon: Sliders,
      },
      {
        id: 'integrations' as SettingsSubSection,
        title: 'Integrations & API',
        desc: 'Connect payment gateways, marketing tools, and access the Ticketa API.',
        btnText: 'View Integrations',
        icon: Share2,
      },
      {
        id: 'legal' as SettingsSubSection,
        title: 'Legal & Compliance',
        desc: 'Review terms of service, attendee consent policies, and privacy protocols.',
        btnText: 'Review Legal',
        icon: Lock,
      },
    ];

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage your organization profile, security, and administrative preferences
          </p>
        </div>

        {/* 9 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsHubItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5 hover:border-[#00b894]/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => setSubSection(item.id, item.title)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-colors cursor-pointer"
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
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Organization Info
              </h3>

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-black text-[#00b894]">
                  {activeOrg.name ? activeOrg.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <div>
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer">
                    Upload New Logo
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">PNG, JPG, or GIF. 500x500px recommended</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organization Name</label>
                  <input
                    type="text"
                    defaultValue={activeOrg.name || 'My Organization'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Organizer Type</label>
                  <select
                    defaultValue={activeOrg.type === 'BUSINESS' ? 'Company' : activeOrg.type === 'INDIVIDUAL' ? 'Individual' : 'Agency'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#00b894]"
                  >
                    <option>Company</option>
                    <option>Individual</option>
                    <option>Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Description</label>
                  <textarea
                    rows={4}
                    defaultValue={`${activeOrg.name || 'Official Organizer'} profile on Ticketa`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden focus:border-[#00b894] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Country</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden">
                    <option>🇳🇬 Nigeria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / State</label>
                  <input
                    type="text"
                    defaultValue="Lagos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Business Address</label>
                  <input
                    type="text"
                    defaultValue="Victoria Island, Lagos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Span 1) */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Contact &amp; Social Links
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="info@organizer.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    defaultValue="+2349048372638"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Website</label>
                  <input
                    type="text"
                    defaultValue="ticketa.live"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#00b894]">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-slate-900">Verification Status</h3>
              </div>
              <div className="space-y-2 text-xs text-slate-600 pt-2 font-medium">
                {['Email verified', 'Phone number verified', 'Bank settlement verified', 'Account approved'].map(
                  (item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-[#00b894]" />
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
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search team members..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden shadow-xs"
            />
          </div>
          <button className="px-5 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#00b894]/20 flex items-center space-x-2 cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members List (Span 2) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Team Members</h3>
            <div className="space-y-3">
              {[
                { name: 'Admin Organizer', email: 'admin@ticketa.live', role: 'Owner', roleColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200', status: 'Active' },
                { name: 'Operations Lead', email: 'ops@ticketa.live', role: 'Organizer', roleColor: 'bg-blue-50 text-blue-700 border border-blue-200', status: 'Active' },
                { name: 'Finance Officer', email: 'finance@ticketa.live', role: 'Finance', roleColor: 'bg-purple-50 text-purple-700 border border-purple-200', status: 'Active' },
                { name: 'Gate Staff', email: 'gate@ticketa.live', role: 'Check-in Staff', roleColor: 'bg-amber-50 text-amber-700 border border-amber-200', status: 'Active' },
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-slate-800 font-extrabold flex items-center justify-center text-sm border border-slate-200 shadow-xs">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <span className="block font-extrabold text-slate-900 text-xs">{m.name}</span>
                      <span className="block text-[11px] text-slate-400">{m.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${m.roleColor}`}>
                      {m.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission Levels (Span 1) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Permission Levels</h3>
            <div className="space-y-3 text-xs">
              {[
                { label: 'Admin / Owner', desc: 'Full platform access, manage organization & billing, invite team members' },
                { label: 'Organizer', desc: 'Create & manage events, manage tickets & pricing, view sales analytics' },
                { label: 'Finance / Accountant', desc: 'View revenue & payouts, withdraw earnings, access reports' },
                { label: 'Check-in Staff', desc: 'Scan tickets, manual check-in modal, view attendee list' },
              ].map((p, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-1">
                  <span className="font-extrabold text-slate-900 block">{p.label}</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{p.desc}</p>
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
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Account Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name</label>
              <input type="text" defaultValue="Organizer Admin" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <input type="email" defaultValue="admin@ticketa.live" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-hidden" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
          <h3 className="text-base font-extrabold text-slate-900">Password</h3>
          <p className="text-xs text-slate-500 font-medium">Use a strong, unique password to secure your organizer account.</p>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer">
            Change Password
          </button>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Status: Enabled - Via Authenticator App</p>
            </div>
            <button className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl cursor-pointer">
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
        <div className="flex items-center space-x-4 border-b border-slate-200 pb-2">
          {(['overview', 'payouts', 'refunds'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPayoutTab(tab)}
              className={`text-xs font-extrabold pb-2 capitalize cursor-pointer transition-colors ${
                payoutTab === tab
                  ? 'text-[#00b894] border-b-2 border-[#00b894]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'refunds' ? 'Refunds & Fees' : tab}
            </button>
          ))}
        </div>

        {/* Paystack Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-800 font-bold">
          <span>Paystack Direct Gateway is connected for processing ticket payments</span>
          <button className="px-3.5 py-1.5 bg-[#00b894] text-white rounded-xl text-xs font-black cursor-pointer shadow-xs">
            Manage Paystack
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Payout Destination</h3>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 block text-sm">Nigerian Bank Account</span>
              <span className="text-slate-500 block font-medium">Organization Account: {activeOrg?.name || 'My Organization'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Payment History</h3>
            <div className="text-xs text-slate-400 py-4 text-center font-medium">Payout settlements processed automatically via linked bank account</div>
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
          <div className="bg-emerald-50/50 border-2 border-[#00b894] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <span className="px-3 py-1 bg-[#00b894] text-white font-black rounded-full text-xs inline-block">Pro ₦250,000</span>
            <h3 className="text-lg font-black text-slate-900">Pro Organizer Plan</h3>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li>✓ Multiple active events</li>
              <li>✓ Reduced ticket fees</li>
              <li>✓ Advanced check-ins (QR Scanner + Manual List)</li>
              <li>✓ Team &amp; permissions</li>
              <li>✓ Priority 24/7 organizer support</li>
            </ul>
            <button className="w-full py-2.5 bg-[#00b894] text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm">
              Current Active Plan
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 font-black rounded-full text-xs inline-block border border-slate-200">Starter FREE</span>
            <h3 className="text-lg font-black text-slate-900">Starter Plan</h3>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li>• 1 active event</li>
              <li>• Basic ticket sales</li>
              <li>• Standard Ticketa platform fee</li>
            </ul>
            <button className="w-full py-2.5 bg-slate-100 text-slate-700 font-extrabold rounded-xl text-xs cursor-pointer border border-slate-200">
              Upgrade / Downgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUBPAGE 6: Notifications
  if (activeSub === 'notifications') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {renderBackHeader('Notifications')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Event Notifications', items: ['Event published / unpublished', 'Event approved by admin', 'Event starting soon', 'Low ticket capacity warnings'] },
            { title: 'Sales & Payment Notifications', items: ['Ticket sold / order placed', 'Ticket refunded', 'Payment webhook triggered', 'Payout settlement processed'] },
            { title: 'Team & Security Notifications', items: ['New team member invited', 'Team invite accepted', 'Team role updated'] },
            { title: 'System Notifications', items: ['Platform feature updates', 'Maintenance alerts', 'Policy & terms updates'] },
          ].map((cat, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">{cat.title}</h3>
              <div className="space-y-3 text-xs font-medium">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-700">
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
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 text-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Event Basics Defaults</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Ticket Type</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900">
                <option>Paid</option>
                <option>Free</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Ticket Quantity</label>
              <input type="number" defaultValue={100} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900" />
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
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Payment Gateways</h3>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
              <span className="font-extrabold text-slate-900">Paystack Checkout</span>
              <span className="px-3 py-1 bg-[#e6faf5] text-[#00b894] font-extrabold rounded-full border border-[#00b894]/30">Connected</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
              <span className="font-extrabold text-slate-900">Google Calendar Sync</span>
              <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-xs">Configure</button>
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
            'GDPR & NDPR Compliance',
            'Privacy Policy & Terms',
            'Attendee Consent Protocol',
            'Data Protection Agreement',
            'Refund & Cancellation Policy',
            'Anti-Spam & Opt-In Preferences',
          ].map((title, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
              <button className="text-xs font-extrabold text-[#00b894] hover:underline cursor-pointer">View Policy →</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
