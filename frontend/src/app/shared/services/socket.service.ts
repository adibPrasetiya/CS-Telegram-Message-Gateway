import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ChatMessage } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    this.socket = io(environment.socketUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connectedSubject.next(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connectedSubject.next(false);
    }
  }

  joinSession(sessionId: string): void {
    this.socket?.emit('join_session', { sessionId });
  }

  leaveSession(sessionId: string): void {
    this.socket?.emit('leave_session', { sessionId });
  }

  startTyping(sessionId: string): void {
    this.socket?.emit('typing_start', { sessionId });
  }

  stopTyping(sessionId: string): void {
    this.socket?.emit('typing_stop', { sessionId });
  }

  updateStatus(online: boolean): void {
    this.socket?.emit('update_status', { online });
  }

  getOnlineCS(): void {
    this.socket?.emit('get_online_cs');
  }

  onNewMessage(): Observable<ChatMessage> {
    return new Observable(observer => {
      this.socket?.on('new_message', (data: ChatMessage) => observer.next(data));
    });
  }

  onSessionJoined(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('session_joined', (data: any) => observer.next(data));
    });
  }

  onSessionEnded(): Observable<{ sessionId: string }> {
    return new Observable(observer => {
      this.socket?.on('session_ended', (data: { sessionId: string }) => observer.next(data));
    });
  }

  onMessagesRead(): Observable<{ sessionId: string }> {
    return new Observable(observer => {
      this.socket?.on('messages_read', (data: { sessionId: string }) => observer.next(data));
    });
  }

  onUserTyping(): Observable<{ userId: string; userRole: string }> {
    return new Observable(observer => {
      this.socket?.on('user_typing', (data: { userId: string; userRole: string }) => observer.next(data));
    });
  }

  onUserStopTyping(): Observable<{ userId: string; userRole: string }> {
    return new Observable(observer => {
      this.socket?.on('user_stop_typing', (data: { userId: string; userRole: string }) => observer.next(data));
    });
  }

  onCSStatusChanged(): Observable<{ csId: string; online: boolean }> {
    return new Observable(observer => {
      this.socket?.on('cs_status_changed', (data: { csId: string; online: boolean }) => observer.next(data));
    });
  }

  onOnlineCSList(): Observable<any[]> {
    return new Observable(observer => {
      this.socket?.on('online_cs_list', (data: any[]) => observer.next(data));
    });
  }

  onNewSessionAssigned(): Observable<{ sessionId: string; client: any; message: string }> {
    return new Observable(observer => {
      this.socket?.on('new_session_assigned', (data: { sessionId: string; client: any; message: string }) => observer.next(data));
    });
  }

  onNewSessionMessage(): Observable<{ sessionId: string; clientName: string; message: string; messageType: string; fileUrl?: string; timestamp: Date }> {
    return new Observable(observer => {
      this.socket?.on('new_session_message', (data: any) => observer.next(data));
    });
  }

  onError(): Observable<{ message: string }> {
    return new Observable(observer => {
      this.socket?.on('error', (data: { message: string }) => observer.next(data));
    });
  }

  // Listen for general notifications (messages, session updates, etc.)
  onNotification(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('notification', (data: any) => observer.next(data));
    });
  }
}