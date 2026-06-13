# 🗄️ PostgreSQL Auto-Migration Guide

## ✨ YANG SUDAH OTOMATIS

Ketika server start (baik di Railway atau lokal), ini akan terjadi **OTOMATIS** tanpa manual input:

```javascript
// Di server.js - initDatabase() function
const tables = [
  { name: 'rak_entries', label: 'IP Import' },
  { name: 'ip_local_entries', label: 'IP Local' },
  { name: 'rubber_local_entries', label: 'Rubber Local' },
  { name: 'rubber_import_entries', label: 'Rubber Import' }
];

// Setiap table akan CREATE IF NOT EXISTS
// Jadi aman dijalankan berkali-kali tanpa error
```

### Kapan Terjadi?
1. **Saat server start** - `npm start` atau di Railway deployment
2. **Otomatis cek koneksi** - Retry 5x jika database belum siap
3. **Buat tabel jika belum ada** - `CREATE TABLE IF NOT EXISTS`
4. **Buat index otomatis** - Untuk performa query

---

## 🚀 SETUP DI RAILWAY (Production)

Hanya butuh 2 hal:

### 1. Environment Variables Sudah Benar ✅
```env
DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
NODE_ENV=production
PORT=3000
RESET_PASSWORD=d14m0nd
```

**File:** `.env` ✅ Sudah ada dan benar

### 2. Saat Deploy
- Railway akan:
  1. Install dependencies dari `package.json` ✅
  2. Run `npm start` (dari package.json) ✅
  3. server.js akan auto-init database ✅
  4. **Tabel otomatis dibuat** ✅

**TIDAK PERLU** menjalankan migration manual!

---

## 🖥️ SETUP LOKAL (Development)

### Pertama kali setup:

```bash
# 1. Clone repo
git clone https://github.com/jonathanjasonk-sudo/rak-dashboard
cd rak-dashboard

# 2. Install dependencies
npm install

# 3. Setup PostgreSQL lokal
# Opsi A: Pakai Docker
docker run --name postgres-local -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Opsi B: Install PostgreSQL native
# (Sudah install? skip)

# 4. Buat database
createdb -U postgres rak_dashboard

# 5. Update .env untuk lokal
DATABASE_URL=postgresql://postgres:password@localhost:5432/rak_dashboard
NODE_ENV=development

# 6. Start server
npm start
```

### Hasilnya:
```
✓ Connected to PostgreSQL
✓ Table rak_entries initialized
✓ Table ip_local_entries initialized
✓ Table rubber_local_entries initialized
✓ Table rubber_import_entries initialized
✅ Database initialization completed
```

---

## 🔄 Jika Ingin Manual (Optional)

**Tidak perlu**, tapi jika penasaran:

```bash
# Run individual migration files
node migrations/003_add_ip_local_table.js
node migrations/004_add_rubber_local_table.js
node migrations/005_add_rubber_import_table.js
```

Tapi ini sudah otomatis di `initDatabase()`, jadi **tidak perlu** dilakukan!

---

## 🆚 Comparison: Automatic vs Manual

| Cara | Pro | Contra |
|------|-----|--------|
| **Automatic** (sekarang) | ✅ Tidak perlu setup manual<br>✅ Sama untuk lokal & production<br>✅ Aman di-rerun berkali-kali | - |
| **Manual Migration** | Kontrol penuh | ❌ Harus jalankan script<br>❌ Beda di lokal & production<br>❌ Rawan lupa jalankan |

---

## 📊 Schema Tabel (Sama untuk Semua)

```sql
CREATE TABLE [table_name] (
  id SERIAL PRIMARY KEY,
  spk VARCHAR(50) NOT NULL,
  rak VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(spk, rak)
);

CREATE INDEX idx_[table_name]_spk ON [table_name](spk);
CREATE INDEX idx_[table_name]_rak ON [table_name](rak);
CREATE INDEX idx_[table_name]_deleted ON [table_name](deleted_at);
```

---

## ✅ Checklist Saat Deploy

- [ ] `.env` sudah punya `DATABASE_URL`
- [ ] `NODE_ENV=production` di .env
- [ ] Railway PostgreSQL sudah aktif
- [ ] Jalankan `npm start` atau deploy ke Railway
- [ ] Cek console log - harus ada "✓ Table ... initialized"
- [ ] Buka dashboard - harus bisa akses

**Itu saja!** Semua tabel otomatis dibuat. 🎉

---

## 🚨 Troubleshooting

### Error: "Connection refused"
```
→ Cek DATABASE_URL di .env
→ Pastikan PostgreSQL sudah running
→ Di Railway, check if postgres.railway.internal accessible
```

### Error: "Table already exists"
```
→ Normal jika server di-restart
→ Pakai CREATE TABLE IF NOT EXISTS (sudah ada)
```

### Error: "Index already exists"
```
→ Sama seperti table
→ Pakai CREATE INDEX IF NOT EXISTS (sudah ada)
```

### Table tidak dibuat
```
→ Cek console log server
→ Pastikan database connection OK
→ Cek permissions user PostgreSQL
```

---

## 📝 Kesimpulan

**Jangan manual input apapun!** 

Sistem sudah auto-init:
- ✅ Connect ke database
- ✅ Create all 4 tables
- ✅ Create semua indexes
- ✅ Safe untuk di-rerun

Cukup deploy ke Railway dan biarkan dia bekerja. 🚀
