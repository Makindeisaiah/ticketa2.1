import React from 'react';
import { OrganizerDashboardPage as OrganizerDashboardPageImpl } from '../organizer/pages/OrganizerDashboardPage';

interface OrganizerDashboardPageProps {
  onNavigateToAttendeeApp: () => void;
}

export const OrganizerDashboardPage: React.FC<OrganizerDashboardPageProps> = ({
  onNavigateToAttendeeApp,
}) => {
  return <OrganizerDashboardPageImpl onSwitchToAttendee={onNavigateToAttendeeApp} />;
};
