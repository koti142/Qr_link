import pool from '../config/database.js';

async function checkTable() {
  try {
    console.log('Checking csv_upload_history table...\n');
    
    // Check if table exists
    const [tables] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE() 
       AND table_name = 'csv_upload_history'`
    );
    
    if (tables[0].count === 0) {
      console.log('❌ Table does not exist!');
      console.log('Run: npm run migrate-csv-history');
      process.exit(1);
    }
    
    console.log('✅ Table exists!');
    
    // Check columns
    const [columns] = await pool.execute(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
       AND table_name = 'csv_upload_history'
       ORDER BY ordinal_position`
    );
    
    console.log('\nColumns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check row count
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM csv_upload_history');
    console.log(`\nTotal records: ${count[0].count}`);
    
    console.log('\n✅ Table is ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();






