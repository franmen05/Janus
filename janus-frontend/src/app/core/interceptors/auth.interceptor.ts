import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authHeader = authService.getAuthHeader();

  if (authHeader && req.url.includes('/api/')) {
    const cloned = req.clone({
      setHeaders: { 'Authorization': `Basic ${authHeader}` }
    });
    return next(cloned);
  }
  return next(req);
};
