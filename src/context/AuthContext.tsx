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
  signIn: (data: SignInData) => Promise<{ success: boolean; user?: AuthUser; error?: string; isUnverified?: boolean }>;
  signInAttendee: (data: { email: string; password: string }) => Promise<{ success: boolean; user?: AuthUser; error?: string; isUnverified?: boolean }>;
  signInOrganizer: (data: { email: string; password: string }) => Promise<{ success: boolean; user?: AuthUser; error?: string; isUnverified?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
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
    supabaseUser: User
  ): Promise<{
    authUser: AuthUser;
    type: AccountType;
    attProfile: AttendeeProfile | null;
    orgProfile: OrganizerProfile | null;
  }> => {
    let determinedType: AccountType = 'ATTENDEE';
    let fullName = (supabaseUser.user_metadata?.full_name as string) || '';
    let phoneNumber = (supabaseUser.user_metadata?.phone_number as string) || '';
    let attProfile: AttendeeProfile | null = null;
    let orgProfile: OrganizerProfile | null = null;

    // First check user metadata
    const metaAccountType = (supabaseUser.user_metadata?.account_type || supabaseUser.user_metadata?.role) as string;
    if (metaAccountType && ['ORGANIZER', 'ADMIN'].includes(metaAccountType.toUpperCase())) {
      determinedType = metaAccountType.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'ORGANIZER';
    }

    if (isSupabaseConfigured) {
      try {
        // 1. Query public.account_types
        const { data: accountTypeData } = await supabase
          .from('account_types')
          .select('account_type')
          .eq('user_id', supabaseUser.id)
          .maybeSingle();

        if (accountTypeData?.account_type) {
          determinedType = accountTypeData.account_type as AccountType;
        }

        // 2. Fetch appropriate profile table
        if (determinedType === 'ORGANIZER' || determinedType === 'ADMIN') {
          const { data: orgData } = await supabase
            .from('organizer_profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .maybeSingle();

          if (orgData) {
            orgProfile = orgData as OrganizerProfile;
            fullName = orgData.full_name || fullName;
            phoneNumber = orgData.phone_number || phoneNumber;
          } else {
            // Check legacy profiles if organizer_profiles not yet migrated
            const { data: legacyProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', supabaseUser.id)
              .maybeSingle();

            if (legacyProfile && ['ORGANIZER', 'ADMIN', 'STAFF'].includes(legacyProfile.role)) {
              fullName = legacyProfile.full_name || fullName;
              phoneNumber = legacyProfile.phone_number || phoneNumber;
              determinedType = legacyProfile.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER';
            }

            // Sync organizer_profiles now that we have session
            try {
              await supabase.from('organizer_profiles').upsert(
                {
                  id: supabaseUser.id,
                  full_name: fullName || 'Ticketa Organizer',
                  email: supabaseUser.email?.trim().toLowerCase() || '',
                  phone_number: phoneNumber || null,
                  country: 'NG',
                  onboarding_completed: true,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
            } catch (e) {}
          }

          // Ensure account_types row exists
          if (!accountTypeData) {
            try {
              await supabase.from('account_types').upsert(
                {
                  user_id: supabaseUser.id,
                  account_type: 'ORGANIZER',
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );
            } catch (e) {}
          }

          // Ensure profiles row exists
          try {
            await supabase.from('profiles').upsert(
              {
                id: supabaseUser.id,
                full_name: fullName || 'Ticketa Organizer',
                email: supabaseUser.email?.trim().toLowerCase() || '',
                phone_number: phoneNumber || null,
                role: determinedType === 'ADMIN' ? 'ADMIN' : 'ORGANIZER',
                is_email_verified: Boolean(supabaseUser.email_confirmed_at),
              },
              { onConflict: 'id' }
            );
          } catch (e) {}
        } else {
          // Attendee
          const { data: attData } = await supabase
            .from('attendee_profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .maybeSingle();

          if (attData) {
            attProfile = attData as AttendeeProfile;
            fullName = attData.full_name || fullName;
            phoneNumber = attData.phone_number || phoneNumber;

            // Sync email verification if confirmed in auth
            if (supabaseUser.email_confirmed_at && !attData.is_email_verified) {
              await supabase
                .from('attendee_profiles')
                .update({ is_email_verified: true, updated_at: new Date().toISOString() })
                .eq('id', supabaseUser.id);
            }
          } else {
            // Check legacy profiles if attendee_profiles not yet populated
            const { data: legacyProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', supabaseUser.id)
              .maybeSingle();

            if (legacyProfile) {
              fullName = legacyProfile.full_name || fullName;
              phoneNumber = legacyProfile.phone_number || phoneNumber;
            }

            // Sync attendee_profiles now that we have session
            try {
              await supabase.from('attendee_profiles').upsert(
                {
                  id: supabaseUser.id,
                  full_name: fullName || 'Ticketa Attendee',
                  email: supabaseUser.email?.trim().toLowerCase() || '',
                  phone_number: phoneNumber || null,
                  is_email_verified: Boolean(supabaseUser.email_confirmed_at),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
            } catch (e) {}
          }

          // Ensure account_types row exists
          if (!accountTypeData) {
            try {
              await supabase.from('account_types').upsert(
                {
                  user_id: supabaseUser.id,
                  account_type: 'ATTENDEE',
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );
            } catch (e) {}
          }

          // Ensure profiles row exists
          try {
            await supabase.from('profiles').upsert(
              {
                id: supabaseUser.id,
                full_name: fullName || 'Ticketa Attendee',
                email: supabaseUser.email?.trim().toLowerCase() || '',
                phone_number: phoneNumber || null,
                role: 'ATTENDEE',
                is_email_verified: Boolean(supabaseUser.email_confirmed_at),
              },
              { onConflict: 'id' }
            );
          } catch (e) {}
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
            if (currentSession?.user) {
              const isConfirmed = Boolean(
                currentSession.user.email_confirmed_at || (currentSession.user as any).confirmed_at
              );

              // If unverified and not currently completing an auth callback, block session
              if (!isConfirmed && !isAuthCallback) {
                try {
                  await supabase.auth.signOut();
                } catch (e) {}
                setSession(null);
                setUser(null);
                setAccountType(null);
                setAttendeeProfile(null);
                setOrganizerProfile(null);
              } else {
                setSession(currentSession);
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
            } else {
              setSession(null);
              setUser(null);
              setAccountType(null);
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

        if (newSession?.user) {
          const isConfirmed = Boolean(
            newSession.user.email_confirmed_at || (newSession.user as any).confirmed_at
          );

          const href = window.location.href;
          const isCallback =
            href.includes('type=signup') ||
            href.includes('/auth/callback') ||
            href.includes('/callback') ||
            href.includes('code=');

          if (!isConfirmed && !isCallback) {
            // Unconfirmed session detected - clear active state
            setSession(null);
            setUser(null);
            setAccountType(null);
            setAttendeeProfile(null);
            setOrganizerProfile(null);
            setLoading(false);
            return;
          }

          setSession(newSession);
          const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(newSession.user);
          setUser(authUser);
          setAccountType(type);
          setAttendeeProfile(attProfile);
          setOrganizerProfile(orgProfile);

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (isCallback) {
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
          setSession(null);
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
          'Supabase database is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel or your .env file.',
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
        // 1. Insert into public.account_types
        await supabase.from('account_types').upsert({
          user_id: data.user.id,
          account_type: 'ATTENDEE',
          updated_at: new Date().toISOString(),
        });

        // 2. Insert into public.attendee_profiles
        await supabase.from('attendee_profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim() || null,
          is_email_verified: Boolean(data.user.email_confirmed_at),
          updated_at: new Date().toISOString(),
        });

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

        const isEmailConfirmed = Boolean(data.user.email_confirmed_at || (data.user as any).confirmed_at);

        if (!isEmailConfirmed) {
          // Explicitly clear session and sign out unverified user to enforce email confirmation
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          setSession(null);
          setUser(null);
          setAccountType(null);
          setAttendeeProfile(null);
          setOrganizerProfile(null);

          return {
            success: true,
            requiresEmailVerification: true,
          };
        }

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          accountType: 'ATTENDEE',
          role: 'ATTENDEE',
          isEmailVerified: true,
        };

        if (data.session) {
          setSession(data.session);
          setUser(authUser);
          setAccountType('ATTENDEE');
        }

        return {
          success: true,
          requiresEmailVerification: false,
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
          'Supabase database is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel or your .env file.',
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
        // 1. Insert into public.account_types
        await supabase.from('account_types').upsert({
          user_id: data.user.id,
          account_type: 'ORGANIZER',
          updated_at: new Date().toISOString(),
        });

        // 2. Insert into public.organizer_profiles
        await supabase.from('organizer_profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim() || null,
          updated_at: new Date().toISOString(),
        });

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

        const isEmailConfirmed = Boolean(data.user.email_confirmed_at || (data.user as any).confirmed_at);

        if (!isEmailConfirmed) {
          // Explicitly clear session and sign out unverified user to enforce email confirmation
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          setSession(null);
          setUser(null);
          setAccountType(null);
          setAttendeeProfile(null);
          setOrganizerProfile(null);

          return {
            success: true,
            requiresEmailVerification: true,
          };
        }

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          accountType: 'ORGANIZER',
          role: 'ORGANIZER',
          isEmailVerified: true,
        };

        if (data.session) {
          setSession(data.session);
          setUser(authUser);
          setAccountType('ORGANIZER');
        }

        return {
          success: true,
          user: authUser,
          requiresEmailVerification: false,
        };
      }

      return { success: false, error: 'Failed to create organizer account.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
  };

  // 3. ATTENDEE SIGNIN (STRICT ISOLATION & VERIFICATION CHECK)
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
        if (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not confirmed') ||
          error.message.toLowerCase().includes('unconfirmed') ||
          error.message.toLowerCase().includes('not verified')
        ) {
          return {
            success: false,
            error: 'Your email address has not been verified yet. Please check your inbox (and spam folder) for the verification link before logging in.',
            isUnverified: true,
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const isConfirmed = Boolean(data.user.email_confirmed_at || (data.user as any).confirmed_at);
        if (!isConfirmed) {
          // Force sign out and block login
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          setUser(null);
          setSession(null);
          setAccountType(null);
          setAttendeeProfile(null);
          setOrganizerProfile(null);
          return {
            success: false,
            error: 'Your email address has not been verified yet. Please check your inbox (and spam folder) for the verification link before logging in.',
            isUnverified: true,
          };
        }

        // Strict portal isolation validation
        const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(data.user);

        if (type === 'ORGANIZER' || type === 'ADMIN') {
          // BLOCK LOGIN FLOW & SIGN OUT IMMEDIATELY
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setAccountType(null);
          return {
            success: false,
            error: 'This account is registered as an organizer. Please use the Organizer Login.',
          };
        }

        // Valid Attendee
        setUser(authUser);
        setSession(data.session);
        setAccountType('ATTENDEE');
        setAttendeeProfile(attProfile);
        setOrganizerProfile(null);
        return { success: true, user: authUser };
      }

      return { success: false, error: 'Invalid login response.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Could not sign in.' };
    }
  };

  // 4. ORGANIZER SIGNIN (STRICT ISOLATION & VERIFICATION CHECK)
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
        if (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not confirmed') ||
          error.message.toLowerCase().includes('unconfirmed') ||
          error.message.toLowerCase().includes('not verified')
        ) {
          return {
            success: false,
            error: 'Your organizer email address has not been verified yet. Please check your inbox (and spam folder) for the verification link before logging in.',
            isUnverified: true,
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const isConfirmed = Boolean(data.user.email_confirmed_at || (data.user as any).confirmed_at);
        if (!isConfirmed) {
          // Force sign out and block login
          try {
            await supabase.auth.signOut();
          } catch (e) {}
          setUser(null);
          setSession(null);
          setAccountType(null);
          setAttendeeProfile(null);
          setOrganizerProfile(null);
          return {
            success: false,
            error: 'Your organizer email address has not been verified yet. Please check your inbox (and spam folder) for the verification link before logging in.',
            isUnverified: true,
          };
        }

        // Strict portal isolation validation
        const { authUser, type, attProfile, orgProfile } = await fetchUserAccountAndProfiles(data.user);

        if (type === 'ATTENDEE') {
          // BLOCK LOGIN FLOW & SIGN OUT IMMEDIATELY
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setAccountType(null);
          return {
            success: false,
            error: 'This account is registered as an attendee. Please use the Attendee Login.',
          };
        }

        // Valid Organizer / Admin
        setUser(authUser);
        setSession(data.session);
        setAccountType(type);
        setAttendeeProfile(null);
        setOrganizerProfile(orgProfile);
        return { success: true, user: authUser };
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
  const resendVerificationEmail = async (email: string, redirectTo: string = '/') => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }

    if (isSupabaseConfigured) {
      try {
        const redirectUrl = redirectTo.startsWith('http')
          ? redirectTo
          : `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
          options: {
            emailRedirectTo: redirectUrl,
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
