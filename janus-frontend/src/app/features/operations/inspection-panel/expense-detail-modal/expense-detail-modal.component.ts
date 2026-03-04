import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InspectionService } from '../../../../core/services/inspection.service';
import { ToastService } from '../../../../core/services/toast.service';
import { InspectionExpense, ExpenseCategory, CreateExpenseRequest } from '../../../../core/models/inspection.model';

@Component({
  selector: 'app-expense-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ (isAddMode ? 'INSPECTION.ADD_EXPENSE' : 'INSPECTION.VIEW_EXPENSE') | translate }}</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      @if (!editing()) {
        <!-- Read-only view -->
        <dl class="row mb-0">
          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}</dt>
          <dd class="col-sm-8">{{ 'INSPECTION.CATEGORY_' + expense!.category | translate }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.amount | number:'1.2-2' }} {{ expense!.currency }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_DATE' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.expenseDate | date:'shortDate' }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_DESCRIPTION' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.description || '-' }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.RESPONSIBLE' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.responsable || '-' }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_JUSTIFICATION' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.justification || '-' }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.PAYMENT_STATUS' | translate }}</dt>
          <dd class="col-sm-8">
            <span class="badge" [class.bg-success]="expense!.paymentStatus === 'PAID'" [class.bg-warning]="expense!.paymentStatus === 'PENDING'">
              {{ 'INSPECTION.PAYMENT_' + expense!.paymentStatus | translate }}
            </span>
          </dd>

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_REGISTERED_BY' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.registeredByFullName }}</dd>
        </dl>
      } @else {
        <!-- Edit form -->
        <form [formGroup]="editForm">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="category">
                <option value="" disabled>{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}...</option>
                @for (cat of expenseCategories; track cat) {
                  <option [value]="cat">{{ 'INSPECTION.CATEGORY_' + cat | translate }}</option>
                }
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="amount" step="0.01" min="0.01">
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_CURRENCY' | translate }}</label>
              <select class="form-select" formControlName="currency">
                <option value="USD">USD</option>
                <option value="DOP">DOP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_DATE' | translate }} @if (editForm.controls.paymentStatus.value === 'PAID') { <span class="text-danger">*</span> }</label>
              <input type="date" class="form-control" formControlName="expenseDate">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_DESCRIPTION' | translate }}</label>
              <input type="text" class="form-control" formControlName="description">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'INSPECTION.RESPONSIBLE' | translate }} <span class="text-danger">*</span></label>
            <input type="text" class="form-control" formControlName="responsable">
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'INSPECTION.PAYMENT_STATUS' | translate }}</label>
              <select class="form-select" formControlName="paymentStatus">
                <option value="PENDING">{{ 'INSPECTION.PAYMENT_PENDING' | translate }}</option>
                <option value="PAID">{{ 'INSPECTION.PAYMENT_PAID' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'INSPECTION.EXPENSE_JUSTIFICATION' | translate }}</label>
            <textarea class="form-control" formControlName="justification" rows="3"></textarea>
          </div>
        </form>
      }
    </div>
    <div class="modal-footer">
      @if (!editing()) {
        @if (canEdit) {
          <button type="button" class="btn btn-outline-primary" (click)="editing.set(true)">
            <i class="bi bi-pencil me-1"></i>{{ 'ACTIONS.EDIT' | translate }}
          </button>
        }
        <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">{{ 'ACTIONS.CLOSE' | translate }}</button>
      } @else {
        <button type="button" class="btn btn-outline-secondary" (click)="cancelEditing()">{{ 'ACTIONS.CANCEL' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="save()" [disabled]="editForm.invalid">{{ 'ACTIONS.SAVE' | translate }}</button>
      }
    </div>
  `
})
export class ExpenseDetailModalComponent {
  activeModal = inject(NgbActiveModal);
  private inspectionService = inject(InspectionService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  expense: InspectionExpense | null = null;
  operationId!: number;
  canEdit = false;

  /** True when the modal was opened to create a new expense (no existing expense provided). */
  get isAddMode(): boolean {
    return this.expense == null;
  }

  editing = signal(false);

  expenseCategories: ExpenseCategory[] = ['LABOR', 'EQUIPMENT', 'TRANSPORT', 'SECURITY', 'OVERTIME', 'OTHER'];

  editForm = new FormGroup({
    category: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    currency: new FormControl<string>('USD', { nonNullable: true }),
    expenseDate: new FormControl<string>('', { nonNullable: true }),
    responsable: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    justification: new FormControl<string>('', { nonNullable: true }),
    paymentStatus: new FormControl<string>('PENDING', { nonNullable: true })
  });

  initForm(): void {
    if (this.expense) {
      // Edit/view mode: populate from existing expense
      this.editForm.patchValue({
        category: this.expense.category,
        description: this.expense.description || '',
        amount: this.expense.amount,
        currency: this.expense.currency,
        expenseDate: this.expense.expenseDate,
        responsable: this.expense.responsable || '',
        justification: this.expense.justification || '',
        paymentStatus: this.expense.paymentStatus || 'PENDING'
      });
    } else {
      // Add mode: start with empty form in editing state
      this.editForm.reset({ category: '', currency: 'USD', paymentStatus: 'PENDING' });
      this.editing.set(true);
    }
    this.updateDateRequired(this.editForm.controls.paymentStatus.value);
    this.editForm.controls.paymentStatus.valueChanges.subscribe(status => this.updateDateRequired(status));
  }

  private updateDateRequired(status: string): void {
    const dateCtrl = this.editForm.controls.expenseDate;
    if (status === 'PAID') {
      dateCtrl.setValidators([Validators.required]);
    } else {
      dateCtrl.clearValidators();
    }
    dateCtrl.updateValueAndValidity();
  }

  cancelEditing(): void {
    if (this.isAddMode) {
      // In add mode, cancelling closes the modal
      this.activeModal.dismiss();
    } else {
      this.editing.set(false);
    }
  }

  save(): void {
    if (this.editForm.invalid) return;
    const val = this.editForm.value;
    const request: CreateExpenseRequest = {
      category: val.category as ExpenseCategory,
      amount: val.amount!,
      description: val.description || undefined,
      currency: val.currency || undefined,
      expenseDate: val.expenseDate || undefined,
      responsable: val.responsable || undefined,
      justification: val.justification || undefined,
      paymentStatus: val.paymentStatus || undefined
    };

    if (this.isAddMode) {
      this.inspectionService.addExpense(this.operationId, request).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_ADDED'));
          this.activeModal.close('created');
        },
        error: (err) => this.toastService.error(err.error?.error || 'Error')
      });
    } else {
      this.inspectionService.updateExpense(this.operationId, this.expense!.id, request).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_UPDATED'));
          this.activeModal.close('updated');
        },
        error: (err) => this.toastService.error(err.error?.error || 'Error')
      });
    }
  }
}
