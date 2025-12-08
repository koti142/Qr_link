# Production Setup Guide

## Environment Variables

### Frontend (.env or .env.production)

```env
# Backend API URL (REQUIRED for production)
VITE_API_URL=https://your-backend-domain.com/api

# Example:
# VITE_API_URL=https://api.yourdomain.com/api
# OR if backend is on same domain:
# VITE_API_URL=https://yourdomain.com/api
```

**Important:** If `VITE_API_URL` is not set, the frontend will try to auto-detect the backend URL based on the current domain. However, it's recommended to set it explicitly.

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=video_delivery
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=1073741824  # 1GB
UPLOAD_PATH=../video-storage

# URLs (IMPORTANT for CORS)
FRONTEND_URL=https://your-frontend-domain.com
BASE_URL=https://your-backend-domain.com
```

## Common Deployment Scenarios

### Scenario 1: Same Domain (Recommended)

If your frontend and backend are on the same domain:

**Frontend:** `https://yourdomain.com`  
**Backend:** `https://yourdomain.com` (serves API at `/api`)

**Frontend .env:**
```env
VITE_API_URL=https://yourdomain.com/api
```

**Backend .env:**
```env
FRONTEND_URL=https://yourdomain.com
BASE_URL=https://yourdomain.com
```

### Scenario 2: Different Domains

**Frontend:** `https://app.yourdomain.com`  
**Backend:** `https://api.yourdomain.com`

**Frontend .env:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Backend .env:**
```env
FRONTEND_URL=https://app.yourdomain.com
BASE_URL=https://api.yourdomain.com
```

### Scenario 3: Subdomain Pattern

**Frontend:** `https://www.yourdomain.com`  
**Backend:** `https://api.yourdomain.com`

**Frontend .env:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Backend .env:**
```env
FRONTEND_URL=https://www.yourdomain.com
BASE_URL=https://api.yourdomain.com
```

## Building for Production

### Frontend

```bash
cd frontend

# Set environment variables
export VITE_API_URL=https://your-backend-domain.com/api

# Build
npm run build

# The build output will be in frontend/dist/
```

### Backend

```bash
cd backend

# Set environment variables in .env file
# Then start the server
npm start
```

## CORS Configuration

The backend automatically configures CORS based on:
1. `FRONTEND_URL` environment variable
2. Same-origin requests (when frontend and backend are on same domain)
3. Production vs development mode

In production, CORS is more restrictive. Make sure `FRONTEND_URL` matches your actual frontend domain.

## Troubleshooting

### "Failed to fetch" Error

1. **Check Backend URL:**
   - Verify `VITE_API_URL` is set correctly in frontend
   - Check browser console for the actual URL being used
   - Ensure backend is accessible at that URL

2. **Check CORS:**
   - Verify `FRONTEND_URL` in backend `.env` matches your frontend domain
   - Check browser console for CORS errors
   - Ensure backend is running and accessible

3. **Check Network:**
   - Verify backend server is running
   - Check if port is accessible (not blocked by firewall)
   - Test backend health endpoint: `https://your-backend-domain.com/api/health`

### Video Not Playing

1. **Check Video File:**
   - Verify video file exists in `video-storage/` directory
   - Check file permissions
   - Ensure video file is not corrupted

2. **Check Database:**
   - Verify video exists in database
   - Check `redirect_slug` or `video_id` matches
   - Ensure video status is "active"

3. **Check Logs:**
   - Check backend console logs for errors
   - Check browser console for errors
   - Look for 404 or 500 errors

## Testing Production Setup

1. **Test Backend Health:**
   ```bash
   curl https://your-backend-domain.com/api/health
   ```

2. **Test Streaming Endpoint:**
   ```bash
   curl -I https://your-backend-domain.com/s/your-slug
   ```

3. **Test CORS:**
   - Open browser console on frontend
   - Try to fetch from backend
   - Check for CORS errors

## Auto-Detection Feature

If `VITE_API_URL` is not set, the frontend will try to auto-detect the backend URL:

- If on `localhost` → uses `http://localhost:5000`
- If on production domain → uses same domain for backend
- Example: If frontend is `https://app.example.com`, it will try `https://app.example.com` for backend

**However, it's recommended to set `VITE_API_URL` explicitly for production.**

