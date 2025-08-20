# Telegram Help Desk Gateway

Sistem gateway chat berbasis Telegram Bot yang meneruskan pesan dari client Telegram ke Customer Service (CS) melalui dashboard web dengan alokasi otomatis menggunakan sistem round robin.

## 🚀 Demo & Preview

![Dashboard Preview](https://via.placeholder.com/800x400/007BFF/FFFFFF?text=Telegram+Help+Desk+Dashboard)

### Fitur Utama
- 📱 **Telegram Bot Integration** - Client kirim pesan via Telegram
- 🎯 **Round Robin Allocation** - Otomatis alokasi CS berdasarkan beban kerja
- 💬 **Real-time Chat** - Dashboard web dengan Socket.IO
- 🔐 **JWT Authentication** - Secure login dengan access & refresh token
- 📊 **Session Management** - Kelola sesi chat client
- 🖼️ **Multimedia Support** - Teks, gambar, file, video, link
- 🔔 **Real-time Notifications** - Badge unread messages
- 📱 **Responsive Design** - UI mirip WhatsApp Web/Telegram Desktop

## 🛠️ Teknologi

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: MySQL + Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT (Access + Refresh Token)
- **Validation**: Joi
- **Bot**: node-telegram-bot-api

### Frontend
- **Framework**: Angular 19
- **Styling**: Bootstrap 5 + SCSS
- **State Management**: RxJS + Services
- **HTTP Client**: Angular HttpClient
- **Real-time**: Socket.IO Client

## 📁 Struktur Project

```
tele-help-desk/
├── backend/                 # Express.js TypeScript API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation middleware
│   │   ├── models/          # Prisma models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── types/           # TypeScript interfaces
│   ├── prisma/              # Database schema & migrations
│   └── uploads/             # File storage
├── frontend/                # Angular 19 SPA
│   ├── src/app/
│   │   ├── auth/            # Login/Register components
│   │   ├── dashboard/       # Main dashboard
│   │   ├── chat/            # Chat components
│   │   └── shared/          # Services, guards, models
├── docs/                    # Documentation
│   ├── API_DOCUMENTATION.md
│   └── SETUP_GUIDE.md
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Telegram Bot Token ([Cara buat bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot))

### 1. Clone Repository
```bash
git clone <repository-url>
cd tele-help-desk
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy & edit environment file
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Setup database (pilih salah satu method)
# Method 1: Quick setup (recommended untuk development)
npm run db:setup

# Method 2: Manual setup
npm run db:push
npm run db:seed

# Start backend
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start development server
ng serve
```

### 4. Database Configuration
```sql
CREATE DATABASE telegram_helpdesk;
CREATE USER 'helpdesk_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON telegram_helpdesk.* TO 'helpdesk_user'@'localhost';
```

### 5. Environment Variables (.env)
```env
DATABASE_URL="mysql://helpdesk_user:password@localhost:3306/telegram_helpdesk"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
PORT=3000
FRONTEND_URL="http://localhost:4200"
```

## 🔄 Alur Proses

1. **Client** kirim pesan ke Telegram Bot
2. **Bot** cek sesi aktif:
   - Jika belum ada → alokasi CS via **round robin**
   - Jika ada → teruskan ke CS yang sama
3. **CS** terima notifikasi real-time di dashboard
4. **CS** balas melalui dashboard web
5. **Bot** kirim balasan ke client Telegram
6. **CS** bisa mengakhiri sesi → client masuk pool baru

## 📊 Database Schema

```mermaid
erDiagram
    User ||--o{ Session : "cs_id"
    User ||--o{ RefreshToken : "user_id"
    Client ||--o{ Session : "client_id"
    Session ||--o{ Chat : "session_id"
    
    User {
        string id PK
        string name
        string email UK
        string password_hash
        enum role
        boolean status_online
        datetime created_at
    }
    
    Client {
        string id PK
        string telegram_id UK
        string name
        string username
        datetime created_at
    }
    
    Session {
        string id PK
        string client_id FK
        string cs_id FK
        enum status
        datetime created_at
        datetime ended_at
    }
    
    Chat {
        string id PK
        string session_id FK
        enum sender_type
        enum message_type
        text message
        string file_url
        boolean is_read
        datetime created_at
    }
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register CS/Admin
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile

### Chat Management
- `GET /api/chat/sessions` - Get chat sessions
- `GET /api/chat/sessions/:id/messages` - Get session messages
- `POST /api/chat/messages` - Send message (CS only)
- `PUT /api/chat/sessions/:id/read` - Mark as read
- `POST /api/chat/sessions/end` - End session

### Socket.IO Events
- `new_message` - Pesan baru
- `session_joined` - Join sesi
- `session_ended` - Sesi berakhir
- `user_typing` - Status mengetik
- `cs_status_changed` - Status CS online/offline

## 🎨 UI Components

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  Sidebar       │        Chat Area         │   Info      │
│  ┌───────────┐ │ ┌─────────────────────┐  │ ┌─────────┐ │
│  │Chat List  │ │ │   Message Thread    │  │ │Client   │ │
│  │           │ │ │                     │  │ │Info     │ │
│  │🔵 Client1 │ │ │ Client: Hello       │  │ │         │ │
│  │🟢 Client2 │ │ │ CS: Hi, how can..   │  │ │Status   │ │
│  │⚪ Client3 │ │ │                     │  │ │Online   │ │
│  │           │ │ │ [Type message...]   │  │ │         │ │
│  └───────────┘ │ └─────────────────────┘  │ └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Development

### Backend Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start           # Start production server

# Database
npm run db:setup     # Quick setup (push + seed)
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations (development)
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset database (⚠️ deletes all data)
npm run db:generate  # Generate Prisma client
```

### Frontend Commands
```bash
ng serve            # Start dev server
ng build            # Build for production
ng test             # Run unit tests
ng lint             # Run linter
```

## 📱 Telegram Bot Commands

Setelah setup, client dapat berinteraksi dengan bot:

```
/start - Memulai percakapan dengan CS
[any message] - Akan diteruskan ke CS yang tersedia
```

## 🚀 Production Deployment

### Using PM2 (Backend)
```bash
npm install -g pm2
pm2 start dist/index.js --name telegram-helpdesk
pm2 startup
pm2 save
```

### Using Nginx (Frontend)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/telegram-helpdesk;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 📚 Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Panduan instalasi lengkap
- [API Documentation](docs/API_DOCUMENTATION.md) - Dokumentasi endpoint API
- [Database Guide](docs/DATABASE_GUIDE.md) - Database schema & operations
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Solusi masalah umum
- [Frontend Fixes](docs/FRONTEND_FIXES.md) - Frontend fixes & components

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Default Accounts

Setelah menjalankan `npm run db:seed`, Anda dapat login dengan akun berikut:

### Admin Account
- **Email:** `admin@helpdesk.com`
- **Password:** `admin123`
- **Role:** Admin

### Customer Service Accounts
- **CS 1:** `cs1@helpdesk.com` / `cs123`
- **CS 2:** `cs2@helpdesk.com` / `cs123`  
- **CS 3:** `cs3@helpdesk.com` / `cs123`

### Sample Data
- 3 sample clients dari Telegram
- 1 active session dengan chat history
- Demo messages untuk testing

## 🆘 Support

Jika mengalami masalah:

1. Cek [Setup Guide](docs/SETUP_GUIDE.md) untuk troubleshooting
2. Jalankan `npm run db:studio` untuk melihat data di database
3. Buka issue di repository
4. Hubungi developer

## 🧪 Testing

### Test Telegram Bot
1. Setup bot token di `.env`
2. Start backend: `npm run dev`
3. Kirim message ke bot Telegram Anda
4. Login ke dashboard sebagai CS
5. Lihat pesan masuk dan reply

### Test Database
```bash
# Lihat database via GUI
npm run db:studio

# Reset dan setup ulang database
npm run db:reset
npm run db:setup
```

---

**⭐ Jika project ini membantu, jangan lupa kasih star!**