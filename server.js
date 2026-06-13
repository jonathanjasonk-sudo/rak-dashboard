const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { Pool } = require('pg');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== DATABASE CONNECTION =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rak_dashboard',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// ===== MULTER SETUP =====
const upload = multer({ storage: multer.memoryStorage() });

// ===== TABLE MAPPING =====
const TAB_NAMES = {
  'ip_import': 'rak_entries',
  'ip_local': 'ip_local_entries',
  'rubber_local': 'rubber_local_entries',
  'rubber_import': 'rubber_import_entries'
};

const getTableName = (tab = 'ip_import') => {
  return TAB_NAMES[tab] || 'rak_entries';
};

const validateTab = (tab) => {
  return Object.keys(TAB_NAMES).includes(tab);
};

// ===== DATABASE INITIALIZATION =====
async function initDatabase() {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`\n🔄 Database connection attempt ${attempt}/${MAX_RETRIES}...`);
      const client = await pool.connect();
      console.log('✓ Connected to PostgreSQL');
      
      // Create all tables
      const tables = [
        { name: 'rak_entries', label: 'IP Import' },
        { name: 'ip_local_entries', label: 'IP Local' },
        { name: 'rubber_local_entries', label: 'Rubber Local' },
        { name: 'rubber_import_entries', label: 'Rubber Import' }
      ];

      for (const table of tables) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${table.name} (
            id SERIAL PRIMARY KEY,
            spk VARCHAR(50) NOT NULL,
            rak VARCHAR(50) NOT NULL,
            source VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP,
            UNIQUE(spk, rak)
          );
          
          CREATE INDEX IF NOT EXISTS idx_${table.name}_spk ON ${table.name}(spk);
          CREATE INDEX IF NOT EXISTS idx_${table.name}_rak ON ${table.name}(rak);
          CREATE INDEX IF NOT EXISTS idx_${table.name}_deleted ON ${table.name}(deleted_at);
        `);
        console.log(`✓ Table ${table.name} (${table.label}) initialized`);
      }
      
      client.release();
      console.log('✅ Database initialization completed\n');
      return true;
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed:`, err.message);
      
      if (attempt === MAX_RETRIES) {
        console.error('\n⚠️  Max retries reached. Database may not be ready.');
        console.error('ERROR:', err.message);
        return false;
      }
      
      console.log(`⏳ Retrying in ${RETRY_DELAY/1000}s...\n`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// ===== RUN MIGRATIONS =====
async function runMigrations() {
  console.log('\n📦 Running database migrations...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  Migrations directory not found, skipping...\n');
      return;
    }
    
    // Get all migration files, sorted
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') && !f.includes('TEMPLATE'))
      .sort();
    
    if (files.length === 0) {
      console.log('ℹ️  No migration files found\n');
      return;
    }
    
    console.log(`Found ${files.length} migration(s):\n`);
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`▶️  Running: ${file}`);
      
      try {
        // Import and run migration
        require(filePath);
      } catch (err) {
        // Migration module might exit process, that's ok
        console.error(`   Error in ${file}:`, err.message);
      }
    }
    
    console.log('\n✅ All migrations processed\n');
  } catch (err) {
    console.error('Error running migrations:', err.message);
  }
}

// ===== API ENDPOINTS =====

// Get all data (excluding soft deleted)
app.get('/api/data', async (req, res) => {
  const tab = req.query.tab || 'ip_import';
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const table = getTableName(tab);
  try {
    const result = await pool.query(
      `SELECT id, spk, rak, source, created_at FROM ${table} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10000`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get data error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Get deleted data only
app.get('/api/data/deleted', async (req, res) => {
  const tab = req.query.tab || 'ip_import';
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const table = getTableName(tab);
  try {
    const result = await pool.query(
      `SELECT id, spk, rak, source, created_at, deleted_at FROM ${table} WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 10000`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get deleted data error:', err);
    res.status(500).json({ error: 'Failed to fetch deleted data' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  const tab = req.query.tab || 'ip_import';
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const table = getTableName(tab);
  try {
    const total = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE deleted_at IS NULL`);
    const uniqueSPK = await pool.query(`SELECT COUNT(DISTINCT spk) FROM ${table} WHERE deleted_at IS NULL`);
    const uniqueRAK = await pool.query(`SELECT COUNT(DISTINCT rak) FROM ${table} WHERE deleted_at IS NULL`);
    const deleted = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE deleted_at IS NOT NULL`);
    const buildings = await pool.query(`SELECT DISTINCT SUBSTRING(rak FROM 1 FOR 1) as building FROM ${table} WHERE deleted_at IS NULL UNION SELECT 'IMPORT' FROM ${table} WHERE rak LIKE 'IMPORT%' AND deleted_at IS NULL ORDER BY building`);
    
    res.json({
      total: parseInt(total.rows[0].count),
      uniqueSPK: parseInt(uniqueSPK.rows[0].count),
      uniqueRAK: parseInt(uniqueRAK.rows[0].count),
      deleted: parseInt(deleted.rows[0].count),
      buildings: buildings.rows.map(r => r.building).filter(b => b)
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Add entry
app.post('/api/entries', async (req, res) => {
  const { spk, rak, source = 'Manual' } = req.body;
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  if (!spk || !rak) {
    return res.status(400).json({ error: 'SPK and RAK are required' });
  }

  const table = getTableName(tab);
  try {
    const result = await pool.query(
      `INSERT INTO ${table} (spk, rak, source) VALUES ($1, $2, $3) ON CONFLICT (spk, rak) DO NOTHING RETURNING *`,
      [spk, rak.toUpperCase(), source]
    );
    
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Entry already exists' });
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add entry error:', err);
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// Delete entry (soft delete)
app.delete('/api/entries/:id', async (req, res) => {
  const { id } = req.params;
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const table = getTableName(tab);
  try {
    const result = await pool.query(
      `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found or already deleted' });
    }
    
    res.json({ message: 'Entry deleted', entry: result.rows[0] });
  } catch (err) {
    console.error('Delete entry error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Restore deleted entry
app.post('/api/entries/:id/restore', async (req, res) => {
  const { id } = req.params;
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const table = getTableName(tab);
  try {
    const result = await pool.query(
      `UPDATE ${table} SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found or not deleted' });
    }
    
    res.json({ message: 'Entry restored', entry: result.rows[0] });
  } catch (err) {
    console.error('Restore entry error:', err);
    res.status(500).json({ error: 'Failed to restore entry' });
  }
});

// Get entries by SPK and RAK (for modal details)
app.get('/api/entries/detail/:rak', async (req, res) => {
  const { rak } = req.params;
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const table = getTableName(tab);
  try {
    const result = await pool.query(
      `SELECT id, spk, rak, source, created_at FROM ${table} WHERE rak = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [rak]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get detail error:', err);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// Import from Excel
app.post('/api/import', upload.single('file'), async (req, res) => {
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const table = getTableName(tab);
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    let importedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    const errors = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (const row of data) {
        // Support multiple column name formats
        const spk = row['SPK'] || row['spk'] || row['No. SPK'] || row['No SPK'] || row['Nomor SPK'];
        const rak = row['RAK'] || row['rak'] || row['Lokasi RAK'] || row['Lokasi'] || row['Location'];

        if (!spk || !rak) {
          skippedCount++;
          continue;
        }

        try {
          const result = await pool.query(
            `INSERT INTO ${table} (spk, rak, source) VALUES ($1, $2, $3) ON CONFLICT (spk, rak) DO NOTHING RETURNING id`,
            [String(spk).trim(), String(rak).trim().toUpperCase(), `Excel: ${sheetName}`]
          );
          if (result.rows.length > 0) {
            importedCount++;
          } else {
            duplicateCount++;
          }
        } catch (err) {
          skippedCount++;
          errors.push(`${spk} - ${rak}: ${err.message}`);
        }
      }
    }

    res.json({
      message: 'Import completed',
      imported: importedCount,
      duplicate: duplicateCount,
      skipped: skippedCount,
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import file: ' + err.message });
  }
});

// Reset all data (for admin only - requires password)
app.post('/api/reset', async (req, res) => {
  const { password } = req.body;
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const RESET_PASSWORD = process.env.RESET_PASSWORD || 'RAK_ADMIN_2024';
  
  // Verify password
  if (!password) {
    return res.status(401).json({ error: 'Password required' });
  }
  
  if (password !== RESET_PASSWORD) {
    return res.status(403).json({ error: 'Invalid password' });
  }
  
  const table = getTableName(tab);
  try {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY`);
    console.log(`✓ Admin reset data executed for table: ${table}`);
    res.json({ message: 'All data has been deleted', status: 'success' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset data: ' + err.message });
  }
});

// Permanently delete all deleted data
app.post('/api/deleted/purge', async (req, res) => {
  const { password } = req.body;
  const tab = req.query.tab || 'ip_import';
  
  if (!validateTab(tab)) {
    return res.status(400).json({ error: 'Invalid tab' });
  }
  
  const RESET_PASSWORD = process.env.RESET_PASSWORD || 'RAK_ADMIN_2024';
  
  // Verify password
  if (!password) {
    return res.status(401).json({ error: 'Password required' });
  }
  
  if (password !== RESET_PASSWORD) {
    return res.status(403).json({ error: 'Invalid password' });
  }
  
  const table = getTableName(tab);
  try {
    const result = await pool.query(`DELETE FROM ${table} WHERE deleted_at IS NOT NULL`);
    console.log(`✓ Permanently purged deleted data from table: ${table}`);
    res.json({ message: `${result.rowCount} deleted records permanently removed`, status: 'success' });
  } catch (err) {
    console.error('Purge error:', err);
    res.status(500).json({ error: 'Failed to purge deleted data: ' + err.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ===== SERVE FRONTEND =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'RAK_Dashboard.html'));
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('🚀 Starting RAK Dashboard Server...');
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`💾 Database URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}\n`);
  
  // Try to init database
  const dbReady = await initDatabase();
  
  if (!dbReady) {
    console.log('⚠️  Database initialization failed, but server will continue...\n');
  }
  
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log('━'.repeat(50) + '\n');
  });
}

startServer().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
