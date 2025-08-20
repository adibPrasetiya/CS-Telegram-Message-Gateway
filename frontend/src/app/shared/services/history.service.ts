import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}