# Troubleshooting Guide - Telegram Help Desk Gateway

## 🔧 Common Issues & Solutions

### TypeScript Build Errors

#### Morgan Declaration File Error
**Error:**
```
Could not find a declaration file for module 'morgan'
```

**Solution:**
```bash
npm install --save-dev @types/morgan
```

#### Telegram Bot API Types Error
**Error:**
```
Could not find a declaration file for module 'node-telegram-bot-api'
```

**Solution:**
```bash
npm install --save-dev @types/node-telegram-bot-api
```

#### JWT Token Signature Error
**Error:**
```
No overload matches this call for jwt.sign()
```

**Solution:**
Gunakan versi kompatibel dari jsonwebtoken:
```bash
npm install jsonwebtoken@8.5.1
npm install --save-dev @types/jsonwebtoken@8.5.9
```

### Database Issues

#### Connection Error
**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Pastikan MySQL service berjalan:
   ```bash
   # Windows
   net start mysql
   
   # macOS/Linux
   sudo systemctl start mysql
   # atau
   brew services start mysql
   ```

2. Check connection string di `.env`:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/telegram_helpdesk"
   ```

3. Test connection:
   ```bash
   mysql -u username -p telegram_helpdesk
   ```

#### Migration Error
**Error:**
```
Error: P1001: Can't reach database server
```

**Solutions:**
1. Reset database dan setup ulang:
   ```bash
   npm run db:reset
   npm run db:setup
   ```

2. Manual push schema:
   ```bash
   npm run db:push --force-reset
   npm run db:seed
   ```

### Telegram Bot Issues

#### Invalid Bot Token
**Error:**
```
Error: ETELEGRAM: 401 Unauthorized
```

**Solutions:**
1. Pastikan `TELEGRAM_BOT_TOKEN` benar di `.env`
2. Test token secara manual:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
   ```

#### Bot Already Running
**Error:**
```
Error: 409 Conflict: terminated by other getUpdates request
```

**Solutions:**
1. Stop semua instance bot yang berjalan
2. Tunggu 30 detik sebelum restart
3. Pastikan hanya satu instance yang running

### Frontend Issues

#### Node Modules Error
**Error:**
```
Cannot resolve dependency tree
```

**Solutions:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Bootstrap Import Error
**Error:**
```
Cannot find module 'bootstrap/dist/css/bootstrap.min.css'
```

**Solutions:**
```bash
cd frontend
npm install bootstrap --legacy-peer-deps
```

#### Socket.IO Connection Error
**Error:**
```
WebSocket connection failed
```

**Solutions:**
1. Pastikan backend running di port 3000
2. Check CORS settings di backend
3. Verify environment URLs:
   ```typescript
   // environment.ts
   socketUrl: 'http://localhost:3000'
   ```

### Development Issues

#### Hot Reload Not Working
**Solutions:**
1. Backend (nodemon):
   ```bash
   npm run dev
   # atau manual restart
   rs
   ```

2. Frontend (Angular):
   ```bash
   ng serve --poll=2000
   ```

#### Port Already in Use
**Error:**
```
EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. Kill process menggunakan port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill
   ```

2. Gunakan port lain di `.env`:
   ```env
   PORT=3001
   ```

## 🚀 Performance Issues

### Database Slow Queries
**Solutions:**
1. Add database indices:
   ```sql
   CREATE INDEX idx_sessions_client ON sessions(client_id, status);
   CREATE INDEX idx_chats_session ON chats(session_id, created_at);
   ```

2. Enable query logging:
   ```typescript
   // database.ts
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error']
   });
   ```

### Memory Issues
**Solutions:**
1. Increase Node.js memory limit:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. Enable connection pooling:
   ```env
   DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=10"
   ```

## 🔍 Debugging Tips

### Enable Debug Mode
1. Backend debugging:
   ```env
   NODE_ENV=development
   DEBUG=*
   ```

2. Frontend debugging:
   ```bash
   ng serve --verbose
   ```

### Log Analysis
1. Backend logs:
   ```bash
   npm run dev | tee backend.log
   ```

2. Database logs:
   ```bash
   npm run db:studio
   # Check logs in browser console
   ```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Get sessions (with token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/chat/sessions
```

## 📱 Production Issues

### SSL/HTTPS Issues
**Solutions:**
1. Setup proper SSL certificates
2. Update environment URLs:
   ```env
   FRONTEND_URL="https://yourdomain.com"
   ```

### Database Connection Pool
**Error:**
```
Too many connections
```

**Solutions:**
```env
DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=5&pool_timeout=20"
```

### Process Management
```bash
# Using PM2
pm2 start dist/index.js --name telegram-helpdesk
pm2 logs telegram-helpdesk
pm2 restart telegram-helpdesk
```

## 🆘 Getting Help

### Check Logs
1. **Backend logs**: `npm run dev` output
2. **Database logs**: `npm run db:studio` 
3. **Browser console**: F12 untuk frontend errors
4. **Network tab**: Check API requests/responses

### Diagnostic Commands
```bash
# Backend health
curl http://localhost:3000/health

# Database connection
npm run db:studio

# View all sessions
npm run db:seed

# Reset everything
npm run db:reset && npm run db:setup
```

### Community Support
1. Check GitHub issues
2. Review setup documentation
3. Contact development team

---

**💡 Pro tip:** Saat mengalami masalah, selalu check logs terlebih dahulu dan pastikan semua environment variables sudah di-set dengan benar!