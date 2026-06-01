/**
 * Migration: Initialize Database Schema
 * Run: node migrations/001_init_schema.js
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
    console.log('🚀 Starting migration...\n');

    // ===== TABLE: rak_entries (Main Data) =====
    console.log('📊 Creating table: rak_entries');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rak_entries (
        id SERIAL PRIMARY KEY,
        spk VARCHAR(50) NOT NULL,
        rak VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        out_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        UNIQUE(spk, rak)
      );
    `);
    console.log('   ✓ Table created');

    // Create indexes for rak_entries
    console.log('📑 Creating indexes for rak_entries');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_spk ON rak_entries(spk);
      CREATE INDEX IF NOT EXISTS idx_rak ON rak_entries(rak);
      CREATE INDEX IF NOT EXISTS idx_status ON rak_entries(status);
      CREATE INDEX IF NOT EXISTS idx_deleted ON rak_entries(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_in_date ON rak_entries(in_date);
    `);
    console.log('   ✓ Indexes created');

    // ===== TABLE: audit_log (History Tracking) =====
    console.log('\n📜 Creating table: audit_log');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER,
        action VARCHAR(50) NOT NULL,
        spk VARCHAR(50),
        rak VARCHAR(50),
        old_value TEXT,
        new_value TEXT,
        details TEXT,
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES rak_entries(id) ON DELETE SET NULL
      );
    `);
    console.log('   ✓ Table created');

    console.log('📑 Creating indexes for audit_log');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_entry ON audit_log(entry_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_spk ON audit_log(spk);
    `);
    console.log('   ✓ Indexes created');

    // ===== TABLE: inout_log (Movement Tracking) =====
    console.log('\n📤 Creating table: inout_log');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inout_log (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER,
        spk VARCHAR(50) NOT NULL,
        rak VARCHAR(50) NOT NULL,
        movement_type VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        source VARCHAR(100),
        FOREIGN KEY (entry_id) REFERENCES rak_entries(id) ON DELETE SET NULL
      );
    `);
    console.log('   ✓ Table created');

    console.log('📑 Creating indexes for inout_log');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inout_spk ON inout_log(spk);
      CREATE INDEX IF NOT EXISTS idx_inout_type ON inout_log(movement_type);
      CREATE INDEX IF NOT EXISTS idx_inout_time ON inout_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_inout_entry ON inout_log(entry_id);
    `);
    console.log('   ✓ Indexes created');

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Tables created:');
    console.log('  1. rak_entries (main data)');
    console.log('  2. audit_log (history tracking)');
    console.log('  3. inout_log (movement tracking)\n');

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
