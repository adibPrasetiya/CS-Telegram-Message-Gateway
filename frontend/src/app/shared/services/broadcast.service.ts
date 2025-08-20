import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BroadcastRequest {
  message: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
  file?: File;
}

export interface BroadcastResponse {
  message: string;
  broadcast: {
    id: string;
    recipientCount: number;
    sentAt: string;
  };
}

export interface BroadcastHistoryItem {
  id: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
  fileUrl?: string;
  status: 'PENDING' | 'SENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  statistics: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
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

export interface BroadcastHistoryResponse {
  broadcasts: BroadcastHistoryItem[];
  pagination: PaginationInfo;
}

export interface BroadcastRecipient {
  id: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    username?: string;
    telegramId: string;
  };
}

export interface BroadcastRecipientsResponse {
  recipients: BroadcastRecipient[];
  pagination: PaginationInfo;
}

export interface BroadcastDetails {
  id: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
  fileUrl?: string;
  status: 'PENDING' | 'SENDING' | 'COMPLETED' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  failedCount?: number;
  pendingCount?: number;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  // For backward compatibility with existing API
  recipients?: Array<{
    id: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    sentAt?: string;
    createdAt: string;
    client: {
      id: string;
      name: string;
      username?: string;
      telegramId: string;
    };
  }>;
  // New statistics structure
  statistics?: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {
  private apiUrl = `${environment.apiUrl}/broadcast`;

  // Reactive state management for infinite scroll
  private broadcastsSubject = new BehaviorSubject<BroadcastHistoryItem[]>([]);
  public broadcasts$ = this.broadcastsSubject.asObservable();

  private paginationInfoSubject = new BehaviorSubject<PaginationInfo | null>(null);
  public paginationInfo$ = this.paginationInfoSubject.asObservable();

  private loadingBroadcastsSubject = new BehaviorSubject<boolean>(false);
  public loadingBroadcasts$ = this.loadingBroadcastsSubject.asObservable();

  // Recipients pagination state management
  private recipientsSubject = new BehaviorSubject<BroadcastRecipient[]>([]);
  public recipients$ = this.recipientsSubject.asObservable();

  private recipientsPaginationSubject = new BehaviorSubject<PaginationInfo | null>(null);
  public recipientsPagination$ = this.recipientsPaginationSubject.asObservable();

  private loadingRecipientsSubject = new BehaviorSubject<boolean>(false);
  public loadingRecipients$ = this.loadingRecipientsSubject.asObservable();

  constructor(private http: HttpClient) {}

  sendBroadcast(broadcastData: BroadcastRequest): Observable<BroadcastResponse> {
    // If there's a file, use FormData
    if (broadcastData.file) {
      const formData = new FormData();
      formData.append('message', broadcastData.message);
      formData.append('messageType', broadcastData.messageType || 'TEXT');
      formData.append('file', broadcastData.file);
      
      return this.http.post<BroadcastResponse>(`${this.apiUrl}/send`, formData);
    } else {
      // For text/link messages without files, send as JSON
      const { file, ...dataWithoutFile } = broadcastData;
      return this.http.post<BroadcastResponse>(`${this.apiUrl}/send`, dataWithoutFile);
    }
  }

  getBroadcastHistory(page: number = 1, limit: number = 20): Observable<BroadcastHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<BroadcastHistoryResponse>(`${this.apiUrl}/history`, { params });
  }

  getBroadcastDetails(broadcastId: string): Observable<BroadcastDetails> {
    return this.http.get<BroadcastDetails>(`${this.apiUrl}/${broadcastId}`);
  }

  // Enhanced methods for infinite scroll
  getBroadcastHistoryWithOffset(
    limit: number = 15,
    offset: number = 0
  ): Observable<BroadcastHistoryResponse> {
    const params = new HttpParams()
      .set('page', Math.floor(offset / limit) + 1)
      .set('limit', limit.toString());

    return this.http.get<BroadcastHistoryResponse>(`${this.apiUrl}/history`, { params });
  }

  // Load initial broadcasts for infinite scroll
  loadInitialBroadcasts(limit: number = 15): Observable<BroadcastHistoryResponse> {
    this.loadingBroadcastsSubject.next(true);
    return this.getBroadcastHistoryWithOffset(limit, 0);
  }

  // Load more broadcasts for infinite scroll
  loadMoreBroadcasts(): Observable<BroadcastHistoryResponse | null> {
    const currentPagination = this.paginationInfoSubject.value;
    const currentBroadcasts = this.broadcastsSubject.value;
    
    if (!currentPagination || !currentPagination.hasNextPage || this.loadingBroadcastsSubject.value) {
      return new Observable(subscriber => subscriber.next(null));
    }

    this.loadingBroadcastsSubject.next(true);
    const nextOffset = currentBroadcasts.length;
    const limit = currentPagination.limit || 15;
    return this.getBroadcastHistoryWithOffset(limit, nextOffset);
  }

  // Update broadcasts and pagination info from response
  updateBroadcastsFromResponse(response: BroadcastHistoryResponse, append = false): void {
    this.loadingBroadcastsSubject.next(false);
    
    if (append) {
      // For infinite scroll - append new broadcasts to existing ones
      const currentBroadcasts = this.broadcastsSubject.value;
      const newBroadcasts = [...currentBroadcasts, ...response.broadcasts];
      this.broadcastsSubject.next(newBroadcasts);
    } else {
      // For initial load - replace all broadcasts
      this.broadcastsSubject.next(response.broadcasts);
    }
    
    // Enhanced pagination info
    const enhancedPagination = {
      ...response.pagination,
      hasMore: response.pagination.hasNextPage,
      limit: response.broadcasts.length > 0 ? response.broadcasts.length : 15,
      offset: (response.pagination.currentPage - 1) * (response.broadcasts.length || 15)
    };
    
    this.paginationInfoSubject.next(enhancedPagination);
  }

  // Reset broadcasts (for refresh)
  resetBroadcasts(): void {
    this.broadcastsSubject.next([]);
    this.paginationInfoSubject.next(null);
    this.loadingBroadcastsSubject.next(false);
  }

  // Getters for current state
  getCurrentBroadcasts(): BroadcastHistoryItem[] {
    return this.broadcastsSubject.value;
  }

  getCurrentPaginationInfo(): PaginationInfo | null {
    return this.paginationInfoSubject.value;
  }

  isLoadingBroadcasts(): boolean {
    return this.loadingBroadcastsSubject.value;
  }

  hasMoreBroadcasts(): boolean {
    const pagination = this.paginationInfoSubject.value;
    return pagination ? pagination.hasNextPage : false;
  }

  setLoadingBroadcasts(loading: boolean): void {
    this.loadingBroadcastsSubject.next(loading);
  }

  // Recipients pagination methods
  getBroadcastRecipients(
    broadcastId: string,
    page: number = 1,
    limit: number = 20,
    statusFilter?: 'PENDING' | 'SENT' | 'FAILED',
    searchQuery?: string
  ): Observable<BroadcastRecipientsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (statusFilter) {
      params = params.set('status', statusFilter);
    }

    if (searchQuery) {
      params = params.set('search', searchQuery);
    }

    return this.http.get<BroadcastRecipientsResponse>(`${this.apiUrl}/${broadcastId}/recipients`, { params });
  }

  // Load initial recipients for pagination
  loadInitialRecipients(
    broadcastId: string,
    limit: number = 20,
    statusFilter?: 'PENDING' | 'SENT' | 'FAILED',
    searchQuery?: string
  ): Observable<BroadcastRecipientsResponse> {
    this.loadingRecipientsSubject.next(true);
    return this.getBroadcastRecipients(broadcastId, 1, limit, statusFilter, searchQuery);
  }

  // Load more recipients for infinite scroll
  loadMoreRecipients(
    broadcastId: string,
    statusFilter?: 'PENDING' | 'SENT' | 'FAILED',
    searchQuery?: string
  ): Observable<BroadcastRecipientsResponse | null> {
    const currentPagination = this.recipientsPaginationSubject.value;
    const currentRecipients = this.recipientsSubject.value;
    
    if (!currentPagination || !currentPagination.hasNextPage || this.loadingRecipientsSubject.value) {
      return new Observable(subscriber => subscriber.next(null));
    }

    this.loadingRecipientsSubject.next(true);
    const nextPage = currentPagination.currentPage + 1;
    const limit = currentPagination.limit || 20;
    
    return this.getBroadcastRecipients(broadcastId, nextPage, limit, statusFilter, searchQuery);
  }

  // Update recipients from response
  updateRecipientsFromResponse(response: BroadcastRecipientsResponse, append = false): void {
    this.loadingRecipientsSubject.next(false);
    
    if (append) {
      // For infinite scroll - append new recipients to existing ones
      const currentRecipients = this.recipientsSubject.value;
      const newRecipients = [...currentRecipients, ...response.recipients];
      this.recipientsSubject.next(newRecipients);
    } else {
      // For initial load or filter change - replace all recipients
      this.recipientsSubject.next(response.recipients);
    }
    
    this.recipientsPaginationSubject.next(response.pagination);
  }

  // Reset recipients
  resetRecipients(): void {
    this.recipientsSubject.next([]);
    this.recipientsPaginationSubject.next(null);
    this.loadingRecipientsSubject.next(false);
  }

  // Getters for recipients state
  getCurrentRecipients(): BroadcastRecipient[] {
    return this.recipientsSubject.value;
  }

  getRecipientsPaginationInfo(): PaginationInfo | null {
    return this.recipientsPaginationSubject.value;
  }

  isLoadingRecipients(): boolean {
    return this.loadingRecipientsSubject.value;
  }

  hasMoreRecipients(): boolean {
    const pagination = this.recipientsPaginationSubject.value;
    return pagination ? pagination.hasNextPage : false;
  }

  setLoadingRecipients(loading: boolean): void {
    this.loadingRecipientsSubject.next(loading);
  }
}