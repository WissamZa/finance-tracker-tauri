/**
 * Simple R2 File Upload for Tauri
 * 
 * Uploads images and PDFs to Cloudflare R2 via Cloudflare Worker
 */

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Get the R2 Worker URL from environment
 */
function getWorkerUrl(): string {
  return import.meta.env.VITE_R2_WORKER_URL || '';
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!getWorkerUrl();
}

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF' 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'File too large. Maximum size is 50MB' 
    };
  }

  return { valid: true };
}

/**
 * Upload a file to R2
 * 
 * @param file - File to upload (image or PDF)
 * @returns Upload result with key and URL
 */
export async function uploadToR2(file: File): Promise<{ 
  success: boolean; 
  key?: string; 
  url?: string; 
  error?: string 
}> {
  const workerUrl = getWorkerUrl();

  if (!workerUrl) {
    return { 
      success: false, 
      error: 'R2 Worker URL not configured. Set VITE_R2_WORKER_URL in .env' 
    };
  }

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Step 1: Get upload key from worker
    const initResponse = await fetch(`${workerUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || 'Failed to initialize upload' 
      };
    }

    const { key, uploadUrl } = await initResponse.json();

    // Step 2: Upload file directly
    const uploadResponse = await fetch(`${workerUrl}${uploadUrl}`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || 'Failed to upload file' 
      };
    }

    const result = await uploadResponse.json();

    return {
      success: true,
      key: result.key,
      url: result.url || `${workerUrl}/file/${result.key}`,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Get file URL
 */
export function getR2FileUrl(key: string): string {
  const workerUrl = getWorkerUrl();
  return `${workerUrl}/file/${key}`;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  const workerUrl = getWorkerUrl();

  if (!workerUrl) {
    return { success: false, error: 'R2 Worker URL not configured' };
  }

  try {
    const response = await fetch(`${workerUrl}/file/${key}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || 'Failed to delete file' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type);
}

/**
 * Get allowed file types description
 */
export function getAllowedFileTypes(): string[] {
  return [...ALLOWED_TYPES];
}
