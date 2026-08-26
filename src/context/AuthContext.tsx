import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser, AccountType, AttendeeProfile, OrganizerProfile } from '../types';

export interface SignUpAttendeeData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: 'ATTENDEE';
  redirectTo?: string;
}

export interface SignUpOrganizerData {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: 'ORGANIZER';
  redirectTo?: string;
}

export interface SignInData {
  email: string;
  password: string;
  targetPortal?: 'ATTENDEE' | 'ORGANIZER';
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  accountType: AccountType | null;
  attendeeProfile: AttendeeProfile | null;
  organizerProfile: OrganizerProfile | null;
  loading: boolean;
  isConfigured: boolean;
  authNotification: { type: 'success' | 'info' | 'error'; message: string } | null;
  clearAuthNotification: () => void;
  signUpAttendee: (data: SignUpAttendeeData) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>;
  signUpOrganizer: (data: SignUpOrganizerData) => Promise<{ success: boolean; requiresEmailVerification?: boolean; user?: AuthUser; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signInAttendee: (data: { email: string; password: string }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signInOrganizer: (data: { email: string; password: string }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [attendeeProfile, setAttendeeProfile] = useState<AttendeeProfile | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authNotification, setAuthNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const clearAuthNotification = () => setAuthNotification(null);

  // Helper to determine and load account type & profile
  const fetchUserAccountAndProfiles = async (
    supabaseUser: User,
    preferredPortal?: 'ATTENDEE' | 'ORGANIZER'
  ): Promise<{
    authUser: AuthUser;
    type: AccountType;
    attProfile: AttendeeProfile | null;
    orgProfile: OrganizerProfile | null;
  }> => {
    let determinedType: AccountType = preferredPortal || 'ATTENDEE';
    let fullName = (supabaseUser.user_metadata?.full_name as string) || '';
    let phoneNumber = (supabaseUser.user_metadata?.phone_number as string) || '';
    let attProfile: AttendeeProfile | null = null;
    let orgProfile: OrganizerProfile | null = null;

    if (isSupabaseConfigured) {
      try {
        // Query account_types and both profile tables in parallel
        const [{ data: accountTypeData }, { data: attData }, { data: orgData }] = await Promise.all([
          supabase.from('account_types').select('account_type').eq('user_id', supabaseUser.id).maybeSingle(),
          supabase.from('attendee_profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
          supabase.from('organizer_profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
        ]);

        if (attData) {
          attProfile = attData as AttendeeProfile;
          if (attData.full_name) fullName = attData.full_name;
          if (attData.phone_number) phoneNumber = attData.phone_number;
        }

        if (orgData) {
          orgProfile = orgData as OrganizerProfile;
          if (!fullName && orgData.full_name) fullName = orgData.full_name;
          if (!phoneNumber && orgData.phone_number) phoneNumber = orgData.phone_number;
        }

        if (accountTypeData?.account_type) {
          determinedType = accountTypeData.account_type as AccountType;
        } else if (orgData && !attData) {
          determinedType = 'ORGANIZER';
        } else if (attData && !orgData) {
          determinedType = 'ATTENDEE';
        } else if (preferredPortal) {
          determinedType = preferredPortal;
        } else {
          // Check metadata as last resort
          const metaAccountType = (supabaseUser.user_metadata?.account_type || supabaseUser.user_metadata?.role) as string;
          if (metaAccountType && ['ORGANIZER', 'ADMIN'].includes(metaAccountType.toUpperCase())) {
            determinedType = metaAccountType.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'ORGANIZER';
          } else {
            determinedType = 'ATTENDEE';
          }
        }
      } catch (e) {
        console.warn('Account type/profile fetch notice:', e);
      }
    }

    if (!fullName) {
      fullName = determinedType === 'ORGANIZER' ? 'Ticketa Organizer' : 'Ticketa Attendee';
    }

    const authUser: AuthUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName,
      phoneNumber,
      accountType: determinedType,
      role: determinedType === 'ORGANIZER' ? 'ORGANIZER' : determinedType === 'ADMIN' ? 'ADMIN' : 'ATTENDEE',
      isEmailVerified: Boolean(supabaseUser.email_confirmed_at),
    };

    return { authUser, type: determinedType, attProfile, orgProfile };
  };

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(session.user);
      setUser(authUser);
      setAccountType(type);
      setAttendeeProfile(attProfile);
      setOrganizerProfile(orgProfile);
    }
  }, [session?.user]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const href = window.location.href;
      const isAuthCallback =
        href.includes('type=signup') ||
        href.includes('type=recovery') ||
        href.includes('/auth/callback') ||
        href.includes('/callback') ||
        href.includes('access_token=') ||
        href.includes('code=');

      if (href.includes('error_description=') || href.includes('error=')) {
        const match = href.match(/error_description=([^&]+)/);
        const errorMsg = match
          ? decodeURIComponent(match[1].replace(/\+/g, ' '))
          : 'Email verification failed or link expired.';
        setAuthNotification({
          type: 'error',
          message: errorMsg,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (isSupabaseConfigured) {
        try {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (mounted) {
            setSession(currentSession);
            if (currentSession?.user) {
              const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(
                currentSession.user
              );
              setUser(authUser);
              setAccountType(type);
              setAttendeeProfile(attProfile);
              setOrganizerProfile(orgProfile);

              if (isAuthCallback) {
                let destination = type === 'ORGANIZER' ? '/organizer' : '/';
                try {
                  const urlObj = new URL(href);
                  const redirectParam = urlObj.searchParams.get('redirect');
                  if (redirectParam) {
                    destination = redirectParam;
                  } else if (type === 'ORGANIZER' || href.includes('/organizer')) {
                    destination = '/organizer';
                  }
                } catch (e) {}

                if (href.includes('type=recovery')) {
                  setAuthNotification({
                    type: 'info',
                    message: 'Authenticated via password reset link. Please update your password below.',
                  });
                } else {
                  setAuthNotification({
                    type: 'success',
                    message: 'Your email address has been verified successfully! You are now logged in.',
                  });
                }

                window.history.replaceState({}, document.title, destination);
                window.dispatchEvent(new Event('popstate'));
              }
            }
          }
        } catch (e) {
          console.error('Error loading session:', e);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth State Changes
    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.user) {
          const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(newSession.user);
          setUser(authUser);
          setAccountType(type);
          setAttendeeProfile(attProfile);
          setOrganizerProfile(orgProfile);

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const href = window.location.href;
            if (
              href.includes('type=signup') ||
              href.includes('/auth/callback') ||
              href.includes('/callback') ||
              href.includes('code=')
            ) {
              let destination = type === 'ORGANIZER' ? '/organizer' : '/';
              try {
                const urlObj = new URL(href);
                const redirectParam = urlObj.searchParams.get('redirect');
                if (redirectParam) {
                  destination = redirectParam;
                } else if (type === 'ORGANIZER' || href.includes('/organizer')) {
                  destination = '/organizer';
                }
              } catch (e) {}

              setAuthNotification({
                type: 'success',
                message: 'Your email address has been verified successfully! Welcome to Ticketa.',
              });
              window.history.replaceState({}, document.title, destination);
              window.dispatchEvent(new Event('popstate'));
            } else if (href.includes('type=recovery')) {
              setAuthNotification({
                type: 'info',
                message: 'Authenticated via password reset link. Please update your password.',
              });
              window.history.replaceState({}, document.title, '/');
              window.dispatchEvent(new Event('popstate'));
            }
          }
        } else {
          setUser(null);
          setAccountType(null);
          setAttendeeProfile(null);
          setOrganizerProfile(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  // 1. ATTENDEE SIGNUP FLOW
  const signUpAttendee = async ({
    fullName,
    email,
    phoneNumber,
    password,
    redirectTo = '/',
  }: SignUpAttendeeData) => {
    if (!fullName.trim() || !email.trim() || !password) {
      return { success: false, error: 'Full name, email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error:
          'Supabase database is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
      };
    }

    try {
      const redirectUrl = redirectTo.startsWith('http')
        ? redirectTo
        : `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
            account_type: 'ATTENDEE',
            role: 'ATTENDEE',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Crucial Check: If the user already existed in Supabase auth, identities array is empty!
        if (data.user.identities && data.user.identities.length === 0) {
          return {
            success: false,
            error: 'An account with this email address already exists. Please sign in with your password, or use "Forgot Password".',
          };
        }

        // 1. Insert into public.account_types
        try {
          await supabase.from('account_types').upsert({
            user_id: data.user.id,
            account_type: 'ATTENDEE',
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}

        // 2. Insert into public.attendee_profiles
        try {
          await supabase.from('attendee_profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone_number: phoneNumber.trim() || null,
            is_email_verified: Boolean(data.user.email_confirmed_at),
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}

        // 3. Sync public.profiles for backward compatibility
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone_number: phoneNumber.trim() || null,
            role: 'ATTENDEE',
            is_email_verified: Boolean(data.user.email_confirmed_at),
          });
        } catch (e) {}

        const isEmailConfirmed = Boolean(data.user.email_confirmed_at);
        const hasSession = Boolean(data.session);
        const requiresVerification = !isEmailConfirmed && !hasSession;

        if (requiresVerification) {
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          setUser(null);
          setSession(null);
          setAccountType(null);
        } else if (data.session) {
          setSession(data.session);
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            accountType: 'ATTENDEE',
            role: 'ATTENDEE',
            isEmailVerified: true,
          });
          setAccountType('ATTENDEE');
        }

        return {
          success: true,
          requiresEmailVerification: requiresVerification,
        };
      }

      return { success: false, error: 'Failed to create attendee account.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
  };

  // 2. ORGANIZER SIGNUP FLOW
  const signUpOrganizer = async ({
    fullName,
    email,
    phoneNumber = '',
    password,
    redirectTo = '/organizer',
  }: SignUpOrganizerData) => {
    if (!fullName.trim() || !email.trim() || !password) {
      return { success: false, error: 'Full name, email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error:
          'Supabase database is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
      };
    }

    try {
      const redirectUrl = redirectTo.startsWith('http')
        ? redirectTo
        : `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
            account_type: 'ORGANIZER',
            role: 'ORGANIZER',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Crucial Check: If the user already existed in Supabase auth, identities array is empty!
        if (data.user.identities && data.user.identities.length === 0) {
          return {
            success: false,
            error: 'An account with this email address already exists. Please sign in with your password, or use "Forgot Password".',
          };
        }

        // 1. Insert into public.account_types
        try {
          await supabase.from('account_types').upsert({
            user_id: data.user.id,
            account_type: 'ORGANIZER',
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}

        // 2. Insert into public.organizer_profiles
        try {
          await supabase.from('organizer_profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone_number: phoneNumber.trim() || null,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}

        // 3. Sync public.profiles for backward compatibility
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone_number: phoneNumber.trim() || null,
            role: 'ORGANIZER',
            is_email_verified: Boolean(data.user.email_confirmed_at),
          });
        } catch (e) {}

        // 4. Create initial organization in public.organizations and public.organization_members
        try {
          const orgName = `${fullName.trim()}'s Organization`;
          const baseSlug = (fullName || 'organization')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'org';
          const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

          const { data: newOrg } = await supabase
            .from('organizations')
            .insert({
              name: orgName,
              slug: uniqueSlug,
              type: 'INDIVIDUAL',
              country: 'Nigeria',
              phone_number: phoneNumber.trim() || null,
              created_by: data.user.id,
            })
            .select()
            .single();

          if (newOrg?.id) {
            await supabase.from('organization_members').insert({
              organization_id: newOrg.id,
              user_id: data.user.id,
              role: 'OWNER',
            });
          }
        } catch (e) {
          console.warn('Initial organization setup notice during sign-up:', e);
        }

        const isEmailConfirmed = Boolean(data.user.email_confirmed_at);
        const hasSession = Boolean(data.session);
        const requiresVerification = !isEmailConfirmed && !hasSession;

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          accountType: 'ORGANIZER',
          role: 'ORGANIZER',
          isEmailVerified: isEmailConfirmed,
        };

        if (requiresVerification) {
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          setUser(null);
          setSession(null);
          setAccountType(null);
        } else if (data.session) {
          setSession(data.session);
          setUser(authUser);
          setAccountType('ORGANIZER');
        }

        return {
          success: true,
          user: authUser,
          requiresEmailVerification: requiresVerification,
        };
      }

      return { success: false, error: 'Failed to create organizer account.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
  };

  // 3. ATTENDEE SIGNIN
  const signInAttendee = async ({ email, password }: { email: string; password: string }) => {
    if (!email.trim() || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase database is not configured.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Email not confirmed. Please check your inbox and verify your email address before signing in.',
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Enforce email verification check only if session is missing
        if (!data.session && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setAccountType(null);
          return {
            success: false,
            error: 'Email not confirmed. Please check your inbox and verify your email address before signing in.',
          };
        }

        // Fetch user account and profiles with preferredPortal 'ATTENDEE'
        const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(data.user, 'ATTENDEE');

        // Ensure attendee_profile exists in database
        if (!attProfile) {
          try {
            await supabase.from('attendee_profiles').upsert(
              {
                id: data.user.id,
                full_name: authUser.fullName || (data.user.user_metadata?.full_name as string) || 'Ticketa Attendee',
                email: data.user.email || email.trim().toLowerCase(),
                phone_number: authUser.phoneNumber || (data.user.user_metadata?.phone_number as string) || null,
                is_email_verified: Boolean(data.user.email_confirmed_at),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          } catch (e) {}
        }

        // If database account_types was missing, set it as ATTENDEE
        try {
          const { data: existingType } = await supabase
            .from('account_types')
            .select('account_type')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!existingType) {
            await supabase.from('account_types').upsert(
              {
                user_id: data.user.id,
                account_type: 'ATTENDEE',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
            await supabase.auth.updateUser({
              data: {
                account_type: 'ATTENDEE',
                role: 'ATTENDEE',
              },
            });
          }
        } catch (e) {}

        // Valid Sign In
        setUser(authUser);
        setSession(data.session);
        setAccountType(type);
        setAttendeeProfile(attProfile);
        setOrganizerProfile(orgProfile);
        return { success: true, user: authUser };
      }

      return { success: false, error: 'Invalid login response.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Could not sign in.' };
    }
  };

  // 4. ORGANIZER SIGNIN
  const signInOrganizer = async ({ email, password }: { email: string; password: string }) => {
    if (!email.trim() || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase database is not configured.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Email not confirmed. Please check your inbox and verify your email address before signing in.',
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (!data.session && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setAccountType(null);
          return {
            success: false,
            error: 'Email not confirmed. Please check your inbox and verify your email address before signing in.',
          };
        }

        // Fetch user account and profiles with preferredPortal 'ORGANIZER'
        const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(data.user, 'ORGANIZER');

        // Ensure organizer_profiles exists
        if (!orgProfile) {
          try {
            await supabase.from('organizer_profiles').upsert(
              {
                id: data.user.id,
                full_name: authUser.fullName || (data.user.user_metadata?.full_name as string) || 'Ticketa Organizer',
                email: data.user.email || email.trim().toLowerCase(),
                phone_number: authUser.phoneNumber || (data.user.user_metadata?.phone_number as string) || null,
                country: 'NG',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          } catch (e) {}
        }

        // Ensure account_types is set to ORGANIZER
        try {
          await supabase.from('account_types').upsert(
            {
              user_id: data.user.id,
              account_type: 'ORGANIZER',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
          await supabase.auth.updateUser({
            data: {
              account_type: 'ORGANIZER',
              role: 'ORGANIZER',
            },
          });
        } catch (e) {}

        const finalUser: AuthUser = {
          ...authUser,
          accountType: 'ORGANIZER',
          role: authUser.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER',
        };

        setUser(finalUser);
        setSession(data.session);
        setAccountType('ORGANIZER');
        setAttendeeProfile(attProfile);
        setOrganizerProfile(orgProfile);
        return { success: true, user: finalUser };
      }

      return { success: false, error: 'Invalid login response.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Could not sign in.' };
    }
  };

  // 5. GENERIC SIGN IN (DISPATCHES OR PERFORMS TARGET CHECK)
  const signIn = async ({ email, password, targetPortal }: SignInData) => {
    if (targetPortal === 'ATTENDEE') {
      return signInAttendee({ email, password });
    }
    if (targetPortal === 'ORGANIZER') {
      return signInOrganizer({ email, password });
    }

    // Default: detect portal from path if possible
    if (window.location.pathname.startsWith('/organizer')) {
      return signInOrganizer({ email, password });
    }
    return signInAttendee({ email, password });
  };

  // 6. SIGNOUT
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    setSession(null);
    setAccountType(null);
    setAttendeeProfile(null);
    setOrganizerProfile(null);
  };

  // 7. PASSWORD RESET
  const resetPassword = async (email: string) => {
    if (!email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to send reset link.' };
      }
    } else {
      return { success: true };
    }
  };

  // 8. UPDATE PASSWORD
  const updatePassword = async (password: string) => {
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to update password.' };
      }
    } else {
      return { success: true };
    }
  };

  // 9. RESEND VERIFICATION EMAIL
  const resendVerificationEmail = async (email: string) => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to resend verification email.' };
      }
    } else {
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        accountType,
        attendeeProfile,
        organizerProfile,
        loading,
        isConfigured: isSupabaseConfigured,
        authNotification,
        clearAuthNotification,
        signUpAttendee,
        signUpOrganizer,
        signIn,
        signInAttendee,
        signInOrganizer,
        signOut,
        resetPassword,
        updatePassword,
        resendVerificationEmail,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
