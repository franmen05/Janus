import { Component, inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { OperatorFunction, Observable, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { OperationService } from '../../../core/services/operation.service';
import { CustomerService } from '../../../core/services/customer.service';
import { PortService } from '../../../core/services/port.service';
import { Customer } from '../../../core/models/customer.model';
import { Port } from '../../../core/models/port.model';
import { TransportMode, OperationType, OperationCategory, CargoType, BlType, BlAvailability } from '../../../core/models/operation.model';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-operation-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, NgbTypeaheadModule, StatusLabelPipe, RouterModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'OPERATIONS.EDIT_TITLE' : 'OPERATIONS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.CUSTOMER' | translate }} <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control"
                  [ngbTypeahead]="searchCustomer"
                  [resultFormatter]="customerResultFormatter"
                  [inputFormatter]="customerInputFormatter"
                  (selectItem)="onCustomerSelected($event)"
                  [value]="selectedCustomerDisplay()"
                  [disabled]="customerLocked()"
                  placeholder="{{ 'OPERATIONS.CUSTOMER_SEARCH_PLACEHOLDER' | translate }}" />
              </div>
              @if (selectedCustomer()) {
                <div class="mt-1 d-flex align-items-center gap-2">
                  <span class="badge bg-primary">{{ selectedCustomer()!.name }}</span>
                  <small class="text-muted">{{ selectedCustomer()!.taxId }}</small>
                  @if (!customerLocked()) {
                    <button type="button" class="btn btn-link btn-sm text-danger p-0" (click)="clearCustomer()">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  }
                </div>
              } @else {
                <div class="mt-1">
                  <a routerLink="/customers/new" class="small text-decoration-none">
                    <i class="bi bi-plus-circle me-1"></i>{{ 'OPERATIONS.CREATE_CUSTOMER' | translate }}
                  </a>
                </div>
              }
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.OPERATION_TYPE' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="operationType"
                      [class.is-invalid]="form.get('operationType')!.invalid && form.get('operationType')!.touched">
                <option value="">{{ 'OPERATIONS.SELECT_OPERATION_TYPE' | translate }}</option>
                <option value="IMPORT">{{ 'OPERATION_TYPES.IMPORT' | translate }}</option>
                <option value="EXPORT">{{ 'OPERATION_TYPES.EXPORT' | translate }}</option>
              </select>
              @if (form.get('operationType')!.hasError('required') && form.get('operationType')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.OPERATION_TYPE_REQUIRED' | translate }}</div>
              }
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.TRANSPORT_MODE' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="transportMode">
                @for (t of transportModes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.OPERATION_CATEGORY' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="operationCategory">
                @for (t of operationCategories; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
              @if (form.get('operationCategory')!.value) {
                <small class="form-text text-muted">
                  {{ 'OPERATION_CATEGORIES.' + form.get('operationCategory')!.value + '_DESC' | translate }}
                </small>
              }
            </div>
          </div>
          @if (form.get('transportMode')!.value === 'MARITIME') {
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">{{ 'OPERATIONS.CARGO_TYPE' | translate }}</label>
                <select class="form-select" formControlName="cargoType">
                  @for (ct of cargoTypes; track ct) { <option [value]="ct">{{ 'CARGO_TYPES.' + ct | translate }}</option> }
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">{{ 'OPERATIONS.CONTAINER_NUMBER' | translate }}</label>
                <input type="text" class="form-control" formControlName="containerNumber"
                       [class.is-invalid]="form.get('containerNumber')!.invalid && form.get('containerNumber')!.touched">
                @if (form.get('containerNumber')!.hasError('required') && form.get('containerNumber')!.touched) {
                  <div class="invalid-feedback">{{ 'OPERATIONS.CONTAINER_NUMBER_REQUIRED' | translate }}</div>
                }
              </div>
            </div>
          }
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">{{ 'OPERATIONS.BL_NUMBER' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="blNumber"
                     [class.is-invalid]="form.get('blNumber')!.invalid && form.get('blNumber')!.touched">
              @if (form.get('blNumber')!.hasError('required') && form.get('blNumber')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.BL_NUMBER_REQUIRED' | translate }}</div>
              }
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'OPERATIONS.BL_TYPE' | translate }}</label>
              <select class="form-select" formControlName="blType">
                @for (bt of blTypes; track bt) { <option [value]="bt">{{ 'BL_TYPES.' + bt | translate }}</option> }
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'OPERATIONS.CHILD_BL_NUMBER' | translate }}</label>
              <input type="text" class="form-control" formControlName="childBlNumber"
                     [class.is-invalid]="form.get('childBlNumber')!.invalid && form.get('childBlNumber')!.touched">
              @if (form.get('childBlNumber')!.hasError('required') && form.get('childBlNumber')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.CHILD_BL_REQUIRED' | translate }}</div>
              }
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.ESTIMATED_ARRIVAL' | translate }} <span class="text-danger">*</span></label>
              <input type="datetime-local" class="form-control" formControlName="estimatedArrival"
                     [class.is-invalid]="form.get('estimatedArrival')!.invalid && form.get('estimatedArrival')!.touched">
              @if (form.get('estimatedArrival')!.hasError('required') && form.get('estimatedArrival')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.ESTIMATED_ARRIVAL_REQUIRED' | translate }}</div>
              }
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.ARRIVAL_DATE' | translate }}</label>
              <input type="datetime-local" class="form-control" formControlName="arrivalDate">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.ARRIVAL_PORT' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="arrivalPortId"
                      [class.is-invalid]="form.get('arrivalPortId')!.invalid && form.get('arrivalPortId')!.touched">
                <option value="">{{ 'OPERATIONS.SELECT_PORT' | translate }}</option>
                @for (port of ports(); track port.id) {
                  <option [value]="port.id">{{ port.code }} - {{ port.name }}</option>
                }
              </select>
              @if (form.get('arrivalPortId')!.hasError('required') && form.get('arrivalPortId')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.ARRIVAL_PORT_REQUIRED' | translate }}</div>
              }
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.ORIGIN_PORT' | translate }}</label>
              <select class="form-select" formControlName="originPortId">
                <option value="">{{ 'OPERATIONS.SELECT_PORT' | translate }}</option>
                @for (port of ports(); track port.id) {
                  <option [value]="port.id">{{ port.code }} - {{ port.name }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.INCOTERM' | translate }}</label>
              <select class="form-select" formControlName="incoterm">
                <option value="">-</option>
                @for (inc of incoterms; track inc) { <option [value]="inc">{{ inc }}</option> }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.BL_AVAILABILITY' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="blAvailability"
                      [class.is-invalid]="form.get('blAvailability')!.invalid && form.get('blAvailability')!.touched">
                <option value="">{{ 'OPERATIONS.SELECT_BL_AVAILABILITY' | translate }}</option>
                <option value="ORIGINAL">{{ 'BL_AVAILABILITY.ORIGINAL' | translate }}</option>
                <option value="NOT_AVAILABLE">{{ 'BL_AVAILABILITY.NOT_AVAILABLE' | translate }}</option>
              </select>
              @if (form.get('blAvailability')!.hasError('required') && form.get('blAvailability')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.BL_AVAILABILITY_REQUIRED' | translate }}</div>
              }
            </div>
          </div>
          @if (form.get('blAvailability')!.value === 'NOT_AVAILABLE') {
            <div class="alert alert-warning mt-2 py-2">
              <small><i class="bi bi-exclamation-triangle me-1"></i>{{ 'OPERATIONS.BL_NOT_AVAILABLE_WARNING' | translate }}</small>
            </div>
          }
          <div class="mb-3">
            <label class="form-label">{{ 'OPERATIONS.NOTES' | translate }}</label>
            <textarea class="form-control" formControlName="notes" rows="3"></textarea>
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
export class OperationFormComponent implements OnInit {
  private operationService = inject(OperationService);
  private customerService = inject(CustomerService);
  private portService = inject(PortService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  customers = signal<Customer[]>([]);
  ports = signal<Port[]>([]);
  isEdit = signal(false);
  operationId: number | null = null;
  selectedCustomer = signal<Customer | null>(null);
  selectedCustomerDisplay = signal('');
  customerLocked = signal(false);
  transportModes = Object.values(TransportMode);
  cargoTypes = Object.values(CargoType);
  operationCategories = Object.values(OperationCategory);
  blTypes = Object.values(BlType);
  incoterms = ['FOB', 'CIF', 'EXW', 'CFR', 'CIP', 'DAP', 'DDP'];

  private readonly blAvailabilityLockedStatuses = new Set([
    'PENDING_EXTERNAL_APPROVAL', 'PAYMENT_PREPARATION',
    'IN_TRANSIT', 'CLOSED', 'CANCELLED'
  ]);

  form = new FormGroup({
    customerId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    operationType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    transportMode: new FormControl(TransportMode.MARITIME, { nonNullable: true, validators: [Validators.required] }),
    cargoType: new FormControl(CargoType.FCL, { nonNullable: true }),
    operationCategory: new FormControl(OperationCategory.CATEGORY_1, { nonNullable: true, validators: [Validators.required] }),
    blNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    blType: new FormControl(BlType.SIMPLE, { nonNullable: true }),
    childBlNumber: new FormControl('', { nonNullable: true }),
    containerNumber: new FormControl('', { nonNullable: true }),
    estimatedArrival: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    blAvailability: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    arrivalDate: new FormControl('', { nonNullable: true }),
    incoterm: new FormControl('', { nonNullable: true }),
    arrivalPortId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    originPortId: new FormControl('', { nonNullable: true })
  });

  searchCustomer: OperatorFunction<string, Customer[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.length < 1) return this.customers().filter(c => c.active).slice(0, 10);
        const lower = term.toLowerCase();
        return this.customers().filter(c => c.active &&
          (c.name.toLowerCase().includes(lower) ||
           c.taxId?.toLowerCase().includes(lower) ||
           c.email?.toLowerCase().includes(lower))
        ).slice(0, 10);
      })
    );

  customerResultFormatter = (customer: Customer) =>
    `${customer.name}  —  ${customer.taxId || ''}  ${customer.email ? '· ' + customer.email : ''}`;

  customerInputFormatter = (customer: Customer) => customer.name;

  onCustomerSelected(event: any): void {
    const customer = event.item as Customer;
    this.selectedCustomer.set(customer);
    this.selectedCustomerDisplay.set(customer.name);
    this.form.get('customerId')!.setValue(customer.id.toString());
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.selectedCustomerDisplay.set('');
    this.form.get('customerId')!.setValue('');
  }

  ngOnInit(): void {
    // Add conditional validation for containerNumber when transportMode is MARITIME and cargoType is FCL
    this.form.get('transportMode')!.valueChanges.subscribe(mode => {
      this.updateContainerNumberValidation(mode, this.form.get('cargoType')!.value);
    });
    this.form.get('cargoType')!.valueChanges.subscribe(cargoType => {
      this.updateContainerNumberValidation(this.form.get('transportMode')!.value, cargoType);
    });
    // Set initial validation
    this.updateContainerNumberValidation(this.form.get('transportMode')!.value, this.form.get('cargoType')!.value);

    // Add conditional validation for childBlNumber when blType is CONSOLIDATED
    this.form.get('blType')!.valueChanges.subscribe(blType => {
      this.updateChildBlValidation(blType);
    });
    this.updateChildBlValidation(this.form.get('blType')!.value);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.operationId = +id;
      // Use forkJoin to ensure both clients and operation are loaded before client lookup
      forkJoin({
        customers: this.customerService.getAll(),
        operation: this.operationService.getById(+id),
        ports: this.portService.getAll()
      }).subscribe(({ customers, operation: op, ports }) => {
        this.customers.set(customers);
        this.ports.set(ports);
        if (op.status === 'CLOSED' || op.status === 'CANCELLED') {
          this.router.navigate(['/operations', op.id]);
          return;
        }
        this.form.patchValue({
          customerId: op.customerId?.toString() ?? '',
          operationType: op.operationType ?? '',
          transportMode: op.transportMode,
          cargoType: op.cargoType ?? CargoType.FCL,
          operationCategory: op.operationCategory,
          blNumber: op.blNumber ?? '',
          blType: op.blType ?? BlType.SIMPLE,
          childBlNumber: op.childBlNumber ?? '',
          containerNumber: op.containerNumber ?? '',
          estimatedArrival: op.estimatedArrival ?? '',
          blAvailability: op.blAvailability ?? '',
          notes: op.notes ?? '',
          arrivalDate: op.arrivalDate ?? '',
          incoterm: op.incoterm ?? '',
          arrivalPortId: op.arrivalPortId?.toString() ?? '',
          originPortId: op.originPortId?.toString() ?? ''
        });
        // Disable BL Availability when operation is at or past VALUATION_REVIEW
        if (this.blAvailabilityLockedStatuses.has(op.status)) {
          this.form.get('blAvailability')!.disable();
        }
        if (op.customerId) {
          const customer = customers.find(c => c.id === op.customerId);
          if (customer) {
            this.selectedCustomer.set(customer);
            this.selectedCustomerDisplay.set(customer.name);
          }
        }
      });
    } else {
      // Not editing: just load clients for the typeahead and ports
      this.portService.getAll().subscribe(ports => this.ports.set(ports));
      this.customerService.getAll().subscribe(customers => {
        this.customers.set(customers);
        const customerIdParam = this.route.snapshot.queryParamMap.get('customerId');
        if (customerIdParam) {
          const customer = customers.find(c => c.id === +customerIdParam);
          if (customer) {
            this.selectedCustomer.set(customer);
            this.selectedCustomerDisplay.set(customer.name);
            this.form.get('customerId')!.setValue(customerIdParam);
            this.customerLocked.set(true);
          }
        }
      });
    }
  }

  private updateContainerNumberValidation(mode: TransportMode, cargoType: string): void {
    const containerControl = this.form.get('containerNumber')!;
    if (mode === TransportMode.MARITIME && cargoType === CargoType.FCL) {
      containerControl.setValidators([Validators.required]);
      containerControl.enable();
    } else {
      containerControl.clearValidators();
      containerControl.setValue('');
      containerControl.disable();
    }
    containerControl.updateValueAndValidity();
  }

  private updateChildBlValidation(blType: string): void {
    const childBlControl = this.form.get('childBlNumber')!;
    if (blType === BlType.CONSOLIDATED) {
      childBlControl.setValidators([Validators.required]);
      childBlControl.enable();
    } else if (blType === BlType.SIMPLE) {
      childBlControl.clearValidators();
      childBlControl.disable();
    } else {
      childBlControl.clearValidators();
      childBlControl.enable();
    }
    childBlControl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = {
      customerId: +val.customerId,
      operationType: val.operationType as OperationType,
      transportMode: val.transportMode,
      cargoType: val.transportMode === TransportMode.MARITIME ? val.cargoType as CargoType : undefined,
      operationCategory: val.operationCategory,
      blNumber: val.blNumber || undefined,
      blType: val.blType as BlType,
      childBlNumber: val.blType === BlType.CONSOLIDATED ? (val.childBlNumber || undefined) : undefined,
      containerNumber: val.containerNumber || undefined,
      estimatedArrival: val.estimatedArrival,
      blAvailability: val.blAvailability as BlAvailability,
      notes: val.notes || undefined,
      arrivalDate: val.arrivalDate || undefined,
      incoterm: val.incoterm || undefined,
      arrivalPortId: val.arrivalPortId ? +val.arrivalPortId : undefined,
      originPortId: val.originPortId ? +val.originPortId : undefined
    };
    const obs = this.isEdit() ? this.operationService.update(this.operationId!, request) : this.operationService.create(request);
    obs.subscribe(op => this.router.navigate(['/operations', op.id]));
  }

  onCancel(): void { this.router.navigate(['/operations']); }
}

