import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let supabaseUrl: string | null = null;
let supabaseKey: string | null = null;

export function createSupabaseClient(url: string, key: string): SupabaseClient {
  // Return existing client if it has the same config
  if (supabaseClient && supabaseUrl === url && supabaseKey === key) {
    return supabaseClient;
  }

  supabaseUrl = url;
  supabaseKey = key;

  // Create standard Supabase client for Tauri
  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: window.localStorage,
    },
  });
  return supabaseClient;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

export function resetSupabaseClient(): void {
  supabaseClient = null;
  supabaseUrl = null;
  supabaseKey = null;
}

/**
 * Gets the redirect URL for auth
 */
export const getRedirectURL = () => {
  // For Tauri desktop app, use a local callback
  return 'tauri://localhost';
};

// Auth functions
export async function signUpWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  return await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectURL(),
    }
  });
}

export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');
  return await client.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  return await client.auth.signOut();
}

export async function getSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: { session } } = await client.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const client = getSupabaseClient();
  if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// Test Supabase connection
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    const { error } = await client.from('categories').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Initialize Supabase tables if they don't exist
export async function initSupabaseTables(url: string, key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    const tables = ['categories', 'records', 'line_items'];
    
    for (const table of tables) {
      const { error } = await client.from(table).select('count').limit(1);
      if (error && error.code !== 'PGRST116') {
        return { 
          success: false, 
          error: `Table '${table}' not found. Please create it in Supabase SQL editor.` 
        };
      }
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
