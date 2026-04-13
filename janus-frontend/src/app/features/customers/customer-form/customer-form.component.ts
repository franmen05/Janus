import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessage } from '../../../core/utils/error-message.util';
import { CustomerType, DocumentType, ContactType, CustomerContact, CreateCustomerContactRequest } from '../../../core/models/customer.model';

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
              <label class="form-label">{{ 'CUSTOMERS.CUSTOMER_CODE' | translate }}</label>
              <input type="text" class="form-control" formControlName="customerCode">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.TYPE' | translate }} <span class="text-danger">*</span></label>
              <div class="d-flex flex-wrap gap-3">
                @for (ct of customerTypes; track ct) {
                  <div class="form-check">
                    <input type="checkbox" class="form-check-input" [id]="'type-' + ct"
                           [checked]="isTypeSelected(ct)" (change)="onTypeToggle(ct, $event)">
                    <label class="form-check-label" [for]="'type-' + ct">
                      {{ 'CUSTOMER_TYPES.' + ct | translate }}
                    </label>
                  </div>
                }
              </div>
              @if (typeTouched() && selectedTypes().length === 0) {
                <div class="text-danger small">{{ 'CUSTOMERS.TYPE_REQUIRED' | translate }}</div>
              }
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
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.ADDRESS' | translate }}</label>
              <textarea class="form-control" formControlName="address" rows="2"></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'CUSTOMERS.NOTES' | translate }}</label>
              <textarea class="form-control" formControlName="notes" rows="2"></textarea>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || selectedTypes().length === 0">{{ (isEdit() ? 'ACTIONS.UPDATE' : 'ACTIONS.CREATE') | translate }}</button>
            <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">{{ 'ACTIONS.CANCEL' | translate }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Contacts Section (edit mode only) -->
    @if (isEdit()) {
      <div class="card mt-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ 'CUSTOMERS.CONTACTS' | translate }}</h5>
          <button type="button" class="btn btn-sm btn-primary" (click)="onAddContact()">
            <i class="bi bi-plus-lg me-1"></i>{{ 'CUSTOMERS.ADD_CONTACT' | translate }}
          </button>
        </div>
        <div class="card-body">
          @if (contacts().length === 0 && !showContactForm()) {
            <p class="text-muted text-center mb-0">{{ 'CUSTOMERS.NO_CONTACTS' | translate }}</p>
          }

          @if (contacts().length > 0) {
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>{{ 'CUSTOMERS.FIRST_NAME' | translate }} / {{ 'CUSTOMERS.LAST_NAME' | translate }}</th>
                    <th>{{ 'CUSTOMERS.IDENTIFICATION' | translate }}</th>
                    <th>{{ 'CUSTOMERS.CONTACT_EMAIL' | translate }}</th>
                    <th>{{ 'CUSTOMERS.CONTACT_PHONE' | translate }}</th>
                    <th>{{ 'CUSTOMERS.CONTACT_TYPE' | translate }}</th>
                    <th>{{ 'CUSTOMERS.RECEIVE_NOTIFICATIONS' | translate }}</th>
                    <th>{{ 'CUSTOMERS.CONTACT_ACTIONS' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (contact of contacts(); track contact.id) {
                    <tr>
                      <td>{{ contact.firstName }} {{ contact.lastName }}</td>
                      <td>{{ contact.identification }}</td>
                      <td>{{ contact.email ?? '-' }}</td>
                      <td>{{ contact.phone }}</td>
                      <td>
                        <span class="badge" [class.bg-primary]="contact.contactType === 'PRIMARY'" [class.bg-secondary]="contact.contactType === 'ALTERNATE'">
                          {{ 'CUSTOMERS.' + contact.contactType | translate }}
                        </span>
                      </td>
                      <td>
                        @if (contact.receiveNotifications) {
                          <i class="bi bi-check-circle-fill text-success"></i>
                        }
                      </td>
                      <td>
                        <button type="button" class="btn btn-sm btn-outline-primary me-1" (click)="onEditContact(contact)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="onDeleteContact(contact.id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (showContactForm()) {
            <hr>
            <h6>{{ (editingContactId() ? 'CUSTOMERS.EDIT_CONTACT' : 'CUSTOMERS.ADD_CONTACT') | translate }}</h6>
            <form [formGroup]="contactForm" (ngSubmit)="onSaveContact()">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'CUSTOMERS.FIRST_NAME' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="firstName">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'CUSTOMERS.LAST_NAME' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="lastName">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'CUSTOMERS.IDENTIFICATION' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="identification">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'CUSTOMERS.CONTACT_PHONE' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="phone">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'CUSTOMERS.CONTACT_EMAIL' | translate }}</label>
                  <input type="email" class="form-control" formControlName="email">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'CUSTOMERS.CONTACT_TYPE' | translate }} <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="contactType">
                    <option value="">{{ 'CUSTOMERS.SELECT_TYPE' | translate }}</option>
                    @for (ct of contactTypes; track ct) {
                      <option [value]="ct">{{ 'CUSTOMERS.' + ct | translate }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" formControlName="receiveNotifications" id="receiveNotifications">
                  <label class="form-check-label" for="receiveNotifications">{{ 'CUSTOMERS.RECEIVE_NOTIFICATIONS' | translate }}</label>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="contactForm.invalid">{{ 'ACTIONS.SAVE' | translate }}</button>
                <button type="button" class="btn btn-outline-secondary" (click)="onCancelContact()">{{ 'ACTIONS.CANCEL' | translate }}</button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `
})
export class CustomerFormComponent implements OnInit {
  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isEdit = signal(false);
  customerId: number | null = null;
  customerTypes = Object.values(CustomerType);
  documentTypes: DocumentType[] = ['RNC', 'CEDULA', 'PASSPORT'];
  contactTypes = Object.values(ContactType);

  // Customer types state (checkboxes instead of dropdown)
  selectedTypes = signal<CustomerType[]>([]);
  typeTouched = signal(false);

  // Contacts state
  contacts = signal<CustomerContact[]>([]);
  showContactForm = signal(false);
  editingContactId = signal<number | null>(null);

  form = new FormGroup({
    businessName: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    documentType: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    alternatePhone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true }),
    customerCode: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true })
  });

  contactForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    identification: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true }),
    contactType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    receiveNotifications: new FormControl(false, { nonNullable: true })
  });

  ngOnInit(): void {
    // Disable receiveNotifications when email is empty
    this.contactForm.get('email')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(email => {
        const ctrl = this.contactForm.get('receiveNotifications')!;
        if (!email) {
          ctrl.setValue(false);
          ctrl.disable();
        } else {
          ctrl.enable();
        }
      });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.customerId = +id;
      this.customerService.getById(+id).subscribe(c => {
        this.form.patchValue({
          name: c.name,
          taxId: c.taxId,
          email: c.email,
          phone: c.phone ?? '',
          address: c.address ?? '',
          businessName: c.businessName ?? '',
          documentType: c.documentType ?? '',
          alternatePhone: c.alternatePhone ?? '',
          country: c.country ?? '',
          customerCode: c.customerCode ?? '',
          notes: c.notes ?? ''
        });
        this.selectedTypes.set(c.customerTypes);
      });
      this.loadContacts();
    }
  }

  private loadContacts(): void {
    if (!this.customerId) return;
    this.customerService.getContacts(this.customerId).subscribe(contacts => {
      this.contacts.set(contacts);
    });
  }

  onAddContact(): void {
    this.editingContactId.set(null);
    this.contactForm.reset();
    // Trigger disable logic for receiveNotifications since email is empty after reset
    this.contactForm.get('receiveNotifications')!.disable();
    this.showContactForm.set(true);
  }

  onEditContact(contact: CustomerContact): void {
    this.editingContactId.set(contact.id);
    this.contactForm.patchValue({
      firstName: contact.firstName,
      lastName: contact.lastName,
      identification: contact.identification,
      phone: contact.phone,
      email: contact.email ?? '',
      contactType: contact.contactType
    });
    // Handle receiveNotifications enable/disable based on email
    const notifCtrl = this.contactForm.get('receiveNotifications')!;
    if (contact.email) {
      notifCtrl.enable();
    } else {
      notifCtrl.disable();
    }
    notifCtrl.setValue(contact.receiveNotifications);
    this.showContactForm.set(true);
  }

  onSaveContact(): void {
    if (this.contactForm.invalid || !this.customerId) return;
    const raw = this.contactForm.getRawValue();
    const request: CreateCustomerContactRequest = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      identification: raw.identification,
      phone: raw.phone,
      email: raw.email || undefined,
      contactType: raw.contactType as ContactType,
      receiveNotifications: raw.receiveNotifications
    };

    const editId = this.editingContactId();
    const obs = editId
      ? this.customerService.updateContact(this.customerId, editId, request)
      : this.customerService.createContact(this.customerId, request);

    obs.subscribe({
      next: () => {
        this.loadContacts();
        this.onCancelContact();
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }

  onDeleteContact(contactId: number): void {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    this.customerService.deleteContact(this.customerId!, contactId).subscribe(() => {
      this.loadContacts();
    });
  }

  onCancelContact(): void {
    this.showContactForm.set(false);
    this.editingContactId.set(null);
    this.contactForm.reset();
  }

  isTypeSelected(type: CustomerType): boolean {
    return this.selectedTypes().includes(type);
  }

  onTypeToggle(type: CustomerType, event: Event): void {
    this.typeTouched.set(true);
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedTypes();
    if (checked) {
      this.selectedTypes.set([...current, type]);
    } else {
      this.selectedTypes.set(current.filter(t => t !== type));
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.selectedTypes().length === 0) return;
    const raw = this.form.getRawValue();
    const val = {
      ...raw,
      customerTypes: this.selectedTypes(),
      documentType: raw.documentType ? raw.documentType as DocumentType : undefined,
      businessName: raw.businessName || undefined,
      alternatePhone: raw.alternatePhone || undefined,
      country: raw.country || undefined,
      customerCode: raw.customerCode || undefined,
      notes: raw.notes || undefined
    };
    const obs = this.isEdit() ? this.customerService.update(this.customerId!, val) : this.customerService.create(val);
    obs.subscribe(() => this.router.navigate(['/customers']));
  }

  onCancel(): void { this.router.navigate(['/customers']); }
}
