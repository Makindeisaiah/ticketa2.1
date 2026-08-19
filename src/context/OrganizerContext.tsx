import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Organization, OrgMemberRole, Profile } from '../types/database';
import { createOrganization } from '../organizer/services/organizerService';

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

export const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
};

export const OrganizerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [activeRole, setActiveRole] = useState<OrgMemberRole | null>(null);
  const [rolesMap, setRolesMap] = useState<Record<string, OrgMemberRole>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrgIdRef = React.useRef<string | null>(null);

  // Sync ref when activeOrg changes
  useEffect(() => {
    activeOrgIdRef.current = activeOrg?.id || null;
  }, [activeOrg?.id]);

  const refreshOrganizations = useCallback(async (overrideUserId?: string) => {
    const targetUserId = overrideUserId || authUser?.id;
    if (!targetUserId || !isValidUUID(targetUserId)) {
      setOrganizations([]);
      setActiveOrg(null);
      setActiveRole(null);
      setRolesMap({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Clean up any stale invalid localStorage entries from past sessions
    try {
      const localKey = `organizer_local_orgs_${targetUserId}`;
      localStorage.removeItem(localKey);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('organizer_local_orgs_')) {
          const val = localStorage.getItem(key);
          if (val && (val.includes('org_default_') || val.includes('org_local_'))) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      // ignore localStorage cleanup errors
    }

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

          let organizerName = authUser?.fullName || '';

          if (orgProfData) {
            organizerName = orgProfData.full_name || organizerName;
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
              organizerName = profileData.full_name || organizerName;
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
            .select('organization_id, role')
            .eq('user_id', targetUserId);

          const memberOrgIds = (memberRows || [])
            .map((r: any) => r.organization_id)
            .filter(isValidUUID);

          let memberOrgs: Organization[] = [];
          if (memberOrgIds.length > 0) {
            const { data: orgsData } = await supabase
              .from('organizations')
              .select('*')
              .in('id', memberOrgIds);
            if (orgsData) {
              memberOrgs = orgsData;
            }
          }

          const orgsMap = new Map<string, Organization>();

          (createdOrgs || []).forEach((org: Organization) => {
            if (org && org.id && isValidUUID(org.id)) {
              orgsMap.set(org.id, org);
              roles[org.id] = 'OWNER';
              const hasMemberRow = (memberRows || []).some((m: any) => m.organization_id === org.id);
              if (!hasMemberRow) {
                try {
                  supabase
                    .from('organization_members')
                    .insert({
                      organization_id: org.id,
                      user_id: targetUserId,
                      role: 'OWNER',
                    })
                    .then(() => {}, () => {});
                } catch (e) {
                  // ignore
                }
              }
            }
          });

          (memberRows || []).forEach((row: any) => {
            const org = memberOrgs.find((o) => o.id === row.organization_id);
            if (org && org.id && isValidUUID(org.id)) {
              orgsMap.set(org.id, org);
              roles[org.id] = row.role || 'MEMBER';
            }
          });

          fetchedOrgs = Array.from(orgsMap.values());

          // If organizer has no organizations yet, create one using pending data or default
          if (fetchedOrgs.length === 0) {
            const userEmail = authUser?.email || '';
            const pendingKey = `pending_organizer_${userEmail.trim().toLowerCase()}`;
            const pendingRaw = localStorage.getItem(pendingKey);
            let orgName = organizerName ? `${organizerName}'s Organization` : 'My Organization';
            let orgType: any = 'INDIVIDUAL';
            let orgCountry = 'Nigeria';
            let orgPhone = authUser?.phoneNumber || '';

            if (pendingRaw) {
              try {
                const pending = JSON.parse(pendingRaw);
                if (pending.orgName) orgName = pending.orgName;
                if (pending.orgType) {
                  orgType = pending.orgType === 'Event Agency' ? 'AGENCY' : pending.orgType === 'Registered Business' ? 'BUSINESS' : 'INDIVIDUAL';
                }
                if (pending.country) orgCountry = pending.country;
                if (pending.phoneNumber) orgPhone = pending.phoneNumber;
              } catch (parseErr) {
                console.warn('Pending organization parse error:', parseErr);
              }
            }

            try {
              const createdResult = await createOrganization(targetUserId, {
                name: orgName,
                type: orgType,
                country: orgCountry,
                phone_number: orgPhone,
              });

              if (createdResult.success && createdResult.organization && isValidUUID(createdResult.organization.id)) {
                fetchedOrgs = [createdResult.organization];
                roles[createdResult.organization.id] = 'OWNER';
                if (pendingRaw) {
                  localStorage.removeItem(pendingKey);
                }
              }
            } catch (createErr) {
              console.error('Failed to auto-provision organizer organization:', createErr);
            }
          }
        } catch (dbErr) {
          console.warn('Database organization query notice:', dbErr);
        }
      }

      // Filter to only genuine UUID organizations
      const validOrgs = fetchedOrgs.filter((o) => o && isValidUUID(o.id));

      validOrgs.forEach((o) => {
        if (!roles[o.id]) roles[o.id] = 'OWNER';
      });

      setOrganizations(validOrgs);
      setRolesMap(roles);

      const currentActiveId = activeOrgIdRef.current;
      const matched = (currentActiveId && isValidUUID(currentActiveId) ? validOrgs.find((o) => o.id === currentActiveId) : null) || validOrgs[0] || null;
      setActiveOrg(matched);
      activeOrgIdRef.current = matched?.id || null;
      setActiveRole(matched ? (roles[matched.id] || 'OWNER') : null);
    } catch (err: any) {
      console.error('Error loading organizer context:', err);
      setError(err.message || 'Failed to load organization context.');
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id, authUser?.email, authUser?.fullName]);

  useEffect(() => {
    if (!authLoading && authUser?.id) {
      refreshOrganizations();
    } else if (!authLoading && !authUser) {
      setIsLoading(false);
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
