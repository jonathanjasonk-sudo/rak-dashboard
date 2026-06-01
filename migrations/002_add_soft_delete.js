/**
 * Migration: Add soft delete columns
 * Run: node migrations/002_add_soft_delete.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rak_dashboard',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running migration: Add soft delete columns\n');

    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='rak_entries' AND column_name='deleted_at'
    `);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Column deleted_at already exists, skipping...\n');
      client.release();
      await pool.end();
      return;
    }

    // Add deleted_at column
    console.log('📝 Adding deleted_at column...');
    await client.query(`
      ALTER TABLE rak_entries 
      ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL
    `);
    console.log('   ✓ Column added');

    // Create index for soft delete queries
    console.log('📑 Creating index for deleted_at...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deleted ON rak_entries(deleted_at)
    `);
    console.log('   ✓ Index created');

    console.log('\n✅ Migration completed successfully!\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
