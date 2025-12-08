# Quick Fix: Stream URL Showing localhost

## Problem
Diagnostic shows `http://localhost:5000/s/ceulfhb20f` instead of `https://kodeit-videos.legatolxp.online/s/ceulfhb20f`

## Solution

### Option 1: Rebuild Frontend (If Using VITE_API_URL)

If you have `VITE_API_URL=https://kodeit-videos.legatolxp.online/api` in `frontend/.env`:

1. **Rebuild the frontend:**
   ```bash
   cd video-storage/frontend
   npm run build
   ```

2. **Restart your frontend server** (if using a production server)

**Why?** Vite bakes environment variables into the build at build time. Changes to `.env` require a rebuild.

### Option 2: Use Auto-Detection (No Rebuild Needed)

The system now auto-detects the domain from the browser URL. Just make sure:

1. **You're accessing from the production domain:**
   - Access: `https://your-frontend-domain.com`
   - NOT: `http://localhost:5173`

2. **The system will automatically use:**
   - `https://kodeit-videos.legatolxp.online` (same domain as frontend)

### Option 3: Check Browser Console

Open browser console (F12) and check the debug logs:
- Look for `[getBackendUrl]` messages
- Check what `backendUrl` is being used
- Check what `VITE_API_URL` value is (if any)

## Verify It's Working

After applying the fix:

1. **Open the diagnostic page**
2. **Check the "Stream URL" field** - should show `https://kodeit-videos.legatolxp.online/s/...`
3. **Check the debug info below** - shows:
   - Backend URL being used
   - VITE_API_URL value
   - Current hostname

## Still Showing localhost?

1. **Check browser console** for `[getBackendUrl]` logs
2. **Verify you're accessing from production domain** (not localhost)
3. **Check if VITE_API_URL is set** in the build (check debug info in diagnostic)
4. **Rebuild frontend** if you changed `.env` file

## Note

The diagnostic now shows debug information to help identify the issue. Look for the small gray text below the Stream URL that shows:
- Backend URL
- VITE_API_URL value  
- Current hostname

This will help you see exactly what's being used.

