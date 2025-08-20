export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CS';
  statusOnline: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'CS';
}

export interface Client {
  id: string;
  telegramId: string;
  name: string;
  username?: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'CLIENT' | 'CS';
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
  message: string;
  fileUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface SessionInfo {
  id: string;
  clientId: string;
  csId?: string;
  status: 'ACTIVE' | 'ENDED';
  client: Client;
  cs?: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
}