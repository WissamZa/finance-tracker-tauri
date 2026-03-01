# Finance Tracker R2 Worker

A Cloudflare Worker for handling file uploads to R2 storage. Supports images (jpg, png, gif, webp) and PDFs.

## Features

- ✅ Direct file upload to R2
- ✅ File download with CORS support
- ✅ File deletion
- ✅ File type validation (images + PDF only)
- ✅ File size limit (50MB max)
- ✅ CORS support for Tauri/desktop apps

## Prerequisites

1. A Cloudflare account
2. Wrangler CLI installed (`npm install -g wrangler`)
3. R2 bucket created in Cloudflare dashboard

## Setup

### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name it `finance-tracker-files`
5. Choose your preferred location

### 2. Configure Worker

Login to Cloudflare:
```bash
cd r2-worker
npm install
wrangler login
```

### 3. Set Environment Variables

In Cloudflare Dashboard:
1. Go to **Workers & Pages**
2. Find your worker after first deploy
3. Go to **Settings** → **Variables**
4. Add:

| Variable | Value |
|----------|-------|
| `ALLOWED_ORIGINS` | `*` or your app URL (e.g., `tauri://localhost,http://localhost:5173`) |
| `R2_PUBLIC_URL` | (optional) Your R2 public URL if bucket is public |

### 4. Deploy

```bash
npm run deploy
```

After deployment, you'll get a URL like:
```
https://finance-tracker-r2.<your-subdomain>.workers.dev
```

## API Endpoints

### Health Check
```
GET /
Response: { "status": "ok", "service": "Finance Tracker R2 API", "version": "1.0.0" }
```

### Upload File
```
POST /upload
Content-Type: application/json

Request:
{
  "filename": "receipt.jpg",
  "contentType": "image/jpeg",
  "fileSize": 123456
}

Response:
{
  "key": "abc123.jpg",
  "uploadUrl": "/upload/abc123.jpg",
  "message": "Use PUT to upload file to the uploadUrl"
}
```

### Direct Upload (2-step)
```
PUT /upload/<key>
Content-Type: image/jpeg

<body: file data>

Response:
{
  "success": true,
  "key": "abc123.jpg",
  "url": "/file/abc123.jpg"
}
```

### Get File
```
GET /file/<key>

Response: File data with appropriate Content-Type
```

### Delete File
```
DELETE /file/<key>

Response:
{
  "success": true
}
```

## Simple Upload (One-step)

You can also upload directly in one request:
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`${WORKER_URL}/upload/${key}`, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});
```

## Environment Variables in Tauri App

After deploying, add to your Tauri app's `.env`:
```env
VITE_R2_WORKER_URL=https://finance-tracker-r2.<your-subdomain>.workers.dev
```

## Local Development

```bash
npm run dev
```

The worker will run at `http://localhost:8787`

## Security Notes

1. **ALLOWED_ORIGINS**: For production, set to your actual app URL instead of `*`
2. **Authentication**: This worker doesn't include auth. Add your own if needed:
   - Check Supabase session token
   - Or add API key authentication
3. **Rate Limiting**: Consider adding rate limiting for production

## Costs

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015/GB/month
- **Class A Operations**: $4.50/million (writes)
- **Class B Operations**: $0.36/million (reads)
- **Free tier**: 10GB storage, 1M Class A, 10M Class B per month

Cloudflare Workers pricing:
- **Free tier**: 100,000 requests/day
- **Paid**: $0.50/million requests
