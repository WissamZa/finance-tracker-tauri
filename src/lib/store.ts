import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from './i18n';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from './supabase-db';

export type DatabaseSource = 'local' | 'supabase';

interface SupabaseConfig {
  url: string;
  key: string;
}

interface AppState {
  language: Language;
  setLanguage: (lang: Language | ((prev: Language) => Language)) => void;
  currentMonth: number;
  setCurrentMonth: (month: number | ((prev: number) => number)) => void;
  currentYear: number;
  setCurrentYear: (year: number | ((prev: number) => number)) => void;
  // Database settings
  databaseSource: DatabaseSource;
  setDatabaseSource: (source: DatabaseSource | ((prev: DatabaseSource) => DatabaseSource)) => void;
  supabaseConfig: SupabaseConfig | null;
  setSupabaseConfig: (config: SupabaseConfig | null | ((prev: SupabaseConfig | null) => SupabaseConfig | null)) => void;
  isSupabaseConnected: boolean;
  setIsSupabaseConnected: (connected: boolean | ((prev: boolean) => boolean)) => void;
  // Auth state
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  setAuth: (user: User | null, session: Session | null, profile?: Profile | null) => void;
  setProfile: (profile: Profile | null | ((prev: Profile | null) => Profile | null)) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set((state) => ({ language: typeof lang === 'function' ? lang(state.language) : lang })),
      currentMonth: new Date().getMonth(),
      setCurrentMonth: (month) => set((state) => ({ currentMonth: typeof month === 'function' ? month(state.currentMonth) : month })),
      currentYear: new Date().getFullYear(),
      setCurrentYear: (year) => set((state) => ({ currentYear: typeof year === 'function' ? year(state.currentYear) : year })),
      // Database settings - default to 'local' for offline-first Tauri app
      databaseSource: 'local',
      setDatabaseSource: (source) => set((state) => ({ databaseSource: typeof source === 'function' ? source(state.databaseSource) : source })),
      supabaseConfig: null,
      setSupabaseConfig: (config) => set((state) => ({ supabaseConfig: typeof config === 'function' ? config(state.supabaseConfig) : config })),
      isSupabaseConnected: false,
      setIsSupabaseConnected: (connected) => set((state) => ({ isSupabaseConnected: typeof connected === 'function' ? connected(state.isSupabaseConnected) : connected })),
      // Auth state
      user: null,
      session: null,
      profile: null,
      setAuth: (user, session, profile = null) => set({ user, session, profile: profile || null }),
      setProfile: (profile) => set((state) => ({ profile: typeof profile === 'function' ? profile(state.profile) : profile })),
    }),
    {
      name: 'app-settings',
    }
  )
);
