# RAK IP IMPOR Dashboard - Setup Guide

## Fitur Utama
- ✓ Koneksi ke Database PostgreSQL di Railway
- ✓ Import data dari Excel (.xlsx, .xls, .csv)
- ✓ Dashboard real-time dengan statistik
- ✓ Pencarian dan filter data
- ✓ Manajemen RAK dan SPK
- ✓ Responsive design

## Prerequisites
- Node.js 14+ 
- npm atau yarn
- Railway account (gratis di https://railway.app)

## Local Setup (Development)

### 1. Install Dependencies
```bash
cd "IP IMPORT DASHBOARD"
npm install
```

### 2. Setup Database Lokal (PostgreSQL)
Pastikan PostgreSQL sudah terinstall. Buat database baru:
```bash
createdb rak_dashboard
```

### 3. Configure .env
Buat file `.env` di root folder:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/rak_dashboard
NODE_ENV=development
PORT=3000
```

### 4. Run Server
```bash
npm start
```
Server akan berjalan di http://localhost:3000

## Deploy ke Railway

### 1. Buat Project di Railway
- Buka https://railway.app
- Klik "New Project"
- Pilih "GitHub" atau upload manual
- Connect GitHub repository

### 2. Buat PostgreSQL Database di Railway
- Klik "Add Service"
- Pilih "PostgreSQL"
- Railway akan otomatis membuat connection string

### 3. Get Database URL
- Di Railway dashboard, buka PostgreSQL service
- Copy connection string dari "Connect" tab
- Format: `postgresql://username:password@host:port/railway`

### 4. Setup Environment Variables
Di Railway project:
- Klik "Add Variable"
- Tambah: `DATABASE_URL` = (paste connection string dari step 3)
- Tambah: `NODE_ENV` = `production`
- Tambah: `PORT` = `3000`

### 5. Deploy
- Railway akan otomatis detect Node.js project
- Configure build command (jika perlu): `npm install`
- Configure start command: `npm start`
- Klik "Deploy"

## Struktur Project

```
IP IMPORT DASHBOARD/
├── server.js              # Express backend API
├── RAK_Dashboard.html     # Frontend dashboard
├── package.json          # Dependencies
├── .env.example          # Environment template
└── .gitignore           # Git ignore file
```

## API Endpoints

### GET /api/data
Ambil semua data RAK entries
```
Response: [{ spk, rak, source, created_at }, ...]
```

### GET /api/stats
Ambil statistik dashboard
```
Response: { total, uniqueSPK, uniqueRAK, buildings }
```

### POST /api/entries
Tambah entry baru
```
Body: { spk, rak, source? }
Response: { id, spk, rak, source, created_at, updated_at }
```

### DELETE /api/entries/:id
Hapus entry
```
Response: { message, entry }
```

### GET /api/entries/detail/:rak
Ambil detail untuk satu RAK
```
Response: [{ id, spk, rak, source }, ...]
```

### POST /api/import
Import dari Excel file
```
Form Data: file (multipart/form-data)
Response: { imported, skipped, errors }
```

### GET /api/health
Health check
```
Response: { status, timestamp }
```

## Format Excel yang Didukung

Spreadsheet harus memiliki kolom:
- **SPK** atau No. SPK atau Nomor SPK
- **RAK** atau Lokasi RAK atau Lokasi atau Location

### Contoh Format:
| SPK    | RAK       |
|--------|-----------|
| 15052  | N1        |
| 15239  | L10       |
| 15250  | K25       |

Atau dengan format berbeda:
| No. SPK | Lokasi RAK  |
|---------|-------------|
| 15052   | N1          |
| 15239   | L10         |
| 15250   | K25         |

## Troubleshooting

### Database Connection Error
- Pastikan DATABASE_URL benar di .env
- Untuk Railway: copy connection string dari dashboard
- Test connection: `npm start` - cek logs

### Excel Import Failed
- Pastikan file format .xlsx, .xls, atau .csv
- Pastikan ada kolom SPK dan RAK (case-insensitive)
- Batas: max 10000 entries per import

### Port Already in Use
```bash
# Change PORT in .env atau:
PORT=3001 npm start
```

### CORS Error di Frontend
Pastikan backend berjalan di `http://localhost:3000` untuk development
Untuk production (Railway), frontend otomatis use relative URLs

## Features

### Input Manual Data
- Masukkan SPK dan Lokasi RAK
- Tekan Enter atau klik tombol
- Data otomatis tersimpan di database

### Import Batch dari Excel
1. Klik "Pilih File Excel"
2. Select file .xlsx/.xls/.csv
3. Tunggu proses import
4. Lihat status berhasil/gagal

### Filter & Search
- Klik tab Building untuk filter per gedung
- Gunakan search untuk cari SPK atau RAK
- Click RAK card untuk lihat detail

### Dashboard Stats
- Total Records: jumlah entry
- Unique SPK: berapa nomor SPK unik
- Active RAK: berapa lokasi unik
- Buildings: berapa gedung

## Database Schema

```sql
CREATE TABLE rak_entries (
  id SERIAL PRIMARY KEY,
  spk VARCHAR(50) NOT NULL,
  rak VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(spk, rak)
);

CREATE INDEX idx_spk ON rak_entries(spk);
CREATE INDEX idx_rak ON rak_entries(rak);
```

## Notes

- Duplicate entries (same SPK + RAK) tidak bisa ditambah
- Data akan persist di database Railroad
- Support multiple sheets dalam 1 file Excel
- Semua RAK otomatis uppercase
- Max query limit: 10000 entries

## Support

Untuk bantuan lebih lanjut:
- Railway Docs: https://docs.railway.app
- PostgreSQL: https://www.postgresql.org/docs/
- Express: https://expressjs.com/

---
Last Updated: 2024
