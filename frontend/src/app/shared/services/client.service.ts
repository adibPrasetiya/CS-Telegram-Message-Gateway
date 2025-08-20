import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

export interface ClientListResponse {
  clients: ClientListItem[];
  pagination: PaginationInfo;
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

  // Reactive state management for infinite scroll
  private clientsSubject = new BehaviorSubject<ClientListItem[]>([]);
  public clients$ = this.clientsSubject.asObservable();

  private paginationInfoSubject = new BehaviorSubject<PaginationInfo | null>(null);
  public paginationInfo$ = this.paginationInfoSubject.asObservable();

  private loadingClientsSubject = new BehaviorSubject<boolean>(false);
  public loadingClients$ = this.loadingClientsSubject.asObservable();

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

  // Enhanced methods for infinite scroll
  getClientsWithOffset(
    limit: number = 15,
    offset: number = 0,
    search?: string
  ): Observable<ClientListResponse> {
    let params = new HttpParams()
      .set('page', Math.floor(offset / limit) + 1)
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ClientListResponse>(this.apiUrl, { params });
  }

  // Load initial clients for infinite scroll
  loadInitialClients(
    limit: number = 15,
    search?: string
  ): Observable<ClientListResponse> {
    this.loadingClientsSubject.next(true);
    return this.getClientsWithOffset(limit, 0, search);
  }

  // Load more clients for infinite scroll
  loadMoreClients(search?: string): Observable<ClientListResponse | null> {
    const currentPagination = this.paginationInfoSubject.value;
    const currentClients = this.clientsSubject.value;
    
    if (!currentPagination || !currentPagination.hasNextPage || this.loadingClientsSubject.value) {
      return new Observable(subscriber => subscriber.next(null));
    }

    this.loadingClientsSubject.next(true);
    const nextOffset = currentClients.length;
    const limit = currentPagination.limit || 15;
    return this.getClientsWithOffset(limit, nextOffset, search);
  }

  // Update clients and pagination info from response
  updateClientsFromResponse(response: ClientListResponse, append = false): void {
    this.loadingClientsSubject.next(false);
    
    if (append) {
      // For infinite scroll - append new clients to existing ones
      const currentClients = this.clientsSubject.value;
      const newClients = [...currentClients, ...response.clients];
      this.clientsSubject.next(newClients);
    } else {
      // For initial load - replace all clients
      this.clientsSubject.next(response.clients);
    }
    
    // Enhanced pagination info
    const enhancedPagination = {
      ...response.pagination,
      hasMore: response.pagination.hasNextPage,
      limit: response.clients.length > 0 ? response.clients.length : 15,
      offset: (response.pagination.currentPage - 1) * (response.clients.length || 15)
    };
    
    this.paginationInfoSubject.next(enhancedPagination);
  }

  // Reset clients (for refresh or search changes)
  resetClients(): void {
    this.clientsSubject.next([]);
    this.paginationInfoSubject.next(null);
    this.loadingClientsSubject.next(false);
  }

  // Getters for current state
  getCurrentClients(): ClientListItem[] {
    return this.clientsSubject.value;
  }

  getCurrentPaginationInfo(): PaginationInfo | null {
    return this.paginationInfoSubject.value;
  }

  isLoadingClients(): boolean {
    return this.loadingClientsSubject.value;
  }

  hasMoreClients(): boolean {
    const pagination = this.paginationInfoSubject.value;
    return pagination ? pagination.hasNextPage : false;
  }

  setLoadingClients(loading: boolean): void {
    this.loadingClientsSubject.next(loading);
  }
}