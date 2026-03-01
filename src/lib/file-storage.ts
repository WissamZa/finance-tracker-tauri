/**
 * File Storage Utility for Tauri
 * 
 * Supports multiple storage backends:
 * 1. Local file storage (Tauri fs plugin) - offline only
 * 2. Supabase Storage - cloud sync
 * 3. Remote API (R2 via backend) - requires deployed API
 */

import { getSupabaseClient } from './supabase';

// Storage backend type
type StorageBackend = 'local' | 'supabase' | 'remote-api';

// Get the configured storage backend
function getStorageBackend(): StorageBackend {
  const useLocal = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';
  const apiUrl = import.meta.env.VITE_API_URL;
  const supabaseClient = getSupabaseClient();

  if (useLocal) return 'local';
  if (supabaseClient) return 'supabase';
  if (apiUrl) return 'remote-api';
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
      case 'remote-api':
        return await uploadToRemoteAPI(file, onProgress);
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
      case 'remote-api':
        return await getRemoteAPIFileUrl(key);
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
      case 'remote-api':
        return await deleteFromRemoteAPI(key);
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
// LOCAL STORAGE (Tauri fs plugin)
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
// REMOTE API (R2 via backend)
// ===========================================

async function uploadToRemoteAPI(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ key: string; url: string }> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('API URL not configured');

  // Get presigned URL from backend
  const res = await fetch(`${apiUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  if (!res.ok) throw new Error('Failed to get upload URL');

  const { presignedUrl, key } = await res.json();

  // Upload directly to R2
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) throw new Error('Upload failed');

  // Construct public URL
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
  const url = publicUrl ? `${publicUrl}/${key}` : key;

  return { key, url };
}

async function getRemoteAPIFileUrl(key: string): Promise<string | null> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }

  if (!apiUrl) return null;

  // Get signed URL from backend
  const res = await fetch(`${apiUrl}/api/files/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) return null;

  const { signedUrl } = await res.json();
  return signedUrl;
}

async function deleteFromRemoteAPI(key: string): Promise<boolean> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return false;

  const res = await fetch(`${apiUrl}/api/files/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  return res.ok;
}
