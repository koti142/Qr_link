import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'video_delivery',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  upload: {
    uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../video-storage'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
    backend: process.env.BACKEND_URL || 'http://localhost:5000'
  },
  
  cdn: {
    useCdn: process.env.USE_CDN === 'true' || false,
    cdnUrl: process.env.CDN_URL || ''
  }
};

export default config;

