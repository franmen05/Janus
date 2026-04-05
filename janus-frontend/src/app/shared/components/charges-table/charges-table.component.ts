import { Component, input, output, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InspectionService } from '../../../core/services/inspection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Customer } from '../../../core/models/customer.model';
import { Operation } from '../../../core/models/operation.model';
import { InspectionExpense, ChargeType } from '../../../core/models/inspection.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { getErrorMessage } from '../../../core/utils/error-message.util';
import { ExpenseDetailModalComponent } from './expense-detail-modal/expense-detail-modal.component';
import { LoadingIndicatorComponent } from '../loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-charges-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, LoadingIndicatorComponent],
  template: `
    @if (canViewExpenses()) {
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0"><i class="bi bi-receipt me-2"></i>{{ 'INSPECTION.CHARGES_TITLE' | translate }}</h6>
        @if (canManageExpenses()) {
          <button class="btn btn-sm btn-primary" (click)="openAddExpense()">
            <i class="bi bi-plus-circle me-1"></i>{{ 'INSPECTION.ADD_CHARGE' | translate }}
          </button>
        }
      </div>
      <div class="card-body">
      @if (loading()) {
        <app-loading-indicator size="sm" />
      } @else {
      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeChargeTab() === 'INCOME'" (click)="activeChargeTab.set('INCOME')">
            {{ 'INSPECTION.TAB_INCOME' | translate }}
            <span class="badge bg-secondary ms-1">{{ incomeTotal() | number:'1.2-2' }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeChargeTab() === 'EXPENSE'" (click)="activeChargeTab.set('EXPENSE')">
            {{ 'INSPECTION.TAB_EXPENSES' | translate }}
            <span class="badge bg-secondary ms-1">{{ expenseTotal() | number:'1.2-2' }}</span>
          </button>
        </li>
      </ul>

      @if (filteredExpenses().length > 0) {
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th>{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}</th>
                <th class="text-center">{{ 'INSPECTION.QUANTITY' | translate }}</th>
                <th class="text-end d-none d-md-table-cell">{{ 'INSPECTION.RATE' | translate }}</th>
                <th class="text-end">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }}</th>
                <th class="d-none d-md-table-cell">{{ 'INSPECTION.EXPENSE_CURRENCY' | translate }}</th>
                <th class="d-none d-md-table-cell">{{ (activeChargeTab() === 'EXPENSE' ? 'INSPECTION.RESPONSIBLE' : 'INSPECTION.BILL_TO') | translate }}</th>
                <th class="d-none d-lg-table-cell">{{ 'INSPECTION.PAYMENT_TYPE' | translate }}</th>
                <th class="d-none d-md-table-cell">{{ 'INSPECTION.PAYMENT_STATUS' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (expense of filteredExpenses(); track expense.id) {
                <tr>
                  <td>{{ 'INSPECTION.CATEGORY_' + expense.category | translate }}</td>
                  <td class="text-center">{{ expense.quantity }}</td>
                  <td class="text-end d-none d-md-table-cell">{{ expense.rate != null ? (expense.rate | number:'1.2-2') : '-' }}</td>
                  <td class="text-end">{{ expense.amount | number:'1.2-2' }}</td>
                  <td class="d-none d-md-table-cell">{{ expense.currency }}</td>
                  <td class="d-none d-md-table-cell">{{ expense.billToName || '-' }}</td>
                  <td class="d-none d-lg-table-cell">
                    @if (expense.paymentType) {
                      {{ 'INSPECTION.PAYMENT_' + expense.paymentType | translate }}
                    } @else {
                      -
                    }
                  </td>
                  <td class="d-none d-md-table-cell">
                    <span class="badge" [class.bg-success]="expense.paymentStatus === 'PAID'" [class.bg-warning]="expense.paymentStatus === 'PENDING'">
                      {{ 'INSPECTION.PAYMENT_' + expense.paymentStatus | translate }}
                    </span>
                  </td>
                  <td>
                      <button class="btn btn-sm btn-outline-secondary me-1" (click)="openExpenseDetail(expense)" title="{{ 'ACTIONS.VIEW' | translate }}">
                        <i class="bi bi-eye"></i>
                      </button>
                      @if (canManageExpenses()) {
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteExpense(expense.id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      }
                    </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="fw-bold">
                <td colspan="3">{{ (activeChargeTab() === 'INCOME' ? 'INSPECTION.INCOME_TOTAL' : 'INSPECTION.EXPENSE_TOTAL') | translate }}</td>
                <td class="text-end">{{ activeChargeTab() === 'INCOME' ? (incomeTotal() | number:'1.2-2') : (expenseTotal() | number:'1.2-2') }}</td>
                <td colspan="5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      } @else {
        <p class="text-muted">{{ 'INSPECTION.NO_EXPENSES' | translate }}</p>
      }
      }
      </div>
    </div>
    }
  `
})
export class ChargesTableComponent implements OnInit {
  operationId = input.required<number>();
  operation = input.required<Operation | null>();
  operationSummary = input<{
    pieces?: number | null;
    grossWeight?: number | null;
    volumetricWeight?: number | null;
    volume?: number | null;
    declaredValue?: number | null;
    customerName?: string | null;
    blNumber?: string | null;
  } | null>(null);
  customers = input<Customer[]>([]);
  liquidationStatus = input<string | null>(null);
  changed = output<void>();

  private inspectionService = inject(InspectionService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  authService = inject(AuthService);

  loading = signal(true);
  allExpenses = signal<InspectionExpense[]>([]);
  expensesTotal = signal<number>(0);
  incomeTotal = signal<number>(0);
  expenseTotal = signal<number>(0);
  activeChargeTab = signal<ChargeType>('EXPENSE');

  filteredExpenses = computed(() => {
    const tab = this.activeChargeTab();
    return this.allExpenses().filter(e => (e.chargeType || 'EXPENSE') === tab);
  });

  ngOnInit(): void {
    this.loadExpenses();
  }

  canViewExpenses(): boolean {
    return this.authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING']);
  }

  canManageExpenses(): boolean {
    const status = this.liquidationStatus();
    if (status === 'DEFINITIVE' || status === 'PAID') return false;
    return this.authService.hasRole(['ADMIN', 'AGENT']);
  }

  loadExpenses(): void {
    this.inspectionService.getExpenses(this.operationId()).subscribe({
      next: (summary) => {
        this.allExpenses.set(summary.expenses);
        this.expensesTotal.set(summary.total);
        this.incomeTotal.set(summary.incomeTotal);
        this.expenseTotal.set(summary.expenseTotal);
        this.loading.set(false);
      },
      error: () => {
        this.allExpenses.set([]);
        this.expensesTotal.set(0);
        this.incomeTotal.set(0);
        this.expenseTotal.set(0);
        this.loading.set(false);
      }
    });
  }

  openAddExpense(): void {
    const ref = this.modalService.open(ExpenseDetailModalComponent, { size: 'xl' });
    ref.componentInstance.expense = null;
    ref.componentInstance.operationId = this.operationId();
    ref.componentInstance.canEdit = true;
    ref.componentInstance.customers = this.customers();
    ref.componentInstance.operationSummary = this.operationSummary();
    ref.componentInstance.defaultChargeType = this.activeChargeTab();
    ref.componentInstance.initForm();
    ref.closed.subscribe((result) => {
      if (result === 'created' || result === 'created-continue') {
        this.loadExpenses();
        this.changed.emit();
        if (result === 'created-continue') {
          this.openAddExpense();
        }
      }
    });
  }

  openExpenseDetail(expense: InspectionExpense): void {
    const ref = this.modalService.open(ExpenseDetailModalComponent, { size: 'xl' });
    ref.componentInstance.expense = expense;
    ref.componentInstance.operationId = this.operationId();
    ref.componentInstance.canEdit = this.canManageExpenses();
    ref.componentInstance.customers = this.customers();
    ref.componentInstance.operationSummary = this.operationSummary();
    ref.componentInstance.initForm();
    ref.closed.subscribe((result) => {
      if (result === 'updated') {
        this.loadExpenses();
        this.changed.emit();
      }
    });
  }

  deleteExpense(expenseId: number): void {
    const msg = this.translate.instant('INSPECTION.CONFIRM_DELETE_EXPENSE');
    if (!confirm(msg)) return;
    this.inspectionService.deleteExpense(this.operationId(), expenseId).subscribe({
      next: () => {
        this.loadExpenses();
        this.changed.emit();
        this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_DELETED'));
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }
}
