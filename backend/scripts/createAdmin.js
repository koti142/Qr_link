import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create an admin user in the database
 */
async function createAdmin() {
  try {
    // Default admin credentials (can be overridden via command line args or env vars)
    const args = process.argv.slice(2);
    const username = args[0] || process.env.ADMIN_USERNAME || 'admin';
    const password = args[1] || process.env.ADMIN_PASSWORD || 'admin123';
    const email = args[2] || process.env.ADMIN_EMAIL || 'admin@example.com';
    const fullName = args[3] || process.env.ADMIN_FULL_NAME || 'Administrator';

    console.log('\n🔐 Creating admin user...');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Full Name: ${fullName}`);

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if admin already exists
    const [existing] = await pool.execute(
      'SELECT id, username FROM admins WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      console.log(`\n⚠️  Admin user '${username}' already exists!`);
      console.log('   Updating password and permissions...');
      
      // Update existing admin
      await pool.execute(
        `UPDATE admins SET 
          password_hash = ?,
          email = ?,
          full_name = ?,
          role = 'admin',
          can_upload_videos = TRUE,
          can_view_videos = TRUE,
          can_check_links = TRUE,
          can_check_qr_codes = TRUE,
          is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE username = ?`,
        [passwordHash, email, fullName, username]
      );
      
      console.log('✅ Admin user updated successfully!');
    } else {
      // Insert new admin
      await pool.execute(
        `INSERT INTO admins (
          username, password_hash, email, full_name, role,
          can_upload_videos, can_view_videos, can_check_links, can_check_qr_codes, is_active
        ) VALUES (?, ?, ?, ?, 'admin', TRUE, TRUE, TRUE, TRUE, TRUE)`,
        [username, passwordHash, email, fullName]
      );
      
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Please change the default password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 Solution: Run the database migrations first:');
      console.error('   mysql -u root -p < database/migration_user_roles_simple.sql');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.error('\n💡 Admin user already exists. Use update instead or choose a different username.');
    }
    
    process.exit(1);
  }
}

createAdmin();

