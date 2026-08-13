import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';

interface OrganizerAppProps {
  onSwitchToAttendeeWebsite?: () => void;
}

const OrganizerAppContent: React.FC<OrganizerAppProps> = ({ onSwitchToAttendeeWebsite }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100 p-4">
        <div className="w-10 h-10 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Authenticating Organizer Session...</p>
      </div>
    );
  }

  return (
    <OrganizerDashboardPage
      onSwitchToAttendee={() => {
        if (onSwitchToAttendeeWebsite) {
          onSwitchToAttendeeWebsite();
        } else {
          window.location.href = '/';
        }
      }}
    />
  );
};

export const OrganizerApp: React.FC<OrganizerAppProps> = (props) => {
  return <OrganizerAppContent {...props} />;
};

export default OrganizerApp;
