import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test the users query to see if it works
 */
async function testUsersQuery() {
  try {
    console.log('\n🔍 Testing users query...\n');

    const page = 1;
    const limit = 10;
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

    // LIMIT and OFFSET must be inserted directly into query string, not as parameters
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    console.log('Query:', query);
    console.log('Params:', params);
    console.log('');

    const [users] = await pool.execute(query, params);
    console.log(`✅ Query successful! Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Full Name: ${user.full_name || 'N/A'}`);
      console.log(`  Role: ${user.role || 'N/A'}`);
      console.log(`  Active: ${user.is_active}`);
      console.log(`  Permissions: upload=${user.can_upload_videos}, view=${user.can_view_videos}, links=${user.can_check_links}, qr=${user.can_check_qr_codes}`);
      console.log('');
    });

    // Test count query
    let countQuery = `SELECT COUNT(*) as total FROM admins WHERE 1=1`;
    const [countResult] = await pool.execute(countQuery);
    const total = countResult[0].total;
    console.log(`Total users in database: ${total}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Query failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testUsersQuery();

