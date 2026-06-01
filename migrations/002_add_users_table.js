/**
 * Migration Example: Add Users Table
 * Run: node migrations/002_add_users_table.js
 * 
 * Ini adalah contoh cara menambah table baru
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
    console.log('🚀 Running migration: Add Users Table\n');

    // Check if table already exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (result.rows[0].exists) {
      console.log('⚠️  Table "users" already exists. Skipping...');
      return;
    }

    // Create users table
    console.log('👤 Creating table: users');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✓ Table created');

    // Create indexes
    console.log('📑 Creating indexes');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('   ✓ Indexes created');

    // Add sample data (optional)
    console.log('📝 Inserting sample data');
    await client.query(`
      INSERT INTO users (username, email, password, role) 
      VALUES ('admin', 'admin@rak-dashboard.local', 'hashed_password_here', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('   ✓ Sample data inserted');

    console.log('\n✅ Migration completed!\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration();
