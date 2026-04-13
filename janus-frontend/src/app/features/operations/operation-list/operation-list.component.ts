import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { Operation, OperationStatus, TransportMode } from '../../../core/models/operation.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-operation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule, StatusBadgeComponent, StatusLabelPipe, LoadingIndicatorComponent, PaginationComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'OPERATIONS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a routerLink="/operations/new" class="btn btn-primary">{{ 'OPERATIONS.NEW' | translate }}</a>
      }
    </div>
    @if (loading()) {
      <app-loading-indicator />
    } @else {
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <input type="text" class="form-control" [placeholder]="'OPERATIONS.SEARCH' | translate" [ngModel]="searchTerm()" (ngModelChange)="onSearch($event)">
            </div>
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()">
                <option value="">{{ 'OPERATIONS.ALL_STATUSES' | translate }}</option>
                @for (s of statuses; track s) { <option [value]="s">{{ s | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-md-4">
              <select class="form-select" [ngModel]="selectedTransport()" (ngModelChange)="selectedTransport.set($event)">
                <option value="">{{ 'OPERATIONS.ALL_TRANSPORT_MODES' | translate }}</option>
                @for (tm of transportModes; track tm) {
                  <option [value]="tm">{{ 'TRANSPORT_MODES.' + tm | translate }}</option>
                }
              </select>
            </div>
          </div>
          @if (activeFilter) {
            <div class="mt-2">
              <span class="badge bg-primary me-2">
                {{ activeFilter === 'active' ? ('DASHBOARD.ACTIVE' | translate) : ('DASHBOARD.OVERDUE' | translate) }}
                <button type="button" class="btn-close btn-close-white ms-1" style="font-size: 0.5rem;" (click)="clearFilter()"></button>
              </span>
            </div>
          }
        </div>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr><th>{{ 'OPERATIONS.REFERENCE' | translate }}</th><th>{{ 'OPERATIONS.CUSTOMER' | translate }}</th><th class="d-none d-md-table-cell">{{ 'OPERATIONS.TRANSPORT_MODE' | translate }}</th><th class="d-none d-md-table-cell">{{ 'OPERATIONS.ARRIVAL_PORT' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'OPERATIONS.AGENT' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'OPERATIONS.CREATED' | translate }}</th></tr>
            </thead>
            <tbody>
              @for (op of filteredOperations(); track op.id) {
                <tr [routerLink]="['/operations', op.id]" style="cursor: pointer;">
                  <td class="fw-bold">{{ op.referenceNumber }}</td>
                  <td>{{ op.customerName }}</td>
                  <td class="d-none d-md-table-cell">{{ op.transportMode | statusLabel }}</td>
                  <td class="d-none d-md-table-cell">{{ op.arrivalPortName ?? '-' }}</td>
                  <td><app-status-badge [status]="op.status" /></td>
                  <td class="d-none d-lg-table-cell">{{ op.assignedAgentName ?? '-' }}</td>
                  <td class="d-none d-sm-table-cell">{{ op.createdAt | date:'shortDate' }}</td>
                </tr>
              }
              @if (filteredOperations().length === 0) {
                <tr><td colspan="7" class="text-center text-muted py-4">{{ 'OPERATIONS.NO_OPERATIONS' | translate }}</td></tr>
              }
            </tbody>
          </table>
          </div>
        </div>
        <app-pagination
          [currentPage]="currentPage()"
          [pageSize]="pageSize"
          [totalElements]="totalElements()"
          [totalPages]="totalPages()"
          (pageChange)="onPageChange($event)" />
      </div>
    }
  `
})
export class OperationListComponent implements OnInit, OnDestroy {
  private operationService = inject(OperationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  loading = signal(true);
  operations = signal<Operation[]>([]);
  filterStatus = '';
  activeFilter = '';
  statuses = Object.values(OperationStatus);
  searchTerm = signal('');
  selectedTransport = signal('');
  transportModes = Object.values(TransportMode);

  currentPage = signal(1);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  filteredOperations = computed(() => {
    const transport = this.selectedTransport();
    if (!transport) return this.operations();
    return this.operations().filter(op => op.transportMode === transport);
  });

  ngOnInit(): void {
    const statusParam = this.route.snapshot.queryParamMap.get('status');
    const filterParam = this.route.snapshot.queryParamMap.get('filter');
    if (statusParam) {
      this.filterStatus = statusParam;
    } else if (filterParam) {
      this.activeFilter = filterParam;
    }

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadOperations();
    });

    this.loadOperations();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadOperations(): void {
    this.loading.set(true);
    if (this.activeFilter) {
      this.operationService.getAll(undefined, undefined, undefined, 0, 9999).subscribe({
        next: response => {
          let ops = response.content;
          if (this.activeFilter === 'active') {
            const excluded = new Set(['CLOSED', 'CANCELLED', 'DRAFT']);
            ops = ops.filter(o => !excluded.has(o.status));
          } else if (this.activeFilter === 'overdue') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            ops = ops.filter(o =>
              o.status !== 'CLOSED' && o.status !== 'CANCELLED' &&
              o.arrivalDate != null && new Date(o.arrivalDate) < today
            );
          }
          this.operations.set(ops);
          this.totalElements.set(ops.length);
          this.totalPages.set(1);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      const search = this.searchTerm() || undefined;
      this.operationService.getAll(this.filterStatus || undefined, undefined, search, this.currentPage() - 1, this.pageSize).subscribe({
        next: response => {
          this.operations.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadOperations();
  }

  onFilterChange(): void {
    this.activeFilter = '';
    this.currentPage.set(1);
    this.loadOperations();
  }

  clearFilter(): void {
    this.activeFilter = '';
    this.filterStatus = '';
    this.currentPage.set(1);
    this.loadOperations();
    this.router.navigate(['/operations']);
  }
}
