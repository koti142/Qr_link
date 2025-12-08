# Domain Auto-Detection System

## Overview

The system now **automatically detects** whether it's running locally or in production and uses the correct domain for all URLs.

## How It Works

### Backend (Server-Side)

The backend automatically detects the domain from incoming requests:

1. **From Request Headers** (Highest Priority):
   - Checks `X-Forwarded-Proto` header (for proxies/load balancers)
   - Checks `X-Forwarded-Host` header (for proxies)
   - Falls back to `req.protocol` and `req.get('host')`

2. **From Environment Variable** (Fallback):
   - Uses `BASE_URL` environment variable if no request is available
   - Defaults to `http://localhost:5000` if not set

**Location:** `backend/utils/urlUtils.js`

### Frontend (Client-Side)

The frontend automatically detects the domain:

1. **From Environment Variable** (Highest Priority):
   - Uses `VITE_API_URL` if set (e.g., `https://kodeit-videos.legatolxp.online/api`)

2. **From Current Browser URL** (Auto-Detection):
   - If on production domain (not localhost), uses same domain for backend
   - If on localhost, uses `http://localhost:5000`

**Location:** `frontend/src/utils/backendUrl.js`

## Examples

### Development (Local)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Stream URL: `http://localhost:5000/s/abc123`

### Production (Hosted)
- Frontend: `https://your-frontend.com`
- Backend: `https://kodeit-videos.legatolxp.online`
- Stream URL: `https://kodeit-videos.legatolxp.online/s/abc123`

## Configuration

### Backend `.env` (Optional but Recommended)

```env
# Set this for production to ensure correct URLs even without request context
BASE_URL=https://kodeit-videos.legatolxp.online
```

### Frontend `.env` (Optional but Recommended)

```env
# Set this for production
VITE_API_URL=https://kodeit-videos.legatolxp.online/api
```

## Benefits

✅ **No manual configuration needed** - Works automatically  
✅ **Development-friendly** - Uses localhost automatically  
✅ **Production-ready** - Detects production domain automatically  
✅ **Proxy-compatible** - Handles X-Forwarded-* headers  
✅ **Database-independent** - Returns correct URLs even if database has old ones  

## How URLs Are Generated

### When Creating/Uploading Videos

```javascript
// Backend automatically uses request domain
const streamingUrl = buildStreamingUrl(req, redirectSlug, videoId);
// Result: https://kodeit-videos.legatolxp.online/s/abc123
```

### When Fetching Videos

```javascript
// Backend updates streaming_url in response
const video = await api.get('/videos/abc123');
// video.streaming_url is automatically updated to correct domain
```

### In Frontend Components

```javascript
// Frontend automatically detects domain
const backendUrl = getBackendUrl();
// Result: https://kodeit-videos.legatolxp.online (in production)
// Result: http://localhost:5000 (in development)
```

## Troubleshooting

### URLs Still Showing localhost?

1. **Check if you're accessing from production domain:**
   - The system detects domain from the browser URL
   - If you access `http://localhost:5173`, it will use `localhost:5000`
   - If you access `https://your-domain.com`, it will use that domain

2. **Set environment variables** (if auto-detection doesn't work):
   ```env
   # Backend .env
   BASE_URL=https://kodeit-videos.legatolxp.online
   
   # Frontend .env
   VITE_API_URL=https://kodeit-videos.legatolxp.online/api
   ```

3. **Restart servers** after setting environment variables

### Behind a Proxy/Load Balancer?

The system automatically handles:
- `X-Forwarded-Proto` header (for HTTPS detection)
- `X-Forwarded-Host` header (for domain detection)

If your proxy doesn't set these headers, you may need to:
1. Configure your proxy to set these headers, OR
2. Set `BASE_URL` environment variable explicitly

## Migration

If you have existing videos with `localhost` URLs in the database:

1. **Option 1: Let the system handle it automatically**
   - The API now returns correct URLs even if database has old ones
   - No action needed - URLs are fixed on-the-fly

2. **Option 2: Update database (optional)**
   ```bash
   npm run update-streaming-urls
   ```
   This updates all videos in the database to use `BASE_URL`

