import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMiscAccess() {
  try {
    // Resolve upload path properly (same as in controller)
    const basePath = path.dirname(__dirname);
    const uploadPath = path.isAbsolute(config.upload.uploadPath) 
      ? config.upload.uploadPath 
      : path.resolve(basePath, config.upload.uploadPath);
    
    const miscPath = path.join(uploadPath, 'misc');
    
    console.log('\n=== Testing Misc Folder Access ===\n');
    console.log('Base path:', basePath);
    console.log('Config upload path:', config.upload.uploadPath);
    console.log('Resolved upload path:', uploadPath);
    console.log('Misc path:', miscPath);
    console.log('Misc exists:', fsSync.existsSync(miscPath));
    
    if (!fsSync.existsSync(miscPath)) {
      console.log('\n❌ Misc folder not found!');
      console.log('\nTrying alternative paths...\n');
      
      const alternatives = [
        path.join(basePath, 'video-storage', 'misc'),
        path.join(basePath, '..', 'video-storage', 'misc'),
        path.join(basePath, 'video-storage', 'video-storage', 'misc'),
        path.join(basePath, '..', 'video-storage', 'video-storage', 'misc'),
      ];
      
      for (const alt of alternatives) {
        const exists = fsSync.existsSync(alt);
        console.log(`  ${exists ? '✓' : '✗'} ${alt}`);
        if (exists) {
          const files = await fs.readdir(alt);
          const videoFiles = files.filter(f => 
            ['.mp4', '.webm', '.mov', '.avi'].includes(path.extname(f).toLowerCase())
          );
          console.log(`    Found ${videoFiles.length} video files`);
          videoFiles.slice(0, 5).forEach(f => console.log(`      - ${f}`));
        }
      }
      return;
    }
    
    console.log('\n✓ Misc folder found!\n');
    
    // Try to read directory
    console.log('Reading directory...');
    const files = await fs.readdir(miscPath);
    console.log(`Found ${files.length} total files\n`);
    
    // Filter video files
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    const videos = [];
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (videoExtensions.includes(ext)) {
        const filePath = path.join(miscPath, file);
        try {
          const stats = await fs.stat(filePath);
          videos.push({
            filename: file,
            size: stats.size,
            modified: stats.mtime
          });
        } catch (statError) {
          console.warn(`⚠ Failed to get stats for ${file}:`, statError.message);
        }
      }
    }
    
    console.log(`Found ${videos.length} video files:\n`);
    videos.forEach((v, i) => {
      const sizeMB = (v.size / (1024 * 1024)).toFixed(2);
      console.log(`${i + 1}. ${v.filename}`);
      console.log(`   Size: ${sizeMB} MB`);
      console.log(`   Modified: ${v.modified.toISOString()}\n`);
    });
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMiscAccess();






