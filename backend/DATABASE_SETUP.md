# Database Setup Guide

## Current Error

```
Access denied for user 'legatolx_video_delivery'@'localhost' (using password: YES)
```

This means the database password is incorrect or the user doesn't have the right permissions.

## Solution

### Step 1: Create .env File

Create a `.env` file in the `backend` directory:

```bash
cd video-storage/backend
copy .env.example .env
# Or on Linux/Mac: cp .env.example .env
```

### Step 2: Set Database Credentials

Edit the `.env` file and set your actual database credentials:

```env
DB_HOST=localhost
DB_USER=legatolx_video_delivery
DB_PASSWORD=your_actual_database_password
DB_NAME=legatolx_video_delivery
DB_PORT=3306
```

### Step 3: Verify Database Credentials

You can test the connection using MySQL command line:

```bash
mysql -u legatolx_video_delivery -p legatolx_video_delivery
```

If this works, use the same password in your `.env` file.

### Step 4: Check Database User Permissions

Make sure the database user has the correct permissions:

```sql
-- Connect as root or admin user
mysql -u root -p

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON legatolx_video_delivery.* TO 'legatolx_video_delivery'@'localhost';
FLUSH PRIVILEGES;
```

### Step 5: Restart Server

After setting the correct credentials:

```bash
npm start
```

## Common Issues

### Issue 1: Password Contains Special Characters

If your password contains special characters, make sure to:
- Wrap it in quotes in the .env file, OR
- Escape special characters properly

### Issue 2: User Doesn't Exist

If the user doesn't exist, create it:

```sql
CREATE USER 'legatolx_video_delivery'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON legatolx_video_delivery.* TO 'legatolx_video_delivery'@'localhost';
FLUSH PRIVILEGES;
```

### Issue 3: Database Doesn't Exist

If the database doesn't exist, create it:

```sql
CREATE DATABASE legatolx_video_delivery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run the schema:

```bash
mysql -u legatolx_video_delivery -p legatolx_video_delivery < ../database/schema.sql
```

## Security Note

**Never commit your `.env` file to git!** It contains sensitive credentials.

The `.env` file should be in `.gitignore` (which it should be by default).

