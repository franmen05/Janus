import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiKeyService } from '../../../core/services/api-key.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiKey, ApiKeyCreated, CreateApiKeyRequest } from '../../../core/models/api-key.model';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-api-key-list',
  standalone: true,
  imports: [DatePipe, FormsModule, TranslateModule, NgbTooltipModule, LoadingIndicatorComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'API_KEYS.TITLE' | translate }}</h2>
      <button class="btn btn-primary" (click)="showCreateForm.set(true)" [disabled]="showCreateForm()">
        {{ 'API_KEYS.NEW' | translate }}
      </button>
    </div>

    @if (createdKey()) {
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <h6 class="alert-heading fw-bold">{{ 'API_KEYS.CREATED_SUCCESS' | translate }}</h6>
        <p class="mb-2">{{ 'API_KEYS.KEY_WARNING' | translate }}</p>
        <div class="d-flex align-items-center gap-2">
          <code class="flex-grow-1 p-2 bg-dark text-light rounded" style="font-family: monospace; word-break: break-all;">{{ createdKey()!.key }}</code>
          <button class="btn btn-sm btn-outline-dark" (click)="copyKey(createdKey()!.key)">
            <i class="bi bi-clipboard me-1"></i>{{ 'API_KEYS.COPY_KEY' | translate }}
          </button>
        </div>
        <button type="button" class="btn-close" (click)="createdKey.set(null)"></button>
      </div>
    }

    @if (showCreateForm()) {
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label">{{ 'API_KEYS.NAME' | translate }}</label>
              <input type="text" class="form-control" [(ngModel)]="newKeyName"
                     [placeholder]="'API_KEYS.NAME_PLACEHOLDER' | translate" required>
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'API_KEYS.EXPIRES_AT' | translate }}</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="newKeyExpiry">
            </div>
            <div class="col-md-3 d-flex gap-2">
              <button class="btn btn-primary" (click)="createKey()" [disabled]="!newKeyName.trim()">
                {{ 'API_KEYS.NEW' | translate }}
              </button>
              <button class="btn btn-outline-secondary" (click)="cancelCreate()">
                {{ 'ACTIONS.CANCEL' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    @if (loading()) {
      <app-loading-indicator />
    } @else {
      <div class="card">
        <div class="card-body p-0 table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>{{ 'API_KEYS.NAME' | translate }}</th>
                <th>{{ 'API_KEYS.KEY_PREFIX' | translate }}</th>
                <th>{{ 'API_KEYS.EXPIRES_AT' | translate }}</th>
                <th>{{ 'API_KEYS.STATUS' | translate }}</th>
                <th class="d-none d-md-table-cell">{{ 'API_KEYS.CREATED_BY' | translate }}</th>
                <th class="d-none d-md-table-cell">{{ 'API_KEYS.LAST_USED' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (key of apiKeys(); track key.id) {
                <tr>
                  <td class="fw-bold">{{ key.name }}</td>
                  <td><code>{{ key.keyPrefix }}...</code></td>
                  <td>{{ key.expiresAt ? (key.expiresAt | date:'short') : ('API_KEYS.NEVER' | translate) }}</td>
                  <td>
                    @switch (getStatus(key)) {
                      @case ('ACTIVE') {
                        <span class="badge bg-success">{{ 'API_KEYS.ACTIVE' | translate }}</span>
                      }
                      @case ('EXPIRED') {
                        <span class="badge bg-danger">{{ 'API_KEYS.EXPIRED' | translate }}</span>
                      }
                      @case ('REVOKED') {
                        <span class="badge bg-secondary">{{ 'API_KEYS.REVOKED' | translate }}</span>
                      }
                    }
                  </td>
                  <td class="d-none d-md-table-cell">{{ key.createdBy }}</td>
                  <td class="d-none d-md-table-cell">{{ key.lastUsedAt ? (key.lastUsedAt | date:'short') : ('API_KEYS.NEVER_USED' | translate) }}</td>
                  <td>
                    @if (key.active) {
                      <button class="btn btn-sm btn-outline-danger" (click)="revokeKey(key)">
                        {{ 'API_KEYS.REVOKE' | translate }}
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="text-center text-muted py-4">{{ 'API_KEYS.NO_KEYS' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class ApiKeyListComponent implements OnInit {
  private apiKeyService = inject(ApiKeyService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  loading = signal(true);
  apiKeys = signal<ApiKey[]>([]);
  createdKey = signal<ApiKeyCreated | null>(null);
  showCreateForm = signal(false);

  newKeyName = '';
  newKeyExpiry = '';

  ngOnInit(): void {
    this.loadKeys();
  }

  getStatus(key: ApiKey): string {
    if (!key.active) return 'REVOKED';
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'EXPIRED';
    return 'ACTIVE';
  }

  createKey(): void {
    const request: CreateApiKeyRequest = {
      name: this.newKeyName.trim(),
      expiresAt: this.newKeyExpiry || null
    };
    this.apiKeyService.create(request).subscribe(created => {
      this.createdKey.set(created);
      this.showCreateForm.set(false);
      this.newKeyName = '';
      this.newKeyExpiry = '';
      this.loadKeys();
    });
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.newKeyName = '';
    this.newKeyExpiry = '';
  }

  revokeKey(key: ApiKey): void {
    const msg = this.translate.instant('API_KEYS.REVOKE_CONFIRM');
    if (confirm(msg)) {
      this.apiKeyService.revoke(key.id).subscribe(() => {
        this.toastService.success(this.translate.instant('API_KEYS.REVOKED_SUCCESS'));
        this.loadKeys();
      });
    }
  }

  copyKey(key: string): void {
    navigator.clipboard.writeText(key);
    this.toastService.success(this.translate.instant('API_KEYS.KEY_COPIED'));
  }

  private loadKeys(): void {
    this.apiKeyService.getAll().subscribe(keys => {
      this.apiKeys.set(keys);
      this.loading.set(false);
    });
  }
}
