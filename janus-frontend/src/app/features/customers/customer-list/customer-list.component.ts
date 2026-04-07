import { Component, inject, OnInit, signal, computed } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerType } from '../../../core/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'CUSTOMERS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a routerLink="/customers/new" class="btn btn-primary">{{ 'CUSTOMERS.NEW' | translate }}</a>
      }
    </div>
    @if (loading()) {
      <app-loading-indicator />
    } @else {
    <div class="card">
      <div class="card-header">
        <div class="row g-2">
          <div class="col-md-8">
            <input type="text" class="form-control"
                   [placeholder]="'CUSTOMERS.SEARCH' | translate"
                   [ngModel]="searchTerm()"
                   (ngModelChange)="searchTerm.set($event)">
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
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>{{ 'CUSTOMERS.NAME' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'CUSTOMERS.BUSINESS_NAME' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'CUSTOMERS.TAX_ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'CUSTOMERS.TYPE' | translate }}</th><th class="d-none d-md-table-cell">{{ 'CUSTOMERS.EMAIL' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'CUSTOMERS.PHONE' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'COMMON.ACTIONS' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (customer of filteredCustomers(); track customer.id) {
              <tr>
                <td class="fw-bold">{{ customer.name }}</td>
                <td class="d-none d-sm-table-cell">{{ customer.businessName ?? '-' }}</td>
                <td class="d-none d-sm-table-cell">{{ customer.taxId }}</td>
                <td class="d-none d-md-table-cell">{{ 'CUSTOMER_TYPES.' + customer.customerType | translate }}</td>
                <td class="d-none d-md-table-cell">{{ customer.email }}</td>
                <td class="d-none d-lg-table-cell">{{ customer.phone ?? '-' }}</td>
                <td><span class="badge" [class]="customer.active ? 'bg-success' : 'bg-secondary'">{{ (customer.active ? 'CUSTOMERS.ACTIVE' : 'CUSTOMERS.INACTIVE') | translate }}</span></td>
                <td>
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/customers', customer.id, 'edit']" class="btn btn-sm btn-outline-primary me-1">{{ 'ACTIONS.EDIT' | translate }}</a>
                  }
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/operations/new']" [queryParams]="{ customerId: customer.id }"
                       class="btn btn-sm btn-outline-success">
                      {{ 'CUSTOMERS.OPERATIONS' | translate }}
                    </a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    }
  `
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  authService = inject(AuthService);
  loading = signal(true);
  customers = signal<Customer[]>([]);
  searchTerm = signal('');
  selectedType = signal('');
  customerTypes = Object.values(CustomerType);
  filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const type = this.selectedType();
    return this.customers().filter(c => {
      const matchesTerm = !term ||
        c.name.toLowerCase().includes(term) ||
        c.taxId.toLowerCase().includes(term) ||
        (c.businessName?.toLowerCase().includes(term) ?? false);
      const matchesType = !type || c.customerType === type;
      return matchesTerm && matchesType;
    });
  });

  ngOnInit(): void {
    this.customerService.getAll().subscribe(customers => {
      this.customers.set(customers);
      this.loading.set(false);
    });
  }
}
