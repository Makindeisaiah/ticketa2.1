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
      let fetchedOrgs: Organization[] = [];
      const roles: Record<string, OrgMemberRole> = {};

      if (isSupabaseConfigured) {
        try {
          // Fetch user profile from public.organizer_profiles or public.profiles
          const { data: orgProfData } = await supabase
            .from('organizer_profiles')
            .select('*')
            .eq('id', targetUserId)
            .maybeSingle();

          if (orgProfData) {
            setProfile({
              id: orgProfData.id,
              full_name: orgProfData.full_name,
              email: orgProfData.email,
              phone_number: orgProfData.phone_number,
              avatar_url: orgProfData.avatar_url,
              role: 'ORGANIZER',
              is_email_verified: true,
              created_at: orgProfData.created_at,
              updated_at: orgProfData.updated_at,
            });
          } else {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', targetUserId)
              .maybeSingle();

            if (profileData) {
              setProfile(profileData as Profile);
            }
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

          const orgsMap = new Map<string, Organization>();

          (createdOrgs || []).forEach((org: Organization) => {
            if (org && org.id) {
              orgsMap.set(org.id, org);
              roles[org.id] = 'OWNER';
            }
          });

          (memberRows || []).forEach((row: any) => {
            if (row && row.organizations && row.organizations.id) {
              orgsMap.set(row.organizations.id, row.organizations);
              roles[row.organizations.id] = row.role || 'MEMBER';
            }
          });

          fetchedOrgs = Array.from(orgsMap.values());
        } catch (dbErr) {
          console.warn('Database organization query notice:', dbErr);
        }
      }

      // Read local storage saved organizations
      const localKey = `organizer_local_orgs_${targetUserId}`;
      let localOrgs: Organization[] = [];
      try {
        const stored = localStorage.getItem(localKey);
        if (stored) {
          localOrgs = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading local orgs:', e);
      }

      // Combine fetched database orgs and local storage orgs
      const combinedMap = new Map<string, Organization>();
      fetchedOrgs.forEach((o) => combinedMap.set(o.id, o));
      localOrgs.forEach((o) => combinedMap.set(o.id, o));

      let allOrgs = Array.from(combinedMap.values());

      // Guarantee at least one default organization for every logged in user
      if (allOrgs.length === 0) {
        let defaultName = 'My Organization';
        try {
          const userEmail = authUser?.email || '';
          const pendingKey = `pending_organizer_${userEmail.trim().toLowerCase()}`;
          const pendingRaw = localStorage.getItem(pendingKey);
          if (pendingRaw) {
            const pending = JSON.parse(pendingRaw);
            if (pending.orgName) defaultName = pending.orgName;
          } else if (userEmail) {
            const namePart = userEmail.split('@')[0];
            defaultName = `${namePart.charAt(0).toUpperCase() + namePart.slice(1)}'s Organization`;
          }
        } catch (e) {
          // ignore parsing error
        }

        const defaultOrg: Organization = {
          id: `org_default_${targetUserId}`,
          name: defaultName,
          type: 'AGENCY',
          country: 'Nigeria',
          created_by: targetUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        allOrgs = [defaultOrg];
        try {
          localStorage.setItem(localKey, JSON.stringify([defaultOrg]));
        } catch (e) {
          console.error('Error storing default org:', e);
        }
      }

      allOrgs.forEach((o) => {
        if (!roles[o.id]) roles[o.id] = 'OWNER';
      });

      setOrganizations(allOrgs);
      setRolesMap(roles);

      const currentActiveId = activeOrg?.id;
      const matched = allOrgs.find((o) => o.id === currentActiveId) || allOrgs[0];
      setActiveOrg(matched);
      setActiveRole(roles[matched.id] || 'OWNER');
    } catch (err: any) {
      console.error('Error loading organizer context:', err);
      setError(err.message || 'Failed to load organization context.');
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id, authUser?.email, activeOrg?.id]);

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
