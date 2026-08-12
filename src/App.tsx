import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { BrowseEventsPage } from './pages/BrowseEventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { PaymentProcessingModal } from './components/PaymentProcessingModal';
import { TicketWalletModal } from './components/TicketWalletModal';
import { getAllEvents } from './services/eventService';
import { SeedEventData } from './data/seedEvents';
import { OrderCheckoutPayload, CompletedOrderResult, getUserOrders } from './services/orderService';
import {
  Layers,
  Database,
  ShieldCheck,
  QrCode,
  CreditCard,
  AlertCircle,
  ListChecks,
} from 'lucide-react';

type AppView = 
  | 'home' 
  | 'browse' 
  | 'detail' 
  | 'checkout' 
  | 'my-tickets' 
  | 'signin' 
  | 'signup' 
  | 'forgot-password' 
  | 'profile' 
  | 'architecture';

function MainAppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [events, setEvents] = useState<SeedEventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SeedEventData | null>(null);
  
  // Checkout & Payment states
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [checkoutPayload, setCheckoutPayload] = useState<OrderCheckoutPayload | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [activeWalletOrder, setActiveWalletOrder] = useState<CompletedOrderResult | null>(null);

  // Return view state for post-login redirect
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<AppView | null>(null);

  // Browse filters pass-through
  const [browseCategory, setBrowseCategory] = useState<string>('all');
  const [browseSearchQuery, setBrowseSearchQuery] = useState<string>('');

  // Architecture view state
  const [archTab, setArchTab] = useState<'architecture' | 'schema' | 'auth' | 'qr' | 'payments' | 'decisions' | 'roadmap'>('architecture');

  const userOrders = getUserOrders();

  useEffect(() => {
    async function loadEvents() {
      const data = await getAllEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    }
    loadEvents();
  }, []);

  const handleNavigate = (view: AppView, params?: any) => {
    if (params?.category) {
      setBrowseCategory(params.category);
    }
    if (params?.searchQuery) {
      setBrowseSearchQuery(params.searchQuery);
    }

    // Protection check for protected routes
    if (!user && (view === 'checkout' || view === 'profile')) {
      setRedirectAfterAuth(view);
      setCurrentView('signin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    if (redirectAfterAuth) {
      const target = redirectAfterAuth;
      setRedirectAfterAuth(null);
      setCurrentView(target);
    } else {
      setCurrentView('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (event: SeedEventData) => {
    setSelectedEvent(event);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCheckout = (event: SeedEventData, quantities: Record<string, number>) => {
    setSelectedEvent(event);
    setSelectedQuantities(quantities);
    
    if (!user) {
      setRedirectAfterAuth('checkout');
      setCurrentView('signin');
    } else {
      setCurrentView('checkout');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitCheckout = (payload: OrderCheckoutPayload) => {
    setCheckoutPayload(payload);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (order: CompletedOrderResult) => {
    // Payment verified and saved
  };

  const handleViewTicketsFromModal = (order: CompletedOrderResult) => {
    setIsPaymentModalOpen(false);
    setActiveWalletOrder(order);
  };

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
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Universal Attendee Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        myTicketsCount={userOrders.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            events={events}
            onSelectEvent={handleSelectEvent}
            onNavigateToBrowse={(params) => handleNavigate('browse', params)}
          />
        )}

        {currentView === 'browse' && (
          <BrowseEventsPage
            initialCategory={browseCategory}
            initialSearchQuery={browseSearchQuery}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentView === 'detail' && selectedEvent && (
          <EventDetailPage
            event={selectedEvent}
            allEvents={events}
            onSelectEvent={handleSelectEvent}
            onNavigateToCheckout={handleNavigateToCheckout}
            onNavigateToBrowse={() => handleNavigate('browse')}
          />
        )}

        {currentView === 'checkout' && selectedEvent && (
          <CheckoutPage
            event={selectedEvent}
            selectedQuantities={selectedQuantities}
            onNavigateToBrowse={() => handleNavigate('browse')}
            onSubmitCheckout={handleSubmitCheckout}
            onNavigateToSignIn={() => {
              setRedirectAfterAuth('checkout');
              setCurrentView('signin');
            }}
          />
        )}

        {currentView === 'my-tickets' && (
          <MyTicketsPage
            onViewTicketWallet={(ord) => setActiveWalletOrder(ord)}
            onNavigateToBrowse={() => handleNavigate('browse')}
          />
        )}

        {/* Auth Pages */}
        {currentView === 'signin' && (
          <SignInPage
            onNavigateToSignUp={() => setCurrentView('signup')}
            onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
            onSuccessRedirect={handleAuthSuccess}
          />
        )}

        {currentView === 'signup' && (
          <SignUpPage
            onNavigateToSignIn={() => setCurrentView('signin')}
            onSuccessRedirect={handleAuthSuccess}
          />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPasswordPage
            onNavigateToSignIn={() => setCurrentView('signin')}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            onNavigateToTickets={() => handleNavigate('my-tickets')}
          />
        )}

        {/* Architecture Specs View */}
        {currentView === 'architecture' && (
          <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-72px)] p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Milestone 1 &amp; 2 Technical Architecture</h1>
                  <p className="text-slate-400 text-xs mt-1">Supabase database schema, RLS matrix, and atomic QR check-in engine</p>
                </div>
                <button
                  onClick={() => handleNavigate('home')}
                  className="bg-[#00b894] text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  Return to Attendee App
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-64 space-y-1">
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
                    const isActive = archTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setArchTab(item.id as any)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#00b894]/20 text-[#00b894] border border-[#00b894]/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#00b894]' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </aside>

                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  {archTab === 'architecture' && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white">4-Client System Architecture</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-[#00b894]">1. Attendee Web Application (Live)</span>
                          <p className="text-slate-400">Home page, search, filters, event details, Paystack checkout &amp; digital QR ticket wallet.</p>
                        </div>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-blue-400">2. Attendee Mobile App</span>
                          <p className="text-slate-400">Mobile-first ticket wallet, push notifications &amp; offline ticket validation.</p>
                        </div>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-amber-400">3. Organizer Dashboard</span>
                          <p className="text-slate-400">Multi-tenant event setup, sales analytics, team member invites &amp; payout settings.</p>
                        </div>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-bold text-purple-400">4. Staff Check-in Scanner</span>
                          <p className="text-slate-400">Camera QR code scanner with atomic double-scan prevention.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {archTab === 'schema' && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white">Database Schema (18 Tables)</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        {tables.map((t) => (
                          <div key={t.name} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-[#00b894] font-bold block">{t.name}</span>
                            <span className="text-slate-400 text-[11px]">{t.columns}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {archTab !== 'architecture' && archTab !== 'schema' && (
                    <div className="space-y-3 text-xs text-slate-300">
                      <h2 className="text-xl font-bold text-white uppercase">{archTab} Specifications</h2>
                      <p className="text-slate-400">
                        Full PostgreSQL definitions, RLS rules, and Edge functions configured in <code className="text-[#00b894]">/supabase/schema.sql</code>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Paystack Processing Modal */}
      {isPaymentModalOpen && checkoutPayload && (
        <PaymentProcessingModal
          payload={checkoutPayload}
          onSuccess={handlePaymentSuccess}
          onViewTickets={handleViewTicketsFromModal}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Ticket Wallet QR Modal */}
      {activeWalletOrder && (
        <TicketWalletModal
          order={activeWalletOrder}
          onClose={() => setActiveWalletOrder(null)}
        />
      )}

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
