import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Organization } from '../../types/database';
import {
  getUserOrganizations,
  getOrganizationMetrics,
  getOrganizationEvents,
  getOrganizationOrders,
  getOrganizationAttendees,
} from '../services/organizerService';
import { OrganizerLayout, OrganizerTab } from '../components/OrganizerLayout';
import { OrganizerOverview } from '../components/OrganizerOverview';
import { OrganizerEvents } from '../components/OrganizerEvents';
import { CreateEventModal } from '../components/CreateEventModal';
import { OrganizerOrdersAttendees } from '../components/OrganizerOrdersAttendees';
import { OrganizerCheckInScanner } from '../components/OrganizerCheckInScanner';
import { OrganizerFinance } from '../components/OrganizerFinance';
import { OrganizerTeam } from '../components/OrganizerTeam';
import { OrganizerAuditLogs } from '../components/OrganizerAuditLogs';
import { OrganizerSettings } from '../components/OrganizerSettings';
import { OrganizerOnboardingModal } from '../components/OrganizerOnboardingModal';
import { Building2, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface OrganizerDashboardPageProps {
  onSwitchToAttendee: () => void;
}

export const OrganizerDashboardPage: React.FC<OrganizerDashboardPageProps> = ({
  onSwitchToAttendee,
}) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<OrganizerTab>('overview');

  const [loading, setLoading] = useState(true);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  // Data states for active organization
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    ticketsSold: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalCheckedIn: 0,
  });
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);

  // Load User's Organizations
  const loadUserOrgs = async () => {
    if (!user?.id) return;
    setLoading(true);
    const orgs = await getUserOrganizations(user.id);
    setOrganizations(orgs);

    if (orgs.length > 0) {
      if (!activeOrg || !orgs.find((o) => o.id === activeOrg.id)) {
        setActiveOrg(orgs[0]);
      }
    } else {
      setActiveOrg(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUserOrgs();
  }, [user?.id]);

  // Load Organization Specific Data
  const loadOrgData = async () => {
    if (!activeOrg?.id) return;

    const [m, evts, ords, atts] = await Promise.all([
      getOrganizationMetrics(activeOrg.id),
      getOrganizationEvents(activeOrg.id),
      getOrganizationOrders(activeOrg.id),
      getOrganizationAttendees(activeOrg.id),
    ]);

    setMetrics(m);
    setEvents(evts);
    setOrders(ords);
    setAttendees(atts);
  };

  useEffect(() => {
    if (activeOrg) {
      loadOrgData();
    }
  }, [activeOrg?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100 p-4">
        <div className="w-10 h-10 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading Organizer Workspace...</p>
      </div>
    );
  }

  // If user has no organizations, show onboarding prompt
  if (!activeOrg) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00b894] to-emerald-400 text-white font-black flex items-center justify-center text-2xl mx-auto shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Welcome to Ticketa Organizer</h2>
            <p className="text-xs text-slate-400">
              You haven't created an organization yet. Create your organizer profile to start publishing events, issuing ticket tiers, and collecting revenue.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsCreateOrgOpen(true)}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Create Organization Profile</span>
            </button>

            <button
              onClick={onSwitchToAttendee}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl transition-all text-xs cursor-pointer"
            >
              Back to Attendee Website
            </button>
          </div>
        </div>

        {isCreateOrgOpen && user?.id && (
          <OrganizerOnboardingModal
            userId={user.id}
            onSuccess={(newOrg) => {
              setIsCreateOrgOpen(false);
              loadUserOrgs();
            }}
            onClose={() => setIsCreateOrgOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <OrganizerLayout
      organizations={organizations}
      activeOrg={activeOrg}
      onSelectOrg={(org) => setActiveOrg(org)}
      onOpenCreateOrg={() => setIsCreateOrgOpen(true)}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      onSwitchToAttendee={onSwitchToAttendee}
    >
      {activeTab === 'overview' && (
        <OrganizerOverview
          metrics={metrics}
          events={events}
          onOpenCreateModal={() => setIsCreateEventOpen(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'events' && (
        <OrganizerEvents
          events={events}
          orgId={activeOrg.id}
          userId={user?.id || ''}
          onOpenCreateModal={() => setIsCreateEventOpen(true)}
          onRefreshEvents={loadOrgData}
        />
      )}

      {activeTab === 'orders' && (
        <OrganizerOrdersAttendees orders={orders} attendees={attendees} />
      )}

      {activeTab === 'scanner' && (
        <OrganizerCheckInScanner events={events} userId={user?.id || ''} />
      )}

      {activeTab === 'finance' && (
        <OrganizerFinance orgId={activeOrg.id} totalRevenue={metrics.totalRevenue} />
      )}

      {activeTab === 'team' && (
        <OrganizerTeam orgId={activeOrg.id} userId={user?.id || ''} />
      )}

      {activeTab === 'audit' && <OrganizerAuditLogs orgId={activeOrg.id} />}

      {activeTab === 'settings' && (
        <OrganizerSettings activeOrg={activeOrg} onRefreshOrg={loadOrgData} />
      )}

      {/* Modals */}
      {isCreateOrgOpen && user?.id && (
        <OrganizerOnboardingModal
          userId={user.id}
          onSuccess={(newOrg) => {
            setIsCreateOrgOpen(false);
            loadUserOrgs();
          }}
          onClose={() => setIsCreateOrgOpen(false)}
        />
      )}

      {isCreateEventOpen && user?.id && activeOrg && (
        <CreateEventModal
          orgId={activeOrg.id}
          userId={user.id}
          onSuccess={() => {
            setIsCreateEventOpen(false);
            loadOrgData();
          }}
          onClose={() => setIsCreateEventOpen(false)}
        />
      )}
    </OrganizerLayout>
  );
};
