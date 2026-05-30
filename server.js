const express = require('express');
const cors = require('cors');
const path = require('path');
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

// ===== DATABASE INITIALIZATION =====
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS rak_entries (
        id SERIAL PRIMARY KEY,
        spk VARCHAR(50) NOT NULL,
        rak VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(spk, rak)
      );
      
      CREATE INDEX IF NOT EXISTS idx_spk ON rak_entries(spk);
      CREATE INDEX IF NOT EXISTS idx_rak ON rak_entries(rak);
    `);
    
    console.log('✓ Database initialized');
    client.release();
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// ===== API ENDPOINTS =====

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT spk, rak, source FROM rak_entries ORDER BY created_at DESC LIMIT 10000'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get data error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM rak_entries');
    const uniqueSPK = await pool.query('SELECT COUNT(DISTINCT spk) FROM rak_entries');
    const uniqueRAK = await pool.query('SELECT COUNT(DISTINCT rak) FROM rak_entries');
    const buildings = await pool.query('SELECT DISTINCT SUBSTRING(rak FROM 1 FOR 1) as building FROM rak_entries UNION SELECT \'IMPORT\' FROM rak_entries WHERE rak LIKE \'IMPORT%\' ORDER BY building');
    
    res.json({
      total: parseInt(total.rows[0].count),
      uniqueSPK: parseInt(uniqueSPK.rows[0].count),
      uniqueRAK: parseInt(uniqueRAK.rows[0].count),
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
  
  if (!spk || !rak) {
    return res.status(400).json({ error: 'SPK and RAK are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO rak_entries (spk, rak, source) VALUES ($1, $2, $3) ON CONFLICT (spk, rak) DO NOTHING RETURNING *',
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

// Delete entry
app.delete('/api/entries/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM rak_entries WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted', entry: result.rows[0] });
  } catch (err) {
    console.error('Delete entry error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Get entries by SPK and RAK (for modal details)
app.get('/api/entries/detail/:rak', async (req, res) => {
  const { rak } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, spk, rak, source FROM rak_entries WHERE rak = $1 ORDER BY created_at DESC',
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
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

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
            'INSERT INTO rak_entries (spk, rak, source) VALUES ($1, $2, $3) ON CONFLICT (spk, rak) DO NOTHING RETURNING id',
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
  const RESET_PASSWORD = process.env.RESET_PASSWORD || 'RAK_ADMIN_2024';
  
  // Verify password
  if (!password) {
    return res.status(401).json({ error: 'Password required' });
  }
  
  if (password !== RESET_PASSWORD) {
    return res.status(403).json({ error: 'Invalid password' });
  }
  
  try {
    await pool.query('TRUNCATE TABLE rak_entries RESTART IDENTITY');
    console.log('✓ Admin reset data executed');
    res.json({ message: 'All data has been deleted', status: 'success' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset data: ' + err.message });
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

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Database connection pooled and ready');
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
