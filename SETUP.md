# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Database Setup

1. Make sure MySQL is running
2. Create the database:
```bash
mysql -u root -p < database/schema.sql
```

3. (Optional) Add default admin:
```bash
mysql -u root -p video_delivery < database/seed.sql
```

### 3. Configure Backend

1. Copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and update:
   - `DB_PASSWORD` - Your MySQL password
   - `JWT_SECRET` - A random secret key (use a strong password)

### 4. Create Directories

From project root:
```bash
mkdir -p video-storage qr-codes
```

**Note:** The system will automatically create subdirectories when videos are uploaded.

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Login**: http://localhost:5173/admin/login
  - Username: `admin`
  - Password: `admin123`

## First Steps

1. Login to admin panel
2. Upload your first video
3. View the generated QR code and redirect URL
4. Test the public video page

## Troubleshooting

### "Cannot connect to database"
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `backend/.env`
- Ensure database exists: `SHOW DATABASES;`

### "Port already in use"
- Change `PORT` in `backend/.env`
- Or kill the process using the port

### "Module not found"
- Run `npm install` in both `backend/` and `frontend/`
- Delete `node_modules` and reinstall if needed

### "Permission denied" on video-storage
- Make sure the directory exists and is writable
- On Linux/Mac: `chmod 755 video-storage`
- On Windows: Run as administrator if needed

## Next Steps

- Change default admin password
- Configure CDN settings (if applicable)
- Set up production environment variables
- Configure SSL/HTTPS for production





