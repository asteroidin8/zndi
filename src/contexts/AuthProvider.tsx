import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  sendEmailOtp,
  signInWithGoogle,
  signOut,
  verifyEmailOtp,
} from '@/services/auth/authSession';
import { registerPushToken } from '@/services/pushTokenService';
import { resetUserData } from '@/utils/resetUserData';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInGoogle: () => Promise<{ error?: string; cancelled?: boolean }>;
  sendEmailOtp: (email: string) => Promise<{ error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void registerPushToken();
      }
      if (event === 'SIGNED_OUT') {
        setLoading(false);
        void resetUserData();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInGoogle = useCallback(() => signInWithGoogle(), []);
  const sendOtp = useCallback((email: string) => sendEmailOtp(email), []);
  const verifyOtp = useCallback((email: string, token: string) => verifyEmailOtp(email, token), []);
  const logout = useCallback(() => signOut(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured(),
      loading,
      session,
      user: session?.user ?? null,
      signInGoogle,
      sendEmailOtp: sendOtp,
      verifyEmailOtp: verifyOtp,
      signOut: logout,
    }),
    [loading, session, signInGoogle, sendOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
