import { Component, input, output, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InspectionService } from '../../../core/services/inspection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { Operation, InspectionType } from '../../../core/models/operation.model';
import { InspectionPhoto, SetInspectionTypeRequest, InspectionExpense, ChargeType } from '../../../core/models/inspection.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { getErrorMessage } from '../../../core/utils/error-message.util';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ExpenseDetailModalComponent } from './expense-detail-modal/expense-detail-modal.component';

@Component({
  selector: 'app-inspection-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, FileUploadComponent, StatusBadgeComponent],
  template: `
    <div class="card mt-3">
      <div class="card-header">
        <h6 class="mb-0">{{ 'INSPECTION.TYPE_LABEL' | translate }}</h6>
      </div>
      <div class="card-body">
        <!-- Type selector: only for ADMIN/AGENT in appropriate statuses -->
        @if (canSetType()) {
          <div class="mb-3">
            <div class="btn-group" role="group">
              @for (type of inspectionTypes; track type) {
                <button type="button" class="btn"
                        [class.btn-primary]="operation()?.inspectionType === type"
                        [class.btn-outline-primary]="operation()?.inspectionType !== type"
                        (click)="setType(type)">
                  {{ 'INSPECTION.TYPE_' + type | translate }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Current type badge -->
        @if (operation()?.inspectionType) {
          <div class="mb-3">
            <app-status-badge [status]="operation()!.inspectionType!" />
            @if (operation()!.inspectionType === 'EXPRESO') {
              <small class="text-muted ms-2">{{ 'INSPECTION.EXPRESO_NOTE' | translate }}</small>
            }
          </div>
        }

        <!-- Photo section: only for VISUAL/FISICA -->
        @if (operation()?.inspectionType === 'VISUAL' || operation()?.inspectionType === 'FISICA') {
          <hr>
          <h6>{{ 'INSPECTION.PHOTOS_TITLE' | translate }}</h6>

          <!-- Photo gallery -->
          @if (photos().length > 0) {
            <div class="row g-3 mb-3">
              @for (photo of photos(); track photo.id) {
                <div class="col-sm-6 col-md-4 col-lg-3">
                  <div class="card h-100">
                    <div class="card-body p-2">
                      <p class="fw-bold mb-1 text-truncate" [title]="photo.originalName">{{ photo.originalName }}</p>
                      <small class="text-muted d-block">{{ photo.createdAt | date:'short' }}</small>
                      <small class="text-muted d-block">{{ photo.uploadedBy }}</small>
                      @if (photo.caption) {
                        <small class="d-block mt-1">{{ photo.caption }}</small>
                      }
                    </div>
                    <div class="card-footer p-2">
                      <a [href]="getDownloadUrl(photo.id)" class="btn btn-sm btn-outline-secondary w-100" target="_blank">
                        <i class="bi bi-download me-1"></i>{{ 'ACTIONS.DOWNLOAD' | translate }}
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted">{{ 'INSPECTION.NO_PHOTOS' | translate }}</p>
          }

          <!-- Photo upload: only ADMIN/AGENT -->
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <div class="border rounded p-3 mt-3">
              <h6>{{ 'INSPECTION.UPLOAD_PHOTO' | translate }}</h6>
              <div class="mb-2">
                <label class="form-label">{{ 'INSPECTION.PHOTO_CAPTION' | translate }}</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="caption">
              </div>
              <app-file-upload (fileSelected)="onFileSelected($event)" />
              @if (selectedFile) {
                <button class="btn btn-sm btn-primary mt-2" (click)="uploadPhoto()" [disabled]="uploading()">
                  @if (uploading()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  {{ 'ACTIONS.UPLOAD' | translate }}
                </button>
              }
            </div>
          }
        }

        <!-- Charges section: visible when inspection type is set -->
        @if (operation()?.inspectionType && canViewExpenses()) {
          <hr>
          <h6>{{ 'INSPECTION.CHARGES_TITLE' | translate }}</h6>

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

          <!-- Add charge button -->
          @if (canManageExpenses()) {
            <button class="btn btn-sm btn-primary mb-2" (click)="openAddExpense()">
              <i class="bi bi-plus-circle me-1"></i>{{ 'INSPECTION.ADD_CHARGE' | translate }}
            </button>
          }
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
                    <th class="d-none d-md-table-cell">{{ 'INSPECTION.BILL_TO' | translate }}</th>
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
  `
})
export class InspectionPanelComponent implements OnInit {
  operationId = input.required<number>();
  operation = input.required<Operation | null>();
  changed = output<void>();

  private inspectionService = inject(InspectionService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  private clientService = inject(ClientService);
  authService = inject(AuthService);

  photos = signal<InspectionPhoto[]>([]);
  uploading = signal(false);
  selectedFile: File | null = null;
  caption = '';

  // Charges state
  allExpenses = signal<InspectionExpense[]>([]);
  expensesTotal = signal<number>(0);
  incomeTotal = signal<number>(0);
  expenseTotal = signal<number>(0);
  activeChargeTab = signal<ChargeType>('EXPENSE');
  clients = signal<Client[]>([]);

  filteredExpenses = computed(() => {
    const tab = this.activeChargeTab();
    return this.allExpenses().filter(e => (e.chargeType || 'EXPENSE') === tab);
  });

  inspectionTypes = Object.values(InspectionType);

  ngOnInit(): void {
    this.loadPhotos();
    this.loadExpenses();
    this.clientService.getAll().subscribe(c => this.clients.set(c));
  }

  canSetType(): boolean {
    const op = this.operation();
    if (!op) return false;
    if (!this.authService.hasRole(['ADMIN', 'AGENT'])) return false;
    return op.status === 'SUBMITTED_TO_CUSTOMS' || op.status === 'VALUATION_REVIEW' || op.status === 'PAYMENT_PREPARATION';
  }

  setType(type: InspectionType): void {
    const msg = this.translate.instant('INSPECTION.CONFIRM_TYPE');
    if (!confirm(msg)) return;

    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    const request: SetInspectionTypeRequest = {
      inspectionType: type,
      comment: comment || undefined
    };
    this.inspectionService.setInspectionType(this.operationId(), request).subscribe({
      next: () => {
        this.changed.emit();
        this.loadPhotos();
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }

  loadPhotos(): void {
    const op = this.operation();
    if (op?.inspectionType === 'VISUAL' || op?.inspectionType === 'FISICA') {
      this.inspectionService.getPhotos(this.operationId()).subscribe(p => this.photos.set(p));
    }
  }

  onFileSelected(file: File): void {
    this.selectedFile = file;
  }

  uploadPhoto(): void {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.inspectionService.uploadPhoto(this.operationId(), this.selectedFile, this.caption || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.selectedFile = null;
        this.caption = '';
        this.loadPhotos();
        this.toastService.success(this.translate.instant('INSPECTION.UPLOAD_SUCCESS'));
      },
      error: (err) => {
        this.uploading.set(false);
        this.toastService.error(getErrorMessage(err, this.translate));
      }
    });
  }

  getDownloadUrl(photoId: number): string {
    return this.inspectionService.getPhotoDownloadUrl(this.operationId(), photoId);
  }

  // Expense methods

  canViewExpenses(): boolean {
    return this.authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING']);
  }

  canManageExpenses(): boolean {
    return this.authService.hasRole(['ADMIN', 'AGENT']);
  }

  loadExpenses(): void {
    const op = this.operation();
    if (op?.inspectionType) {
      this.inspectionService.getExpenses(this.operationId()).subscribe({
        next: (summary) => {
          this.allExpenses.set(summary.expenses);
          this.expensesTotal.set(summary.total);
          this.incomeTotal.set(summary.incomeTotal);
          this.expenseTotal.set(summary.expenseTotal);
        },
        error: () => {
          this.allExpenses.set([]);
          this.expensesTotal.set(0);
          this.incomeTotal.set(0);
          this.expenseTotal.set(0);
        }
      });
    }
  }

  openAddExpense(): void {
    const ref = this.modalService.open(ExpenseDetailModalComponent, { size: 'xl' });
    const op = this.operation();
    ref.componentInstance.expense = null;
    ref.componentInstance.operationId = this.operationId();
    ref.componentInstance.canEdit = true;
    ref.componentInstance.clients = this.clients();
    ref.componentInstance.operationSummary = op ? {
      pieces: op.pieces,
      grossWeight: op.grossWeight,
      volumetricWeight: op.volumetricWeight,
      volume: op.volume,
      declaredValue: op.declaredValue,
      clientName: op.clientName,
      blNumber: op.blNumber
    } : null;
    ref.componentInstance.initForm();
    ref.closed.subscribe((result) => {
      if (result === 'created' || result === 'created-continue') {
        this.loadExpenses();
        if (result === 'created-continue') {
          this.openAddExpense();
        }
      }
    });
  }

  openExpenseDetail(expense: InspectionExpense): void {
    const ref = this.modalService.open(ExpenseDetailModalComponent, { size: 'xl' });
    const op = this.operation();
    ref.componentInstance.expense = expense;
    ref.componentInstance.operationId = this.operationId();
    ref.componentInstance.canEdit = this.canManageExpenses();
    ref.componentInstance.clients = this.clients();
    ref.componentInstance.operationSummary = op ? {
      pieces: op.pieces,
      grossWeight: op.grossWeight,
      volumetricWeight: op.volumetricWeight,
      volume: op.volume,
      declaredValue: op.declaredValue,
      clientName: op.clientName,
      blNumber: op.blNumber
    } : null;
    ref.componentInstance.initForm();
    ref.closed.subscribe((result) => {
      if (result === 'updated') {
        this.loadExpenses();
      }
    });
  }

  deleteExpense(expenseId: number): void {
    const msg = this.translate.instant('INSPECTION.CONFIRM_DELETE_EXPENSE');
    if (!confirm(msg)) return;
    this.inspectionService.deleteExpense(this.operationId(), expenseId).subscribe({
      next: () => {
        this.loadExpenses();
        this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_DELETED'));
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }
}
