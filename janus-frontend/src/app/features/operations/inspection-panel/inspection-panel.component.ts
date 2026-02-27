import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InspectionService } from '../../../core/services/inspection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Operation, InspectionType } from '../../../core/models/operation.model';
import { InspectionPhoto, SetInspectionTypeRequest, InspectionExpense, ExpenseCategory, CreateExpenseRequest } from '../../../core/models/inspection.model';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-inspection-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, FileUploadComponent, StatusBadgeComponent],
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

        <!-- Expenses section: visible when inspection type is set -->
        @if (operation()?.inspectionType && canViewExpenses()) {
          <hr>
          <h6>{{ 'INSPECTION.EXPENSES_TITLE' | translate }}</h6>

          @if (expenses().length > 0) {
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}</th>
                    <th>{{ 'INSPECTION.EXPENSE_DESCRIPTION' | translate }}</th>
                    <th class="text-end">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }}</th>
                    <th class="d-none d-md-table-cell">{{ 'INSPECTION.EXPENSE_CURRENCY' | translate }}</th>
                    <th class="d-none d-md-table-cell">{{ 'INSPECTION.EXPENSE_DATE' | translate }}</th>
                    <th class="d-none d-md-table-cell">{{ 'INSPECTION.EXPENSE_JUSTIFICATION' | translate }}</th>
                    <th class="d-none d-md-table-cell">{{ 'INSPECTION.EXPENSE_REGISTERED_BY' | translate }}</th>
                    @if (canManageExpenses()) {
                      <th>{{ 'COMMON.ACTIONS' | translate }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (expense of expenses(); track expense.id) {
                    @if (editingExpenseId() === expense.id) {
                      <tr>
                        <td>
                          <select class="form-select form-select-sm" [formControl]="editExpenseForm.controls.category">
                            @for (cat of expenseCategories; track cat) {
                              <option [value]="cat">{{ 'INSPECTION.CATEGORY_' + cat | translate }}</option>
                            }
                          </select>
                        </td>
                        <td><input type="text" class="form-control form-control-sm" [formControl]="editExpenseForm.controls.description"></td>
                        <td><input type="number" class="form-control form-control-sm" [formControl]="editExpenseForm.controls.amount" step="0.01" min="0.01"></td>
                        <td class="d-none d-md-table-cell"><input type="text" class="form-control form-control-sm" [formControl]="editExpenseForm.controls.currency" style="width:80px"></td>
                        <td class="d-none d-md-table-cell"><input type="date" class="form-control form-control-sm" [formControl]="editExpenseForm.controls.expenseDate"></td>
                        <td class="d-none d-md-table-cell"><input type="text" class="form-control form-control-sm" [formControl]="editExpenseForm.controls.justification"></td>
                        <td class="d-none d-md-table-cell">{{ expense.registeredByFullName }}</td>
                        <td>
                          <button class="btn btn-sm btn-success me-1" (click)="updateExpense(expense.id)" [disabled]="editExpenseForm.invalid">
                            {{ 'INSPECTION.EXPENSE_SAVE' | translate }}
                          </button>
                          <button class="btn btn-sm btn-secondary" (click)="cancelEdit()">
                            {{ 'INSPECTION.EXPENSE_CANCEL' | translate }}
                          </button>
                        </td>
                      </tr>
                    } @else {
                      <tr>
                        <td>{{ 'INSPECTION.CATEGORY_' + expense.category | translate }}</td>
                        <td>{{ expense.description || '-' }}</td>
                        <td class="text-end">{{ expense.amount | number:'1.2-2' }}</td>
                        <td class="d-none d-md-table-cell">{{ expense.currency }}</td>
                        <td class="d-none d-md-table-cell">{{ expense.expenseDate | date:'shortDate' }}</td>
                        <td class="d-none d-md-table-cell">{{ expense.justification || '-' }}</td>
                        <td class="d-none d-md-table-cell">{{ expense.registeredByFullName }}</td>
                        @if (canManageExpenses()) {
                          <td>
                            <button class="btn btn-sm btn-outline-primary me-1" (click)="startEdit(expense)">
                              {{ 'INSPECTION.EDIT_EXPENSE' | translate }}
                            </button>
                            <button class="btn btn-sm btn-outline-danger" (click)="deleteExpense(expense.id)">
                              {{ 'INSPECTION.DELETE_EXPENSE' | translate }}
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  }
                </tbody>
                <tfoot>
                  <tr class="fw-bold">
                    <td colspan="2">{{ 'INSPECTION.EXPENSE_TOTAL' | translate }}</td>
                    <td class="text-end">{{ expensesTotal() | number:'1.2-2' }}</td>
                    <td colspan="5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          } @else {
            <p class="text-muted">{{ 'INSPECTION.NO_EXPENSES' | translate }}</p>
          }

          <!-- Add expense button and form -->
          @if (canManageExpenses()) {
            @if (!showExpenseForm()) {
              <button class="btn btn-sm btn-primary" (click)="showExpenseForm.set(true)">
                <i class="bi bi-plus-circle me-1"></i>{{ 'INSPECTION.ADD_EXPENSE' | translate }}
              </button>
            } @else {
              <div class="border rounded p-3 mt-2">
                <h6>{{ 'INSPECTION.ADD_EXPENSE' | translate }}</h6>
                <form [formGroup]="newExpenseForm" (ngSubmit)="addExpense()">
                  <div class="row g-2">
                    <div class="col-6 col-md-3">
                      <label class="form-label">{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }} *</label>
                      <select class="form-select form-select-sm" formControlName="category">
                        <option value="" disabled>{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}...</option>
                        @for (cat of expenseCategories; track cat) {
                          <option [value]="cat">{{ 'INSPECTION.CATEGORY_' + cat | translate }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-6 col-md-3">
                      <label class="form-label">{{ 'INSPECTION.EXPENSE_DESCRIPTION' | translate }}</label>
                      <input type="text" class="form-control form-control-sm" formControlName="description">
                    </div>
                    <div class="col-6 col-md-2">
                      <label class="form-label">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }} *</label>
                      <input type="number" class="form-control form-control-sm" formControlName="amount" step="0.01" min="0.01">
                    </div>
                    <div class="col-6 col-md-2">
                      <label class="form-label">{{ 'INSPECTION.EXPENSE_CURRENCY' | translate }}</label>
                      <input type="text" class="form-control form-control-sm" formControlName="currency">
                    </div>
                    <div class="col-6 col-md-2">
                      <label class="form-label">{{ 'INSPECTION.EXPENSE_DATE' | translate }}</label>
                      <input type="date" class="form-control form-control-sm" formControlName="expenseDate">
                    </div>
                  </div>
                  <div class="row g-2 mt-1">
                    <div class="col-12">
                      <label class="form-label">{{ 'INSPECTION.EXPENSE_JUSTIFICATION' | translate }}</label>
                      <textarea class="form-control form-control-sm" formControlName="justification" rows="2"></textarea>
                    </div>
                  </div>
                  <div class="mt-2">
                    <button type="submit" class="btn btn-sm btn-primary me-1" [disabled]="newExpenseForm.invalid">
                      {{ 'INSPECTION.EXPENSE_SAVE' | translate }}
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" (click)="showExpenseForm.set(false)">
                      {{ 'INSPECTION.EXPENSE_CANCEL' | translate }}
                    </button>
                  </div>
                </form>
              </div>
            }
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
  authService = inject(AuthService);

  photos = signal<InspectionPhoto[]>([]);
  uploading = signal(false);
  selectedFile: File | null = null;
  caption = '';

  // Expenses state
  expenses = signal<InspectionExpense[]>([]);
  expensesTotal = signal<number>(0);
  showExpenseForm = signal(false);
  editingExpenseId = signal<number | null>(null);

  expenseCategories: ExpenseCategory[] = ['LABOR', 'EQUIPMENT', 'TRANSPORT', 'SECURITY', 'OVERTIME', 'OTHER'];

  newExpenseForm = new FormGroup({
    category: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    currency: new FormControl<string>('USD', { nonNullable: true }),
    expenseDate: new FormControl<string>('', { nonNullable: true }),
    justification: new FormControl<string>('', { nonNullable: true })
  });

  editExpenseForm = new FormGroup({
    category: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    currency: new FormControl<string>('USD', { nonNullable: true }),
    expenseDate: new FormControl<string>('', { nonNullable: true }),
    justification: new FormControl<string>('', { nonNullable: true })
  });

  inspectionTypes = Object.values(InspectionType);

  ngOnInit(): void {
    this.loadPhotos();
    this.loadExpenses();
  }

  canSetType(): boolean {
    const op = this.operation();
    if (!op) return false;
    if (!this.authService.hasRole(['ADMIN', 'AGENT'])) return false;
    return op.status === 'SUBMITTED_TO_CUSTOMS' || op.status === 'VALUATION_REVIEW';
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
      error: (err) => this.toastService.error(err.error?.error || 'Error')
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
        this.toastService.error(err.error?.error || 'Error');
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
          this.expenses.set(summary.expenses);
          this.expensesTotal.set(summary.total);
        },
        error: () => {
          this.expenses.set([]);
          this.expensesTotal.set(0);
        }
      });
    }
  }

  addExpense(): void {
    if (this.newExpenseForm.invalid) return;
    const val = this.newExpenseForm.value;
    const request: CreateExpenseRequest = {
      category: val.category as ExpenseCategory,
      amount: val.amount!,
      description: val.description || undefined,
      currency: val.currency || undefined,
      expenseDate: val.expenseDate || undefined,
      justification: val.justification || undefined
    };
    this.inspectionService.addExpense(this.operationId(), request).subscribe({
      next: () => {
        this.newExpenseForm.reset({ category: '', currency: 'USD' });
        this.showExpenseForm.set(false);
        this.loadExpenses();
        this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_ADDED'));
      },
      error: (err) => this.toastService.error(err.error?.error || 'Error')
    });
  }

  startEdit(expense: InspectionExpense): void {
    this.editingExpenseId.set(expense.id);
    this.editExpenseForm.patchValue({
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount,
      currency: expense.currency,
      expenseDate: expense.expenseDate,
      justification: expense.justification || ''
    });
  }

  cancelEdit(): void {
    this.editingExpenseId.set(null);
  }

  updateExpense(expenseId: number): void {
    if (this.editExpenseForm.invalid) return;
    const val = this.editExpenseForm.value;
    const request: CreateExpenseRequest = {
      category: val.category as ExpenseCategory,
      amount: val.amount!,
      description: val.description || undefined,
      currency: val.currency || undefined,
      expenseDate: val.expenseDate || undefined,
      justification: val.justification || undefined
    };
    this.inspectionService.updateExpense(this.operationId(), expenseId, request).subscribe({
      next: () => {
        this.editingExpenseId.set(null);
        this.loadExpenses();
        this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_UPDATED'));
      },
      error: (err) => this.toastService.error(err.error?.error || 'Error')
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
      error: (err) => this.toastService.error(err.error?.error || 'Error')
    });
  }
}
