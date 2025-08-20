import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionInfo, ChatMessage, SendMessageRequest } from '../models';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export interface SessionsResponse {
  success: boolean;
  data: SessionInfo[];
  pagination: PaginationInfo;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private sessionsSubject = new BehaviorSubject<SessionInfo[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  private paginationInfoSubject = new BehaviorSubject<PaginationInfo | null>(null);
  public paginationInfo$ = this.paginationInfoSubject.asObservable();

  private loadingSessionsSubject = new BehaviorSubject<boolean>(false);
  public loadingSessions$ = this.loadingSessionsSubject.asObservable();

  private activeSessionSubject = new BehaviorSubject<SessionInfo | null>(null);
  public activeSession$ = this.activeSessionSubject.asObservable();

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Legacy method for backward compatibility
  getSessions(): Observable<{ sessions: SessionInfo[] }> {
    return this.http.get<{ sessions: SessionInfo[] }>(`${environment.apiUrl}/chat/sessions`);
  }

  // New paginated method
  getSessionsPaginated(limit = 15, offset = 0, page?: number): Observable<SessionsResponse> {
    let params: any = { limit: limit.toString(), offset: offset.toString() };
    if (page) {
      params.page = page.toString();
    }
    
    return this.http.get<SessionsResponse>(`${environment.apiUrl}/chat/sessions`, { params });
  }

  // Load initial sessions
  loadInitialSessions(limit = 15): Observable<SessionsResponse> {
    this.loadingSessionsSubject.next(true);
    return this.getSessionsPaginated(limit, 0);
  }

  // Load more sessions for infinite scroll
  loadMoreSessions(): Observable<SessionsResponse | null> {
    const currentPagination = this.paginationInfoSubject.value;
    const currentSessions = this.sessionsSubject.value;
    
    if (!currentPagination || !currentPagination.hasMore || this.loadingSessionsSubject.value) {
      return new Observable(subscriber => subscriber.next(null));
    }

    this.loadingSessionsSubject.next(true);
    const nextOffset = currentSessions.length;
    return this.getSessionsPaginated(currentPagination.limit, nextOffset);
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

  // Update sessions and pagination info from paginated response
  updateSessionsFromResponse(response: SessionsResponse, append = false): void {
    this.loadingSessionsSubject.next(false);
    
    if (append) {
      // For infinite scroll - append new sessions to existing ones
      const currentSessions = this.sessionsSubject.value;
      const newSessions = [...currentSessions, ...response.data];
      this.sessionsSubject.next(newSessions);
    } else {
      // For initial load - replace all sessions
      this.sessionsSubject.next(response.data);
    }
    
    this.paginationInfoSubject.next(response.pagination);
  }

  // Reset sessions (for refresh)
  resetSessions(): void {
    this.sessionsSubject.next([]);
    this.paginationInfoSubject.next(null);
    this.loadingSessionsSubject.next(false);
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

  getCurrentPaginationInfo(): PaginationInfo | null {
    return this.paginationInfoSubject.value;
  }

  isLoadingSessions(): boolean {
    return this.loadingSessionsSubject.value;
  }

  hasMoreSessions(): boolean {
    const pagination = this.paginationInfoSubject.value;
    return pagination ? pagination.hasMore : false;
  }

  setLoadingSessions(loading: boolean): void {
    this.loadingSessionsSubject.next(loading);
  }
}