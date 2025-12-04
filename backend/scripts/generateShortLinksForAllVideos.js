import pool from '../config/database.js';
import config from '../config/config.js';
import { generateUniqueShortId } from '../utils/shortUrlGenerator.js';
import * as redirectService from '../services/redirectService.js';

/**
 * Generate short links for all videos (new and old)
 * This script will:
 * 1. Find all active videos
 * 2. Generate short links for each video
 * 3. Update redirects table with short links pointing to stream page
 * 4. Update videos table with redirect_slug
 */
async function generateShortLinksForAllVideos() {
  try {
    console.log('🔍 Starting short link generation for all videos...\n');

    // Get all active videos
    const [videos] = await pool.execute(
      'SELECT video_id, redirect_slug, title FROM videos WHERE status = "active" ORDER BY created_at DESC'
    );

    console.log(`Found ${videos.length} active videos\n`);

    let updated = 0;
    let created = 0;
    let errors = 0;

    for (const video of videos) {
      try {
        const videoId = video.video_id;
        const currentRedirectSlug = video.redirect_slug;
        
        // Target URL: stream page
        const targetUrl = `${config.urls.frontend}/stream/${videoId}`;
        
        // Always generate a new short link (10 characters)
        const shortSlug = await generateUniqueShortId();
        
        // Delete old redirects for this video (clean up)
        try {
          await pool.execute('DELETE FROM redirects WHERE slug = ?', [videoId]);
          if (currentRedirectSlug && currentRedirectSlug !== videoId) {
            await pool.execute('DELETE FROM redirects WHERE slug = ?', [currentRedirectSlug]);
          }
        } catch (deleteError) {
          // Ignore delete errors
        }
        
        // Create new redirect with short slug pointing to stream page
        await redirectService.createRedirect(shortSlug, targetUrl, false);
        
        // Also create redirect for videoId pointing to stream page (for backward compatibility)
        await redirectService.createRedirect(videoId, targetUrl, false);
        
        // Update video's redirect_slug to the new short slug
        await pool.execute(
          'UPDATE videos SET redirect_slug = ? WHERE video_id = ?',
          [shortSlug, videoId]
        );
        
        console.log(`✓ Created/Updated short link for: ${video.title || videoId}`);
        console.log(`  Video ID: ${videoId}`);
        console.log(`  Short slug: ${shortSlug}`);
        console.log(`  Short URL: ${config.urls.base}/${shortSlug}`);
        console.log(`  Stream URL: ${targetUrl}\n`);
        
        if (currentRedirectSlug && currentRedirectSlug !== videoId && currentRedirectSlug !== shortSlug) {
          updated++;
        } else {
          created++;
        }
      } catch (error) {
        console.error(`✗ Error processing video ${video.video_id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total videos: ${videos.length}`);
    console.log(`  Created: ${created}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Errors: ${errors}`);
    console.log('\n✅ Short link generation complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateShortLinksForAllVideos();

