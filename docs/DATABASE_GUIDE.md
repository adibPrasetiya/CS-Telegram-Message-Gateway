# Database Guide - Telegram Help Desk Gateway

## 📊 Database Schema Overview

Database menggunakan **MySQL** dengan **Prisma ORM** untuk type-safe database operations.

## 🗂️ Tables Structure

### users
Menyimpan data CS dan Admin
```sql
- id: String (PK, CUID)
- name: String 
- email: String (UNIQUE)
- password_hash: String
- role: Enum (ADMIN, CS)
- status_online: Boolean
- created_at: DateTime
```

### clients  
Menyimpan data client Telegram
```sql
- id: String (PK, CUID)
- telegram_id: String (UNIQUE)
- name: String
- username: String (nullable)
- created_at: DateTime
```

### sessions
Sesi chat antara client dan CS
```sql
- id: String (PK, CUID)
- client_id: String (FK → clients.id)
- cs_id: String (FK → users.id, nullable)
- status: Enum (ACTIVE, ENDED)
- created_at: DateTime
- ended_at: DateTime (nullable)
```

### chats
Pesan dalam sesi chat
```sql
- id: String (PK, CUID)
- session_id: String (FK → sessions.id)
- sender_type: Enum (CLIENT, CS)
- message_type: Enum (TEXT, IMAGE, FILE, VIDEO, LINK)
- message: Text
- file_url: String (nullable)
- is_read: Boolean
- created_at: DateTime
```

### refresh_tokens
Token refresh untuk JWT
```sql
- id: String (PK, CUID)
- user_id: String (FK → users.id)
- token: String (UNIQUE)
- created_at: DateTime
- expires_at: DateTime
```

## 🛠️ Database Commands

### Setup Commands
```bash
# Quick setup (recommended)
npm run db:setup

# Manual setup
npm run db:push
npm run db:seed
```

### Development Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed

# Reset database (⚠️ deletes all data)
npm run db:reset
```

### Migration Commands
```bash
# Create and apply migration (development)
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Reset and recreate database
npm run db:reset
```

## 🌱 Database Seeding

### Default Accounts Created
```javascript
// Admin Account
admin@helpdesk.com / admin123

// CS Accounts  
cs1@helpdesk.com / cs123
cs2@helpdesk.com / cs123
cs3@helpdesk.com / cs123
```

### Sample Data
- **3 Sample Clients**: John Doe, Jane Smith, Bob Wilson
- **1 Active Session**: Demo conversation between client and CS
- **Sample Messages**: Text messages untuk testing

### Custom Seeding
Edit `prisma/seed.ts` untuk menambah data custom:

```typescript
// Tambah CS baru
const newCS = await prisma.user.create({
  data: {
    name: 'CS Baru',
    email: 'cs-baru@helpdesk.com',
    passwordHash: await bcrypt.hash('password123', 12),
    role: 'CS',
  }
});
```

## 📈 Database Monitoring

### Prisma Studio
GUI untuk melihat dan edit data:
```bash
npm run db:studio
# Buka http://localhost:5555
```

### Query Logging
Enable di `src/utils/database.ts`:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Enable semua log
});
```

### Performance Monitoring
```typescript
// Di production, gunakan connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=5"
    }
  }
});
```

## 🔄 Common Operations

### Round Robin CS Allocation
```typescript
// Di telegramService.ts
const onlineCS = await prisma.user.findMany({
  where: { role: 'CS', statusOnline: true },
  include: { sessions: { where: { status: 'ACTIVE' } } }
});

// Sort by workload (least sessions first)
onlineCS.sort((a, b) => a.sessions.length - b.sessions.length);
```

### Session Management
```typescript
// Create new session
const session = await prisma.session.create({
  data: {
    clientId: client.id,
    csId: selectedCS.id,
    status: 'ACTIVE'
  }
});

// End session
await prisma.session.update({
  where: { id: sessionId },
  data: { 
    status: 'ENDED',
    endedAt: new Date()
  }
});
```

### Message Tracking
```typescript
// Mark messages as read
await prisma.chat.updateMany({
  where: {
    sessionId,
    senderType: 'CLIENT',
    isRead: false
  },
  data: { isRead: true }
});

// Get unread count
const unreadCount = await prisma.chat.count({
  where: {
    sessionId,
    senderType: 'CLIENT', 
    isRead: false
  }
});
```

## 🔧 Troubleshooting

### Connection Issues
```bash
# Test database connection
npm run db:studio

# Check connection string
echo $DATABASE_URL
```

### Migration Issues
```bash
# Reset and recreate
npm run db:reset
npm run db:setup

# Force push schema
npm run db:push --force-reset
```

### Data Issues
```bash
# View data in GUI
npm run db:studio

# Re-seed database
npm run db:reset
npm run db:seed
```

## 📊 Database Relations

```mermaid
erDiagram
    User ||--o{ Session : "cs_id"
    User ||--o{ RefreshToken : "user_id" 
    Client ||--o{ Session : "client_id"
    Session ||--o{ Chat : "session_id"
    
    User {
        string id PK
        string email UK
        enum role
        boolean status_online
    }
    
    Client {
        string id PK
        string telegram_id UK  
        string name
    }
    
    Session {
        string id PK
        string client_id FK
        string cs_id FK
        enum status
    }
    
    Chat {
        string id PK
        string session_id FK
        enum sender_type
        enum message_type
        boolean is_read
    }
```

## 🚀 Production Considerations

### Backup Strategy
```bash
# MySQL dump
mysqldump -u user -p telegram_helpdesk > backup.sql

# Restore
mysql -u user -p telegram_helpdesk < backup.sql
```

### Index Optimization
Add indices untuk performance:
```sql
-- Session lookup by client
CREATE INDEX idx_sessions_client_status ON sessions(client_id, status);

-- Chat lookup by session
CREATE INDEX idx_chats_session_created ON chats(session_id, created_at);

-- Unread messages
CREATE INDEX idx_chats_unread ON chats(session_id, sender_type, is_read);
```

### Connection Pooling
```env
# .env untuk production
DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=20"
```