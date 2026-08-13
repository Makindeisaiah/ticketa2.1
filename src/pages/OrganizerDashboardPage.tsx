import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Organization } from '../types/database';
import {
  getUserOrganizations,
  getOrganizationMetrics,
  getOrganizationEvents,
  getOrganizationOrders,
  getOrganizationAttendees,
} from '../services/organizerService';
import { OrganizerLayout, OrganizerTab } from '../components/organizer/OrganizerLayout';
import { OrganizerOverview } from '../components/organizer/OrganizerOverview';
import { OrganizerEvents } from '../components/organizer/OrganizerEvents';
import { CreateEventModal } from '../components/organizer/CreateEventModal';
import { OrganizerOrdersAttendees } from '../components/organizer/OrganizerOrdersAttendees';
import { OrganizerCheckInScanner } from '../components/organizer/OrganizerCheckInScanner';
import { OrganizerFinance } from '../components/organizer/OrganizerFinance';
import { OrganizerTeam } from '../components/organizer/OrganizerTeam';
import { OrganizerAuditLogs } from '../components/organizer/OrganizerAuditLogs';
import { OrganizerSettings } from '../components/organizer/OrganizerSettings';
import { OrganizerOnboardingModal } from '../components/organizer/OrganizerOnboardingModal';

interface OrganizerDashboardPageProps {
  onNavigateToAttendeeApp: () => void;
}

export const OrganizerDashboardPage: React.FC<OrganizerDashboardPageProps> = ({
  onNavigateToAttendeeApp,
}) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<OrganizerTab>('overview');

  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  // Loaded org data
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

  // Load User Organizations
  const loadUserOrgs = async () => {
    if (!user) return;
    setLoadingOrgs(true);
    const orgs = await getUserOrganizations(user.id);
    setOrganizations(orgs);

    if (orgs.length > 0) {
      if (!activeOrg || !orgs.find((o) => o.id === activeOrg.id)) {
        setActiveOrg(orgs[0]);
      }
    } else {
      setIsOnboardingOpen(true);
    }
    setLoadingOrgs(false);
  };

  useEffect(() => {
    loadUserOrgs();
  }, [user]);

  // Load Active Org Details
  const loadOrgData = async () => {
    if (!activeOrg) return;

    const [met, evts, ords, atts] = await Promise.all([
      getOrganizationMetrics(activeOrg.id),
      getOrganizationEvents(activeOrg.id),
      getOrganizationOrders(activeOrg.id),
      getOrganizationAttendees(activeOrg.id),
    ]);

    setMetrics(met);
    setEvents(evts);
    setOrders(ords);
    setAttendees(atts);
  };

  useEffect(() => {
    if (activeOrg) {
      loadOrgData();
    }
  }, [activeOrg]);

  const handleOrgCreated = (newOrg: Organization) => {
    setIsOnboardingOpen(false);
    setOrganizations((prev) => [newOrg, ...prev]);
    setActiveOrg(newOrg);
  };

  if (loadingOrgs) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading Organizer Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <OrganizerLayout
      organizations={organizations}
      activeOrg={activeOrg}
      onSelectOrg={(org) => setActiveOrg(org)}
      onOpenCreateOrg={() => setIsOnboardingOpen(true)}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t)}
      onSwitchToAttendee={onNavigateToAttendeeApp}
    >
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <OrganizerOverview
          metrics={metrics}
          recentOrders={orders}
          events={events}
          onNavigateTab={(t) => setActiveTab(t)}
          onOpenCreateEvent={() => setIsCreateEventOpen(true)}
        />
      )}

      {/* Events Tab */}
      {activeTab === 'events' && activeOrg && user && (
        <OrganizerEvents
          events={events}
          orgId={activeOrg.id}
          userId={user.id}
          onRefresh={loadOrgData}
          onOpenCreateEvent={() => setIsCreateEventOpen(true)}
        />
      )}

      {/* Orders & Attendees Tab */}
      {activeTab === 'orders' && (
        <OrganizerOrdersAttendees orders={orders} attendees={attendees} events={events} />
      )}

      {/* QR Scanner Tab */}
      {activeTab === 'scanner' && user && (
        <OrganizerCheckInScanner events={events} userId={user.id} />
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && activeOrg && (
        <OrganizerFinance orgId={activeOrg.id} totalRevenue={metrics.totalRevenue} />
      )}

      {/* Team Members Tab */}
      {activeTab === 'team' && activeOrg && user && (
        <OrganizerTeam orgId={activeOrg.id} userId={user.id} />
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && activeOrg && (
        <OrganizerAuditLogs orgId={activeOrg.id} />
      )}

      {/* Org Settings Tab */}
      {activeTab === 'settings' && activeOrg && (
        <OrganizerSettings activeOrg={activeOrg} onRefreshOrg={loadUserOrgs} />
      )}

      {/* Create Event Modal */}
      {isCreateEventOpen && activeOrg && user && (
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

      {/* Onboarding / Create Org Modal */}
      {isOnboardingOpen && user && (
        <OrganizerOnboardingModal
          userId={user.id}
          onSuccess={handleOrgCreated}
          onClose={() => setIsOnboardingOpen(false)}
          canClose={organizations.length > 0}
        />
      )}
    </OrganizerLayout>
  );
};
