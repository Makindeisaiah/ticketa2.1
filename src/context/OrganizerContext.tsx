import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Organization, OrgMemberRole, Profile } from '../types/database';

export interface OrganizerContextType {
  user: any | null;
  profile: Profile | null;
  organizationId: string | null;
  organization: Organization | null;
  organizations: Organization[];
  organizationRole: OrgMemberRole | null;
  isOrganizer: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  setActiveOrganization: (orgId: string) => void;
  refreshOrganizations: (overrideUserId?: string) => Promise<void>;
}

const OrganizerContext = createContext<OrganizerContextType | undefined>(undefined);

export const OrganizerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [activeRole, setActiveRole] = useState<OrgMemberRole | null>(null);
  const [rolesMap, setRolesMap] = useState<Record<string, OrgMemberRole>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganizations = useCallback(async (overrideUserId?: string) => {
    const targetUserId = overrideUserId || authUser?.id;
    if (!targetUserId) {
      setOrganizations([]);
      setActiveOrg(null);
      setActiveRole(null);
      setRolesMap({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setOrganizations([]);
        setActiveOrg(null);
        setActiveRole(null);
        setIsLoading(false);
        return;
      }

      // Fetch user profile from public.profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch organizations created by user
      const { data: createdOrgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', targetUserId);

      // Fetch organization_members entries for this user
      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(*)')
        .eq('user_id', targetUserId);

      const roles: Record<string, OrgMemberRole> = {};
      const orgsMap = new Map<string, Organization>();

      // Populate created orgs (default role OWNER if created_by matches)
      (createdOrgs || []).forEach((org: Organization) => {
        orgsMap.set(org.id, org);
        roles[org.id] = 'OWNER';
      });

      // Populate member orgs
      (memberRows || []).forEach((row: any) => {
        if (row.organizations) {
          orgsMap.set(row.organizations.id, row.organizations);
          roles[row.organizations.id] = row.role || 'MEMBER';
        }
      });

      const allOrgs = Array.from(orgsMap.values());
      setOrganizations(allOrgs);
      setRolesMap(roles);

      if (allOrgs.length > 0) {
        // Retain existing active org if valid, else pick first
        const currentActiveId = activeOrg?.id;
        const matched = allOrgs.find((o) => o.id === currentActiveId) || allOrgs[0];
        setActiveOrg(matched);
        setActiveRole(roles[matched.id] || 'OWNER');
      } else {
        setActiveOrg(null);
        setActiveRole(null);
      }
    } catch (err: any) {
      console.error('Error loading organizer context:', err);
      setError(err.message || 'Failed to load organization context.');
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (!authLoading) {
      refreshOrganizations();
    }
  }, [authUser?.id, authLoading, refreshOrganizations]);

  const setActiveOrganization = (orgId: string) => {
    const selected = organizations.find((o) => o.id === orgId);
    if (selected) {
      setActiveOrg(selected);
      setActiveRole(rolesMap[selected.id] || 'MEMBER');
    }
  };

  const isOrganizer = organizations.length > 0;
  const isAuthorized = Boolean(
    activeRole && ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'MEMBER'].includes(activeRole)
  );

  return (
    <OrganizerContext.Provider
      value={{
        user: authUser,
        profile,
        organizationId: activeOrg?.id || null,
        organization: activeOrg,
        organizations,
        organizationRole: activeRole,
        isOrganizer,
        isAuthorized,
        isLoading: authLoading || isLoading,
        error,
        setActiveOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizerContext.Provider>
  );
};

export const useOrganizer = () => {
  const context = useContext(OrganizerContext);
  if (!context) {
    throw new Error('useOrganizer must be used within an OrganizerProvider');
  }
  return context;
};
