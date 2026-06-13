const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rak_dashboard',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('▶️  Creating table: rubber_local_entries');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS rubber_local_entries (
        id SERIAL PRIMARY KEY,
        spk VARCHAR(50) NOT NULL,
        rak VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        UNIQUE(spk, rak)
      );
      
      CREATE INDEX IF NOT EXISTS idx_rubber_local_spk ON rubber_local_entries(spk);
      CREATE INDEX IF NOT EXISTS idx_rubber_local_rak ON rubber_local_entries(rak);
      CREATE INDEX IF NOT EXISTS idx_rubber_local_deleted ON rubber_local_entries(deleted_at);
    `);
    
    console.log('✓ Table rubber_local_entries created successfully');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
