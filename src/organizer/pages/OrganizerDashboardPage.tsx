import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getOrganizationMetrics,
  getOrganizationEvents,
  getOrganizationOrders,
  getOrganizationAttendees,
} from '../services/organizerService';
import { OrganizerLayout, OrganizerTab } from '../components/OrganizerLayout';
import { Organization } from '../../types/database';
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

interface OrganizerDashboardPageProps {
  onSwitchToAttendee: () => void;
  initialTab?: OrganizerTab;
}

export const OrganizerDashboardPage: React.FC<OrganizerDashboardPageProps> = ({
  onSwitchToAttendee,
  initialTab = 'overview',
}) => {
  const { user } = useAuth();
  const {
    organizations,
    organization: activeOrg,
    setActiveOrganization,
    refreshOrganizations,
  } = useOrganizer();

  const [activeTab, setActiveTab] = useState<OrganizerTab>(initialTab);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  // Data states for active organization with default safe fallbacks
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
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load Organization Specific Data safely
  const loadOrgData = async () => {
    if (!activeOrg?.id) return;
    setDataLoading(true);

    try {
      const [m, evts, ords, atts] = await Promise.all([
        getOrganizationMetrics(activeOrg.id).catch(() => ({
          totalRevenue: 0,
          ticketsSold: 0,
          totalEvents: 0,
          activeEvents: 0,
          totalCheckedIn: 0,
        })),
        getOrganizationEvents(activeOrg.id).catch(() => []),
        getOrganizationOrders(activeOrg.id).catch(() => []),
        getOrganizationAttendees(activeOrg.id).catch(() => []),
      ]);

      setMetrics(m || {
        totalRevenue: 0,
        ticketsSold: 0,
        totalEvents: 0,
        activeEvents: 0,
        totalCheckedIn: 0,
      });
      setEvents(evts || []);
      setOrders(ords || []);
      setAttendees(atts || []);
    } catch (e) {
      console.error('Error fetching org data:', e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrg?.id) {
      loadOrgData();
    }
  }, [activeOrg?.id]);

  const effectiveOrg: Organization = activeOrg || {
    id: `org_default_${user?.id || 'guest'}`,
    name: 'My Organization',
    type: 'AGENCY' as const,
    country: 'Nigeria',
    created_by: user?.id || 'guest',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <OrganizerLayout
      organizations={organizations.length > 0 ? organizations : [effectiveOrg]}
      activeOrg={effectiveOrg}
      onSelectOrg={(org) => setActiveOrganization(org.id)}
      onOpenCreateOrg={() => setIsCreateOrgOpen(true)}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        const subpath = tab === 'overview' ? '/organizer/dashboard' : `/organizer/${tab}`;
        window.history.pushState({}, '', subpath);
      }}
      onSwitchToAttendee={onSwitchToAttendee}
    >
      {activeTab === 'overview' && (
        <OrganizerOverview
          metrics={metrics}
          events={events}
          onOpenCreateModal={() => setIsCreateEventOpen(true)}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            window.history.pushState({}, '', `/organizer/${tab}`);
          }}
        />
      )}

      {activeTab === 'events' && (
        <OrganizerEvents
          events={events}
          orgId={effectiveOrg.id}
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
        <OrganizerFinance orgId={effectiveOrg.id} totalRevenue={metrics.totalRevenue} />
      )}

      {activeTab === 'team' && (
        <OrganizerTeam orgId={effectiveOrg.id} userId={user?.id || ''} />
      )}

      {activeTab === 'audit' && <OrganizerAuditLogs orgId={effectiveOrg.id} />}

      {activeTab === 'settings' && (
        <OrganizerSettings activeOrg={effectiveOrg} onRefreshOrg={loadOrgData} />
      )}

      {/* Modals */}
      {isCreateOrgOpen && user?.id && (
        <OrganizerOnboardingModal
          userId={user.id}
          onSuccess={() => {
            setIsCreateOrgOpen(false);
            refreshOrganizations(user.id);
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
