import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('janus_credentials');
        localStorage.removeItem('janus_user');
        router.navigate(['/login']);
      } else if (error.status === 400 || error.status === 422) {
        const message = error.error?.error || error.error?.message || translate.instant('TOAST.GENERIC_ERROR');
        toastService.error(message);
      } else if (error.status === 403) {
        toastService.error(translate.instant('TOAST.ACCESS_DENIED'));
      } else if (error.status === 404) {
        toastService.error(translate.instant('TOAST.NOT_FOUND'));
      } else if (error.status >= 500) {
        toastService.error(translate.instant('TOAST.SERVER_ERROR'));
      }
      return throwError(() => error);
    })
  );
};
