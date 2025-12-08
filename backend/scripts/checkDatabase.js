import pool from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName, columnName) {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
       AND table_name = ? 
       AND column_name = ?`,
      [tableName, columnName]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error(`Error checking column ${columnName}:`, error.message);
    return false;
  }
}

/**
 * Check database structure and apply migration if needed
 */
async function checkDatabase() {
  try {
    console.log('\n🔍 Checking database structure...\n');

    const requiredColumns = [
      'full_name',
      'can_upload_videos',
      'can_view_videos',
      'can_check_links',
      'can_check_qr_codes',
      'is_active',
      'created_by',
      'last_login'
    ];

    const missingColumns = [];

    for (const column of requiredColumns) {
      const exists = await columnExists('admins', column);
      if (!exists) {
        missingColumns.push(column);
        console.log(`❌ Missing column: ${column}`);
      } else {
        console.log(`✅ Column exists: ${column}`);
      }
    }

    if (missingColumns.length === 0) {
      console.log('\n✅ All required columns exist! Database structure is up to date.\n');
      return true;
    }

    console.log(`\n⚠️  Found ${missingColumns.length} missing column(s).`);
    console.log('💡 Please run the migration to add missing columns:');
    console.log('   mysql -u root -p video_delivery < database/migration_user_roles_simple.sql\n');
    
    // Try to read and execute the migration
    try {
      const migrationPath = join(__dirname, '../../database/migration_user_roles_simple.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      
      console.log('📝 Attempting to apply migration automatically...\n');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));

      for (const statement of statements) {
        try {
          if (statement.trim()) {
            await pool.execute(statement);
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        } catch (error) {
          // Ignore errors for columns that already exist
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ Error: ${error.message}`);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }

      console.log('\n✅ Migration applied! Verifying...\n');
      
      // Verify again
      const stillMissing = [];
      for (const column of missingColumns) {
        const exists = await columnExists('admins', column);
        if (!exists) {
          stillMissing.push(column);
        }
      }

      if (stillMissing.length === 0) {
        console.log('✅ All columns have been added successfully!\n');
        return true;
      } else {
        console.log(`⚠️  Some columns are still missing: ${stillMissing.join(', ')}`);
        console.log('   Please run the migration manually.\n');
        return false;
      }
    } catch (error) {
      console.error('\n❌ Error applying migration:', error.message);
      console.log('   Please run the migration manually:\n');
      console.log('   mysql -u root -p video_delivery < database/migration_user_roles_simple.sql\n');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    console.error(`   Code: ${error.code || 'N/A'}`);
    return false;
  }
}

// Run the check
checkDatabase().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});






