import { type AuthResponse, type AuthTokens, type UserProfile } from '@coffeeroute/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const STORAGE_KEY = 'coffeeroute.session';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  status: Status;
  user: UserProfile | null;
  tokens: AuthTokens | null;
  /** Restores the session saved in the Keychain/Keystore on app start. */
  hydrate: () => Promise<void>;
  setSession: (auth: AuthResponse) => Promise<void>;
  setUser: (user: UserProfile) => void;
  clear: () => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  user: null,
  tokens: null,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AuthResponse;
        set({ status: 'authenticated', user: saved.user, tokens: saved.tokens });
        return;
      }
    } catch {
      // Corrupt or unreadable entry: start signed out.
    }
    set({ status: 'anonymous', user: null, tokens: null });
  },

  setSession: async (auth) => {
    set({ status: 'authenticated', user: auth.user, tokens: auth.tokens });
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(auth));
  },

  setUser: (user) => {
    const { tokens } = get();
    set({ user });
    if (tokens) void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ user, tokens }));
  },

  clear: async () => {
    set({ status: 'anonymous', user: null, tokens: null });
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  },
}));
