/**
 * File Storage Utility for Tauri
 * 
 * Supports multiple storage backends:
 * 1. Local file storage (localStorage/IndexedDB) - offline only
 * 2. Supabase Storage - cloud sync
 * 3. Cloudflare R2 via Worker - remote API
 */

import { getSupabaseClient } from './supabase';
import { uploadToR2, deleteFromR2, getR2FileUrl, isR2Configured } from './r2-upload';

// Storage backend type
type StorageBackend = 'local' | 'supabase' | 'r2';

// Get the configured storage backend
function getStorageBackend(): StorageBackend {
  const useLocal = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
  const supabaseClient = getSupabaseClient();

  if (useLocal) return 'local';
  if (supabaseClient) return 'supabase';
  if (isR2Configured()) return 'r2';
  return 'local'; // Default to local
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ key: string; url: string } | null> {
  const backend = getStorageBackend();

  try {
    switch (backend) {
      case 'supabase':
        return await uploadToSupabase(file, onProgress);
      case 'r2':
        return await uploadToR2Storage(file);
      case 'local':
      default:
        return await uploadToLocal(file);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

/**
 * Get a signed/accessible URL for a file
 */
export async function getFileUrl(key: string): Promise<string | null> {
  const backend = getStorageBackend();

  try {
    switch (backend) {
      case 'supabase':
        return await getSupabaseFileUrl(key);
      case 'r2':
        return getR2FileUrl(key);
      case 'local':
      default:
        return await getLocalFileUrl(key);
    }
  } catch (error) {
    console.error('Failed to get file URL:', error);
    return null;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<boolean> {
  const backend = getStorageBackend();

  try {
    switch (backend) {
      case 'supabase':
        return await deleteFromSupabase(key);
      case 'r2':
        const result = await deleteFromR2(key);
        return result.success;
      case 'local':
      default:
        return await deleteFromLocal(key);
    }
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

// ===========================================
// LOCAL STORAGE (localStorage for base64)
// ===========================================

async function uploadToLocal(file: File): Promise<{ key: string; url: string }> {
  // For Tauri, we'll use base64 encoding for local storage
  // In production, use @tauri-apps/plugin-fs for actual file system storage
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const key = `local-${Date.now()}-${file.name}`;
      
      // Store in localStorage (for small files) or IndexedDB
      try {
        localStorage.setItem(`file:${key}`, base64);
        resolve({ key, url: base64 });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function getLocalFileUrl(key: string): Promise<string | null> {
  const data = localStorage.getItem(`file:${key}`);
  return data;
}

async function deleteFromLocal(key: string): Promise<boolean> {
  localStorage.removeItem(`file:${key}`);
  return true;
}

// ===========================================
// SUPABASE STORAGE
// ===========================================

const SUPABASE_BUCKET = 'finance-tracker-files';

async function uploadToSupabase(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ key: string; url: string }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not initialized');

  const key = `${Date.now()}-${file.name}`;
  
  const { data, error } = await client.storage
    .from(SUPABASE_BUCKET)
    .upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = client.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(data.path);

  return { key: data.path, url: urlData.publicUrl };
}

async function getSupabaseFileUrl(key: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data } = client.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(key);

  return data.publicUrl;
}

async function deleteFromSupabase(key: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client.storage
    .from(SUPABASE_BUCKET)
    .remove([key]);

  return !error;
}

// ===========================================
// R2 STORAGE (via Cloudflare Worker)
// ===========================================

async function uploadToR2Storage(file: File): Promise<{ key: string; url: string }> {
  const result = await uploadToR2(file);
  
  if (!result.success || !result.key) {
    throw new Error(result.error || 'R2 upload failed');
  }

  return { 
    key: result.key, 
    url: result.url || getR2FileUrl(result.key) 
  };
}
