# API Documentation - Telegram Help Desk Gateway

## Base URL
```
http://localhost:3000/api
```

## Authentication

Semua endpoint yang memerlukan autentikasi harus menyertakan header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Mendaftarkan user baru (CS/Admin).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CS" // Optional: "CS" | "ADMIN"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/logout
Logout user (requires authentication).

#### GET /auth/profile
Mendapatkan profil user (requires authentication).

### Chat Management

#### GET /chat/sessions
Mendapatkan daftar sesi chat.

**Query Parameters:**
- None (CS hanya melihat sesi mereka, Admin melihat semua)

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-id",
      "clientId": "client-id",
      "csId": "cs-id",
      "status": "ACTIVE",
      "client": {
        "id": "client-id",
        "telegramId": "123456789",
        "name": "Client Name",
        "username": "client_username"
      },
      "cs": {
        "id": "cs-id",
        "name": "CS Name",
        "email": "cs@example.com"
      },
      "lastMessage": {
        "id": "message-id",
        "message": "Hello",
        "senderType": "CLIENT",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      "unreadCount": 5
    }
  ]
}
```

#### GET /chat/sessions/:sessionId/messages
Mendapatkan pesan dalam sesi.

**Query Parameters:**
- `limit`: Number (default: 50)
- `offset`: Number (default: 0)

**Response:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "sessionId": "session-id",
      "senderType": "CLIENT",
      "messageType": "TEXT",
      "message": "Hello",
      "fileUrl": null,
      "isRead": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /chat/messages
Mengirim pesan (CS only).

**Request Body:**
```json
{
  "sessionId": "session-id",
  "message": "Hello, how can I help you?",
  "messageType": "TEXT"
}
```

#### PUT /chat/sessions/:sessionId/read
Menandai pesan sebagai sudah dibaca (CS only).

#### POST /chat/sessions/end
Mengakhiri sesi chat (CS only).

**Request Body:**
```json
{
  "sessionId": "session-id"
}
```

## Socket.IO Events

### Client Events (dari frontend ke server)

- `join_session`: Join sesi chat
- `leave_session`: Leave sesi chat
- `typing_start`: Mulai mengetik
- `typing_stop`: Berhenti mengetik
- `update_status`: Update status online/offline
- `get_online_cs`: Request daftar CS online

### Server Events (dari server ke frontend)

- `new_message`: Pesan baru
- `session_joined`: Berhasil join sesi
- `session_ended`: Sesi berakhir
- `messages_read`: Pesan ditandai sudah dibaca
- `user_typing`: User sedang mengetik
- `user_stop_typing`: User berhenti mengetik
- `cs_status_changed`: Status CS berubah
- `online_cs_list`: Daftar CS online
- `error`: Error message

## Error Responses

```json
{
  "error": "Error message description"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error