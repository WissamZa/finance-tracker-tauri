/**
 * Cloudflare Worker for R2 File Operations
 * 
 * Handles:
 * - GET / - Health check
 * - GET /files - List files
 * - POST /upload - Initialize upload and get key
 * - PUT /upload/:key - Upload file data
 * - GET /file/:key - Get a file from R2
 * - DELETE /file/:key - Delete a file from R2
 */

export interface Env {
  BUCKET: R2Bucket;
  ALLOWED_ORIGINS?: string;
  R2_PUBLIC_URL?: string;
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// CORS headers
function corsHeaders(origin: string, allowedOrigins: string | undefined): HeadersInit {
  const originsStr = allowedOrigins || '*';
  const origins = originsStr.split(',').map(o => o.trim());
  const allowedOrigin = origins.includes('*') ? '*' : 
    origins.includes(origin) ? origin : origins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle OPTIONS request (CORS preflight)
function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, env.ALLOWED_ORIGINS),
  });
}

// Generate a unique file key
function generateKey(filename: string): string {
  const ext = filename.split('.').pop() || 'bin';
  const uuid = crypto.randomUUID();
  return `${uuid}.${ext}`;
}

// Upload endpoint - get upload key
async function handleUploadInit(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';
  
  try {
    const body = await request.json<{ filename: string; contentType: string; fileSize: number }>();
    
    if (!body.filename || !body.contentType || !body.fileSize) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(body.contentType)) {
      return new Response(JSON.stringify({ 
        error: 'File type not allowed. Allowed: JPG, JPEG, PNG, PDF' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    // Validate file size
    if (body.fileSize > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File size exceeds 50MB limit' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    // Generate unique key
    const key = generateKey(body.filename);

    // Return the key for direct upload - NO multipart upload
    return new Response(JSON.stringify({ 
      key,
      uploadUrl: `/upload/${key}`,
      message: 'Use PUT to upload file to the uploadUrl'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  }
}

// Direct upload endpoint - store file in R2
async function handleDirectUpload(request: Request, env: Env, key: string): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';
  
  try {
    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    
    // Validate content type
    if (!ALLOWED_FILE_TYPES.includes(contentType)) {
      return new Response(JSON.stringify({ error: 'File type not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    // Get file data
    const fileData = await request.arrayBuffer();
    
    if (fileData.byteLength > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File size exceeds 50MB limit' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    // Upload to R2 with metadata
    await env.BUCKET.put(key, fileData, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    const publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL}/${key}` : null;

    return new Response(JSON.stringify({ 
      success: true,
      key,
      url: publicUrl || `/file/${key}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  }
}

// List files endpoint
async function handleListFiles(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';
  
  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // List objects from R2
    const listed = await env.BUCKET.list({
      limit,
      cursor,
    });

    const files = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploadedAt: obj.uploaded || obj.customMetadata?.uploadedAt,
      contentType: obj.httpMetadata?.contentType,
    }));

    return new Response(JSON.stringify({ 
      files,
      cursor: listed.truncated ? listed.cursor : null,
      hasMore: listed.truncated,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  } catch (error) {
    console.error('List error:', error);
    return new Response(JSON.stringify({ error: 'Failed to list files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  }
}

// Get file endpoint
async function handleGetFile(request: Request, env: Env, key: string): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';
  
  try {
    const object = await env.BUCKET.get(key);
    
    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    const headers = new Headers({
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.etag,
      ...corsHeaders(origin, env.ALLOWED_ORIGINS),
    });

    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  }
}

// Delete file endpoint
async function handleDeleteFile(request: Request, env: Env, key: string): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';
  
  try {
    await env.BUCKET.delete(key);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  }
}

// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    // Route: GET /files - List all files
    if (path === '/files' && request.method === 'GET') {
      return handleListFiles(request, env);
    }

    // Route: POST /upload - Initialize upload and get key
    if (path === '/upload' && request.method === 'POST') {
      return handleUploadInit(request, env);
    }

    // Route: PUT /upload/:key - Direct upload file
    const uploadMatch = path.match(/^\/upload\/([^/]+)$/);
    if (uploadMatch && request.method === 'PUT') {
      return handleDirectUpload(request, env, uploadMatch[1]);
    }

    // Route: GET /file/:key - Get file
    const getMatch = path.match(/^\/file\/([^/]+)$/);
    if (getMatch && request.method === 'GET') {
      return handleGetFile(request, env, getMatch[1]);
    }

    // Route: DELETE /file/:key - Delete file
    const deleteMatch = path.match(/^\/file\/([^/]+)$/);
    if (deleteMatch && request.method === 'DELETE') {
      return handleDeleteFile(request, env, deleteMatch[1]);
    }

    // Route: GET / - Health check
    if (path === '/' && request.method === 'GET') {
      const origin = request.headers.get('Origin') || '*';
      return new Response(JSON.stringify({ 
        status: 'ok', 
        service: 'Finance Tracker R2 API',
        version: '2.0.0'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
      });
    }

    // 404 for unknown routes
    const origin = request.headers.get('Origin') || '*';
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env.ALLOWED_ORIGINS) },
    });
  },
};
