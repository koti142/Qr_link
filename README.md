# Video Delivery System

A complete full-stack video delivery platform with React frontend, Node.js backend, and MySQL database. Features include QR code generation, redirect URLs, video versioning, Moodle integration support, and future CDN readiness.

## 🚀 Features

- **Video Upload & Management**: Upload videos with automatic folder organization
- **QR Code Generation**: Auto-generate QR codes for each video
- **Redirect System**: Short URLs that redirect to video pages
- **Video Versioning**: Support for multiple versions of the same video
- **Caption Support**: Upload and manage VTT caption files
- **Admin Dashboard**: Complete admin interface for managing videos
- **Public Video Pages**: Clean video playback with Video.js player
- **Moodle Integration**: Embed mode support for Moodle LMS
- **CDN Ready**: Configuration for future CDN integration

## 📁 Project Structure

```
video-storage/
├── backend/              # Node.js + Express backend
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Express server entry point
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   └── App.jsx      # Main app component
│   └── package.json
├── database/            # MySQL schema and migrations
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Seed data
└── video-storage/       # Video file storage (auto-created)
    └── G{grade}/
        └── U{unit}/
            └── L{lesson}/
                └── VIDEO_ID_v01_master.mp4
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express
- **MySQL** database
- **Multer** for file uploads
- **QRCode** for QR code generation
- **JWT** for authentication
- **Sharp** for image processing

### Frontend
- **React 18** with Vite
- **React Router** for routing
- **Tailwind CSS** for styling
- **Video.js** for video playback
- **Axios** for API calls

## 📋 Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd video-storage
```

### 2. Database Setup

1. Create MySQL database:
```bash
mysql -u root -p < database/schema.sql
```

2. (Optional) Seed default admin:
```bash
mysql -u root -p video_delivery < database/seed.sql
```

### 3. Backend Setup

```bash
cd backend
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=video_delivery
JWT_SECRET=your-super-secret-jwt-key
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

### 5. Create Required Directories

```bash
# From project root
mkdir -p video-storage qr-codes
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📖 Usage

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

### Video ID Format

Videos follow this naming convention:
```
G{grade}_U{unit}_L{lesson}_{TopicNoSpaces}
```

Example: `G03_U02_L01_InputDevices`

### Uploading a Video

1. Login to admin panel at `/admin/login`
2. Navigate to "Upload Video"
3. Fill in:
   - Grade (1-12)
   - Unit number
   - Lesson number
   - Topic (no spaces, e.g., "InputDevices")
   - Title
   - Description (optional)
   - Video file
4. Click "Upload Video"

The system will:
- Generate video ID automatically
- Create folder structure: `G{grade}/U{unit}/L{lesson}/`
- Save video file with proper naming
- Create database entry
- Generate QR code
- Create redirect URL

### Accessing Videos

- **Public URL**: `http://localhost:5173/video/{videoId}`
- **Redirect URL**: `http://localhost:5000/{videoId}` (redirects to public page)
- **QR Code**: Available in admin panel

### Embed Mode (Moodle)

Add `?embed=true` to any video URL:
```
http://localhost:5173/video/G03_U02_L01_InputDevices?embed=true
```

This returns a minimal UI without header/footer for embedding.

## 🔌 API Endpoints

### Public Endpoints

- `GET /api/videos` - List all videos (with optional filters)
- `GET /api/videos/:videoId` - Get video details
- `GET /:slug` - Redirect to video page

### Admin Endpoints (Require Authentication)

- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `POST /api/videos/upload` - Upload video
- `PUT /api/videos/:id` - Update video metadata
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:videoId/versions` - Get video versions
- `GET /api/admin/redirects` - List all redirects
- `POST /api/captions/upload` - Upload caption file
- `GET /api/captions/:videoId` - Get captions for video
- `DELETE /api/captions/:id` - Delete caption

## 🔐 Authentication

Admin routes require JWT authentication. Include token in headers:
```
Authorization: Bearer <token>
```

## 📦 CDN Configuration

To enable CDN support in the future:

1. Set in `.env`:
```env
USE_CDN=true
CDN_BASE_URL=https://cdn.myorg.org/
LOCAL_BASE_URL=http://localhost:5000/video-storage/
```

2. The backend will automatically use CDN URLs when `USE_CDN=true`

## 🗄️ Database Schema

### Tables

- **videos**: Main video metadata
- **redirects**: Redirect slug mappings
- **captions**: Caption file references
- **video_versions**: Version history
- **admins**: Admin user accounts
- **analytics**: (Future) Analytics data

## 🧪 Development

### Backend Development

```bash
cd backend
npm run dev  # Uses node --watch for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```

## 📝 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=video_delivery
DB_PORT=3306

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=1073741824  # 1GB
UPLOAD_PATH=../video-storage

# CDN (Future)
USE_CDN=false
CDN_BASE_URL=https://cdn.myorg.org/
LOCAL_BASE_URL=http://localhost:5000/video-storage/

# URLs
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Database Connection Issues

- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `video_delivery` exists

### File Upload Issues

- Check `video-storage` directory exists and is writable
- Verify `MAX_FILE_SIZE` in `.env` is sufficient
- Check disk space

### CORS Issues

- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check browser console for CORS errors

## 🔮 Future Enhancements

- [ ] Video transcoding for multiple quality levels
- [ ] Thumbnail generation
- [ ] Analytics tracking
- [ ] User authentication for public access
- [ ] Video playlists
- [ ] Search functionality
- [ ] Bulk upload support
- [ ] Video preview/trimming

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for educational video delivery**





