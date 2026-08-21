import React from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { OrganizerAuth } from './OrganizerAuth';

interface OrganizerRouteGuardProps {
  children: React.ReactNode;
}

export const OrganizerRouteGuard: React.FC<OrganizerRouteGuardProps> = ({ children }) => {
  const { user, profile, organizations, isOrganizer, isLoading, refreshOrganizations } = useOrganizer();

  // 1. Session or Organization Authorization is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100 p-4 antialiased">
        <div className="w-10 h-10 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Authenticating Organizer Session...</p>
      </div>
    );
  }

  // 2. Unauthenticated user or user with no registered organization -> render Organizer Sign Up screen
  if (!user || organizations.length === 0) {
    return (
      <OrganizerAuth
        initialMode="signup"
        onSuccess={() => {
          refreshOrganizations();
        }}
      />
    );
  }

  // 3. Authenticated Organizer -> render dashboard directly
  return <>{children}</>;
};
