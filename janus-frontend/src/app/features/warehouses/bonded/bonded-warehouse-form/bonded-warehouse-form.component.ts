import { Component, inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { BondedWarehouseService } from '../../../../core/services/bonded-warehouse.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-bonded-warehouse-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'BONDED_WAREHOUSES.EDIT_TITLE' : 'BONDED_WAREHOUSES.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.CODE' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="code">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.NAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="name">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'BONDED_WAREHOUSES.DESCRIPTION' | translate }}</label>
            <textarea class="form-control" formControlName="description" rows="2"></textarea>
          </div>
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.SECUENCIA' | translate }}</label>
              <input type="number" class="form-control" formControlName="secuencia">
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.TIPO_LOCALIZACION' | translate }}</label>
              <input type="text" class="form-control" formControlName="tipoLocalizacion">
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.PAIS_ORIGEN' | translate }}</label>
              <select class="form-select" formControlName="paisOrigen">
                <option [ngValue]="null">—</option>
                @for (country of countries(); track country.code) {
                  <option [value]="country.code">{{ country.name }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.CENTRO_LOGISTICO' | translate }}</label>
              <input type="text" class="form-control" formControlName="centroLogistico">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'BONDED_WAREHOUSES.UBICACION_AREA' | translate }}</label>
              <input type="text" class="form-control" formControlName="ubicacionArea">
            </div>
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
export class BondedWarehouseFormComponent implements OnInit {
  private warehouseService = inject(BondedWarehouseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  countries = signal<{ code: string; name: string }[]>([]);
  isEdit = signal(false);
  warehouseId: number | null = null;

  form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    secuencia: new FormControl<number | null>(null),
    tipoLocalizacion: new FormControl<string | null>(null),
    centroLogistico: new FormControl<string | null>(null),
    ubicacionArea: new FormControl<string | null>(null),
    paisOrigen: new FormControl<string | null>(null)
  });

  ngOnInit(): void {
    this.http.get<{ code: string; name: string }[]>(
      `${environment.apiUrl}/api/ports/catalog/countries`
    ).subscribe(c => this.countries.set(c));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.warehouseId = +id;
      this.warehouseService.getById(+id).subscribe(d => {
        this.form.patchValue({
          code: d.code,
          name: d.name,
          description: d.description ?? '',
          secuencia: d.secuencia,
          tipoLocalizacion: d.tipoLocalizacion,
          centroLogistico: d.centroLogistico,
          ubicacionArea: d.ubicacionArea,
          paisOrigen: d.paisOrigen
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = {
      code: val.code,
      name: val.name,
      description: val.description || undefined,
      secuencia: val.secuencia,
      tipoLocalizacion: val.tipoLocalizacion || undefined,
      centroLogistico: val.centroLogistico || undefined,
      ubicacionArea: val.ubicacionArea || undefined,
      paisOrigen: val.paisOrigen || undefined
    };
    const obs = this.isEdit() ? this.warehouseService.update(this.warehouseId!, request) : this.warehouseService.create(request);
    obs.subscribe(() => this.router.navigate(['/warehouses/bonded']));
  }

  onCancel(): void { this.router.navigate(['/warehouses/bonded']); }
}
