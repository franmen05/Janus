import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { CargoType, InspectionType } from '../../../core/models/operation.model';
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
              <label class="form-label">{{ 'OPERATIONS.CARGO_TYPE' | translate }}</label>
              <select class="form-select" formControlName="cargoType">
                @for (t of cargoTypes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'OPERATIONS.INSPECTION_TYPE' | translate }}</label>
              <select class="form-select" formControlName="inspectionType">
                @for (t of inspectionTypes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
          </div>
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
  cargoTypes = Object.values(CargoType);
  inspectionTypes = Object.values(InspectionType);

  form = new FormGroup({
    clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cargoType: new FormControl(CargoType.FCL, { nonNullable: true, validators: [Validators.required] }),
    inspectionType: new FormControl(InspectionType.EXPRESS, { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => this.clients.set(clients));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.operationId = +id;
      this.operationService.getById(+id).subscribe(op => {
        this.form.patchValue({ clientId: op.clientId?.toString() ?? '', cargoType: op.cargoType, inspectionType: op.inspectionType, notes: op.notes ?? '' });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { clientId: +val.clientId, cargoType: val.cargoType, inspectionType: val.inspectionType, notes: val.notes || undefined };
    const obs = this.isEdit() ? this.operationService.update(this.operationId!, request) : this.operationService.create(request);
    obs.subscribe(op => this.router.navigate(['/operations', op.id]));
  }

  onCancel(): void { this.router.navigate(['/operations']); }
}
