/**
 * 📚 TEMPLATE: Berbagai Jenis Table yang Sering Digunakan
 * Copy-paste sesuai kebutuhan
 */

// ========================================
// 1️⃣ TABLE SEDERHANA (Users)
// ========================================
const SIMPLE_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
`;

// ========================================
// 2️⃣ TABLE DENGAN FOREIGN KEY (Orders)
// ========================================
const TABLE_WITH_FK = `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
`;

// ========================================
// 3️⃣ TABLE DENGAN SOFT DELETE
// ========================================
const TABLE_SOFT_DELETE = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_deleted ON products(deleted_at);
`;

// ========================================
// 4️⃣ TABLE DENGAN JSON COLUMN
// ========================================
const TABLE_JSON = `
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id INTEGER,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_event ON logs(event_type);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_metadata ON logs USING GIN(metadata);
`;

// ========================================
// 5️⃣ TABLE INVENTORY/STOCK
// ========================================
const TABLE_INVENTORY = `
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  warehouse_location VARCHAR(50),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_location);
`;

// ========================================
// 6️⃣ TABLE AUDIT/HISTORY
// ========================================
const TABLE_HISTORY = `
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  action VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);
`;

// ========================================
// 7️⃣ CARA MENAMBAH COLUMN KE TABLE EXISTING
// ========================================
const ALTER_TABLE = `
-- Menambah column baru
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Mengubah type column
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(12,2);

-- Menambah constraint
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE(email);

-- Menghapus column
ALTER TABLE users DROP COLUMN phone;

-- Rename column
ALTER TABLE users RENAME COLUMN name TO full_name;

-- Add default value
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
`;

// ========================================
// 8️⃣ LIHAT STRUKTUR TABLE
// ========================================
const VIEW_TABLE = `
-- Lihat semua columns di table
\\d users

-- Lihat semua tables
\\dt

-- Lihat struktur spesifik
\\d+ users

-- Lihat constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users';

-- Lihat indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'users';
`;

// ========================================
// 9️⃣ STATISTIK DATABASE
// ========================================
const DB_STATS = `
-- Jumlah rows per table
SELECT table_name, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Ukuran table
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Lihat semua tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
`;

// ========================================
// 🔟 BACKUP & RESTORE
// ========================================
const BACKUP_RESTORE = `
-- Backup satu table
pg_dump -h localhost -U postgres -d rak_dashboard -t users > backup_users.sql

-- Restore dari backup
psql -h localhost -U postgres -d rak_dashboard < backup_users.sql

-- Backup seluruh database
pg_dump -h localhost -U postgres rak_dashboard > backup_full.sql

-- Restore full database
psql -h localhost -U postgres -d rak_dashboard < backup_full.sql
`;

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           TEMPLATE DATABASE TABLES & QUERIES                  ║
╚════════════════════════════════════════════════════════════════╝

1️⃣  SIMPLE_TABLE             - Table dengan columns dasar
2️⃣  TABLE_WITH_FK           - Table dengan Foreign Key
3️⃣  TABLE_SOFT_DELETE       - Table dengan soft delete
4️⃣  TABLE_JSON              - Table dengan JSON column
5️⃣  TABLE_INVENTORY         - Table inventory/stock
6️⃣  TABLE_HISTORY           - Audit/history log
7️⃣  ALTER_TABLE             - Modifikasi table existing
8️⃣  VIEW_TABLE              - Query untuk lihat struktur
9️⃣  DB_STATS                - Statistik database
🔟 BACKUP_RESTORE           - Backup & restore

Cara menggunakan:
1. Copy template SQL yang sesuai
2. Buka Railway Console → Database tab
3. Paste dan jalankan query
4. ATAU: Buat migration file dan jalankan via Node.js

Contoh:
  node migrations/001_init_schema.js
  node migrations/002_add_users_table.js
`);
