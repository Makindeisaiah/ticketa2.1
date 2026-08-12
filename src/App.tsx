import { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  Server, 
  Users, 
  FileCode, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  Building2,
  Ticket,
  Smartphone,
  Globe,
  Scan,
  Terminal,
  Key,
  FolderTree,
  ListChecks,
  ChevronRight
} from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'auth' | 'qr' | 'payments' | 'decisions' | 'roadmap'>('architecture');
  const [selectedTable, setSelectedTable] = useState<string>('profiles');

  const tables = [
    { name: 'profiles', columns: 'id, full_name, email, phone_number, avatar_url, role, is_email_verified', rls: 'Self update, Public view' },
    { name: 'organizations', columns: 'id, name, type, country, phone_number, logo_url, created_by', rls: 'Org members only' },
    { name: 'organization_members', columns: 'id, organization_id, user_id, role, invited_by', rls: 'Org admin manage' },
    { name: 'events', columns: 'id, organization_id, title, slug, venue_id, start_time, end_time, status', rls: 'Public if PUBLISHED, Org manage' },
    { name: 'venues', columns: 'id, organization_id, name, address, city, country, capacity', rls: 'Org manage' },
    { name: 'event_categories', columns: 'id, name, slug, icon_name', rls: 'Public read, Admin manage' },
    { name: 'ticket_types', columns: 'id, event_id, name, price, quantity_available, quantity_sold', rls: 'Public read' },
    { name: 'orders', columns: 'id, order_number, user_id, event_id, total_amount, status, idempotency_key', rls: 'Purchaser & Org view' },
    { name: 'order_items', columns: 'id, order_id, ticket_type_id, unit_price, quantity, subtotal', rls: 'Purchaser view' },
    { name: 'payments', columns: 'id, order_id, provider, transaction_reference, amount, status', rls: 'Server verified only' },
    { name: 'tickets', columns: 'id, ticket_code, qr_code_hash, order_id, event_id, status, is_checked_in', rls: 'Owner, Org & Assigned Staff' },
    { name: 'ticket_holders', columns: 'id, ticket_id, full_name, email, phone_number', rls: 'Ticket owner' },
    { name: 'refunds', columns: 'id, order_id, payment_id, amount, reason, requested_by', rls: 'Org Admin & Admin' },
    { name: 'payout_accounts', columns: 'id, organization_id, account_type, bank_name, account_number, is_verified', rls: 'Org Owner & Admin' },
    { name: 'payouts', columns: 'id, organization_id, payout_account_id, amount, status, reference', rls: 'Org Owner & Admin' },
    { name: 'check_ins', columns: 'id, ticket_id, event_id, scanned_by, status, scanned_at', rls: 'Assigned Staff & Org' },
    { name: 'notifications', columns: 'id, user_id, title, body, type, is_read', rls: 'Recipient user only' },
    { name: 'audit_logs', columns: 'id, actor_id, organization_id, action, entity_type, metadata', rls: 'Admin & Org Owner' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Navigation Banner */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-orange-500/20">
            T2
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">TICKETA 2.0</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                MILESTONE 1
              </span>
            </div>
            <p className="text-xs text-slate-400">Architecture, Database Foundation & Supabase Integration</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-mono">
              Supabase Status: {isSupabaseConfigured ? 'Configured' : 'Env Ready (Awaiting Credentials)'}
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
            Foundation Ready
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Milestone 1 Navigation
          </div>
          {[
            { id: 'architecture', label: 'System Architecture', icon: Layers },
            { id: 'schema', label: 'Database Schema (18 Tables)', icon: Database },
            { id: 'auth', label: 'Auth & RBAC Matrix', icon: ShieldCheck },
            { id: 'qr', label: 'QR Check-in Engine', icon: QrCode },
            { id: 'payments', label: 'Payments & Payouts', icon: CreditCard },
            { id: 'decisions', label: 'Decisions Required', icon: AlertCircle },
            { id: 'roadmap', label: 'Milestone Roadmap', icon: ListChecks },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6 px-3">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center text-slate-300 font-semibold">
                <FileCode className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Key Deliverables
              </div>
              <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
                <li>• /supabase/schema.sql</li>
                <li>• /src/types/database.ts</li>
                <li>• /src/lib/supabase.ts</li>
                <li>• /DOCS_MILESTONE_1.md</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Viewport Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl overflow-y-auto">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Platform System Architecture</h2>
                <p className="text-slate-400 text-sm">
                  Ticketa 2.0 is designed as one unified backend serving four distinct client application interfaces.
                </p>
              </div>

              {/* Four Client Apps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: '1. Attendee Website', icon: Globe, color: 'text-blue-400', desc: 'Event discovery, search, checkout, digital tickets & profile management' },
                  { name: '2. Attendee Mobile App', icon: Smartphone, color: 'text-emerald-400', desc: 'Mobile-first onboarding, offline ticket wallet, push notifications & QR codes' },
                  { name: '3. Organizer Dashboard', icon: Building2, color: 'text-amber-400', desc: 'Multi-tenant event setup, ticket inventory, revenue analytics, team roles & payouts' },
                  { name: '4. Staff Check-in', icon: Scan, color: 'text-purple-400', desc: 'Camera QR code scanner, manual validation, real-time check-in counts & history' },
                ].map((app) => {
                  const Icon = app.icon;
                  return (
                    <div key={app.name} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <Icon className={`w-6 h-6 ${app.color}`} />
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Client App</span>
                      </div>
                      <h3 className="font-semibold text-slate-200 text-sm">{app.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{app.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Core Infrastructure Stack */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-base font-semibold text-slate-200 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-amber-400" />
                  Unified Supabase Backend Stack
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-amber-400 font-semibold block">Supabase Auth</span>
                    <p className="text-slate-400">JWT sessions, email/password, email verification, password resets & invite tokens.</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-emerald-400 font-semibold block">PostgreSQL + RLS</span>
                    <p className="text-slate-400">18 relational tables, Row Level Security policies, indexes & atomic transaction functions.</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-purple-400 font-semibold block">Edge Functions & Storage</span>
                    <p className="text-slate-400">Server-side payment verification, automated staff invitations, media asset storage.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">PostgreSQL Database Schema (18 Tables)</h2>
                <p className="text-slate-400 text-sm">
                  Complete DDL migration script created at <code className="text-amber-400 font-mono">/supabase/schema.sql</code>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Table List */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1 h-[480px] overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tables ({tables.length})
                  </div>
                  {tables.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTable(t.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-all ${
                        selectedTable === t.name
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{t.name}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
                </div>

                {/* Selected Table Inspector */}
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  {(() => {
                    const t = tables.find((item) => item.name === selectedTable);
                    if (!t) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <h3 className="text-lg font-bold text-amber-400 font-mono">{t.name}</h3>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">
                            RLS: {t.rls}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Columns & Data Types</h4>
                          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed break-all">
                            {t.columns.split(', ').map((col, idx) => (
                              <div key={idx} className="py-1 border-b border-slate-800/50 last:border-0 flex items-center justify-between">
                                <span className="text-slate-200">{col}</span>
                                <span className="text-slate-500 text-[11px]">{col === 'id' ? 'UUID PRIMARY KEY' : col.includes('_id') ? 'UUID FOREIGN KEY' : 'TEXT/DATETIME/NUMERIC'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTH & RBAC */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication & Authorization Architecture</h2>
                <p className="text-slate-400 text-sm">
                  Powered exclusively by Supabase Auth with server-enforced PostgreSQL Row Level Security (RLS).
                </p>
              </div>

              {/* User Roles Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="p-4">Role</th>
                      <th className="p-4">Registration Method</th>
                      <th className="p-4">Permissions Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-4 font-bold text-blue-400">ATTENDEE</td>
                      <td className="p-4">Public signup (Full Name, Email, Phone, Password)</td>
                      <td className="p-4">Browse events, purchase tickets, view personal orders & QR codes.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-amber-400">ORGANIZER</td>
                      <td className="p-4">4-stage public onboarding flow</td>
                      <td className="p-4">Create events, manage tickets, invite staff, view analytics, manage payouts.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-purple-400">STAFF</td>
                      <td className="p-4">Organizer invitation token only</td>
                      <td className="p-4">Access assigned events, scan QR codes, validate tickets & check in attendees.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-rose-400">ADMIN</td>
                      <td className="p-4">Protected / Database elevation</td>
                      <td className="p-4">Full platform control, organizer verification, audit logs & system settings.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QR CHECK-IN */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Atomic QR Code Check-in Engine</h2>
                <p className="text-slate-400 text-sm">
                  Protects against duplicate scans, double check-ins, and race conditions using PostgreSQL stored procedure <code className="text-amber-400 font-mono">check_in_ticket()</code>.
                </p>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <h3 className="font-semibold text-slate-200 text-base flex items-center">
                  <Key className="w-5 h-5 mr-2 text-amber-400" />
                  Atomic Transaction Execution Flow
                </h3>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                  <pre>{`SCAN QR CODE ➔ Extract Hash ➔ check_in_ticket(hash, event_id, staff_id)
  │
  ├── 1. SELECT * FROM tickets WHERE qr_code_hash = p_hash FOR UPDATE (Row Lock)
  ├── 2. IF NOT FOUND ➔ Return 'INVALID_TICKET'
  ├── 3. IF event_id != p_event_id ➔ Log 'WRONG_EVENT'
  ├── 4. IF status != 'VALID' ➔ Log 'CANCELLED_TICKET'
  ├── 5. IF is_checked_in == TRUE ➔ Log 'ALREADY_CHECKED_IN' (Duplicate)
  └── 6. IF ALL VALID ➔ UPDATE tickets SET is_checked_in=TRUE, status='USED'
         INSERT INTO check_ins (SUCCESS)
         RETURN jsonb_build_object('success', true)`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment & Payout Architecture</h2>
                <p className="text-slate-400 text-sm">
                  100% server-verified payments with idempotent webhook handlers and split payouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-semibold text-amber-400 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Verification Pipeline
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mr-1 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Checkout initializes order in <code className="text-amber-400">PENDING</code> state with <code className="text-slate-400">idempotency_key</code>.</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mr-1 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Payment provider webhook calls Edge Function <code className="text-amber-400">/verify-payment</code>.</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mr-1 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Edge Function verifies transaction signature server-to-server before minting tickets.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-semibold text-emerald-400 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Organizer Payout Accounts
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mr-1 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Supports <strong>INDIVIDUAL</strong> (Full Name, Bank, Account Number) and <strong>BUSINESS</strong> (CAC Reg Number, Business Name).</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 mr-1 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Accounts must pass verification before disbursement requests are processed.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DECISIONS REQUIRED */}
          {activeTab === 'decisions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Decisions Required</h2>
                <p className="text-slate-400 text-sm">
                  Clarifications for specific business choices highlighted for project stakeholders.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: '1. Payment Provider Default Routing',
                    options: 'Paystack (Primary NGN/Africa) vs. Stripe (Primary USD/Europe) vs. Dual-Provider Auto-Router.',
                    recommendation: 'Implement dual-provider abstraction with configurable defaults per organization.'
                  },
                  {
                    title: '2. Ticket Transferability Policy',
                    options: 'Non-transferable (owner only) vs. Transferable via email transfer request.',
                    recommendation: 'Allow ticket transfer with audit log tracing for attendee flexibility.'
                  },
                  {
                    title: '3. Platform Fee Allocation Model',
                    options: 'Flat fee per ticket vs. Percentage fee vs. Pass fee to buyer vs. Absorb by organizer.',
                    recommendation: 'Configurable percentage fee (e.g. 3.5% + $0.50) passed to ticket buyer by default.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-slate-900 border border-amber-500/30 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <h3 className="font-semibold text-slate-100 text-sm">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-300"><strong className="text-slate-400">Options:</strong> {item.options}</p>
                    <p className="text-xs text-amber-400/90"><strong className="text-amber-400">Recommended:</strong> {item.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Milestone Development Roadmap</h2>
                <p className="text-slate-400 text-sm">
                  Sequential plan for implementing the 4 client application interfaces after Milestone 1 approval.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { m: 'Milestone 1', title: 'Architecture & Technical Foundation', status: 'COMPLETED', active: true, desc: 'Database schema, Supabase Auth, RLS policies, atomic functions, project structure.' },
                  { m: 'Milestone 2', title: 'Attendee Web & Mobile UI Applications', status: 'NEXT', active: false, desc: 'Event discovery, filtering, ticket checkout, digital tickets wallet & QR displays.' },
                  { m: 'Milestone 3', title: 'Organizer Dashboard Application', status: 'PENDING', active: false, desc: '4-stage signup, event creation, ticket inventory, attendee tables, sales charts, payout settings.' },
                  { m: 'Milestone 4', title: 'Staff Check-In Scanner Application', status: 'PENDING', active: false, desc: 'Camera QR code scanner, manual verification, real-time check-in stats & history.' },
                  { m: 'Milestone 5', title: 'End-to-End Edge Integration & Launch', status: 'PENDING', active: false, desc: 'Live webhooks, Edge Functions, WebSocket check-in sync, final audits & polish.' },
                ].map((step) => (
                  <div 
                    key={step.m} 
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      step.active 
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-100' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{step.m}</span>
                        <h3 className="font-semibold text-slate-200 text-sm">{step.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
                      step.status === 'COMPLETED' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : step.status === 'NEXT'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
