export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'CS';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  photo?: any[];
  document?: any;
  video?: any;
  date: number;
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
  client: {
    id: string;
    telegramId: string;
    name: string;
    username?: string;
  };
  cs?: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
}