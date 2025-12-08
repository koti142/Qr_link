import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = path.dirname(__dirname);
const uploadPath = path.isAbsolute(config.upload.uploadPath) 
  ? config.upload.uploadPath 
  : path.resolve(basePath, config.upload.uploadPath);

const miscPath = path.join(uploadPath, 'misc');

console.log('Path resolution:');
console.log('  Base path:', basePath);
console.log('  Config upload path:', config.upload.uploadPath);
console.log('  Resolved upload path:', uploadPath);
console.log('  Misc path:', miscPath);
console.log('  Misc exists:', fs.existsSync(miscPath));

if (fs.existsSync(miscPath)) {
  const files = fs.readdirSync(miscPath);
  const videoFiles = files.filter(f => ['.mp4', '.webm', '.mov', '.avi'].includes(path.extname(f).toLowerCase()));
  console.log('  Video files found:', videoFiles.length);
  videoFiles.forEach(f => console.log('    -', f));
} else {
  console.log('  ERROR: Misc folder not found!');
  console.log('  Trying alternative paths...');
  
  // Try alternative paths
  const alternatives = [
    path.join(basePath, 'video-storage', 'misc'),
    path.join(basePath, '..', 'video-storage', 'misc'),
    path.join(basePath, 'video-storage', 'video-storage', 'misc'),
  ];
  
  alternatives.forEach(alt => {
    console.log(`  Checking: ${alt}`);
    if (fs.existsSync(alt)) {
      console.log(`    ✓ EXISTS! Found ${fs.readdirSync(alt).length} files`);
    }
  });
}






