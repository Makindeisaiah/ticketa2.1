import React, { useState } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { OrganizerAuth } from './OrganizerAuth';
import { Building2, Plus, ArrowLeft } from 'lucide-react';
import { OrganizerOnboardingModal } from './OrganizerOnboardingModal';

interface OrganizerRouteGuardProps {
  children: React.ReactNode;
}

export const OrganizerRouteGuard: React.FC<OrganizerRouteGuardProps> = ({ children }) => {
  const { user, isOrganizer, isLoading, refreshOrganizations } = useOrganizer();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);

  // 1. Session or Organization Authorization is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100 p-4 antialiased">
        <div className="w-10 h-10 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Authenticating Organizer Session...</p>
      </div>
    );
  }

  // 2. Unauthenticated user -> render Organizer Login screen
  if (!user) {
    return (
      <OrganizerAuth
        onSuccess={() => {
          refreshOrganizations();
        }}
      />
    );
  }

  // 3. Authenticated user but HAS NO ORGANIZATION MEMBERSHIP
  if (!isOrganizer) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00b894] to-emerald-400 text-white font-black flex items-center justify-center text-2xl mx-auto shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">No Organizer Account Found</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              No organizer account is associated with <span className="text-white font-bold">{user.email}</span>. Create an organizer account to start publishing events, managing tickets, and tracking sales.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsCreateOrgOpen(true)}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Organizer Account</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#00b894]" />
              <span>Return to Attendee Site</span>
            </button>
          </div>
        </div>

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
      </div>
    );
  }

  // 4. Authenticated & Authorized Organizer
  return <>{children}</>;
};
