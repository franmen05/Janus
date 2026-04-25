import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccountCodeConfig } from '../../../core/models/account-code-config.model';

@Injectable({ providedIn: 'root' })
export class AccountCodeConfigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/accounts/code-config`;

  get(): Observable<AccountCodeConfig> {
    return this.http.get<AccountCodeConfig>(this.apiUrl);
  }

  update(config: AccountCodeConfig): Observable<AccountCodeConfig> {
    return this.http.put<AccountCodeConfig>(this.apiUrl, config);
  }
}
