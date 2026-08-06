import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { parseAuthSessionUrl } from './lib/auth-url';
import { supabase } from './lib/supabase';
import { syncOutbox } from './lib/sync';

WebBrowser.maybeCompleteAuthSession();

const institutionDomain = '@sairamtap.edu.in';
const isInstitutionEmail = (email?: string) => email?.trim().toLowerCase().endsWith(institutionDomain) === true;

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  signInWithGoogle(): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  signUp(fullName: string, email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const activeUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { activeUserId.current = data.session?.user.id ?? null; setSession(data.session); }).finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      const nextUserId = next?.user.id ?? null;
      if (activeUserId.current !== nextUserId) queryClient.clear();
      activeUserId.current = nextUserId;
      setSession(next); setLoading(false);
      if (next) setTimeout(() => void syncOutbox(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(supabase), loading, session,
    async signInWithGoogle() {
      if (!supabase) throw new Error('LearnFlow backend is not configured.');
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { hd: 'sairamtap.edu.in', prompt: 'select_account' } },
      });
      if (error) throw error;
      if (!data.url) throw new Error('Google sign-in is not available.');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return false;
      const tokens = parseAuthSessionUrl(result.url);
      const signedIn = await supabase.auth.setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
      if (signedIn.error) throw signedIn.error;
      if (!isInstitutionEmail(signedIn.data.session?.user.email)) {
        await supabase.auth.signOut();
        throw new Error('Use your @sairamtap.edu.in college account.');
      }
      return true;
    },
    async signIn(email, password) {
      if (!supabase) throw new Error('LearnFlow backend is not configured.');
      const normalizedEmail = email.trim().toLowerCase();
      if (!isInstitutionEmail(normalizedEmail)) throw new Error('Use your @sairamtap.edu.in college account.');
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw error;
    },
    async signUp(fullName, email, password) {
      if (!supabase) return false;
      const normalizedEmail = email.trim().toLowerCase();
      if (!isInstitutionEmail(normalizedEmail)) throw new Error('Use your @sairamtap.edu.in college account.');
      const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { full_name: fullName.trim() } } });
      if (error) throw error;
      return !data.session;
    },
    async signOut() { if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; } },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
