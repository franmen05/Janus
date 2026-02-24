import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { TransportMode, OperationCategory, CargoType, BlType } from '../../../core/models/operation.model';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-operation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, StatusLabelPipe],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'OPERATIONS.EDIT_TITLE' : 'OPERATIONS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.CLIENT' | translate }}</label>
              <select class="form-select" formControlName="clientId">
                <option value="">{{ 'OPERATIONS.SELECT_CLIENT' | translate }}</option>
                @for (client of clients(); track client.id) {
                  <option [value]="client.id">{{ client.name }} ({{ client.taxId }})</option>
                }
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.TRANSPORT_MODE' | translate }}</label>
              <select class="form-select" formControlName="transportMode">
                @for (t of transportModes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.OPERATION_CATEGORY' | translate }}</label>
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
              <label class="form-label">{{ 'OPERATIONS.BL_NUMBER' | translate }}</label>
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
            @if (form.get('blType')!.value === 'CONSOLIDATED') {
              <div class="col-md-4">
                <label class="form-label">{{ 'OPERATIONS.CHILD_BL_NUMBER' | translate }}</label>
                <input type="text" class="form-control" formControlName="childBlNumber"
                       [class.is-invalid]="form.get('childBlNumber')!.invalid && form.get('childBlNumber')!.touched">
                @if (form.get('childBlNumber')!.hasError('required') && form.get('childBlNumber')!.touched) {
                  <div class="invalid-feedback">{{ 'OPERATIONS.CHILD_BL_REQUIRED' | translate }}</div>
                }
              </div>
            }
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.ESTIMATED_ARRIVAL' | translate }}</label>
              <input type="datetime-local" class="form-control" formControlName="estimatedArrival">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.DEADLINE' | translate }}</label>
              <input type="datetime-local" class="form-control" formControlName="deadline">
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
              <label class="form-label">{{ 'OPERATIONS.BL_ORIGINAL_AVAILABLE' | translate }}</label>
              <select class="form-select" formControlName="blOriginalAvailable"
                      [class.is-invalid]="form.get('blOriginalAvailable')!.invalid && form.get('blOriginalAvailable')!.touched">
                <option value="">{{ 'OPERATIONS.SELECT_BL_ORIGINAL' | translate }}</option>
                <option value="true">{{ 'COMMON.YES' | translate }}</option>
                <option value="false">{{ 'COMMON.NO' | translate }}</option>
              </select>
              @if (form.get('blOriginalAvailable')!.hasError('required') && form.get('blOriginalAvailable')!.touched) {
                <div class="invalid-feedback">{{ 'OPERATIONS.BL_ORIGINAL_REQUIRED' | translate }}</div>
              }
            </div>
          </div>
          @if (form.get('blOriginalAvailable')!.value === 'false') {
            <div class="alert alert-warning mt-2 py-2">
              <small><i class="bi bi-exclamation-triangle me-1"></i>{{ 'OPERATIONS.BL_ORIGINAL_WARNING' | translate }}</small>
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
  private clientService = inject(ClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  clients = signal<Client[]>([]);
  isEdit = signal(false);
  operationId: number | null = null;
  transportModes = Object.values(TransportMode);
  cargoTypes = Object.values(CargoType);
  operationCategories = Object.values(OperationCategory);
  blTypes = Object.values(BlType);
  incoterms = ['FOB', 'CIF', 'EXW', 'CFR', 'CIP', 'DAP', 'DDP'];

  form = new FormGroup({
    clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    transportMode: new FormControl(TransportMode.MARITIME, { nonNullable: true, validators: [Validators.required] }),
    cargoType: new FormControl(CargoType.FCL, { nonNullable: true }),
    operationCategory: new FormControl(OperationCategory.CATEGORY_1, { nonNullable: true, validators: [Validators.required] }),
    blNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    blType: new FormControl(BlType.SIMPLE, { nonNullable: true }),
    childBlNumber: new FormControl('', { nonNullable: true }),
    containerNumber: new FormControl('', { nonNullable: true }),
    estimatedArrival: new FormControl('', { nonNullable: true }),
    blOriginalAvailable: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    deadline: new FormControl('', { nonNullable: true }),
    incoterm: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => this.clients.set(clients));

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
      this.operationService.getById(+id).subscribe(op => {
        if (op.status === 'CLOSED' || op.status === 'CANCELLED') {
          this.router.navigate(['/operations', op.id]);
          return;
        }
        this.form.patchValue({
          clientId: op.clientId?.toString() ?? '',
          transportMode: op.transportMode,
          cargoType: op.cargoType ?? CargoType.FCL,
          operationCategory: op.operationCategory,
          blNumber: op.blNumber ?? '',
          blType: op.blType ?? BlType.SIMPLE,
          childBlNumber: op.childBlNumber ?? '',
          containerNumber: op.containerNumber ?? '',
          estimatedArrival: op.estimatedArrival ?? '',
          blOriginalAvailable: op.blOriginalAvailable ? 'true' : 'false',
          notes: op.notes ?? '',
          deadline: op.deadline ?? '',
          incoterm: op.incoterm ?? ''
        });
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
    } else {
      childBlControl.clearValidators();
      childBlControl.setValue('');
      childBlControl.disable();
    }
    childBlControl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = {
      clientId: +val.clientId,
      transportMode: val.transportMode,
      cargoType: val.transportMode === TransportMode.MARITIME ? val.cargoType as CargoType : undefined,
      operationCategory: val.operationCategory,
      blNumber: val.blNumber || undefined,
      blType: val.blType as BlType,
      childBlNumber: val.blType === BlType.CONSOLIDATED ? (val.childBlNumber || undefined) : undefined,
      containerNumber: val.containerNumber || undefined,
      estimatedArrival: val.estimatedArrival || undefined,
      blOriginalAvailable: val.blOriginalAvailable === 'true',
      notes: val.notes || undefined,
      deadline: val.deadline || undefined,
      incoterm: val.incoterm || undefined
    };
    const obs = this.isEdit() ? this.operationService.update(this.operationId!, request) : this.operationService.create(request);
    obs.subscribe(op => this.router.navigate(['/operations', op.id]));
  }

  onCancel(): void { this.router.navigate(['/operations']); }
}

