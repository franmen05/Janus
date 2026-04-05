import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerType, DocumentType } from '../../../core/models/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'CUSTOMERS.EDIT_TITLE' : 'CUSTOMERS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.BUSINESS_NAME' | translate }}</label>
              <input type="text" class="form-control" formControlName="businessName">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.NAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="name">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.REPRESENTATIVE' | translate }}</label>
              <input type="text" class="form-control" formControlName="representative">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.TYPE' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="customerType">
                <option value="">{{ 'CUSTOMERS.SELECT_TYPE' | translate }}</option>
                @for (ct of customerTypes; track ct) {
                  <option [value]="ct">{{ 'CUSTOMER_TYPES.' + ct | translate }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.DOCUMENT_TYPE' | translate }}</label>
              <select class="form-select" formControlName="documentType">
                <option value="">{{ 'CUSTOMERS.SELECT_DOCUMENT_TYPE' | translate }}</option>
                @for (dt of documentTypes; track dt) {
                  <option [value]="dt">{{ 'ID_DOCUMENT_TYPES.' + dt | translate }}</option>
                }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.TAX_ID' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="taxId">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.EMAIL' | translate }} <span class="text-danger">*</span></label>
              <input type="email" class="form-control" formControlName="email">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.PHONE' | translate }}</label>
              <input type="text" class="form-control" formControlName="phone">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.ALTERNATE_PHONE' | translate }}</label>
              <input type="text" class="form-control" formControlName="alternatePhone">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.COUNTRY' | translate }}</label>
              <input type="text" class="form-control" formControlName="country">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'CUSTOMERS.ADDRESS' | translate }}</label>
            <textarea class="form-control" formControlName="address" rows="2"></textarea>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ (isEdit() ? 'ACTIONS.UPDATE' : 'ACTIONS.CREATE') | translate }}</button>
            <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">{{ 'ACTIONS.CANCEL' | translate }}</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CustomerFormComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  customerId: number | null = null;
  customerTypes = Object.values(CustomerType);
  documentTypes: DocumentType[] = ['RNC', 'CEDULA', 'PASSPORT'];

  form = new FormGroup({
    businessName: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    representative: new FormControl('', { nonNullable: true }),
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    customerType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentType: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    alternatePhone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.customerId = +id;
      this.customerService.getById(+id).subscribe(c => {
        this.form.patchValue({
          name: c.name,
          taxId: c.taxId,
          email: c.email,
          customerType: c.customerType,
          phone: c.phone ?? '',
          address: c.address ?? '',
          businessName: c.businessName ?? '',
          representative: c.representative ?? '',
          documentType: c.documentType ?? '',
          alternatePhone: c.alternatePhone ?? '',
          country: c.country ?? ''
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const val = {
      ...raw,
      customerType: raw.customerType as CustomerType,
      documentType: raw.documentType ? raw.documentType as DocumentType : undefined,
      businessName: raw.businessName || undefined,
      representative: raw.representative || undefined,
      alternatePhone: raw.alternatePhone || undefined,
      country: raw.country || undefined
    };
    const obs = this.isEdit() ? this.customerService.update(this.customerId!, val) : this.customerService.create(val);
    obs.subscribe(() => this.router.navigate(['/customers']));
  }

  onCancel(): void { this.router.navigate(['/customers']); }
}
