import bcrypt from 'bcrypt';
import pool from '../config/database.js';

export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, full_name, role, can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes, is_active, created_at, last_login FROM admins WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (username LIKE ? OR full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.execute(query, params);
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM admins' + (search ? ' WHERE username LIKE ? OR full_name LIKE ?' : ''),
      search ? [`%${search}%`, `%${search}%`] : []
    );

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      'SELECT id, username, full_name, role, can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes, is_active, created_at, last_login FROM admins WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function createUser(req, res) {
  try {
    const { username, password, full_name, role, can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM admins WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdBy = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO admins (username, password, full_name, role, can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [
        username,
        hashedPassword,
        full_name || null,
        role || 'viewer',
        can_upload_videos ? 1 : 0,
        can_view_videos ? 1 : 0,
        can_check_links ? 1 : 0,
        can_check_qr_codes ? 1 : 0,
        createdBy
      ]
    );

    res.status(201).json({ 
      message: 'User created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, password, full_name, role, can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes, is_active } = req.body;

    const updates = [];
    const params = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (can_upload_videos !== undefined) {
      updates.push('can_upload_videos = ?');
      params.push(can_upload_videos ? 1 : 0);
    }
    if (can_view_videos !== undefined) {
      updates.push('can_view_videos = ?');
      params.push(can_view_videos ? 1 : 0);
    }
    if (can_check_links !== undefined) {
      updates.push('can_check_links = ?');
      params.push(can_check_links ? 1 : 0);
    }
    if (can_check_qr_codes !== undefined) {
      updates.push('can_check_qr_codes = ?');
      params.push(can_check_qr_codes ? 1 : 0);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const [result] = await pool.execute(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [user] = await pool.execute(
      'SELECT id, username, full_name, role, can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes, is_active FROM admins WHERE id = ?',
      [id]
    );

    res.json(user[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent self-deletion
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await pool.execute(
      'DELETE FROM admins WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

