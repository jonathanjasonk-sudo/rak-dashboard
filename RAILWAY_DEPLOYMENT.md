# Railway Deployment Guide - RAK IP IMPOR Dashboard

## Langkah-Langkah Deploy ke Railway

### LANGKAH 1: Persiapan Local
1. Pastikan Node.js sudah terinstall:
   ```bash
   node --version
   npm --version
   ```

2. Buka terminal di folder `IP IMPORT DASHBOARD`

3. Install dependencies:
   ```bash
   npm install
   ```

### LANGKAH 2: Setup GitHub Repository
Railway work best dengan GitHub integration. Pilih salah satu:

**OPSI A: Jika sudah punya GitHub**
1. Buat repository baru di https://github.com/new
   - Repository name: `rak-dashboard`
   - Add .gitignore: Node

2. Di folder local:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/rak-dashboard.git
   git push -u origin main
   ```

**OPSI B: Upload Manual ke Railway (tanpa GitHub)**
- Railway juga support direct upload
- Bisa drag-drop folder atau gunakan Railway CLI

### LANGKAH 3: Buat Railway Account
1. Kunjungi https://railway.app
2. Klik "Sign Up"
3. Pilih GitHub atau Email untuk register
4. Verify email jika perlu

### LANGKAH 4: Buat Project di Railway

1. Di Railway dashboard klik "New Project"
2. Pilih salah satu:
   - **GitHub**: Connect ke repository GitHub
   - **Blank Project**: Mulai dari kosong

3. Jika GitHub: authorisasi Railway, pilih repository

4. Railway akan auto-detect Node.js project

### LANGKAH 5: Setup PostgreSQL Database

1. Di Railway project, klik "Add Service"
2. Pilih "PostgreSQL"
3. Railway akan otomatis create database instance
4. Tunggu sampai status "running" (biasanya 1-2 menit)

### LANGKAH 6: Get Database Connection String

1. Di Railway, klik tab "PostgreSQL"
2. Buka tab "Connect" atau lihat Environment variables
3. Copy connection string, formatnya:
   ```
   postgresql://postgres:PASSWORD@host.railway.app:PORT/railway
   ```
4. Atau cari di "Variables" tab → `DATABASE_URL`

### LANGKAH 7: Configure Environment Variables

**Method 1: Via Railway Dashboard**
1. Klik pada Node.js service
2. Buka tab "Variables"
3. Tambah variable baru:
   - Key: `DATABASE_URL`
   - Value: (paste connection string dari step 6)
4. Tambah variable kedua:
   - Key: `NODE_ENV`
   - Value: `production`

**Method 2: Via .env.production**
Buat file `.env.production`:
```
DATABASE_URL=postgresql://postgres:PASSWORD@host.railway.app:PORT/railway
NODE_ENV=production
PORT=3000
```

### LANGKAH 8: Deploy

1. Jika pakai GitHub:
   - Railway akan auto-deploy saat push ke main branch
   - Atau klik "Deploy" di dashboard

2. Jika GitHub tidak connect:
   - Klik "Deploy"
   - Atau gunakan Railway CLI: `railway up`

3. Tunggu proses build selesai (2-5 menit)
   - Lihat logs untuk memastikan tidak ada error

### LANGKAH 9: Test aplikasi

1. Setelah deploy selesai, Railway akan give URL:
   ```
   https://your-app-randomstring.railway.app
   ```

2. Buka URL di browser

3. Test features:
   - ✓ Dashboard load dengan data
   - ✓ Add manual data
   - ✓ Import Excel file
   - ✓ Search dan filter working

### LANGKAH 10: Setup Custom Domain (Optional)

1. Di Railway project settings
2. Buka "Domains"
3. Klik "Add Domain"
4. Masukkan domain Anda
5. Update DNS records sesuai instruksi Railway

## Troubleshooting Railway Deployment

### Problem 1: Build Error "Cannot find module"
**Solution:**
```bash
npm install
git add package-lock.json
git commit -m "Update packages"
git push
```

### Problem 2: Database Connection Refused
**Check:**
- Pastikan DATABASE_URL benar (copy ulang dari Railway)
- Cek PostgreSQL service status: harus "running"
- Lihat logs: `railway logs`

### Problem 3: Port Not Available
**Railway auto-assign port, jangan hardcode. Gunakan:**
```javascript
const PORT = process.env.PORT || 3000;
```

### Problem 4: Timeout saat deploy
**Solution:**
- Timeout biasanya 15 menit
- Cek npm dependencies - bisa reduce size
- Bisa increase timeout di settings

### Problem 5: Environment Variables tidak apply
**Fix:**
1. Re-deploy: `git push` atau klik deploy button
2. Verify variables di Railway dashboard
3. Restart service: klik stop → start

## Monitor Aplikasi

### Logs
```bash
# Via Railway web:
Dashboard → Service → Logs tab

# Via CLI:
railway logs
```

### Performance
- Railway dashboard menunjukkan CPU, Memory usage
- Monitor di "Metrics" tab

### Alerts
Set up alerts jika app down:
- Settings → Alerts
- Configure email notification

## Update Aplikasi

### Cara Update Code:

**If using GitHub:**
```bash
git add .
git commit -m "Update features"
git push origin main
```
Railway auto-redeploy

**If manual upload:**
```bash
railway up
```

### Update Dependencies:
```bash
npm update
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

## Cost & Pricing

Railway pricing:
- **Free tier**: $5/bulan credit (usually enough for small project)
- **PostgreSQL**: included dalam credit
- **Node.js**: included
- **Overage**: charged per hour

Cara reduce cost:
- Clean unused services
- Set resource limits
- Monitor usage di Railway dashboard

## Backup Database

Railway auto-backup, tapi bisa manual:

```bash
# Connect ke Railway PostgreSQL
railway connect

# Dump database
pg_dump railway > backup.sql

# Restore
psql railway < backup.sql
```

## Scale Application

Jika traffic tinggi:
1. Increase resource allocation
2. Enable auto-scaling (Pro plan)
3. Add caching layer

## Useful Links

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/reference/cli)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Support

- Railway Support: https://railway.app/help
- Email: support@railway.app
- Discord: https://discord.gg/railway

---

**Setelah semua selesai, aplikasi Anda ready untuk production!** 🚀
