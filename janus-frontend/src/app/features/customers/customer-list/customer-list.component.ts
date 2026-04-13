import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerType } from '../../../core/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent, PaginationComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'CUSTOMERS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a routerLink="/customers/new" class="btn btn-primary">{{ 'CUSTOMERS.NEW' | translate }}</a>
      }
    </div>
    <div class="card">
      <div class="card-header">
        <div class="row g-2">
          <div class="col-md-8">
            <input type="text" class="form-control"
                   [placeholder]="'CUSTOMERS.SEARCH' | translate"
                   [ngModel]="searchTerm()"
                   (ngModelChange)="onSearch($event)">
          </div>
          <div class="col-md-4">
            <select class="form-select"
                    [attr.aria-label]="'CUSTOMERS.FILTER_TYPE' | translate"
                    [ngModel]="selectedType()"
                    (ngModelChange)="selectedType.set($event)">
              <option value="">{{ 'CUSTOMERS.ALL_TYPES' | translate }}</option>
              @for (type of customerTypes; track type) {
                <option [value]="type">{{ 'CUSTOMER_TYPES.' + type | translate }}</option>
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
            <tr><th>{{ 'CUSTOMERS.NAME' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'CUSTOMERS.CUSTOMER_CODE' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'CUSTOMERS.TAX_ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'CUSTOMERS.TYPE' | translate }}</th><th class="d-none d-md-table-cell">{{ 'CUSTOMERS.EMAIL' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'CUSTOMERS.PHONE' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'COMMON.ACTIONS' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (customer of filteredCustomers(); track customer.id) {
              <tr role="button" [style.cursor]="'pointer'" (click)="goToDetail(customer.id)">
                <td class="fw-bold">{{ customer.name }}</td>
                <td class="d-none d-sm-table-cell">{{ customer.customerCode ?? '-' }}</td>
                <td class="d-none d-sm-table-cell">{{ customer.taxId }}</td>
                <td class="d-none d-md-table-cell">
                  @for (ct of customer.customerTypes; track ct) {
                    <span class="badge bg-info me-1">{{ 'CUSTOMER_TYPES.' + ct | translate }}</span>
                  }
                </td>
                <td class="d-none d-md-table-cell">{{ customer.email }}</td>
                <td class="d-none d-lg-table-cell">{{ customer.phone ?? '-' }}</td>
                <td><span class="badge" [class]="customer.active ? 'bg-success' : 'bg-secondary'">{{ (customer.active ? 'CUSTOMERS.ACTIVE' : 'CUSTOMERS.INACTIVE') | translate }}</span></td>
                <td>
                  <div class="d-flex flex-column flex-md-row gap-1">
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/customers', customer.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                  }
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/operations/new']" [queryParams]="{ customerId: customer.id }"
                       class="btn btn-sm btn-outline-success">
                      {{ 'CUSTOMERS.OPERATIONS' | translate }}
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
export class CustomerListComponent implements OnInit, OnDestroy {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  authService = inject(AuthService);

  loading = signal(true);
  customers = signal<Customer[]>([]);
  searchTerm = signal('');
  selectedType = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);

  customerTypes = Object.values(CustomerType);

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  filteredCustomers = computed(() => {
    const type = this.selectedType();
    return this.customers().filter(c => !type || c.customerTypes.includes(type as CustomerType));
  });

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadCustomers();
    });
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private loadCustomers(): void {
    this.loading.set(true);
    const search = this.searchTerm() || undefined;
    this.customerService.getAll(this.currentPage() - 1, this.pageSize, search).subscribe({
      next: response => {
        this.customers.set(response.content);
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
    this.loadCustomers();
  }

  goToDetail(id: number): void {
    this.router.navigate(['/customers', id, 'edit']);
  }
}
