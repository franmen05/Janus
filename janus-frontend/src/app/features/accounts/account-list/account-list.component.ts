import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountService } from '../../../core/services/account.service';
import { Account, AccountType } from '../../../core/models/account.model';
import { CsvImportResponse } from '../../../core/models/shared.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent, PaginationComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'ACCOUNTS.TITLE' | translate }}</h2>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <button class="btn btn-outline-secondary btn-sm" (click)="onExportCsv()">{{ 'ACCOUNTS.EXPORT_CSV' | translate }}</button>
        <button class="btn btn-outline-secondary btn-sm" (click)="onDownloadTemplate()">{{ 'ACCOUNTS.DOWNLOAD_TEMPLATE' | translate }}</button>
        <label class="btn btn-outline-secondary btn-sm mb-0" [class.disabled]="importing()">
          {{ importing() ? '...' : ('ACCOUNTS.IMPORT_CSV' | translate) }}
          <input type="file" accept=".csv" class="d-none" (change)="onImportCsv($event)">
        </label>
        @if (authService.hasRole(['ADMIN', 'AGENT'])) {
          <a routerLink="/accounts/new" class="btn btn-primary">{{ 'ACCOUNTS.NEW' | translate }}</a>
        }
      </div>
    </div>
    @if (importResult()) {
      <div class="alert alert-info mb-3 alert-dismissible fade show">
        <div class="d-flex flex-wrap gap-2">
          <span class="badge bg-success">{{ 'ACCOUNTS.IMPORT_RESULT_CREATED' | translate:{count: importResult()!.imported} }}</span>
          <span class="badge bg-primary">{{ 'ACCOUNTS.IMPORT_RESULT_UPDATED' | translate:{count: importResult()!.updated} }}</span>
          <span class="badge bg-secondary">{{ 'ACCOUNTS.IMPORT_RESULT_DUPLICATES' | translate:{count: importResult()!.duplicates} }}</span>
          <span class="badge bg-danger">{{ 'ACCOUNTS.IMPORT_RESULT_ERRORS' | translate:{count: importResult()!.skipped} }}</span>
        </div>
        @if (importResult()!.errors.length > 0) {
          <ul class="mb-0 mt-1">
            @for (err of importResult()!.errors; track err) {
              <li>{{ err }}</li>
            }
          </ul>
        }
        <button type="button" class="btn-close" (click)="importResult.set(null)"></button>
      </div>
    }
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
        <div class="form-check form-switch mt-2">
          <input class="form-check-input" type="checkbox" id="showInactiveToggle"
                 [checked]="showInactive()"
                 (change)="onToggleShowInactive($any($event.target).checked)">
          <label class="form-check-label" for="showInactiveToggle">
            {{ 'ACCOUNTS.SHOW_INACTIVE' | translate }}
          </label>
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
                  @if (authService.hasRole(['ADMIN'])) {
                    @if (account.active) {
                      <button type="button" class="btn btn-sm btn-outline-danger"
                              (click)="onDeactivate(account, $event)">
                        {{ 'ACCOUNTS.DEACTIVATE' | translate }}
                      </button>
                    } @else {
                      <button type="button" class="btn btn-sm btn-outline-success"
                              (click)="onActivate(account, $event)">
                        {{ 'ACCOUNTS.ACTIVATE' | translate }}
                      </button>
                    }
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
  private modalService = inject(NgbModal);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  loading = signal(true);
  accounts = signal<Account[]>([]);
  searchTerm = signal('');
  selectedType = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);
  importing = signal(false);
  importResult = signal<CsvImportResponse | null>(null);
  showInactive = signal(false);

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
    const activeOnly = !this.showInactive();
    this.accountService.getAll(this.currentPage() - 1, this.pageSize, search, activeOnly).subscribe({
      next: response => {
        this.accounts.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onToggleShowInactive(value: boolean): void {
    this.showInactive.set(value);
    this.currentPage.set(1);
    this.loadAccounts();
  }

  onActivate(account: Account, event: Event): void {
    event.stopPropagation();
    this.accountService.setActive(account.id, true).subscribe({
      next: updated => {
        this.accounts.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.toast.success(this.translate.instant('ACCOUNTS.ACTIVATED_SUCCESS'));
      }
    });
  }

  onDeactivate(account: Account, event: Event): void {
    event.stopPropagation();
    const ref = this.modalService.open(ConfirmDialogComponent);
    ref.componentInstance.title.set(this.translate.instant('ACCOUNTS.CONFIRM_DEACTIVATE_TITLE'));
    ref.componentInstance.message.set(this.translate.instant('ACCOUNTS.CONFIRM_DEACTIVATE_MESSAGE', { name: account.name }));
    ref.result.then(
      confirmed => {
        if (!confirmed) return;
        this.accountService.setActive(account.id, false).subscribe({
          next: updated => {
            if (!this.showInactive()) {
              this.accounts.update(list => list.filter(a => a.id !== updated.id));
            } else {
              this.accounts.update(list => list.map(a => a.id === updated.id ? updated : a));
            }
            this.toast.success(this.translate.instant('ACCOUNTS.DEACTIVATED_SUCCESS'));
          }
        });
      },
      () => { /* dismissed */ }
    );
  }

  onDownloadTemplate(): void {
    const content = [
      'name,taxId,email,accountTypes,phone,address,businessName,representative,documentType,alternatePhone,country,accountCode,notes',
      '"Acme Corp","123456789","contact@acme.com","COMPANY;SHIPPER","+1-555-0100","123 Main St","Acme Corporation","John Doe","RNC","+1-555-0101","DO","ACC001","Example account"'
    ].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onExportCsv(): void {
    this.accountService.exportCsv().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'accounts.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onImportCsv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importing.set(true);
    this.accountService.importCsv(file).subscribe({
      next: result => {
        this.importResult.set(result);
        this.importing.set(false);
        this.loadAccounts();
      },
      error: () => { this.importing.set(false); }
    });
    (event.target as HTMLInputElement).value = '';
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
