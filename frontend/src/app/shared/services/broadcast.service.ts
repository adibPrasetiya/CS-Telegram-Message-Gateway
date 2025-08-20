import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

export interface BroadcastHistoryResponse {
  broadcasts: BroadcastHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BroadcastDetails {
  id: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'LINK';
  fileUrl?: string;
  status: 'PENDING' | 'SENDING' | 'COMPLETED' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipients: Array<{
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
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {
  private apiUrl = `${environment.apiUrl}/broadcast`;

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
}