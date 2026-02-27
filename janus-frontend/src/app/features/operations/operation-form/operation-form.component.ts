import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { OperatorFunction, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { OperationService } from '../../../core/services/operation.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { TransportMode, OperationCategory, CargoType, BlType, BlAvailability } from '../../../core/models/operation.model';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-operation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgbTypeaheadModule, StatusLabelPipe, RouterModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'OPERATIONS.EDIT_TITLE' : 'OPERATIONS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.CLIENT' | translate }}</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control"
                  [ngbTypeahead]="searchClient"
                  [resultFormatter]="clientResultFormatter"
                  [inputFormatter]="clientInputFormatter"
                  (selectItem)="onClientSelected($event)"
                  [value]="selectedClientDisplay()"
                  [disabled]="clientLocked()"
                  placeholder="{{ 'OPERATIONS.CLIENT_SEARCH_PLACEHOLDER' | translate }}" />
              </div>
              @if (selectedClient()) {
                <div class="mt-1 d-flex align-items-center gap-2">
                  <span class="badge bg-primary">{{ selectedClient()!.name }}</span>
                  <small class="text-muted">{{ selectedClient()!.taxId }}</small>
                  @if (!clientLocked()) {
                    <button type="button" class="btn btn-link btn-sm text-danger p-0" (click)="clearClient()">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  }
                </div>
              } @else {
                <div class="mt-1">
                  <a routerLink="/clients/new" class="small text-decoration-none">
                    <i class="bi bi-plus-circle me-1"></i>{{ 'OPERATIONS.CREATE_CLIENT' | translate }}
                  </a>
                </div>
              }
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
              <label class="form-label">{{ 'OPERATIONS.BL_AVAILABILITY' | translate }}</label>
              <select class="form-select" formControlName="blAvailability"
                      [class.is-invalid]="form.get('blAvailability')!.invalid && form.get('blAvailability')!.touched">
                <option value="">{{ 'OPERATIONS.SELECT_BL_AVAILABILITY' | translate }}</option>
                <option value="ORIGINAL">{{ 'BL_AVAILABILITY.ORIGINAL' | translate }}</option>
                <option value="ENDORSED">{{ 'BL_AVAILABILITY.ENDORSED' | translate }}</option>
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
  private clientService = inject(ClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  clients = signal<Client[]>([]);
  isEdit = signal(false);
  operationId: number | null = null;
  selectedClient = signal<Client | null>(null);
  selectedClientDisplay = signal('');
  clientLocked = signal(false);
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
    blAvailability: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    deadline: new FormControl('', { nonNullable: true }),
    incoterm: new FormControl('', { nonNullable: true })
  });

  searchClient: OperatorFunction<string, Client[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.length < 1) return this.clients().filter(c => c.active).slice(0, 10);
        const lower = term.toLowerCase();
        return this.clients().filter(c => c.active &&
          (c.name.toLowerCase().includes(lower) ||
           c.taxId?.toLowerCase().includes(lower) ||
           c.email?.toLowerCase().includes(lower))
        ).slice(0, 10);
      })
    );

  clientResultFormatter = (client: Client) =>
    `${client.name}  —  ${client.taxId || ''}  ${client.email ? '· ' + client.email : ''}`;

  clientInputFormatter = (client: Client) => client.name;

  onClientSelected(event: any): void {
    const client = event.item as Client;
    this.selectedClient.set(client);
    this.selectedClientDisplay.set(client.name);
    this.form.get('clientId')!.setValue(client.id.toString());
  }

  clearClient(): void {
    this.selectedClient.set(null);
    this.selectedClientDisplay.set('');
    this.form.get('clientId')!.setValue('');
  }

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => {
      this.clients.set(clients);
      const clientIdParam = this.route.snapshot.queryParamMap.get('clientId');
      if (clientIdParam && !this.isEdit()) {
        const client = clients.find(c => c.id === +clientIdParam);
        if (client) {
          this.selectedClient.set(client);
          this.selectedClientDisplay.set(client.name);
          this.form.get('clientId')!.setValue(clientIdParam);
          this.clientLocked.set(true);
        }
      }
    });

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
          blAvailability: op.blAvailability ?? '',
          notes: op.notes ?? '',
          deadline: op.deadline ?? '',
          incoterm: op.incoterm ?? ''
        });
        if (op.clientId) {
          const client = this.clients().find(c => c.id === op.clientId);
          if (client) {
            this.selectedClient.set(client);
            this.selectedClientDisplay.set(client.name);
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
      clientId: +val.clientId,
      transportMode: val.transportMode,
      cargoType: val.transportMode === TransportMode.MARITIME ? val.cargoType as CargoType : undefined,
      operationCategory: val.operationCategory,
      blNumber: val.blNumber || undefined,
      blType: val.blType as BlType,
      childBlNumber: val.blType === BlType.CONSOLIDATED ? (val.childBlNumber || undefined) : undefined,
      containerNumber: val.containerNumber || undefined,
      estimatedArrival: val.estimatedArrival || undefined,
      blAvailability: val.blAvailability as BlAvailability,
      notes: val.notes || undefined,
      deadline: val.deadline || undefined,
      incoterm: val.incoterm || undefined
    };
    const obs = this.isEdit() ? this.operationService.update(this.operationId!, request) : this.operationService.create(request);
    obs.subscribe(op => this.router.navigate(['/operations', op.id]));
  }

  onCancel(): void { this.router.navigate(['/operations']); }
}

