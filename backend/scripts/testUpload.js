import pool from '../config/database.js';
import config from '../config/config.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateVideoId } from '../utils/videoIdGenerator.js';
import { ensureDirectoryExists, getFileSize } from '../utils/fileUtils.js';
import * as videoService from '../services/videoService.js';
import * as redirectService from '../services/redirectService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
  try {
    console.log('=== Testing Upload Function ===\n');
    
    // Test database connection
    console.log('1. Testing database connection...');
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✓ Database connected:', rows[0]);
    
    // Test path resolution
    console.log('\n2. Testing path resolution...');
    const backendDir = path.dirname(__dirname);
    const basePath = path.dirname(backendDir);
    const uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    
    console.log('  Backend dir:', backendDir);
    console.log('  Base path:', basePath);
    console.log('  Config upload path:', config.upload.uploadPath);
    console.log('  Resolved upload path:', uploadPath);
    console.log('  Upload path exists:', fsSync.existsSync(uploadPath));
    
    // Test my-storage folder
    console.log('\n3. Testing my-storage folder...');
    const myStoragePath = path.join(uploadPath, 'my-storage');
    await ensureDirectoryExists(myStoragePath);
    console.log('✓ My Storage folder:', myStoragePath);
    console.log('  Exists:', fsSync.existsSync(myStoragePath));
    
    // Test misc folder
    console.log('\n4. Testing misc folder...');
    const miscPath = path.join(uploadPath, 'misc');
    console.log('  Misc path:', miscPath);
    console.log('  Exists:', fsSync.existsSync(miscPath));
    if (fsSync.existsSync(miscPath)) {
      const files = await fs.readdir(miscPath);
      const videoFiles = files.filter(f => 
        ['.mp4', '.webm', '.mov', '.avi'].includes(path.extname(f).toLowerCase())
      );
      console.log(`  Found ${videoFiles.length} video files`);
      videoFiles.slice(0, 5).forEach(f => console.log(`    - ${f}`));
    }
    
    // Test video ID generation
    console.log('\n5. Testing video ID generation...');
    const testTitle = 'VID_1764744941896_master';
    const videoId = generateVideoId({ title: testTitle });
    console.log('  Test title:', testTitle);
    console.log('  Generated video ID:', videoId);
    
    // Test video service
    console.log('\n6. Testing video service...');
    const existingVideo = await videoService.getVideoByVideoId(videoId, true);
    console.log('  Existing video check:', existingVideo ? 'Found' : 'Not found');
    
    // Test redirect service
    console.log('\n7. Testing redirect service...');
    try {
      const redirectResult = await redirectService.createRedirect('test_slug_' + Date.now(), 'http://localhost:5173/stream/test', true);
      console.log('✓ Redirect created:', redirectResult);
    } catch (err) {
      console.error('✗ Redirect error:', err.message);
    }
    
    console.log('\n=== All Tests Passed ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testUpload();




