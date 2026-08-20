import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrganizer } from '../../context/OrganizerContext';
import {
  getOrganizationMetrics,
  getOrganizationEvents,
  getOrganizationOrders,
  getOrganizationAttendees,
  isValidUUID,
} from '../services/organizerService';
import { OrganizerLayout, OrganizerTab } from '../components/OrganizerLayout';
import { Organization } from '../../types/database';
import { OrganizerOverview } from '../components/OrganizerOverview';
import { OrganizerEvents } from '../components/OrganizerEvents';
import { OrganizerAnalytics } from '../components/OrganizerAnalytics';
import { OrganizerTicketSales } from '../components/OrganizerTicketSales';
import { OrganizerOrdersAttendees } from '../components/OrganizerOrdersAttendees';
import { OrganizerCheckIns } from '../components/OrganizerCheckIns';
import { OrganizerSettings, SettingsSubSection } from '../components/OrganizerSettings';
import { OrganizerOnboardingModal } from '../components/OrganizerOnboardingModal';
import { CreateEventModal } from '../components/CreateEventModal';

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
  const [subpageTitle, setSubpageTitle] = useState<string | null>(null);
  const [settingsSubSection, setSettingsSubSection] = useState<SettingsSubSection>(null);

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
  const activeOrgId = activeOrg?.id;
  const loadOrgData = React.useCallback(async () => {
    if (!activeOrgId || !isValidUUID(activeOrgId)) return;
    setDataLoading(true);

    try {
      const [m, evts, ords, atts] = await Promise.all([
        getOrganizationMetrics(activeOrgId).catch(() => ({
          totalRevenue: 0,
          ticketsSold: 0,
          totalEvents: 0,
          activeEvents: 0,
          totalCheckedIn: 0,
        })),
        getOrganizationEvents(activeOrgId).catch(() => []),
        getOrganizationOrders(activeOrgId).catch(() => []),
        getOrganizationAttendees(activeOrgId).catch(() => []),
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
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId && isValidUUID(activeOrgId)) {
      loadOrgData();
    }
  }, [activeOrgId, loadOrgData]);

  const effectiveOrg: Organization = activeOrg || organizations[0] || {
    id: '',
    name: user?.fullName ? `${user.fullName}'s Organization` : 'My Organization',
    type: 'INDIVIDUAL' as const,
    country: 'Nigeria',
    created_by: user?.id || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const currentOrgId = (effectiveOrg.id && isValidUUID(effectiveOrg.id))
    ? effectiveOrg.id
    : (organizations.find((o) => isValidUUID(o.id))?.id || '');

  return (
    <OrganizerLayout
      organizations={organizations.length > 0 ? organizations : [effectiveOrg]}
      activeOrg={effectiveOrg}
      onSelectOrg={(org) => setActiveOrganization(org.id)}
      onOpenCreateOrg={() => setIsCreateOrgOpen(true)}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setSubpageTitle(null);
        setSettingsSubSection(null);
        const subpath = tab === 'overview' ? '/organizer/dashboard' : `/organizer/${tab}`;
        window.history.pushState({}, '', subpath);
      }}
      onSwitchToAttendee={onSwitchToAttendee}
      onOpenCreateModal={() => setIsCreateEventOpen(true)}
      subpageTitle={subpageTitle}
      onBackToSettingsHub={() => {
        setSubpageTitle(null);
        setSettingsSubSection(null);
      }}
      events={events}
      orders={orders}
      attendees={attendees}
    >
      {activeTab === 'overview' && (
        <OrganizerOverview
          metrics={metrics}
          events={events}
          orgName={effectiveOrg?.name || user?.fullName || 'Organizer'}
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
          orgId={currentOrgId}
          userId={user?.id || ''}
          onOpenCreateModal={() => setIsCreateEventOpen(true)}
          onRefreshEvents={loadOrgData}
        />
      )}

      {activeTab === 'analytics' && (
        <OrganizerAnalytics events={events} orders={orders} metrics={metrics} />
      )}

      {activeTab === 'tickets' && (
        <OrganizerTicketSales orders={orders} />
      )}

      {activeTab === 'orders' && (
        <OrganizerOrdersAttendees orders={orders} attendees={attendees} />
      )}

      {activeTab === 'check-ins' && (
        <OrganizerCheckIns events={events} userId={user?.id || ''} />
      )}

      {activeTab === 'settings' && (
        <OrganizerSettings
          activeOrg={effectiveOrg}
          onRefreshOrg={loadOrgData}
          subSection={settingsSubSection}
          onSubSectionChange={(sub, title) => {
            setSettingsSubSection(sub);
            setSubpageTitle(title);
          }}
        />
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

      {isCreateEventOpen && (
        <CreateEventModal
          orgId={currentOrgId}
          userId={user?.id || ''}
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
