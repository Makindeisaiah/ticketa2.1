import React from 'react';
import { OrganizerProvider } from '../context/OrganizerContext';
import { OrganizerErrorBoundary } from './components/OrganizerErrorBoundary';
import { OrganizerRouteGuard } from './components/OrganizerRouteGuard';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { OrganizerTab } from './components/OrganizerLayout';
import { OrganizerAuth } from './components/OrganizerAuth';

interface OrganizerAppProps {
  onSwitchToAttendeeWebsite?: () => void;
  pathname?: string;
}

export const OrganizerApp: React.FC<OrganizerAppProps> = ({
  onSwitchToAttendeeWebsite,
  pathname = window.location.pathname,
}) => {
  const handleSwitchToAttendee = () => {
    if (onSwitchToAttendeeWebsite) {
      onSwitchToAttendeeWebsite();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Determine active tab or auth mode based on pathname
  let initialTab: OrganizerTab = 'overview';
  if (pathname.includes('/organizer/events')) initialTab = 'events';
  else if (pathname.includes('/organizer/analytics')) initialTab = 'analytics';
  else if (pathname.includes('/organizer/orders') || pathname.includes('/organizer/attendees')) initialTab = 'orders';
  else if (pathname.includes('/organizer/tickets')) initialTab = 'tickets';
  else if (pathname.includes('/organizer/team')) initialTab = 'team';
  else if (pathname.includes('/organizer/settings') || pathname.includes('/organizer/finance') || pathname.includes('/organizer/billing')) initialTab = 'settings';

  const isAuthRoute = pathname === '/organizer/login' || pathname === '/organizer/signup';

  return (
    <OrganizerErrorBoundary>
      <OrganizerProvider>
        {isAuthRoute ? (
          <OrganizerAuth
            initialMode={pathname === '/organizer/signup' ? 'signup' : 'signin'}
            onSuccess={() => {
              window.history.pushState({}, '', '/organizer/dashboard');
              window.dispatchEvent(new Event('popstate'));
            }}
          />
        ) : (
          <OrganizerRouteGuard>
            <OrganizerDashboardPage
              initialTab={initialTab}
              onSwitchToAttendee={handleSwitchToAttendee}
            />
          </OrganizerRouteGuard>
        )}
      </OrganizerProvider>
    </OrganizerErrorBoundary>
  );
};

export default OrganizerApp;
