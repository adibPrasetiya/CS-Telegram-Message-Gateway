import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getAccessToken();
  
  let authReq = req;
  // Add auth header if token exists and not for auth endpoints
  if (token && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login') && !req.url.includes('/auth/logout')) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 errors for protected endpoints, not auth endpoints
      if (error.status === 401 && 
          !req.url.includes('/auth/refresh') && 
          !req.url.includes('/auth/login') && 
          !req.url.includes('/auth/register') &&
          !req.url.includes('/auth/logout')) {
        return handle401Error(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, router: Router): Observable<HttpEvent<any>> {
  const refreshToken = authService.getRefreshToken();
  
  if (!refreshToken) {
    authService.logout();
    router.navigate(['/auth/login']);
    return throwError(() => new Error('No refresh token'));
  }

  return authService.refreshToken().pipe(
    switchMap(() => {
      const newToken = authService.getAccessToken();
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${newToken}`)
      });
      return next(authReq);
    }),
    catchError((error) => {
      authService.logout();
      router.navigate(['/auth/login']);
      return throwError(() => error);
    })
  );
}