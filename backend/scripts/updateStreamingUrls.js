/**
 * Script to update streaming URLs in the database
 * This updates all videos to use the correct domain from BASE_URL environment variable
 * 
 * Usage: node scripts/updateStreamingUrls.js
 */

import dotenv from 'dotenv';
import pool from '../config/database.js';
import config from '../config/config.js';

dotenv.config();

async function updateStreamingUrls() {
  try {
    console.log('🔄 Starting streaming URL update...');
    console.log(`📍 Base URL: ${config.urls.base}`);
    
    // Get all videos
    const [videos] = await pool.execute(
      'SELECT id, video_id, redirect_slug, streaming_url FROM videos WHERE status != "deleted"'
    );
    
    console.log(`📹 Found ${videos.length} videos to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const video of videos) {
      if (!video.redirect_slug) {
        console.log(`⚠️  Skipping video ${video.video_id} - no redirect_slug`);
        skipped++;
        continue;
      }
      
      // Build new streaming URL
      const newStreamingUrl = `${config.urls.base}/s/${video.redirect_slug}`;
      
      // Check if URL needs updating
      if (video.streaming_url === newStreamingUrl) {
        console.log(`✓ Video ${video.video_id} already has correct URL`);
        skipped++;
        continue;
      }
      
      // Update the database
      await pool.execute(
        'UPDATE videos SET streaming_url = ? WHERE id = ?',
        [newStreamingUrl, video.id]
      );
      
      console.log(`✅ Updated video ${video.video_id}:`);
      console.log(`   Old: ${video.streaming_url}`);
      console.log(`   New: ${newStreamingUrl}`);
      updated++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${videos.length}`);
    console.log('\n✅ Streaming URL update complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating streaming URLs:', error);
    process.exit(1);
  }
}

updateStreamingUrls();

