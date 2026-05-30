# 🚀 RAK Dashboard - Complete Setup Package

Selamat! Anda sekarang memiliki sistem yang lengkap untuk:
- ✅ Koneksi ke Railway Database
- ✅ Backend API dengan Express.js
- ✅ Frontend Dashboard interaktif
- ✅ Import Excel data otomatis
- ✅ Search, filter, dan manajemen data

---

## 📁 File yang Telah Dibuat

### **Backend & Server**
- `server.js` - Express backend dengan API endpoints
- `package.json` - Node.js dependencies dan scripts
- `.env.example` - Template environment variables

### **Frontend**
- `RAK_Dashboard.html` - Dashboard UI lengkap dengan chart dan table

### **Database**
- Setup untuk PostgreSQL (auto-created di Railway)
- Schema: table `rak_entries` dengan indexes

### **Configuration**
- `.env.example` - Template untuk database URL
- `.gitignore` - Git ignore patterns
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Local Docker setup

### **Documentation**
- `README.md` - Setup guide dan dokumentasi
- `RAILWAY_DEPLOYMENT.md` - Panduan deploy ke Railway
- `setup.sh` / `setup.bat` - Automated setup scripts
- `sample-import.js` - Script untuk generate contoh Excel

---

## ⚡ Quick Start (5 Menit)

### Windows Users:
```cmd
1. Double-click setup.bat
2. Update .env file dengan DATABASE_URL
3. Run: npm start
4. Open: http://localhost:3000
```

### Mac/Linux Users:
```bash
1. chmod +x setup.sh
2. ./setup.sh
3. Update .env file
4. npm start
5. Open: http://localhost:3000
```

### Docker (Local):
```bash
docker-compose up
# PostgreSQL + Node.js akan running
# Open: http://localhost:3000
```

---

## 📊 Fitur Utama

### Dashboard
- Total Records, Unique SPK, Active RAK, Buildings stats
- Distribution chart per building
- SPK count bar chart
- Real-time data updates

### Input Data
- Manual entry form (SPK + RAK)
- Bulk import dari Excel
- Support .xlsx, .xls, .csv files
- Auto-detect column names

### Management
- Search by SPK atau RAK
- Filter by Building
- Click RAK untuk lihat detail
- Delete entries
- View recent additions

---

## 🚀 Deploy ke Railway

### Step 1: Setup Local
```bash
npm install
```

### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/rak-dashboard
git push -u origin main
```

### Step 3: Railway Setup
1. Visit https://railway.app
2. New Project → Select GitHub Repo
3. Add PostgreSQL service
4. Set DATABASE_URL variable
5. Deploy!

**Detail lengkap → baca `RAILWAY_DEPLOYMENT.md`**

---

## 📝 Excel Import Format

Spreadsheet harus punya kolom:
- **SPK** (atau: No. SPK, Nomor SPK)
- **RAK** (atau: Lokasi RAK, Lokasi, Location)

### Contoh:
```
SPK    | RAK
-------|------
15052  | N1
15239  | L10
15250  | K25
```

---

## 🔌 API Endpoints

```
GET    /api/data              - Ambil semua data
GET    /api/stats             - Statistik dashboard
GET    /api/health            - Health check
POST   /api/entries           - Tambah entry
DELETE /api/entries/:id       - Hapus entry
GET    /api/entries/detail/:rak - Detail per RAK
POST   /api/import            - Import Excel
```

---

## 🗄️ Database

Automatic schema creation saat server start:

```sql
CREATE TABLE rak_entries (
  id SERIAL PRIMARY KEY,
  spk VARCHAR(50),
  rak VARCHAR(50),
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(spk, rak)
);
```

---

## 🔒 Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional
NODE_ENV=development|production
PORT=3000
```

**Untuk Railway:**
- Copy DATABASE_URL dari Railway PostgreSQL service
- Format: `postgresql://postgres:PASS@host.railway.app:5432/railway`

---

## 📌 Penting

1. **Jangan commit `.env` file** - sudah di .gitignore
2. **Production mode**: Set NODE_ENV=production di Railway
3. **Database backup**: Railway auto-backup daily
4. **Port**: Railway auto-assign, jangan hardcode
5. **SSL**: Railway menggunakan SSL untuk DATABASE_URL

---

## 🆘 Troubleshooting

### Error: Cannot connect to database
```
1. Check DATABASE_URL di .env
2. Pastikan PostgreSQL service running (Railway)
3. Test connection: npm start (lihat logs)
```

### Error: Excel import failed
```
1. Pastikan kolom SPK dan RAK ada
2. Format harus .xlsx atau .csv
3. Max 10000 entries per file
```

### Port 3000 already in use
```
PORT=3001 npm start
```

### Module not found
```
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📚 File Structure

```
IP IMPORT DASHBOARD/
├── server.js                    ← Backend API
├── RAK_Dashboard.html           ← Frontend
├── package.json                 ← Dependencies
├── .env.example                 ← Env template
├── .env                         ← Your variables (git ignored)
├── .gitignore                   ← Git ignore
├── Dockerfile                   ← Container config
├── docker-compose.yml           ← Local Docker
├── README.md                    ← Full docs
├── RAILWAY_DEPLOYMENT.md        ← Deploy guide
├── setup.sh / setup.bat         ← Auto setup
└── sample-import.js             ← Sample script
```

---

## 🎯 Next Steps

1. **Local Development**
   - Run: `npm start`
   - Test di: `http://localhost:3000`
   - Import sample Excel file

2. **Deploy to Railway**
   - Follow `RAILWAY_DEPLOYMENT.md`
   - Get free $5/month credit
   - PostgreSQL included

3. **Production Ready**
   - Set NODE_ENV=production
   - Monitor at Railway dashboard
   - Enable auto-scaling (if needed)

---

## 📞 Support

- **Railway Help**: https://docs.railway.app
- **Express Docs**: https://expressjs.com
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Node.js**: https://nodejs.org/docs/

---

## ✨ Features Included

- ✅ Express.js REST API
- ✅ PostgreSQL database
- ✅ Excel import (XLSX)
- ✅ Real-time dashboard
- ✅ Search & filter
- ✅ Responsive design
- ✅ Dark theme UI
- ✅ Docker support
- ✅ Railway deployment ready

---

## 🎉 You're All Set!

Aplikasi Anda siap untuk:
- Development lokal
- Deployment ke Railway
- Scaling production
- Team collaboration

**Happy coding! 🚀**

---

*Last Updated: 2024*
*For updates, check https://railway.app dan https://expressjs.com*
