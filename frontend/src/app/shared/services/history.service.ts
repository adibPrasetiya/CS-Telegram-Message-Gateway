import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SessionHistoryItem {
  id: string;
  clientId: string;
  csId: string | null;
  status: 'ACTIVE' | 'ENDED';
  createdAt: string;
  endedAt: string | null;
  client: {
    id: string;
    name: string;
    username: string | null;
    telegramId: string;
  };
  cs: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    chats: number;
  };
}

export interface SessionDetails extends SessionHistoryItem {
  chats: {
    id: string;
    senderType: 'CLIENT' | 'CS';
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
    message: string;
    fileUrl: string | null;
    isRead: boolean;
    createdAt: string;
  }[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  hasMore?: boolean;
  limit?: number;
  offset?: number;
}

export interface SessionHistoryResponse {
  sessions: SessionHistoryItem[];
  pagination: PaginationInfo;
}

export interface SearchResult {
  id: string;
  senderType: 'CLIENT' | 'CS';
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
  message: string;
  fileUrl: string | null;
  createdAt: string;
  session: SessionHistoryItem;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: PaginationInfo;
}

export interface CSPerformanceStats {
  csId: string;
  csName: string;
  csEmail: string;
  totalSessions: number;
  activeSessions: number;
  endedSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  avgSessionDurationMinutes: number;
}

export interface CSStatsResponse {
  stats: CSPerformanceStats[];
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private apiUrl = `${environment.apiUrl}/history`;

  // Reactive state management for infinite scroll
  private sessionsSubject = new BehaviorSubject<SessionHistoryItem[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  private paginationInfoSubject = new BehaviorSubject<PaginationInfo | null>(null);
  public paginationInfo$ = this.paginationInfoSubject.asObservable();

  private loadingSessionsSubject = new BehaviorSubject<boolean>(false);
  public loadingSessions$ = this.loadingSessionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSessionHistory(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: 'ACTIVE' | 'ENDED';
      clientName?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Observable<SessionHistoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.clientName) {
        params = params.set('clientName', filters.clientName);
      }
      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo);
      }
    }

    return this.http.get<SessionHistoryResponse>(`${this.apiUrl}/sessions`, { params });
  }

  getSessionDetails(sessionId: string): Observable<SessionDetails> {
    return this.http.get<SessionDetails>(`${this.apiUrl}/sessions/${sessionId}`);
  }

  getCSPerformanceStats(dateFrom?: string, dateTo?: string): Observable<CSStatsResponse> {
    let params = new HttpParams();
    
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    return this.http.get<CSStatsResponse>(`${this.apiUrl}/stats/cs-performance`, { params });
  }

  searchChatHistory(query: string, page: number = 1, limit: number = 20): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params });
  }

  // Enhanced methods for infinite scroll
  getSessionHistoryWithOffset(
    limit: number = 15,
    offset: number = 0,
    filters?: {
      status?: 'ACTIVE' | 'ENDED';
      clientName?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Observable<SessionHistoryResponse> {
    let params = new HttpParams()
      .set('page', Math.floor(offset / limit) + 1)
      .set('limit', limit.toString());

    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.clientName) {
        params = params.set('clientName', filters.clientName);
      }
      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo);
      }
    }

    return this.http.get<SessionHistoryResponse>(`${this.apiUrl}/sessions`, { params });
  }

  // Load initial sessions for infinite scroll
  loadInitialSessions(
    limit: number = 15,
    filters?: {
      status?: 'ACTIVE' | 'ENDED';
      clientName?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Observable<SessionHistoryResponse> {
    this.loadingSessionsSubject.next(true);
    return this.getSessionHistoryWithOffset(limit, 0, filters);
  }

  // Load more sessions for infinite scroll
  loadMoreSessions(
    filters?: {
      status?: 'ACTIVE' | 'ENDED';
      clientName?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Observable<SessionHistoryResponse | null> {
    const currentPagination = this.paginationInfoSubject.value;
    const currentSessions = this.sessionsSubject.value;
    
    if (!currentPagination || !currentPagination.hasNextPage || this.loadingSessionsSubject.value) {
      return new Observable(subscriber => subscriber.next(null));
    }

    this.loadingSessionsSubject.next(true);
    const nextOffset = currentSessions.length;
    const limit = currentPagination.limit || 15;
    return this.getSessionHistoryWithOffset(limit, nextOffset, filters);
  }

  // Update sessions and pagination info from response
  updateSessionsFromResponse(response: SessionHistoryResponse, append = false): void {
    this.loadingSessionsSubject.next(false);
    
    if (append) {
      // For infinite scroll - append new sessions to existing ones
      const currentSessions = this.sessionsSubject.value;
      const newSessions = [...currentSessions, ...response.sessions];
      this.sessionsSubject.next(newSessions);
    } else {
      // For initial load - replace all sessions
      this.sessionsSubject.next(response.sessions);
    }
    
    // Enhanced pagination info
    const enhancedPagination = {
      ...response.pagination,
      hasMore: response.pagination.hasNextPage,
      limit: response.sessions.length > 0 ? response.sessions.length : 15,
      offset: (response.pagination.currentPage - 1) * (response.sessions.length || 15)
    };
    
    this.paginationInfoSubject.next(enhancedPagination);
  }

  // Reset sessions (for refresh or filter changes)
  resetSessions(): void {
    this.sessionsSubject.next([]);
    this.paginationInfoSubject.next(null);
    this.loadingSessionsSubject.next(false);
  }

  // Getters for current state
  getCurrentSessions(): SessionHistoryItem[] {
    return this.sessionsSubject.value;
  }

  getCurrentPaginationInfo(): PaginationInfo | null {
    return this.paginationInfoSubject.value;
  }

  isLoadingSessions(): boolean {
    return this.loadingSessionsSubject.value;
  }

  hasMoreSessions(): boolean {
    const pagination = this.paginationInfoSubject.value;
    return pagination ? pagination.hasNextPage : false;
  }

  setLoadingSessions(loading: boolean): void {
    this.loadingSessionsSubject.next(loading);
  }
}