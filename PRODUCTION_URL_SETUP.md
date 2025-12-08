# Production URL Setup Guide

## Problem
Streaming URLs are being stored as `http://localhost:5000/s/slug` instead of your production domain `https://kodeit-videos.legatolxp.online/s/slug`.

## Solution

### Step 1: Set Backend Environment Variable

Create or update the `.env` file in the `backend` directory:

```bash
cd video-storage/backend
nano .env  # or use your preferred editor
```

Add or update these variables:

```env
# IMPORTANT: Set your production domain
BASE_URL=https://kodeit-videos.legatolxp.online
FRONTEND_URL=https://your-frontend-domain.com

# Other required variables
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=video_delivery
DB_PORT=3306
JWT_SECRET=your-secret-key-here
```

### Step 2: Update Existing Videos in Database

Run the migration script to update all existing videos:

```bash
cd video-storage/backend
npm run update-streaming-urls
```

This will:
- Read all videos from the database
- Update their `streaming_url` field to use `BASE_URL` instead of localhost
- Show you a summary of what was updated

### Step 3: Restart Backend Server

After setting the environment variables, restart your backend server:

```bash
# If using PM2
pm2 restart video-backend

# Or if running directly
npm start
```

### Step 4: Verify

1. Check a video in your database:
   ```sql
   SELECT video_id, redirect_slug, streaming_url FROM videos LIMIT 5;
   ```
   The `streaming_url` should now show `https://kodeit-videos.legatolxp.online/s/slug`

2. Test streaming a video:
   - Visit: `https://kodeit-videos.legatolxp.online/s/lmp5ojnt50`
   - The video should play correctly

## Going Forward

**New videos** uploaded after this setup will automatically use the correct domain because:
- The code now uses `getBaseUrl(req)` which reads from the request's actual domain
- Falls back to `BASE_URL` environment variable if needed

## Troubleshooting

### URLs still showing localhost?

1. **Check environment variable is set:**
   ```bash
   # In backend directory
   node -e "require('dotenv').config(); console.log(process.env.BASE_URL)"
   ```
   Should output: `https://kodeit-videos.legatolxp.online`

2. **Check if migration script ran successfully:**
   ```bash
   npm run update-streaming-urls
   ```
   Look for "Updated: X" in the output

3. **Manually update a video (for testing):**
   ```sql
   UPDATE videos 
   SET streaming_url = 'https://kodeit-videos.legatolxp.online/s/lmp5ojnt50' 
   WHERE redirect_slug = 'lmp5ojnt50';
   ```

### File not found errors?

The file path resolution has been improved to search multiple locations:
- `my-storage/{redirect_slug}.mp4` (highest priority)
- `my-storage/{video_id}.mp4`
- `upload/{file_path}` (from database)
- `misc/{filename}`

If files are still not found, check:
1. File exists in one of these locations
2. File permissions are correct
3. `UPLOAD_PATH` environment variable points to the correct directory

## Notes

- The streaming URL format is: `https://kodeit-videos.legatolxp.online/s/{redirect_slug}`
- **NOT** `https://kodeit-videos.legatolxp.online/api/s/{redirect_slug}` (no `/api` in the path)
- The route `/s/:slug` is handled by `redirectRoutes.js`, not `videoRoutes.js`

