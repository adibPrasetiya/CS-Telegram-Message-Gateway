import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthTokens, LoginRequest, RegisterRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check auth status without making HTTP requests during initialization
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.getAccessToken();
    if (token) {
      // Just set as authenticated based on token presence
      // Profile will be loaded when first needed
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Public method to verify auth status with server
  public verifyAuthStatus(): void {
    const token = this.getAccessToken();
    if (token) {
      this.getProfile().subscribe({
        next: (response) => {
          this.currentUserSubject.next(response.profile);
          this.isAuthenticatedSubject.next(true);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  login(credentials: LoginRequest): Observable<{ message: string; tokens: AuthTokens }> {
    return this.http.post<{ message: string; tokens: AuthTokens }>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setTokens(response.tokens);
        }),
        switchMap(response => {
          return this.getProfile().pipe(
            tap(userResponse => {
              this.currentUserSubject.next(userResponse.profile);
              this.isAuthenticatedSubject.next(true);
            }),
            map(() => response)
          );
        })
      );
  }

  register(userData: RegisterRequest): Observable<{ message: string; tokens: AuthTokens }> {
    return this.http.post<{ message: string; tokens: AuthTokens }>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          this.setTokens(response.tokens);
        }),
        switchMap(response => {
          return this.getProfile().pipe(
            tap(userResponse => {
              this.currentUserSubject.next(userResponse.profile);
              this.isAuthenticatedSubject.next(true);
            }),
            map(() => response)
          );
        })
      );
  }

  refreshToken(): Observable<{ message: string; tokens: AuthTokens }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ message: string; tokens: AuthTokens }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setTokens(response.tokens);
        })
      );
  }

  logout(): void {
    const token = this.getAccessToken();
    
    // Clear local state first
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Then try to notify server (non-blocking)
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
        next: () => {
          // Logout successful on server
        },
        error: (error) => {
          // Ignore server errors during logout since we've already cleared local state
          console.warn('Server logout failed:', error);
        }
      });
    }
  }

  getProfile(): Observable<{ profile: User }> {
    return this.http.get<{ profile: User }>(`${environment.apiUrl}/auth/profile`);
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }
}