import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { SocketService } from './services/socketService';
import { TelegramService } from './services/telegramService';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:4200",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global io instance for socket communication
(global as any).io = io;

app.use('/api', routes);

let telegramService: TelegramService | null = null;
let socketService: SocketService | null = null;

try {
  telegramService = new TelegramService();
  socketService = new SocketService(io, telegramService);
  console.log('Telegram bot and Socket service initialized successfully');
} catch (error) {
  console.error('Failed to initialize services:', error);
  console.log('Please check your TELEGRAM_BOT_TOKEN in .env file');
}

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('Received shutdown signal. Gracefully shutting down...');
  
  if (telegramService) {
    telegramService.stopPolling();
  }
  
  TelegramService.resetInstance();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
});
