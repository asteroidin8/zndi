import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function getAuthRedirectUri(): string {
  return makeRedirectUri({ scheme: 'routiner', path: 'auth/callback' });
}

function parseAuthParams(url: string): { access_token?: string; refresh_token?: string } {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(query);
  return {
    access_token: hashParams.get('access_token') ?? queryParams.get('access_token') ?? undefined,
    refresh_token: hashParams.get('refresh_token') ?? queryParams.get('refresh_token') ?? undefined,
  };
}

export async function signInWithGoogle(): Promise<{ error?: string; cancelled?: boolean }> {
  if (!isSupabaseConfigured()) return { error: 'Supabase가 설정되지 않았어요.' };
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 클라이언트를 만들 수 없어요.' };

  const redirectTo = getAuthRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'OAuth URL을 받지 못했어요.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { cancelled: true };

  const { access_token, refresh_token } = parseAuthParams(result.url);
  if (!access_token || !refresh_token) return { error: '인증 토큰을 파싱하지 못했어요.' };

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) return { error: sessionError.message };
  return {};
}

export async function sendEmailOtp(email: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: 'Supabase가 설정되지 않았어요.' };
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 클라이언트를 만들 수 없어요.' };

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  return error ? { error: error.message } : {};
}

export async function verifyEmailOtp(email: string, token: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 클라이언트를 만들 수 없어요.' };

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });
  return error ? { error: error.message } : {};
}

export async function signOut(): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { error } = await supabase.auth.signOut();
  return error ? { error: error.message } : {};
}

/** Deep link 콜백 처리 (앱 cold start·OAuth redirect) */
export async function handleAuthCallbackUrl(url: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 클라이언트를 만들 수 없어요.' };

  const { access_token, refresh_token } = parseAuthParams(url);
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return error ? { error: error.message } : {};
  }

  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : undefined;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? { error: error.message } : {};
  }

  if (parsed.queryParams?.access_token && parsed.queryParams?.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: String(parsed.queryParams.access_token),
      refresh_token: String(parsed.queryParams.refresh_token),
    });
    return error ? { error: error.message } : {};
  }

  return { error: '인증 정보를 찾지 못했어요.' };
}
