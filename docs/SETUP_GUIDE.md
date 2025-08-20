# Setup Guide - Telegram Help Desk Gateway

## Prerequisites

- Node.js 18+ dan npm
- MySQL 8.0+
- Telegram Bot Token

## 1. Setup Database

### Install MySQL
```bash
# Windows (menggunakan MySQL Installer)
# Download dari: https://dev.mysql.com/downloads/installer/

# macOS (menggunakan Homebrew)
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### Create Database
```sql
CREATE DATABASE telegram_helpdesk;
CREATE USER 'helpdesk_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON telegram_helpdesk.* TO 'helpdesk_user'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Setup Telegram Bot

1. Buka Telegram dan cari [@BotFather](https://t.me/botfather)
2. Ketik `/newbot` untuk membuat bot baru
3. Ikuti instruksi untuk memberi nama bot
4. Simpan token yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit file .env sesuai konfigurasi Anda
nano .env
```

### Konfigurasi .env
```env
DATABASE_URL="mysql://helpdesk_user:your_password@localhost:3306/telegram_helpdesk"
JWT_SECRET="your-very-secure-jwt-secret-key-here"
JWT_REFRESH_SECRET="your-very-secure-refresh-secret-key-here"
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
PORT=3000
FRONTEND_URL="http://localhost:4200"
```

### Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Method 1: Quick Setup (Recommended)
npm run db:setup

# Method 2: Manual Setup
npm run db:push          # Push schema to database
npm run db:seed          # Seed with sample data

# Method 3: Using Migrations (Production)
npm run db:migrate       # Create and run migration
npm run db:seed          # Seed with sample data
```

### Database Scripts
```bash
npm run db:push         # Push schema changes to DB
npm run db:migrate      # Create and run migrations (dev)
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:seed         # Seed database with sample data
npm run db:studio       # Open Prisma Studio (GUI)
npm run db:reset        # Reset database (⚠️ deletes all data)
npm run db:setup        # Quick setup: push + seed
```

### Start Backend
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve

# Build for production
ng build --configuration production
```

Frontend akan berjalan di `http://localhost:4200`

## 5. Verification

### Test Backend
```bash
curl http://localhost:3000/health
```
Response: `{"status":"OK","timestamp":"..."}`

### Test Telegram Bot
1. Buka Telegram
2. Cari bot Anda menggunakan username yang diberikan
3. Kirim pesan `/start`
4. Bot harus merespons

### Test Frontend
1. Buka `http://localhost:4200`
2. Register akun CS/Admin baru
3. Login dengan akun tersebut
4. Anda harus masuk ke dashboard

## 6. Production Deployment

### Backend (Express.js)
```bash
# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name telegram-helpdesk

# Setup nginx reverse proxy
# /etc/nginx/sites-available/telegram-helpdesk
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend (Angular)
```bash
# Build for production
ng build --configuration production

# Serve dengan nginx
# Copy dist/ ke /var/www/html/
cp -r dist/* /var/www/html/
```

## 7. Troubleshooting

### Database Connection Error
- Pastikan MySQL service berjalan
- Periksa credentials di .env
- Test koneksi: `mysql -u helpdesk_user -p telegram_helpdesk`

### Telegram Bot Error
- Pastikan token benar di .env
- Pastikan bot tidak digunakan polling di tempat lain
- Test token: `curl https://api.telegram.org/bot<TOKEN>/getMe`

### TypeScript Build Error
- Install missing types: `npm install --save-dev @types/morgan @types/node-telegram-bot-api`
- Fix JWT version: `npm install jsonwebtoken@8.5.1 @types/jsonwebtoken@8.5.9`

### Frontend Build Error
- Hapus node_modules dan package-lock.json
- Install ulang: `npm install --legacy-peer-deps`
- Update Angular CLI: `npm install -g @angular/cli@19`

### CORS Error
- Pastikan FRONTEND_URL di backend .env sesuai
- Periksa cors configuration di backend

**💡 Untuk troubleshooting lengkap, lihat [Troubleshooting Guide](TROUBLESHOOTING.md)**

## 8. Default Accounts

Setelah menjalankan `npm run db:seed`, akun berikut akan dibuat:

### Admin Account
- **Email:** `admin@helpdesk.com`
- **Password:** `admin123`
- **Role:** Admin

### Customer Service Accounts
- **CS 1:** `cs1@helpdesk.com` / `cs123`
- **CS 2:** `cs2@helpdesk.com` / `cs123`
- **CS 3:** `cs3@helpdesk.com` / `cs123`

### Sample Data
Database juga akan berisi:
- 3 sample clients (John Doe, Jane Smith, Bob Wilson)
- 1 active chat session dengan message history
- Demo conversation untuk testing

### Manual Account Creation
Jika tidak menggunakan seeding, buat admin via API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com", 
    "password": "admin123",
    "role": "ADMIN"
  }'
```

## 9. Monitoring & Logs

### Backend Logs
```bash
# PM2 logs
pm2 logs telegram-helpdesk

# Direct logs saat development
npm run dev
```

### Database Logs
```bash
# MySQL error log (Ubuntu)
sudo tail -f /var/log/mysql/error.log

# MySQL slow query log
sudo tail -f /var/log/mysql/mysql-slow.log
```