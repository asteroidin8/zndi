import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** SecureStore는 2048바이트 제한 — 청크 저장 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const chunksStr = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunksStr) {
      const n = parseInt(chunksStr, 10);
      const parts: string[] = [];
      for (let i = 0; i < n; i++) {
        const part = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (part) parts.push(part);
      }
      return parts.join('');
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    const chunkSize = 1800;
    if (value.length <= chunkSize) {
      return SecureStore.setItemAsync(key, value);
    }
    const chunks = Math.ceil(value.length / chunkSize);
    const writes: Promise<void>[] = [];
    for (let i = 0; i < chunks; i++) {
      writes.push(
        SecureStore.setItemAsync(`${key}_chunk_${i}`, value.slice(i * chunkSize, (i + 1) * chunkSize)),
      );
    }
    writes.push(SecureStore.setItemAsync(`${key}_chunks`, String(chunks)));
    return Promise.all(writes).then(() => undefined);
  },
  removeItem: async (key: string) => {
    const chunksStr = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunksStr) {
      const n = parseInt(chunksStr, 10);
      await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_chunk_${i}`)),
      );
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
