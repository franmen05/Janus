import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal, NgbTypeaheadModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperatorFunction, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { InspectionService } from '../../../../core/services/inspection.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getErrorMessage } from '../../../../core/utils/error-message.util';
import { InspectionExpense, ExpenseCategory, CreateExpenseRequest, ChargeType, PaymentType, BillToType } from '../../../../core/models/inspection.model';
import { ExpenseCategoryService } from '../../../../core/services/expense-category.service';
import { ExpenseCategoryConfig } from '../../../../core/models/expense-category.model';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-expense-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgbTypeaheadModule, NgbNavModule, NgbTooltipModule],
  styles: [`
    .modal-body .form-label {
      white-space: nowrap;
      font-size: 0.8125rem;
    }
  `],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ (isAddMode ? 'INSPECTION.ADD_CHARGE' : 'INSPECTION.VIEW_CHARGE') | translate }}</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      @if (!editing()) {
        <!-- Read-only view -->
        <div class="mb-3">
          <span class="badge" [class.bg-primary]="expense!.chargeType === 'INCOME'" [class.bg-danger]="expense!.chargeType === 'EXPENSE'">
            {{ expense!.chargeType === 'INCOME' ? ('INSPECTION.TAB_INCOME' | translate) : ('INSPECTION.TAB_EXPENSES' | translate) }}
          </span>
        </div>
        <dl class="row mb-0">
          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}</dt>
          <dd class="col-sm-8">{{ 'INSPECTION.CATEGORY_' + expense!.category | translate }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.QUANTITY' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.quantity }}</dd>

          @if (expense!.rate != null) {
            <dt class="col-sm-4">{{ 'INSPECTION.RATE' | translate }}</dt>
            <dd class="col-sm-8">{{ expense!.rate | number:'1.2-2' }}</dd>
          }

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.amount | number:'1.2-2' }} {{ expense!.currency }}</dd>

          @if (expense!.paymentType) {
            <dt class="col-sm-4">{{ 'INSPECTION.PAYMENT_TYPE' | translate }}</dt>
            <dd class="col-sm-8">{{ 'INSPECTION.PAYMENT_' + expense!.paymentType | translate }}</dd>
          }

          @if (expense!.billToType) {
            <dt class="col-sm-4">{{ 'INSPECTION.BILL_TO' | translate }}</dt>
            <dd class="col-sm-8">{{ 'INSPECTION.BILL_TO_' + expense!.billToType | translate }}</dd>
          }

          @if (expense!.billToName) {
            <dt class="col-sm-4">{{ 'INSPECTION.BILL_TO_NAME' | translate }}</dt>
            <dd class="col-sm-8">{{ expense!.billToName }}</dd>
          }

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_DESCRIPTION' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.description || '-' }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_DATE' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.expenseDate | date:'shortDate' }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.PAYMENT_STATUS' | translate }}</dt>
          <dd class="col-sm-8">
            <span class="badge" [class.bg-success]="expense!.paymentStatus === 'PAID'" [class.bg-warning]="expense!.paymentStatus === 'PENDING'">
              {{ 'INSPECTION.PAYMENT_' + expense!.paymentStatus | translate }}
            </span>
          </dd>

          @if (expense!.invoiceNumber) {
            <dt class="col-sm-4">{{ 'INSPECTION.INVOICE_NUMBER' | translate }}</dt>
            <dd class="col-sm-8">{{ expense!.invoiceNumber }}</dd>
          }

          @if (expense!.referenceNumberCharge) {
            <dt class="col-sm-4">{{ 'INSPECTION.REFERENCE' | translate }}</dt>
            <dd class="col-sm-8">{{ expense!.referenceNumberCharge }}</dd>
          }

          <dt class="col-sm-4">{{ 'INSPECTION.SHOW_ON_DOCUMENTS' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.showOnDocuments ? ('COMMON.YES' | translate) : ('COMMON.NO' | translate) }}</dd>

          <dt class="col-sm-4">{{ 'INSPECTION.REIMBURSABLE' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.reimbursable ? ('INSPECTION.REIMBURSABLE' | translate) : ('INSPECTION.NOT_REIMBURSABLE' | translate) }}</dd>

          @if (expense!.notes) {
            <dt class="col-sm-4">{{ 'INSPECTION.NOTES' | translate }}</dt>
            <dd class="col-sm-8">{{ expense!.notes }}</dd>
          }

          <dt class="col-sm-4">{{ 'INSPECTION.EXPENSE_REGISTERED_BY' | translate }}</dt>
          <dd class="col-sm-8">{{ expense!.registeredByFullName }}</dd>
        </dl>
      } @else {
        <!-- Tabs -->
        <ul ngbNav #nav="ngbNav" [activeId]="activeTab()" (activeIdChange)="setTab($event)" class="nav-tabs mb-3">
          <li [ngbNavItem]="'INCOME'">
            <button ngbNavLink>{{ 'INSPECTION.TAB_INCOME' | translate }}</button>
          </li>
          <li [ngbNavItem]="'EXPENSE'">
            <button ngbNavLink>{{ 'INSPECTION.TAB_EXPENSES' | translate }}</button>
          </li>
        </ul>

        <!-- Edit form -->
        <form [formGroup]="editForm">
          <!-- Row 1: Category, Quantity, Units, Rate, Amount, Currency, Payment Type -->
          <div class="row g-2 mb-3 align-items-end">
            <div class="col">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select form-select-sm" formControlName="category">
                <option value="" disabled>{{ 'INSPECTION.EXPENSE_CATEGORY' | translate }}...</option>
                @if (categoriesLoading()) {
                  <option disabled>{{ 'COMMON.LOADING' | translate }}</option>
                } @else {
                  @for (cat of activeCategories(); track cat.name) {
                    <option [value]="cat.name">{{ getCategoryLabel(cat) }}</option>
                  }
                }
              </select>
            </div>
            <div class="col-auto" style="width: 90px;">
              <label class="form-label">{{ 'INSPECTION.QUANTITY' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control form-control-sm" formControlName="quantity" min="1">
            </div>
            <div class="col-auto" style="width: 130px;">
              <label class="form-label">{{ 'INSPECTION.UNITS' | translate }}</label>
              <select class="form-select form-select-sm" formControlName="units">
                <option value="">-</option>
                @for (unit of unitOptions; track unit) {
                  <option [value]="unit">{{ 'INSPECTION.UNITS_' + unit | translate }}</option>
                }
              </select>
            </div>
            <div class="col-auto" style="width: 100px;">
              <label class="form-label">{{ 'INSPECTION.RATE' | translate }}</label>
              <input type="number" class="form-control form-control-sm" formControlName="rate" step="0.01">
            </div>
            <div class="col-auto" style="width: 150px;">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_AMOUNT' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control form-control-sm" formControlName="amount" step="0.01" min="0.01">
            </div>
            <div class="col-auto" style="width: 80px;">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_CURRENCY' | translate }}</label>
              <select class="form-select form-select-sm" formControlName="currency">
                <option value="USD">USD</option>
                <option value="DOP">DOP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div class="col">
              <label class="form-label">
                {{ 'INSPECTION.PAYMENT_TYPE' | translate }} <i class="bi bi-info-circle text-muted" style="cursor:pointer" [ngbTooltip]="'INSPECTION.PAYMENT_TYPE_TOOLTIP' | translate" triggers="click:blur" placement="top"></i>
              </label>
              <select class="form-select form-select-sm" formControlName="paymentType">
                <option value="">-</option>
                <option value="COLLECT">{{ 'INSPECTION.PAYMENT_COLLECT' | translate }}</option>
                <option value="PREPAID">{{ 'INSPECTION.PAYMENT_PREPAID' | translate }}</option>
              </select>
            </div>
          </div>

          <!-- Row 2: Bill To Type, Bill To Name, Invoice Number, Invoice Date, Reference -->
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-2">
              <label class="form-label">{{ 'INSPECTION.BILL_TO' | translate }}</label>
              <select class="form-select form-select-sm" formControlName="billToType">
                <option value="">-</option>
                <option value="COMPANY">{{ 'INSPECTION.BILL_TO_COMPANY' | translate }}</option>
                <option value="CONSIGNEE">{{ 'INSPECTION.BILL_TO_CONSIGNEE' | translate }}</option>
                <option value="INDIVIDUAL">{{ 'INSPECTION.BILL_TO_INDIVIDUAL' | translate }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'INSPECTION.BILL_TO_NAME' | translate }}</label>
              <input type="text" class="form-control form-control-sm"
                formControlName="billToName"
                [ngbTypeahead]="searchClient"
                [resultFormatter]="clientResultFormatter"
                [inputFormatter]="clientInputFormatter"
                (selectItem)="onClientSelected($event)">
            </div>
            <div class="col-md-2">
              <label class="form-label">{{ 'INSPECTION.INVOICE_NUMBER' | translate }}</label>
              <input type="text" class="form-control form-control-sm" formControlName="invoiceNumber">
            </div>
            <div class="col-md-2">
              <label class="form-label">{{ 'INSPECTION.INVOICE_DATE' | translate }}</label>
              <input type="date" class="form-control form-control-sm" formControlName="invoiceDate">
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'INSPECTION.REFERENCE' | translate }}</label>
              <input type="text" class="form-control form-control-sm" formControlName="referenceNumber">
            </div>
          </div>

          <!-- Row 3: Description, Payment Status, Date -->
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_DESCRIPTION' | translate }}</label>
              <input type="text" class="form-control form-control-sm" formControlName="description">
            </div>
            <div class="col-md-3">
              <label class="form-label">
                {{ 'INSPECTION.PAYMENT_STATUS' | translate }} <i class="bi bi-info-circle text-muted" style="cursor:pointer" [ngbTooltip]="'INSPECTION.PAYMENT_STATUS_TOOLTIP' | translate" triggers="click:blur" placement="top"></i>
              </label>
              <select class="form-select form-select-sm" formControlName="paymentStatus">
                <option value="PENDING">{{ 'INSPECTION.PAYMENT_PENDING' | translate }}</option>
                <option value="PAID">{{ 'INSPECTION.PAYMENT_PAID' | translate }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'INSPECTION.EXPENSE_DATE' | translate }} @if (editForm.controls.paymentStatus.value === 'PAID') { <span class="text-danger">*</span> }</label>
              <input type="date" class="form-control form-control-sm" formControlName="expenseDate">
            </div>
          </div>

          <!-- Row 4: Checkboxes -->
          <div class="row mb-3">
            <div class="col-12">
              <div class="form-check form-check-inline">
                <input type="checkbox" class="form-check-input" formControlName="showOnDocuments" id="showOnDocuments">
                <label class="form-check-label" for="showOnDocuments">{{ 'INSPECTION.SHOW_ON_DOCUMENTS' | translate }}</label>
              </div>
              <div class="form-check form-check-inline">
                <input type="checkbox" class="form-check-input" formControlName="updateRelated" id="updateRelated">
                <label class="form-check-label" for="updateRelated">{{ 'INSPECTION.UPDATE_RELATED' | translate }}</label>
              </div>
              <div class="form-check form-check-inline">
                <input type="checkbox" class="form-check-input" formControlName="reimbursable" id="reimbursable">
                <label class="form-check-label" for="reimbursable">{{ 'INSPECTION.REIMBURSABLE' | translate }}</label>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-3">
            <label class="form-label">{{ 'INSPECTION.NOTES' | translate }}</label>
            <textarea class="form-control form-control-sm" formControlName="notes" rows="2"></textarea>
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
        @if (isAddMode) {
          <button type="button" class="btn btn-primary" (click)="saveAndAdd()" [disabled]="editForm.invalid">{{ 'INSPECTION.SAVE_AND_ADD' | translate }}</button>
        } @else {
          <button type="button" class="btn btn-primary" (click)="save()" [disabled]="editForm.invalid">{{ 'ACTIONS.SAVE' | translate }}</button>
        }
      }
    </div>
  `
})
export class ExpenseDetailModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private inspectionService = inject(InspectionService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private expenseCategoryService = inject(ExpenseCategoryService);

  expense: InspectionExpense | null = null;
  operationId!: number;
  canEdit = false;
  operationSummary: {
    pieces?: number | null;
    grossWeight?: number | null;
    volumetricWeight?: number | null;
    volume?: number | null;
    declaredValue?: number | null;
    clientName?: string | null;
    blNumber?: string | null;
  } | null = null;
  clients: Client[] = [];

  readonly unitOptions = [
    'CONTAINERS', 'HOURS', 'DAYS', 'KG', 'M3', 'PALLETS', 'PIECES', 'TONS', 'FLAT'
  ];

  /** True when the modal was opened to create a new expense (no existing expense provided). */
  get isAddMode(): boolean {
    return this.expense == null;
  }

  editing = signal(false);
  activeTab = signal<ChargeType>('EXPENSE');

  activeCategories = signal<ExpenseCategoryConfig[]>([]);
  categoriesLoading = signal(true);

  ngOnInit(): void {
    this.loadCategories();
  }

  getCategoryLabel(cat: ExpenseCategoryConfig): string {
    return this.translate.currentLang === 'es' ? cat.labelEs : cat.labelEn;
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.expenseCategoryService.getActive().subscribe({
      next: categories => {
        this.activeCategories.set(categories);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categoriesLoading.set(false);
      }
    });
  }

  editForm = new FormGroup({
    chargeType: new FormControl<ChargeType>('EXPENSE', { nonNullable: true }),
    category: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    quantity: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    units: new FormControl<string>('', { nonNullable: true }),
    rate: new FormControl<number | null>(null),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    currency: new FormControl<string>('USD', { nonNullable: true }),
    paymentType: new FormControl<string>('', { nonNullable: true }),
    paymentStatus: new FormControl<string>('PENDING', { nonNullable: true }),
    expenseDate: new FormControl<string>('', { nonNullable: true }),
    billToType: new FormControl<string>('', { nonNullable: true }),
    billToName: new FormControl<string>('', { nonNullable: true }),
    invoiceNumber: new FormControl<string>('', { nonNullable: true }),
    invoiceDate: new FormControl<string>('', { nonNullable: true }),
    referenceNumber: new FormControl<string>('', { nonNullable: true }),
    showOnDocuments: new FormControl<boolean>(true, { nonNullable: true }),
    updateRelated: new FormControl<boolean>(false, { nonNullable: true }),
    reimbursable: new FormControl<boolean>(true, { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true })
  });

  // Client typeahead — filters by selected billToType and searches name, taxId, email
  searchClient: OperatorFunction<string, Client[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        const selectedType = this.editForm.controls.billToType.value;
        let filtered = this.clients.filter(c => c.active);
        // Filter by clientType matching selected billToType
        if (selectedType) {
          filtered = filtered.filter(c => c.clientType === selectedType);
        }
        if (term.length < 1) {
          return filtered.slice(0, 10);
        }
        const lower = term.toLowerCase();
        return filtered.filter(c =>
          c.name.toLowerCase().includes(lower) ||
          c.taxId?.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower)
        ).slice(0, 10);
      })
    );

  clientResultFormatter = (client: Client) => `${client.name} \u2014 ${client.taxId} \u00b7 ${client.email}`;
  clientInputFormatter = (client: any) => typeof client === 'string' ? client : client.name;

  onClientSelected(event: any): void {
    const client = event.item;
    this.editForm.controls.billToName.setValue(client.name);
  }

  setTab(tab: any): void {
    const chargeTab = tab as ChargeType;
    this.activeTab.set(chargeTab);
    this.editForm.controls.chargeType.setValue(chargeTab);
  }

  initForm(): void {
    if (this.expense) {
      // Edit/view mode: populate from existing expense
      this.editForm.patchValue({
        chargeType: this.expense.chargeType || 'EXPENSE',
        category: this.expense.category,
        description: this.expense.description || '',
        quantity: this.expense.quantity || 1,
        units: this.expense.units || '',
        rate: this.expense.rate,
        amount: this.expense.amount,
        currency: this.expense.currency,
        paymentType: this.expense.paymentType || '',
        paymentStatus: this.expense.paymentStatus || 'PENDING',
        expenseDate: this.expense.expenseDate || '',
        billToType: this.expense.billToType || '',
        billToName: this.expense.billToName || '',
        invoiceNumber: this.expense.invoiceNumber || '',
        invoiceDate: this.expense.invoiceDate || '',
        referenceNumber: this.expense.referenceNumberCharge || '',
        showOnDocuments: this.expense.showOnDocuments ?? true,
        updateRelated: this.expense.updateRelated ?? false,
        reimbursable: this.expense.reimbursable ?? true,
        notes: this.expense.notes || ''
      });
      this.activeTab.set(this.expense.chargeType || 'EXPENSE');
    } else {
      // Add mode: start with empty form in editing state
      this.editForm.reset({
        chargeType: 'EXPENSE', category: '', currency: 'USD', paymentStatus: 'PENDING',
        quantity: 1, showOnDocuments: true, updateRelated: false, reimbursable: true,
        description: '', units: '', rate: null, amount: null, paymentType: '',
        expenseDate: '', billToType: '', billToName: '', invoiceNumber: '',
        invoiceDate: '', referenceNumber: '', notes: ''
      });
      // Auto-fill reference with BL number
      if (this.operationSummary?.blNumber) {
        this.editForm.controls.referenceNumber.setValue(this.operationSummary.blNumber);
      }
      this.editing.set(true);
    }
    this.updateDateRequired(this.editForm.controls.paymentStatus.value);
    this.editForm.controls.paymentStatus.valueChanges.subscribe(status => this.updateDateRequired(status));
    // Auto-compute amount from quantity * rate
    this.editForm.controls.quantity.valueChanges.subscribe(() => this.computeAmount());
    this.editForm.controls.rate.valueChanges.subscribe(() => this.computeAmount());
    // Clear billToName when billToType changes (filter changed, previous selection no longer valid)
    this.editForm.controls.billToType.valueChanges.subscribe(() => {
      this.editForm.controls.billToName.setValue('');
    });
  }

  private computeAmount(): void {
    const qty = this.editForm.controls.quantity.value;
    const rate = this.editForm.controls.rate.value;
    if (qty && rate != null && rate > 0) {
      const computed = +(qty * rate).toFixed(2);
      this.editForm.controls.amount.setValue(computed, { emitEvent: false });
    }
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
      this.activeModal.dismiss();
    } else {
      this.editing.set(false);
    }
  }

  private buildRequest(): CreateExpenseRequest {
    const val = this.editForm.value;
    return {
      category: val.category as ExpenseCategory,
      amount: val.amount!,
      description: val.description || undefined,
      currency: val.currency || undefined,
      expenseDate: val.expenseDate || undefined,
      paymentStatus: val.paymentStatus || undefined,
      reimbursable: val.reimbursable,
      chargeType: (val.chargeType as ChargeType) || 'EXPENSE',
      quantity: val.quantity || 1,
      units: val.units || undefined,
      rate: val.rate || undefined,
      paymentType: (val.paymentType as PaymentType) || undefined,
      billToType: (val.billToType as BillToType) || undefined,
      billToName: val.billToName || undefined,
      invoiceNumber: val.invoiceNumber || undefined,
      invoiceDate: val.invoiceDate || undefined,
      referenceNumber: val.referenceNumber || undefined,
      showOnDocuments: val.showOnDocuments,
      updateRelated: val.updateRelated,
      notes: val.notes || undefined
    };
  }

  save(): void {
    if (this.editForm.invalid) return;
    const request = this.buildRequest();

    if (this.isAddMode) {
      this.inspectionService.addExpense(this.operationId, request).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_ADDED'));
          this.activeModal.close('created');
        },
        error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
      });
    } else {
      this.inspectionService.updateExpense(this.operationId, this.expense!.id, request).subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_UPDATED'));
          this.activeModal.close('updated');
        },
        error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
      });
    }
  }

  saveAndAdd(): void {
    if (this.editForm.invalid) return;
    const request = this.buildRequest();
    this.inspectionService.addExpense(this.operationId, request).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('INSPECTION.EXPENSE_ADDED'));
        this.activeModal.close('created-continue');
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }
}
