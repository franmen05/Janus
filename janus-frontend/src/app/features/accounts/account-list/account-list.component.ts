import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { Account, AccountType } from '../../../core/models/account.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent, PaginationComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'ACCOUNTS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a routerLink="/accounts/new" class="btn btn-primary">{{ 'ACCOUNTS.NEW' | translate }}</a>
      }
    </div>
    <div class="card">
      <div class="card-header">
        <div class="row g-2">
          <div class="col-md-8">
            <input type="text" class="form-control"
                   [placeholder]="'ACCOUNTS.SEARCH' | translate"
                   [ngModel]="searchTerm()"
                   (ngModelChange)="onSearch($event)">
          </div>
          <div class="col-md-4">
            <select class="form-select"
                    [attr.aria-label]="'ACCOUNTS.FILTER_TYPE' | translate"
                    [ngModel]="selectedType()"
                    (ngModelChange)="selectedType.set($event)">
              <option value="">{{ 'ACCOUNTS.ALL_TYPES' | translate }}</option>
              @for (type of accountTypes; track type) {
                <option [value]="type">{{ 'ACCOUNT_TYPES.' + type | translate }}</option>
              }
            </select>
          </div>
        </div>
      </div>
      @if (loading()) {
        <div class="card-body"><app-loading-indicator /></div>
      } @else {
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>{{ 'ACCOUNTS.NAME' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'ACCOUNTS.ACCOUNT_CODE' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'ACCOUNTS.TAX_ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'ACCOUNTS.TYPE' | translate }}</th><th class="d-none d-md-table-cell">{{ 'ACCOUNTS.EMAIL' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'ACCOUNTS.PHONE' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'COMMON.ACTIONS' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (account of filteredAccounts(); track account.id) {
              <tr role="button" [style.cursor]="'pointer'" (click)="goToDetail(account.id)">
                <td class="fw-bold">{{ account.name }}</td>
                <td class="d-none d-sm-table-cell">{{ account.accountCode ?? '-' }}</td>
                <td class="d-none d-sm-table-cell">{{ account.taxId }}</td>
                <td class="d-none d-md-table-cell">
                  @for (ct of account.accountTypes; track ct) {
                    <span class="badge bg-info me-1">{{ 'ACCOUNT_TYPES.' + ct | translate }}</span>
                  }
                </td>
                <td class="d-none d-md-table-cell">{{ account.email }}</td>
                <td class="d-none d-lg-table-cell">{{ account.phone ?? '-' }}</td>
                <td><span class="badge" [class]="account.active ? 'bg-success' : 'bg-secondary'">{{ (account.active ? 'ACCOUNTS.ACTIVE' : 'ACCOUNTS.INACTIVE') | translate }}</span></td>
                <td>
                  <div class="d-flex flex-column flex-md-row gap-1">
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/accounts', account.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                  }
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/operations/new']" [queryParams]="{ accountId: account.id }"
                       class="btn btn-sm btn-outline-success">
                      {{ 'ACCOUNTS.OPERATIONS' | translate }}
                    </a>
                  }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="currentPage()"
        [pageSize]="pageSize"
        [totalElements]="totalElements()"
        [totalPages]="totalPages()"
        (pageChange)="onPageChange($event)" />
      }
    </div>
  `
})
export class AccountListComponent implements OnInit, OnDestroy {
  private accountService = inject(AccountService);
  private router = inject(Router);
  authService = inject(AuthService);

  loading = signal(true);
  accounts = signal<Account[]>([]);
  searchTerm = signal('');
  selectedType = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);

  accountTypes = Object.values(AccountType);

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  filteredAccounts = computed(() => {
    const type = this.selectedType();
    return this.accounts().filter(c => !type || c.accountTypes.includes(type as AccountType));
  });

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadAccounts();
    });
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private loadAccounts(): void {
    this.loading.set(true);
    const search = this.searchTerm() || undefined;
    this.accountService.getAll(this.currentPage() - 1, this.pageSize, search).subscribe({
      next: response => {
        this.accounts.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAccounts();
  }

  goToDetail(id: number): void {
    this.router.navigate(['/accounts', id, 'edit']);
  }
}
