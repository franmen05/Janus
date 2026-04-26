import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { OperatorFunction, Observable, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { OperationService } from '../../../core/services/operation.service';
import { AccountService } from '../../../core/services/account.service';
import { PortService } from '../../../core/services/port.service';
import { BondedWarehouseService } from '../../../core/services/bonded-warehouse.service';
import { Account } from '../../../core/models/account.model';
import { Port } from '../../../core/models/port.model';
import { BondedWarehouse } from '../../../core/models/bonded-warehouse.model';
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
              <label class="form-label">{{ 'OPERATIONS.ACCOUNT' | translate }} <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control"
                  [ngbTypeahead]="searchAccount"
                  [resultFormatter]="accountResultFormatter"
                  [inputFormatter]="accountInputFormatter"
                  (selectItem)="onAccountSelected($event)"
                  [value]="selectedAccountDisplay()"
                  [disabled]="accountLocked()"
                  placeholder="{{ 'OPERATIONS.ACCOUNT_SEARCH_PLACEHOLDER' | translate }}" />
              </div>
              @if (selectedAccount()) {
                <div class="mt-1 d-flex align-items-center gap-2">
                  <span class="badge bg-primary">{{ selectedAccount()!.name }}</span>
                  <small class="text-muted">{{ selectedAccount()!.taxId }}</small>
                  @if (!accountLocked()) {
                    <button type="button" class="btn btn-link btn-sm text-danger p-0" (click)="clearAccount()">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  }
                </div>
              } @else {
                <div class="mt-1">
                  <a routerLink="/accounts/new" class="small text-decoration-none">
                    <i class="bi bi-plus-circle me-1"></i>{{ 'OPERATIONS.CREATE_ACCOUNT' | translate }}
                  </a>
                </div>
              }
            </div>
            <div class="col-md-6">
              <!-- Partner (optional) -->
              @if (availablePartners().length > 0) {
                <div class="mb-3">
                  <label for="partnerId" class="form-label">{{ 'OPERATIONS.PARTNER_LABEL' | translate }}</label>
                  <select id="partnerId" class="form-select" formControlName="partnerId">
                    <option value="">{{ 'OPERATIONS.PARTNER_PLACEHOLDER' | translate }}</option>
                    @for (partner of availablePartners(); track partner.id) {
                      <option [value]="partner.id.toString()">{{ partner.name }}</option>
                    }
                  </select>
                </div>
              }
            </div>
          </div>
          <div class="row mb-3">
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
                @for (port of arrivalPorts(); track port.id) {
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
                @for (port of originPorts(); track port.id) {
                  <option [value]="port.id">{{ port.code }} - {{ port.name }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.WAREHOUSE' | translate }}</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-building"></i></span>
                <input type="text" class="form-control"
                  [ngbTypeahead]="searchWarehouse"
                  [resultFormatter]="warehouseResultFormatter"
                  [inputFormatter]="warehouseInputFormatter"
                  (selectItem)="onWarehouseSelected($event)"
                  [value]="selectedWarehouseDisplay()"
                  placeholder="{{ 'OPERATIONS.SELECT_WAREHOUSE' | translate }}" />
              </div>
              @if (selectedWarehouse()) {
                <div class="mt-1 d-flex align-items-center gap-2">
                  <span class="badge bg-secondary">{{ selectedWarehouse()!.code }}</span>
                  <small class="text-muted">{{ selectedWarehouse()!.name }}</small>
                  <button type="button" class="btn btn-link btn-sm text-danger p-0" (click)="clearWarehouse()">
                    <i class="bi bi-x-circle"></i>
                  </button>
                </div>
              }
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.INCOTERM' | translate }}</label>
              <select class="form-select" formControlName="incoterm">
                <option value="">-</option>
                @for (inc of incoterms; track inc) { <option [value]="inc">{{ inc }}</option> }
              </select>
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
  private accountService = inject(AccountService);
  private portService = inject(PortService);
  private warehouseService = inject(BondedWarehouseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  accounts = signal<Account[]>([]);
  arrivalPorts = signal<Port[]>([]);
  originPorts = signal<Port[]>([]);
  isEdit = signal(false);
  operationId: number | null = null;
  selectedAccount = signal<Account | null>(null);
  availablePartners = computed(() => this.selectedAccount()?.partnerAccounts ?? []);
  selectedAccountDisplay = signal('');
  accountLocked = signal(false);
  warehouses = signal<BondedWarehouse[]>([]);
  selectedWarehouse = signal<BondedWarehouse | null>(null);
  selectedWarehouseDisplay = signal('');
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
    accountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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
    originPortId: new FormControl('', { nonNullable: true }),
    warehouseId: new FormControl('', { nonNullable: true }),
    partnerId: new FormControl('', { nonNullable: true })
  });

  searchAccount: OperatorFunction<string, Account[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.length < 1) return this.accounts().filter(c => c.active).slice(0, 10);
        const lower = term.toLowerCase();
        return this.accounts().filter(c => c.active &&
          (c.name.toLowerCase().includes(lower) ||
           c.taxId?.toLowerCase().includes(lower) ||
           c.email?.toLowerCase().includes(lower))
        ).slice(0, 10);
      })
    );

  accountResultFormatter = (account: Account) =>
    `${account.name}  —  ${account.taxId || ''}  ${account.email ? '· ' + account.email : ''}`;

  accountInputFormatter = (account: Account) => account.name;

  searchWarehouse: OperatorFunction<string, BondedWarehouse[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.length < 1) return this.warehouses().slice(0, 10);
        const lower = term.toLowerCase();
        return this.warehouses().filter(d =>
          d.code.toLowerCase().includes(lower) ||
          d.name.toLowerCase().includes(lower)
        ).slice(0, 10);
      })
    );

  warehouseResultFormatter = (warehouse: BondedWarehouse) =>
    `${warehouse.code}  —  ${warehouse.name}`;

  warehouseInputFormatter = (warehouse: BondedWarehouse) => warehouse.name;

  onWarehouseSelected(event: NgbTypeaheadSelectItemEvent<BondedWarehouse>): void {
    const warehouse = event.item;
    this.selectedWarehouse.set(warehouse);
    this.selectedWarehouseDisplay.set(warehouse.name);
    this.form.get('warehouseId')!.setValue(warehouse.id.toString());
  }

  clearWarehouse(): void {
    this.selectedWarehouse.set(null);
    this.selectedWarehouseDisplay.set('');
    this.form.get('warehouseId')!.setValue('');
  }

  onAccountSelected(event: any): void {
    const account = event.item as Account;
    this.selectedAccount.set(account);
    this.selectedAccountDisplay.set(account.name);
    this.form.get('accountId')!.setValue(account.id.toString());
    this.form.get('partnerId')!.setValue('');
  }

  clearAccount(): void {
    this.selectedAccount.set(null);
    this.selectedAccountDisplay.set('');
    this.form.get('accountId')!.setValue('');
    this.form.get('partnerId')!.setValue('');
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
        accountsPage: this.accountService.getAll(0, 9999, undefined, true),
        operation: this.operationService.getById(+id),
        arrivalPorts: this.portService.getAll('arrival'),
        originPorts: this.portService.getAll('origin'),
        warehouses: this.warehouseService.getAll()
      }).subscribe(({ accountsPage, operation: op, arrivalPorts, originPorts, warehouses }) => {
        const accounts = accountsPage.content;
        this.accounts.set(accounts);
        this.arrivalPorts.set(arrivalPorts);
        this.originPorts.set(originPorts);
        this.warehouses.set(warehouses);
        if (op.status === 'CLOSED' || op.status === 'CANCELLED') {
          this.router.navigate(['/operations', op.id]);
          return;
        }
        this.form.patchValue({
          accountId: op.accountId?.toString() ?? '',
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
          originPortId: op.originPortId?.toString() ?? '',
          warehouseId: op.warehouseId?.toString() ?? '',
          partnerId: op.partnerId?.toString() ?? ''
        });
        // Disable BL Availability when operation is at or past VALUATION_REVIEW
        if (this.blAvailabilityLockedStatuses.has(op.status)) {
          this.form.get('blAvailability')!.disable();
        }
        if (op.accountId) {
          const account = accounts.find(c => c.id === op.accountId);
          if (account) {
            this.selectedAccount.set(account);
            this.selectedAccountDisplay.set(account.name);
          }
        }
        if (op.warehouseId) {
          const warehouse = warehouses.find(d => d.id === op.warehouseId);
          if (warehouse) {
            this.selectedWarehouse.set(warehouse);
            this.selectedWarehouseDisplay.set(warehouse.name);
          }
        }
      });
    } else {
      // Not editing: just load clients for the typeahead and ports
      forkJoin({
        arrivalPorts: this.portService.getAll('arrival'),
        originPorts: this.portService.getAll('origin'),
        warehouses: this.warehouseService.getAll()
      }).subscribe(({ arrivalPorts, originPorts, warehouses }) => {
        this.arrivalPorts.set(arrivalPorts);
        this.originPorts.set(originPorts);
        this.warehouses.set(warehouses);
      });
      this.accountService.getAll(0, 9999, undefined, true).subscribe(response => {
        const accounts = response.content;
        this.accounts.set(accounts);
        const accountIdParam = this.route.snapshot.queryParamMap.get('accountId');
        if (accountIdParam) {
          const account = accounts.find((c: Account) => c.id === +accountIdParam);
          if (account) {
            this.selectedAccount.set(account);
            this.selectedAccountDisplay.set(account.name);
            this.form.get('accountId')!.setValue(accountIdParam);
            this.accountLocked.set(true);
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
      accountId: +val.accountId,
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
      originPortId: val.originPortId ? +val.originPortId : undefined,
      warehouseId: val.warehouseId ? +val.warehouseId : undefined,
      partnerId: val.partnerId ? +val.partnerId : undefined
    };
    const obs = this.isEdit() ? this.operationService.update(this.operationId!, request) : this.operationService.create(request);
    obs.subscribe(op => this.router.navigate(['/operations', op.id]));
  }

  onCancel(): void { this.router.navigate(['/operations']); }
}

