import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

/**
 * Get all users (with pagination)
 */
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, username, email, full_name, role, 
        can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes,
        is_active, created_at, updated_at, last_login,
        created_by
      FROM admins
      WHERE 1=1
    `;
    const params = [];

    // Add search filter
    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // LIMIT and OFFSET must be inserted directly into query string, not as parameters
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [users] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM admins WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Get creator names
    const userIds = users.map(u => u.created_by).filter(Boolean);
    const creatorMap = {};
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      const [creators] = await pool.execute(
        `SELECT id, username, full_name FROM admins WHERE id IN (${placeholders})`,
        userIds
      );
      creators.forEach(c => {
        creatorMap[c.id] = c.full_name || c.username;
      });
    }

    // Add creator name to each user
    const usersWithCreator = users.map(user => ({
      ...user,
      created_by_name: user.created_by ? creatorMap[user.created_by] : null
    }));

    res.json({
      users: usersWithCreator,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message,
      hint: 'Make sure the database migration has been run. Check migration_user_roles_simple.sql'
    });
  }
}

/**
 * Get user by ID
 */
export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      `SELECT 
        id, username, email, full_name, role, 
        can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes,
        is_active, created_at, updated_at, last_login, created_by
      FROM admins 
      WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get creator name if exists
    if (users[0].created_by) {
      const [creators] = await pool.execute(
        'SELECT username, full_name FROM admins WHERE id = ?',
        [users[0].created_by]
      );
      if (creators.length > 0) {
        users[0].created_by_name = creators[0].full_name || creators[0].username;
      }
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * Create new user
 */
export async function createUser(req, res) {
  try {
    const {
      username,
      password,
      email,
      full_name,
      role = 'viewer',
      can_upload_videos = false,
      can_view_videos = false,
      can_check_links = false,
      can_check_qr_codes = false
    } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const [existing] = await pool.execute(
      'SELECT id FROM admins WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const [emailExists] = await pool.execute(
        'SELECT id FROM admins WHERE email = ?',
        [email]
      );
      if (emailExists.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Get creator ID from token (if available)
    // JWT token contains userId, which could be a number or string
    let created_by = null;
    if (req.user?.userId) {
      created_by = parseInt(req.user.userId) || null;
    }

    // Set permissions based on role
    let finalCanUpload = can_upload_videos;
    let finalCanView = can_view_videos;
    let finalCanCheckLinks = can_check_links;
    let finalCanCheckQR = can_check_qr_codes;

    // Auto-set permissions based on role
    if (role === 'admin') {
      finalCanUpload = true;
      finalCanView = true;
      finalCanCheckLinks = true;
      finalCanCheckQR = true;
    } else if (role === 'uploader') {
      finalCanUpload = true;
      finalCanView = true;
      finalCanCheckLinks = true;
      finalCanCheckQR = true;
    } else if (role === 'viewer') {
      finalCanView = true;
      finalCanCheckLinks = true;
      finalCanCheckQR = true;
    }

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO admins (
        username, password_hash, email, full_name, role,
        can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes,
        is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [
        username,
        password_hash,
        email || null,
        full_name || null,
        role,
        finalCanUpload,
        finalCanView,
        finalCanCheckLinks,
        finalCanCheckQR,
        created_by
      ]
    );

    // Fetch created user
    const [newUser] = await pool.execute(
      `SELECT 
        id, username, email, full_name, role, 
        can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes,
        is_active, created_at, updated_at, created_by
      FROM admins 
      WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message,
      hint: 'Make sure the database migration has been run. Check migration_user_roles_simple.sql'
    });
  }
}

/**
 * Update user
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      email,
      full_name,
      role,
      can_upload_videos,
      can_view_videos,
      can_check_links,
      can_check_qr_codes,
      is_active
    } = req.body;

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id, username, email FROM admins WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const params = [];

    // Update username if provided and different
    if (username && username !== existing[0].username) {
      // Check if new username already exists
      const [usernameCheck] = await pool.execute(
        'SELECT id FROM admins WHERE username = ? AND id != ?',
        [username, id]
      );
      if (usernameCheck.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      updates.push('username = ?');
      params.push(username);
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const password_hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(password_hash);
    }

    // Update email if provided
    if (email !== undefined) {
      if (email && email !== existing[0].email) {
        // Check if email already exists
        const [emailCheck] = await pool.execute(
          'SELECT id FROM admins WHERE email = ? AND id != ?',
          [email, id]
        );
        if (emailCheck.length > 0) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
      updates.push('email = ?');
      params.push(email || null);
    }

    // Update other fields
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name || null);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (can_upload_videos !== undefined) {
      updates.push('can_upload_videos = ?');
      params.push(can_upload_videos);
    }

    if (can_view_videos !== undefined) {
      updates.push('can_view_videos = ?');
      params.push(can_view_videos);
    }

    if (can_check_links !== undefined) {
      updates.push('can_check_links = ?');
      params.push(can_check_links);
    }

    if (can_check_qr_codes !== undefined) {
      updates.push('can_check_qr_codes = ?');
      params.push(can_check_qr_codes);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await pool.execute(
      `UPDATE admins SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Fetch updated user
    const [updated] = await pool.execute(
      `SELECT 
        id, username, email, full_name, role, 
        can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes,
        is_active, created_at, updated_at, last_login, created_by
      FROM admins 
      WHERE id = ?`,
      [id]
    );

    res.json({
      message: 'User updated successfully',
      user: updated[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * Delete user
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    const currentUserId = req.user?.userId ? (parseInt(req.user.userId) || req.user.userId) : null;
    if (currentUserId && parseInt(id) === parseInt(currentUserId)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id, username FROM admins WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await pool.execute('DELETE FROM admins WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    
    // Check for foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Cannot delete user: This user has created other users. Please reassign or delete those users first.' 
      });
    }

    res.status(500).json({ error: 'Failed to delete user' });
  }
}

