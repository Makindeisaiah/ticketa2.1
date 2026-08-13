import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser } from '../types';

interface SignUpData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  authNotification: { type: 'success' | 'info' | 'error'; message: string } | null;
  clearAuthNotification: () => void;
  signUpAttendee: (data: SignUpData) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authNotification, setAuthNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const clearAuthNotification = () => setAuthNotification(null);

  // Helper to fetch profile from public.profiles
  const fetchUserProfile = async (supabaseUser: User): Promise<AuthUser> => {
    let fullName = (supabaseUser.user_metadata?.full_name as string) || 'Ticketa Attendee';
    let phoneNumber = (supabaseUser.user_metadata?.phone_number as string) || '';
    let role: AuthUser['role'] = (supabaseUser.user_metadata?.role as any) || 'ATTENDEE';

    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (profile) {
          fullName = profile.full_name || fullName;
          phoneNumber = profile.phone_number || phoneNumber;
          role = (profile.role as AuthUser['role']) || role;
          
          // Ensure is_email_verified in profiles is synced if Supabase confirmed email
          if (supabaseUser.email_confirmed_at && !profile.is_email_verified) {
            await supabase.from('profiles').update({ is_email_verified: true }).eq('id', supabaseUser.id);
          }
        } else {
          // Create profile if missing
          await supabase.from('profiles').upsert({
            id: supabaseUser.id,
            full_name: fullName,
            email: supabaseUser.email || '',
            phone_number: phoneNumber,
            role: 'ATTENDEE',
            is_email_verified: Boolean(supabaseUser.email_confirmed_at),
          });
        }
      } catch (e) {
        console.warn('Profile sync notice:', e);
      }
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName,
      phoneNumber,
      role,
      isEmailVerified: Boolean(supabaseUser.email_confirmed_at),
    };
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const updatedUser = await fetchUserProfile(session.user);
      setUser(updatedUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // Check URL parameters for email verification or password reset callback
      const href = window.location.href;
      const isAuthCallback = href.includes('type=signup') || href.includes('type=recovery') || href.includes('/auth/callback') || href.includes('/callback') || href.includes('access_token=') || href.includes('code=');

      if (href.includes('error_description=') || href.includes('error=')) {
        const match = href.match(/error_description=([^&]+)/);
        const errorMsg = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : 'Email verification failed or link expired.';
        setAuthNotification({
          type: 'error',
          message: errorMsg,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (isSupabaseConfigured) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(currentSession);
            if (currentSession?.user) {
              const authUser = await fetchUserProfile(currentSession.user);
              setUser(authUser);

              if (isAuthCallback) {
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
                // Clean up URL bar to root path
                window.history.replaceState({}, document.title, '/');
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.user) {
          const authUser = await fetchUserProfile(newSession.user);
          setUser(authUser);

          // Handle verification callback events
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const href = window.location.href;
            if (href.includes('type=signup') || href.includes('/auth/callback') || href.includes('/callback')) {
              setAuthNotification({
                type: 'success',
                message: 'Your email address has been verified successfully! Welcome to Ticketa.',
              });
              window.history.replaceState({}, document.title, '/');
            } else if (href.includes('type=recovery')) {
              setAuthNotification({
                type: 'info',
                message: 'Authenticated via password reset link. Please update your password.',
              });
              window.history.replaceState({}, document.title, '/');
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  const signUpAttendee = async ({ fullName, email, phoneNumber, password }: SignUpData) => {
    if (!fullName.trim() || !email.trim() || !password) {
      return { success: false, error: 'Full name, email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase database is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel or your .env file.',
      };
    }

    try {
      // Direct redirect URL to /auth/callback for production & preview environments
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
            role: 'ATTENDEE', // Explicitly enforced role
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Explicitly ensure profile is created in public.profiles with ATTENDEE platform role
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          role: 'ATTENDEE',
          is_email_verified: Boolean(data.user.email_confirmed_at),
        });

        const requiresVerification = !data.session && !data.user.email_confirmed_at;
        
        if (data.session) {
          setSession(data.session);
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            role: 'ATTENDEE',
            isEmailVerified: Boolean(data.user.email_confirmed_at),
          });
        }

        return {
          success: true,
          requiresEmailVerification: requiresVerification,
        };
      }

      return { success: false, error: 'Failed to create account. Please try again.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred.' };
    }
  };

  const signIn = async ({ email, password }: SignInData) => {
    if (!email.trim() || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase database is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel or your .env file.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const authUser = await fetchUserProfile(data.user);
        setUser(authUser);
        setSession(data.session);
        return { success: true };
      }

      return { success: false, error: 'Invalid login response.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Could not sign in.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setUser(null);
    setSession(null);
  };

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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        authNotification,
        clearAuthNotification,
        signUpAttendee,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
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
