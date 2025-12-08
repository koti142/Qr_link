import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';
import captionRoutes from './routes/captionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cloudflareRoutes from './routes/cloudflareRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow specific origins; in development, allow all
    const isProduction = config.nodeEnv === 'production';
    
    if (isProduction) {
      // Production: Allow configured frontend URL and same-origin requests
      const allowedOrigins = [
        config.urls.frontend,
        // Allow same origin (for when frontend and backend are on same domain)
        origin.startsWith('http://') || origin.startsWith('https://') ? origin : undefined
      ].filter(Boolean);
      
      // Check if origin matches frontend URL or is same domain
      const originMatches = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          const originUrl = new URL(origin);
          // Allow exact match or same domain
          return allowedUrl.origin === originUrl.origin || 
                 originUrl.hostname === allowedUrl.hostname;
        } catch {
          return allowed === origin;
        }
      });
      
      if (originMatches || origin.includes(config.urls.frontend.replace(/^https?:\/\//, ''))) {
        callback(null, true);
      } else {
        // Log for debugging but allow in production (can be restricted later)
        console.warn(`[CORS] Request from unlisted origin: ${origin}`);
        callback(null, true); // Allow for now, can restrict later
      }
    } else {
      // Development: Allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges', 'Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/video-storage', express.static(path.join(__dirname, '../video-storage')));
app.use('/qr-codes', express.static(path.join(__dirname, '../qr-codes')));
app.use('/thumbnails', express.static(path.join(__dirname, '../video-storage/thumbnails')));
// Serve uploaded videos from backend/upload folder
app.use('/upload', express.static(path.join(__dirname, 'upload')));
// Serve caption files with proper CORS headers
app.use('/captions', (req, res, next) => {
  // Set CORS headers for caption files
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin');
  res.header('Content-Type', 'text/vtt; charset=utf-8');
  next();
}, express.static(path.join(__dirname, '../video-storage/captions')));

// Log all API requests
app.use('/api', (req, res, next) => {
  console.log('[API] Request:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cloudflare', cloudflareRoutes);

// Redirect routes (must be after API routes but before catch-all)
app.use('/', redirectRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    console.log(`   Host: ${config.database.host}`);
    console.log(`   Database: ${config.database.database}`);
    console.log(`   User: ${config.database.user}`);
    
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    // Test query to verify database exists and is accessible
    const [rows] = await pool.execute('SELECT DATABASE() as current_db, VERSION() as version');
    const dbInfo = rows[0];
    
    console.log('✅ Database connection successful!');
    console.log(`   Connected to: ${dbInfo.current_db}`);
    console.log(`   MySQL Version: ${dbInfo.version}`);
    
    // Check if tables exist
    const [tables] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [config.database.database]);
    
    const tableCount = tables[0].count;
    console.log(`   Tables found: ${tableCount}`);
    
    if (tableCount === 0) {
      console.log('⚠️  Warning: No tables found. Run database/schema.sql to create tables.');
    } else {
      console.log('✅ Database schema is ready!');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Solution: Create the database first:');
      console.error(`   mysql -u ${config.database.user} -p < database/schema.sql`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution: Make sure MySQL server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Solution: Check your database credentials in .env file');
    }
    
    return false;
  }
}

// Start server
const PORT = config.port;

// Test database connection before starting server
testDatabaseConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Video storage: ${config.upload.uploadPath}`);
      console.log(`🌐 Frontend URL: ${config.urls.frontend}`);
      console.log(`📦 CDN Mode: ${config.cdn.useCdn ? 'Enabled' : 'Disabled'}`);
      console.log('='.repeat(50) + '\n');
    });
  } else {
    console.error('\n⚠️  Server not started due to database connection failure.');
    console.error('   Please fix the database connection and restart the server.\n');
    process.exit(1);
  }
}).catch((error) => {
  console.error('\n❌ Fatal error during startup:', error);
  process.exit(1);
});

