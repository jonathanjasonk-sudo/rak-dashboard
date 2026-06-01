/**
 * 🎯 QUICK START: Template Siap Pakai untuk Table Baru
 * 
 * Cara menggunakan:
 * 1. Copy file ini: cp migrations/004_template.js migrations/004_your_table_name.js
 * 2. Edit nama table dan columns
 * 3. Jalankan: node migrations/004_your_table_name.js
 * 4. Commit: git add migrations/004_your_table_name.js && git commit -m "Add your_table migration"
 * 5. Push: git push
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
    console.log('🚀 Migration: Add New Table\n');

    // ================================================
    // ⚙️  STEP 1: Check if table exists
    // ================================================
    console.log('🔍 Checking if table exists...');
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'your_table_name'
      );
    `);

    if (checkTable.rows[0].exists) {
      console.log('⚠️  Table "your_table_name" already exists.\n');
      console.log('Choose one:');
      console.log('  1. Skip (table already created)');
      console.log('  2. Drop & recreate: ALTER TABLE your_table_name ...\n');
      return;
    }

    // ================================================
    // ⚙️  STEP 2: Create main table
    // ================================================
    console.log('📊 Creating table: your_table_name');
    await client.query(`
      CREATE TABLE IF NOT EXISTS your_table_name (
        id SERIAL PRIMARY KEY,
        
        -- 📝 Basic Columns
        name VARCHAR(200) NOT NULL,
        description TEXT,
        
        -- 📊 Status & Tracking
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
        
        -- ⚠️ OPTIONAL: Uncomment untuk features tambahan
        -- user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        -- metadata JSONB DEFAULT '{}',
        -- tags TEXT[] DEFAULT ARRAY[]::TEXT[]
      );
    `);
    console.log('   ✓ Table created\n');

    // ================================================
    // ⚙️  STEP 3: Create indexes untuk performa
    // ================================================
    console.log('📑 Creating indexes');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_your_table_name_name 
      ON your_table_name(name);
      
      CREATE INDEX IF NOT EXISTS idx_your_table_name_status 
      ON your_table_name(status);
      
      CREATE INDEX IF NOT EXISTS idx_your_table_name_created 
      ON your_table_name(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_your_table_name_deleted 
      ON your_table_name(deleted_at);
    `);
    console.log('   ✓ Indexes created\n');

    // ================================================
    // ⚙️  STEP 4: Insert sample data (optional)
    // ================================================
    console.log('📝 Inserting sample data (optional)');
    await client.query(`
      INSERT INTO your_table_name (name, status, description)
      VALUES 
        ('Sample 1', 'active', 'This is a sample entry'),
        ('Sample 2', 'inactive', 'Another sample')
      ON CONFLICT DO NOTHING;
    `);
    console.log('   ✓ Sample data inserted\n');

    // ================================================
    // ⚙️  STEP 5: Verify data
    // ================================================
    console.log('🔍 Verifying table structure');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'your_table_name'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Columns:');
    structure.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '✓ NULL' : '✗ NOT NULL';
      console.log(`     • ${col.column_name} (${col.data_type}) - ${nullable}`);
    });
    console.log();

    const rowCount = await client.query(`
      SELECT COUNT(*) FROM your_table_name;
    `);
    console.log(`   Rows: ${rowCount.rows[0].count}\n`);

    // ================================================
    // ✅ SUCCESS
    // ================================================
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║        ✅ MIGRATION COMPLETED SUCCESSFULLY        ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    console.log('📊 Next steps:');
    console.log('  1. Add API endpoints in server.js');
    console.log('  2. Create routes for CRUD operations');
    console.log('  3. Test with Postman or curl');
    console.log('  4. Update frontend if needed\n');

    console.log('📚 Example API endpoints to create:');
    console.log('  GET    /api/your_table_name');
    console.log('  GET    /api/your_table_name/:id');
    console.log('  POST   /api/your_table_name');
    console.log('  PUT    /api/your_table_name/:id');
    console.log('  DELETE /api/your_table_name/:id\n');

  } catch (err) {
    console.error('\n❌ MIGRATION FAILED\n');
    console.error('Error:', err.message);
    console.error('\nTips:');
    console.error('  • Check DATABASE_URL in .env');
    console.error('  • Verify PostgreSQL is running');
    console.error('  • Check table/column names');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ================================================
// 🚀 RUN MIGRATION
// ================================================
runMigration().then(() => {
  console.log('Migration process ended.\n');
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
