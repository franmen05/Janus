import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { ExchangeRate, AutoFetchStatus } from '../../../core/models/exchange-rate.model';
import { AuthService } from '../../../core/services/auth.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-exchange-rate-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PaginationComponent],
  template: `
    <!-- Current Rate Card -->
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'EXCHANGE_RATES.TITLE' | translate }}</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" (click)="onFetchRate()" [disabled]="fetching()">
          @if (fetching()) {
            <span class="spinner-border spinner-border-sm me-1"></span>
            {{ 'EXCHANGE_RATES.FETCHING' | translate }}
          } @else {
            <i class="bi bi-cloud-download me-1"></i>
            {{ 'EXCHANGE_RATES.FETCH_RATE' | translate }}
          }
        </button>
        <a routerLink="/exchange-rates/new" class="btn btn-primary">{{ 'EXCHANGE_RATES.NEW_RATE' | translate }}</a>
      </div>
    </div>

    <!-- Current Rate Display -->
    <div class="card mb-4">
      <div class="card-body text-center">
        @if (loadingCurrent()) {
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
          </div>
        } @else if (currentRate()) {
          <h6 class="text-body-secondary mb-1">{{ 'EXCHANGE_RATES.CURRENT_RATE' | translate }}</h6>
          <h3 class="mb-1">1 USD = {{ currentRate()!.rate | number:'1.4-4' }} DOP</h3>
          <div class="d-flex justify-content-center gap-2 align-items-center">
            <small class="text-body-secondary">{{ 'EXCHANGE_RATES.EFFECTIVE_DATE' | translate }}: {{ currentRate()!.effectiveDate }}</small>
            <span class="badge" [class]="currentRate()!.source === 'MANUAL' ? 'bg-success' : 'bg-primary'">
              {{ (currentRate()!.source === 'MANUAL' ? 'EXCHANGE_RATES.MANUAL' : 'EXCHANGE_RATES.AUTOMATIC') | translate }}
            </span>
          </div>
        } @else {
          <p class="text-body-secondary mb-0">{{ 'EXCHANGE_RATES.NO_ACTIVE_RATE' | translate }}</p>
        }
      </div>
    </div>

    <!-- Auto-Fetch Settings -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">{{ 'EXCHANGE_RATES.AUTO_FETCH' | translate }}</h6>
            <small class="text-body-secondary">{{ 'EXCHANGE_RATES.AUTO_FETCH_DESC' | translate }}</small>
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="autoFetchToggle"
                   [checked]="autoFetchEnabled()"
                   (change)="onToggleAutoFetch()"
                   [disabled]="togglingAutoFetch()">
            <label class="form-check-label" for="autoFetchToggle">
              {{ (autoFetchEnabled() ? 'EXCHANGE_RATES.AUTO_FETCH_ON' : 'EXCHANGE_RATES.AUTO_FETCH_OFF') | translate }}
            </label>
          </div>
        </div>
        @if (autoFetchEnabled()) {
          <div class="mt-3 d-flex align-items-center gap-2">
            <label class="form-label mb-0 text-body-secondary">{{ 'EXCHANGE_RATES.SCHEDULED_TIME' | translate }}:</label>
            <input type="time" class="form-control form-control-sm" style="width: 130px;"
                   [value]="scheduledTime()"
                   (change)="onTimeChange($event)"
                   [disabled]="togglingAutoFetch()">
          </div>
        }
      </div>
    </div>

    <!-- History Table -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">{{ 'EXCHANGE_RATES.HISTORY' | translate }}</h5>
      </div>
      <div class="card-body p-0 table-responsive">
        @if (loading()) {
          <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
            </div>
          </div>
        } @else {
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>{{ 'EXCHANGE_RATES.EFFECTIVE_DATE' | translate }}</th>
                <th>{{ 'EXCHANGE_RATES.RATE' | translate }}</th>
                <th>{{ 'EXCHANGE_RATES.SOURCE' | translate }}</th>
                <th>{{ 'EXCHANGE_RATES.ACTIVE' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (rate of rates(); track rate.id) {
                <tr>
                  <td>{{ rate.effectiveDate }}</td>
                  <td class="fw-bold">{{ rate.rate | number:'1.4-4' }}</td>
                  <td>
                    <span class="badge" [class]="rate.source === 'MANUAL' ? 'bg-success' : 'bg-primary'">
                      {{ (rate.source === 'MANUAL' ? 'EXCHANGE_RATES.MANUAL' : 'EXCHANGE_RATES.AUTOMATIC') | translate }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class]="rate.active ? 'bg-success' : 'bg-secondary'">
                      {{ (rate.active ? 'EXCHANGE_RATES.YES' : 'EXCHANGE_RATES.NO') | translate }}
                    </span>
                  </td>
                  <td>
                    <a [routerLink]="['/exchange-rates', rate.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                  </td>
                </tr>
              }
              @empty {
                <tr><td colspan="5" class="text-center text-muted py-3">{{ 'COMMON.NO_DATA' | translate }}</td></tr>
              }
            </tbody>
          </table>
          <app-pagination
            [currentPage]="currentPage()"
            [pageSize]="pageSize"
            [totalElements]="totalElements()"
            [totalPages]="totalPages()"
            (pageChange)="onPageChange($event)" />
        }
      </div>
    </div>
  `
})
export class ExchangeRateListComponent implements OnInit {
  private exchangeRateService = inject(ExchangeRateService);
  authService = inject(AuthService);

  rates = signal<ExchangeRate[]>([]);
  currentRate = signal<ExchangeRate | null>(null);
  loading = signal(false);
  loadingCurrent = signal(false);
  fetching = signal(false);
  autoFetchEnabled = signal(false);
  autoFetchHour = signal(8);
  autoFetchMinute = signal(0);
  togglingAutoFetch = signal(false);

  currentPage = signal(1);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);

  scheduledTime = computed(() => {
    const h = this.autoFetchHour().toString().padStart(2, '0');
    const m = this.autoFetchMinute().toString().padStart(2, '0');
    return `${h}:${m}`;
  });

  ngOnInit(): void {
    this.loadRates();
    this.loadCurrentRate();
    this.loadAutoFetchStatus();
  }

  private loadRates(): void {
    this.loading.set(true);
    this.exchangeRateService.getAll(this.currentPage() - 1, this.pageSize).subscribe({
      next: response => {
        this.rates.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadRates();
  }

  private loadCurrentRate(): void {
    this.loadingCurrent.set(true);
    this.exchangeRateService.getCurrent().subscribe({
      next: rate => {
        this.currentRate.set(rate);
        this.loadingCurrent.set(false);
      },
      error: () => {
        this.currentRate.set(null);
        this.loadingCurrent.set(false);
      }
    });
  }

  onFetchRate(): void {
    this.fetching.set(true);
    this.exchangeRateService.fetchCurrentRate().subscribe({
      next: rate => {
        this.currentRate.set(rate);
        this.fetching.set(false);
        this.loadRates();
      },
      error: () => this.fetching.set(false)
    });
  }

  private loadAutoFetchStatus(): void {
    this.exchangeRateService.getAutoFetchStatus().subscribe({
      next: status => {
        this.autoFetchEnabled.set(status.enabled);
        this.autoFetchHour.set(status.hour);
        this.autoFetchMinute.set(status.minute);
      },
      error: () => this.autoFetchEnabled.set(false)
    });
  }

  onToggleAutoFetch(): void {
    const newValue = !this.autoFetchEnabled();
    this.togglingAutoFetch.set(true);
    this.exchangeRateService.toggleAutoFetch(newValue, this.autoFetchHour(), this.autoFetchMinute()).subscribe({
      next: status => {
        this.autoFetchEnabled.set(status.enabled);
        this.autoFetchHour.set(status.hour);
        this.autoFetchMinute.set(status.minute);
        this.togglingAutoFetch.set(false);
      },
      error: () => this.togglingAutoFetch.set(false)
    });
  }

  onTimeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const [h, m] = input.value.split(':').map(Number);
    this.autoFetchHour.set(h);
    this.autoFetchMinute.set(m);
    this.togglingAutoFetch.set(true);
    this.exchangeRateService.toggleAutoFetch(this.autoFetchEnabled(), h, m).subscribe({
      next: status => {
        this.autoFetchHour.set(status.hour);
        this.autoFetchMinute.set(status.minute);
        this.togglingAutoFetch.set(false);
      },
      error: () => this.togglingAutoFetch.set(false)
    });
  }
}
