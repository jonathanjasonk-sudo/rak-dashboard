# 📚 Panduan Menambah Database Tables Baru

## 🎯 2 Cara Praktis

### **Cara 1: Via Railway Console (Paling Mudah)**

**Langkah-langkah:**

1. Buka [Railway Dashboard](https://railway.app) → Project `rak-dashboard`
2. Pilih service **PostgreSQL**
3. Klik tab **"Database"**
4. Klik tombol **"Connect"**
5. Pilih method: `pgAdmin` atau copy URL connection string
6. Paste SQL Query Anda
7. Klik **Execute** atau tekan Enter

**⚠️ Keuntungan & Kerugian:**
- ✅ Cepat, langsung executed
- ✅ Tidak perlu running aplikasi
- ❌ Sulit di-track (tidak ada history)
- ❌ Riskiko typo langsung affected produksi

---

### **Cara 2: Via Migration File di Node.js (REKOMENDASI)**

**Mengapa lebih baik?**
- ✅ Version control (bisa di-track di Git)
- ✅ Bisa di-reuse & didokumentasikan
- ✅ Bisa di-rollback
- ✅ Aman & terstruktur

**Folder Structure:**
```
IP IMPORT DASHBOARD/
├── migrations/
│   ├── 001_init_schema.js        ← Initial tables
│   ├── 002_add_users_table.js     ← Table baru
│   ├── 003_add_permissions.js     ← Table baru lagi
│   └── TEMPLATES.js                ← Template
├── server.js
├── package.json
└── ...
```

**Langkah-langkah:**

1. **Buat file migration baru:**
   ```bash
   touch migrations/003_add_new_table.js
   ```

2. **Copy template structure:**
   ```javascript
   require('dotenv').config();
   const { Pool } = require('pg');

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });

   async function runMigration() {
     const client = await pool.connect();
     
     try {
       console.log('🚀 Running migration...\n');

       // Your SQL queries here
       await client.query(`
         CREATE TABLE IF NOT EXISTS your_table (
           id SERIAL PRIMARY KEY,
           name VARCHAR(100) NOT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         );
       `);

       console.log('✅ Migration completed!');
     } catch (err) {
       console.error('❌ Error:', err.message);
       process.exit(1);
     } finally {
       client.release();
       await pool.end();
     }
   }

   runMigration();
   ```

3. **Jalankan migration:**
   ```bash
   node migrations/003_add_new_table.js
   ```

4. **Output:**
   ```
   🚀 Running migration...
   
   ✅ Migration completed!
   ```

---

## 📝 Contoh: Menambah Table Baru

### Scenario: Ingin menambah tabel `customers`

**File: `migrations/003_add_customers.js`**

```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding customers table...\n');

    // Create main table
    console.log('👥 Creating table: customers');
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(200),
        address TEXT,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);
    console.log('   ✓ Table created');

    // Create indexes for performance
    console.log('📑 Creating indexes');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
      CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(deleted_at);
    `);
    console.log('   ✓ Indexes created');

    // Add audit log untuk customers
    console.log('📜 Adding audit log for customers');
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_audit (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        action VARCHAR(50),
        old_value TEXT,
        new_value TEXT,
        modified_by VARCHAR(100),
        modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `);
    console.log('   ✓ Audit table created');

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Tables created:');
    console.log('  • customers');
    console.log('  • customer_audit\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
```

**Jalankan:**
```bash
node migrations/003_add_customers.js
```

---

## 🔧 Operasi Database Umum

### Menambah Column ke Table Existing

```javascript
await client.query(`
  ALTER TABLE rak_entries 
  ADD COLUMN priority VARCHAR(50) DEFAULT 'normal';
`);
```

### Mengubah Type Column

```javascript
await client.query(`
  ALTER TABLE rak_entries 
  ALTER COLUMN source TYPE TEXT;
`);
```

### Menambah Index

```javascript
await client.query(`
  CREATE INDEX IF NOT EXISTS idx_priority 
  ON rak_entries(priority);
`);
```

### Menghapus Column

```javascript
await client.query(`
  ALTER TABLE rak_entries 
  DROP COLUMN priority;
`);
```

### Lihat Semua Tables

```javascript
const result = await client.query(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name;
`);
console.log(result.rows);
```

---

## 🚀 Workflow di Production

### **Via Railway CLI** (Jika sudah install)

```bash
# Login
railway login

# Link project
railway link

# Run migration
railway run node migrations/003_add_customers.js
```

### **Via GitHub Actions** (Automated)

Buat file `.github/workflows/migrate.yml`:

```yaml
name: Database Migration

on:
  push:
    branches:
      - main
    paths:
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: |
          DATABASE_URL=${{ secrets.DATABASE_URL }} \
          node migrations/*.js
```

---

## 📊 Monitoring Database

### Lihat ukuran table

```javascript
const result = await client.query(`
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
`);
```

### Lihat statistik rows

```javascript
const result = await client.query(`
  SELECT table_name, n_live_tup as row_count
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC;
`);
```

---

## ⚠️ Best Practices

1. **Selalu buat index** pada columns yang sering di-query
2. **Gunakan UNIQUE constraint** pada columns yang tidak boleh duplikat
3. **Tambah FOREIGN KEY** untuk data integrity
4. **Soft delete pattern** untuk audit trail (jangan hard delete)
5. **Versioning migrations** dengan nomor prefix (001_, 002_, etc)
6. **Backup sebelum migrate** di production
7. **Test di local dulu** sebelum push ke production

---

## 🆘 Troubleshooting

### "ERROR: relation already exists"
Table sudah ada, skip atau rename.

```javascript
// Alternatif: check dulu
const exists = await client.query(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'customers'
  );
`);
if (exists.rows[0].exists) {
  console.log('Table already exists');
  return;
}
```

### "ERROR: connection refused"
Database tidak running atau URL salah.

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### "ERROR: permission denied"
User tidak punya privilege. Gunakan superuser atau minta admin.

---

## 📝 Checklist Sebelum Deploy

- [ ] Buat file migration dengan nama deskriptif
- [ ] Test migration di local environment
- [ ] Backup database (via Railway atau manual)
- [ ] Review SQL syntax
- [ ] Tambah error handling
- [ ] Commit & push ke Git
- [ ] Run migration di production
- [ ] Verify via Railway console
- [ ] Update dokumentasi

---

**Happy migrating! 🚀**
