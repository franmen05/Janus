import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessage } from '../../../core/utils/error-message.util';
import { Account, AccountType, DocumentType, ContactType, AccountContact, CreateAccountContactRequest, AccountPartner } from '../../../core/models/account.model';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'ACCOUNTS.EDIT_TITLE' : 'ACCOUNTS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.BUSINESS_NAME' | translate }}</label>
              <input type="text" class="form-control" formControlName="businessName">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.NAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="name">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.ACCOUNT_CODE' | translate }}</label>
              <input type="text" class="form-control" formControlName="accountCode">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.TYPE' | translate }} <span class="text-danger">*</span></label>
              <div class="d-flex flex-wrap gap-3">
                @for (ct of accountTypes; track ct) {
                  <div class="form-check">
                    <input type="checkbox" class="form-check-input" [id]="'type-' + ct"
                           [checked]="isTypeSelected(ct)" (change)="onTypeToggle(ct, $event)">
                    <label class="form-check-label" [for]="'type-' + ct">
                      {{ 'ACCOUNT_TYPES.' + ct | translate }}
                    </label>
                  </div>
                }
              </div>
              @if (typeTouched() && selectedTypes().length === 0) {
                <div class="text-danger small">{{ 'ACCOUNTS.TYPE_REQUIRED' | translate }}</div>
              }
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.DOCUMENT_TYPE' | translate }}</label>
              <select class="form-select" formControlName="documentType">
                <option value="">{{ 'ACCOUNTS.SELECT_DOCUMENT_TYPE' | translate }}</option>
                @for (dt of documentTypes; track dt) {
                  <option [value]="dt">{{ 'ID_DOCUMENT_TYPES.' + dt | translate }}</option>
                }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.TAX_ID' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="taxId">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.EMAIL' | translate }} <span class="text-danger">*</span></label>
              <input type="email" class="form-control" formControlName="email">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.PHONE' | translate }}</label>
              <input type="text" class="form-control" formControlName="phone">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.ALTERNATE_PHONE' | translate }}</label>
              <input type="text" class="form-control" formControlName="alternatePhone">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.COUNTRY' | translate }}</label>
              <input type="text" class="form-control" formControlName="country">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.ADDRESS' | translate }}</label>
              <textarea class="form-control" formControlName="address" rows="2"></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'ACCOUNTS.NOTES' | translate }}</label>
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
          <h5 class="mb-0">{{ 'ACCOUNTS.CONTACTS' | translate }}</h5>
          <button type="button" class="btn btn-sm btn-primary" (click)="onAddContact()">
            <i class="bi bi-plus-lg me-1"></i>{{ 'ACCOUNTS.ADD_CONTACT' | translate }}
          </button>
        </div>
        <div class="card-body">
          @if (contacts().length === 0 && !showContactForm()) {
            <p class="text-muted text-center mb-0">{{ 'ACCOUNTS.NO_CONTACTS' | translate }}</p>
          }

          @if (contacts().length > 0) {
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>{{ 'ACCOUNTS.FIRST_NAME' | translate }} / {{ 'ACCOUNTS.LAST_NAME' | translate }}</th>
                    <th>{{ 'ACCOUNTS.IDENTIFICATION' | translate }}</th>
                    <th>{{ 'ACCOUNTS.CONTACT_EMAIL' | translate }}</th>
                    <th>{{ 'ACCOUNTS.CONTACT_PHONE' | translate }}</th>
                    <th>{{ 'ACCOUNTS.CONTACT_TYPE' | translate }}</th>
                    <th>{{ 'ACCOUNTS.RECEIVE_NOTIFICATIONS' | translate }}</th>
                    <th>{{ 'ACCOUNTS.CONTACT_ACTIONS' | translate }}</th>
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
                          {{ 'ACCOUNTS.' + contact.contactType | translate }}
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
            <h6>{{ (editingContactId() ? 'ACCOUNTS.EDIT_CONTACT' : 'ACCOUNTS.ADD_CONTACT') | translate }}</h6>
            <form [formGroup]="contactForm" (ngSubmit)="onSaveContact()">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'ACCOUNTS.FIRST_NAME' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="firstName">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'ACCOUNTS.LAST_NAME' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="lastName">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'ACCOUNTS.IDENTIFICATION' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="identification">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'ACCOUNTS.CONTACT_PHONE' | translate }} <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="phone">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'ACCOUNTS.CONTACT_EMAIL' | translate }}</label>
                  <input type="email" class="form-control" formControlName="email">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'ACCOUNTS.CONTACT_TYPE' | translate }} <span class="text-danger">*</span></label>
                  <select class="form-select" formControlName="contactType">
                    <option value="">{{ 'ACCOUNTS.SELECT_TYPE' | translate }}</option>
                    @for (ct of contactTypes; track ct) {
                      <option [value]="ct">{{ 'ACCOUNTS.' + ct | translate }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" formControlName="receiveNotifications" id="receiveNotifications">
                  <label class="form-check-label" for="receiveNotifications">{{ 'ACCOUNTS.RECEIVE_NOTIFICATIONS' | translate }}</label>
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

    <!-- Partner Accounts Section (edit mode + SOCIO type only) -->
    @if (isEdit() && isSocio()) {
      <div class="card mt-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ 'ACCOUNTS.PARTNER_ACCOUNTS' | translate }}</h5>
          @if (!showPartnerSearch()) {
            <button type="button" class="btn btn-sm btn-primary" (click)="onAddPartner()">
              <i class="bi bi-plus-lg me-1"></i>{{ 'ACCOUNTS.ADD_PARTNER' | translate }}
            </button>
          }
        </div>
        <div class="card-body">
          @if (partnerAccounts().length === 0 && !showPartnerSearch()) {
            <p class="text-muted text-center mb-0">{{ 'ACCOUNTS.NO_PARTNERS' | translate }}</p>
          }

          @if (partnerAccounts().length > 0) {
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>{{ 'ACCOUNTS.PARTNER_NAME' | translate }}</th>
                    <th>{{ 'ACCOUNTS.PARTNER_CODE' | translate }}</th>
                    <th>{{ 'ACCOUNTS.PARTNER_ACTIONS' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (partner of partnerAccounts(); track partner.id) {
                    <tr>
                      <td>{{ partner.name }}</td>
                      <td>{{ partner.accountCode ?? '-' }}</td>
                      <td>
                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="onRemovePartner(partner.id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (showPartnerSearch()) {
            <hr>
            <div class="mb-3">
              <input type="text" class="form-control" [placeholder]="'ACCOUNTS.PARTNER_SEARCH_PLACEHOLDER' | translate"
                     [value]="partnerSearchTerm()"
                     (input)="onPartnerSearch($any($event.target).value)">
            </div>
            @if (partnerSearchResults().length > 0) {
              <div class="list-group mb-3">
                @for (result of partnerSearchResults(); track result.id) {
                  <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          (click)="onSelectPartner(result)">
                    <span>{{ result.name }}</span>
                    <small class="text-muted">{{ result.accountCode ?? '' }}</small>
                  </button>
                }
              </div>
            }
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="onCancelPartnerSearch()">
              {{ 'ACTIONS.CANCEL' | translate }}
            </button>
          }
        </div>
      </div>
    }
  `
})
export class AccountFormComponent implements OnInit {
  private accountService = inject(AccountService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isEdit = signal(false);
  accountId: number | null = null;
  accountTypes = Object.values(AccountType);
  documentTypes: DocumentType[] = ['RNC', 'CEDULA', 'PASSPORT'];
  contactTypes = Object.values(ContactType);

  // Account types state (checkboxes instead of dropdown)
  selectedTypes = signal<AccountType[]>([]);
  typeTouched = signal(false);

  // Contacts state
  contacts = signal<AccountContact[]>([]);
  showContactForm = signal(false);
  editingContactId = signal<number | null>(null);

  // Partner accounts state
  partnerAccounts = signal<AccountPartner[]>([]);
  showPartnerSearch = signal(false);
  partnerSearchTerm = signal('');
  partnerSearchResults = signal<Account[]>([]);

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
    accountCode: new FormControl('', { nonNullable: true }),
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
      this.accountId = +id;
      this.accountService.getById(+id).subscribe(c => {
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
          accountCode: c.accountCode ?? '',
          notes: c.notes ?? ''
        });
        this.selectedTypes.set(c.accountTypes);
        this.partnerAccounts.set(c.partnerAccounts ?? []);
      });
      this.loadContacts();
    }
  }

  private loadContacts(): void {
    if (!this.accountId) return;
    this.accountService.getContacts(this.accountId).subscribe(contacts => {
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

  onEditContact(contact: AccountContact): void {
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
    if (this.contactForm.invalid || !this.accountId) return;
    const raw = this.contactForm.getRawValue();
    const request: CreateAccountContactRequest = {
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
      ? this.accountService.updateContact(this.accountId, editId, request)
      : this.accountService.createContact(this.accountId, request);

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
    this.accountService.deleteContact(this.accountId!, contactId).subscribe(() => {
      this.loadContacts();
    });
  }

  onCancelContact(): void {
    this.showContactForm.set(false);
    this.editingContactId.set(null);
    this.contactForm.reset();
  }

  isTypeSelected(type: AccountType): boolean {
    return this.selectedTypes().includes(type);
  }

  onTypeToggle(type: AccountType, event: Event): void {
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
      accountTypes: this.selectedTypes(),
      documentType: raw.documentType ? raw.documentType as DocumentType : undefined,
      businessName: raw.businessName || undefined,
      alternatePhone: raw.alternatePhone || undefined,
      country: raw.country || undefined,
      accountCode: raw.accountCode || undefined,
      notes: raw.notes || undefined
    };
    const obs = this.isEdit() ? this.accountService.update(this.accountId!, val) : this.accountService.create(val);
    obs.subscribe(() => this.router.navigate(['/accounts']));
  }

  onCancel(): void { this.router.navigate(['/accounts']); }

  isSocio(): boolean {
    return this.selectedTypes().includes(AccountType.SOCIO);
  }

  onAddPartner(): void {
    this.showPartnerSearch.set(true);
    this.partnerSearchTerm.set('');
    this.partnerSearchResults.set([]);
  }

  onCancelPartnerSearch(): void {
    this.showPartnerSearch.set(false);
    this.partnerSearchResults.set([]);
  }

  onPartnerSearch(term: string): void {
    this.partnerSearchTerm.set(term);
    if (!term || term.length < 2) {
      this.partnerSearchResults.set([]);
      return;
    }
    this.accountService.getAll(0, 10, term).subscribe(page => {
      const existing = new Set(this.partnerAccounts().map(p => p.id));
      this.partnerSearchResults.set(
        page.content.filter(a => a.id !== this.accountId && !existing.has(a.id))
      );
    });
  }

  onSelectPartner(account: Account): void {
    if (!this.accountId) return;
    this.accountService.addPartner(this.accountId, account.id).subscribe({
      next: (updated) => {
        this.partnerAccounts.set(updated.partnerAccounts ?? []);
        this.onCancelPartnerSearch();
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }

  onRemovePartner(partnerId: number): void {
    if (!this.accountId) return;
    this.accountService.removePartner(this.accountId, partnerId).subscribe({
      next: () => {
        this.partnerAccounts.set(this.partnerAccounts().filter(p => p.id !== partnerId));
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }
}
