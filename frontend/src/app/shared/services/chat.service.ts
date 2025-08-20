import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionInfo, ChatMessage, SendMessageRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private sessionsSubject = new BehaviorSubject<SessionInfo[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  private activeSessionSubject = new BehaviorSubject<SessionInfo | null>(null);
  public activeSession$ = this.activeSessionSubject.asObservable();

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSessions(): Observable<{ sessions: SessionInfo[] }> {
    return this.http.get<{ sessions: SessionInfo[] }>(`${environment.apiUrl}/chat/sessions`);
  }

  getSessionMessages(sessionId: string, limit = 50, offset = 0, lastMessageId?: string): Observable<{
    messages: ChatMessage[],
    hasMore: boolean,
    total: number
  }> {
    let params: any = { limit: limit.toString(), offset: offset.toString() };
    if (lastMessageId) {
      params.lastMessageId = lastMessageId;
    }
    
    return this.http.get<{
      messages: ChatMessage[],
      hasMore: boolean,
      total: number
    }>(`${environment.apiUrl}/chat/sessions/${sessionId}/messages`, { params });
  }

  sendMessage(request: SendMessageRequest): Observable<{ message: string; data: ChatMessage }> {
    return this.http.post<{ message: string; data: ChatMessage }>(`${environment.apiUrl}/chat/messages`, request);
  }

  markAsRead(sessionId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.apiUrl}/chat/sessions/${sessionId}/read`, {});
  }

  endSession(sessionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/chat/sessions/end`, { sessionId });
  }

  uploadFile(sessionId: string, file: File): Observable<{ message: string; data: ChatMessage; fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    
    return this.http.post<{ message: string; data: ChatMessage; fileUrl: string }>(`${environment.apiUrl}/chat/upload`, formData);
  }

  updateSessions(sessions: SessionInfo[]): void {
    this.sessionsSubject.next(sessions);
  }

  setActiveSession(session: SessionInfo | null): void {
    this.activeSessionSubject.next(session);
  }

  updateMessages(messages: ChatMessage[]): void {
    this.messagesSubject.next(messages);
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  updateSessionUnreadCount(sessionId: string, count: number): void {
    const sessions = this.sessionsSubject.value.map(session => 
      session.id === sessionId ? { ...session, unreadCount: count } : session
    );
    this.sessionsSubject.next(sessions);
  }

  updateSessionLastMessage(sessionId: string, message: ChatMessage): void {
    const sessions = this.sessionsSubject.value.map(session => 
      session.id === sessionId ? { ...session, lastMessage: message } : session
    );
    this.sessionsSubject.next(sessions);
  }

  getCurrentSessions(): SessionInfo[] {
    return this.sessionsSubject.value;
  }

  getCurrentActiveSession(): SessionInfo | null {
    return this.activeSessionSubject.value;
  }

  getCurrentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }
}