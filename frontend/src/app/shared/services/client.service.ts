import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClientListItem {
  id: string;
  name: string;
  username?: string;
  telegramId: string;
  createdAt: string;
  updatedAt: string;
  totalSessions: number;
  lastSession: {
    id: string;
    status: 'ACTIVE' | 'ENDED';
    createdAt: string;
    cs?: {
      id: string;
      name: string;
      email: string;
    };
    _count: {
      chats: number;
    };
  } | null;
  hasActiveSession: boolean;
  canStartConversation: boolean;
}

export interface ClientListResponse {
  clients: ClientListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ClientDetails {
  id: string;
  name: string;
  username?: string;
  telegramId: string;
  createdAt: string;
  updatedAt: string;
  sessions: Array<{
    id: string;
    status: 'ACTIVE' | 'ENDED';
    createdAt: string;
    endedAt?: string;
    cs?: {
      id: string;
      name: string;
      email: string;
    };
    _count: {
      chats: number;
    };
  }>;
  _count: {
    sessions: number;
  };
}

export interface StartConversationResponse {
  message: string;
  session: {
    id: string;
    clientId: string;
    csId: string;
    status: 'ACTIVE';
    createdAt: string;
    client: {
      id: string;
      name: string;
      username?: string;
      telegramId: string;
    };
    cs: {
      id: string;
      name: string;
      email: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  getClients(page: number = 1, limit: number = 20, search?: string): Observable<ClientListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ClientListResponse>(this.apiUrl, { params });
  }

  getClientDetails(clientId: string): Observable<ClientDetails> {
    return this.http.get<ClientDetails>(`${this.apiUrl}/${clientId}`);
  }

  startConversation(clientId: string): Observable<StartConversationResponse> {
    return this.http.post<StartConversationResponse>(`${this.apiUrl}/${clientId}/start-conversation`, {});
  }
}