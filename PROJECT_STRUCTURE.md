# Project Structure Overview

## Complete File Tree

```
video-storage/
│
├── backend/                          # Node.js Backend
│   ├── config/
│   │   ├── config.js                 # Application configuration
│   │   └── database.js               # MySQL connection pool
│   │
│   ├── controllers/                  # Route controllers
│   │   ├── authController.js         # Authentication (login, verify)
│   │   ├── videoController.js       # Video CRUD operations
│   │   ├── redirectController.js     # Redirect handling
│   │   └── captionController.js      # Caption management
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT authentication middleware
│   │
│   ├── routes/                       # Express routes
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── videoRoutes.js           # Video endpoints
│   │   ├── redirectRoutes.js         # Redirect endpoints
│   │   ├── captionRoutes.js        # Caption endpoints
│   │   └── adminRoutes.js           # Admin endpoints
│   │
│   ├── services/                     # Business logic
│   │   ├── videoService.js          # Video database operations
│   │   ├── redirectService.js       # Redirect management
│   │   ├── qrCodeService.js         # QR code generation
│   │   └── captionService.js        # Caption file handling
│   │
│   ├── utils/                        # Utility functions
│   │   ├── videoIdGenerator.js      # Video ID generation/parsing
│   │   └── fileUtils.js             # File system utilities
│   │
│   ├── package.json                  # Backend dependencies
│   ├── server.js                     # Express server entry point
│   └── .env.example                  # Environment variables template
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── Layout.jsx          # Main layout wrapper
│   │   │   ├── VideoPlayer.jsx     # Video.js player component
│   │   │   └── QRCodeViewer.jsx    # QR code display component
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── PublicVideoPage.jsx # Public video viewing page
│   │   │   ├── AdminLogin.jsx      # Admin login page
│   │   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   │   ├── VideoUpload.jsx     # Video upload form
│   │   │   ├── VideoList.jsx       # Video management list
│   │   │   ├── VideoEdit.jsx       # Video metadata editor
│   │   │   ├── RedirectViewer.jsx  # Redirect & QR code viewer
│   │   │   ├── CaptionUpload.jsx   # Caption upload page
│   │   │   └── VersionHistory.jsx   # Version history viewer
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # Axios API client
│   │   │
│   │   ├── App.jsx                  # Main app component with routes
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles (Tailwind)
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── postcss.config.js            # PostCSS configuration
│
├── database/                         # Database files
│   ├── schema.sql                   # MySQL schema (all tables)
│   └── seed.sql                     # Seed data (default admin)
│
├── video-storage/                    # Video file storage (auto-created)
│   └── G{grade}/                    # Organized by grade
│       └── U{unit}/                 # Then by unit
│           └── L{lesson}/           # Then by lesson
│               └── VIDEO_ID_v01_master.mp4
│
├── qr-codes/                         # QR code images (auto-created)
│   └── {videoId}.png
│
├── README.md                         # Main documentation
├── SETUP.md                          # Quick setup guide
├── PROJECT_STRUCTURE.md              # This file
└── .gitignore                        # Git ignore rules

```

## Key Features by Component

### Backend Services

**videoService.js**
- Create, read, update, delete videos
- Version management
- Filter by grade/unit/lesson
- CDN URL building

**redirectService.js**
- Create and manage redirects
- Slug-based redirects
- Redirect URL building

**qrCodeService.js**
- Generate QR code PNG files
- Store in qr-codes directory
- High-quality QR codes

**captionService.js**
- Upload VTT caption files
- Multi-language support
- Caption file management

### Frontend Pages

**PublicVideoPage.jsx**
- Video playback with Video.js
- Caption support
- Related videos
- QR code display
- Embed mode support

**AdminDashboard.jsx**
- Statistics overview
- Quick navigation
- Video counts and storage stats

**VideoUpload.jsx**
- Form-based video upload
- Auto-generates video ID
- Metadata input

**VideoList.jsx**
- Filterable video list
- Bulk operations
- Quick actions

**RedirectViewer.jsx**
- View all redirects
- QR code preview
- Copy redirect URLs

## Database Tables

1. **videos** - Main video metadata
2. **redirects** - Redirect slug mappings
3. **captions** - Caption file references
4. **video_versions** - Version history
5. **admins** - Admin user accounts
6. **analytics** - (Future) Analytics data

## API Routes

### Public
- `GET /api/videos` - List videos
- `GET /api/videos/:videoId` - Get video
- `GET /:slug` - Redirect to video

### Admin (Authenticated)
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token
- `POST /api/videos/upload` - Upload video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:videoId/versions` - Get versions
- `GET /api/admin/redirects` - List redirects
- `POST /api/captions/upload` - Upload caption
- `GET /api/captions/:videoId` - Get captions
- `DELETE /api/captions/:id` - Delete caption

## Video ID Format

```
G{grade}_U{unit}_L{lesson}_{TopicNoSpaces}
```

Example: `G03_U02_L01_InputDevices`

## Folder Organization

Videos are stored in:
```
video-storage/G{grade}/U{unit}/L{lesson}/VIDEO_ID_v{version}_master.mp4
```

This ensures:
- Organized file structure
- Easy navigation
- Scalable storage
- Clear hierarchy

## Configuration

All configuration is in:
- `backend/config/config.js` - Application config
- `backend/.env` - Environment variables (create from .env.example)

Key settings:
- Database connection
- JWT secrets
- Upload limits
- CDN configuration
- URL settings





