import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { OperationService } from '../../../core/services/operation.service';
import { Declaration, DeclarationType, TariffLine } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TariffLineFormComponent } from '../tariff-line-form/tariff-line-form.component';

@Component({
  selector: 'app-declaration-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent],
  template: `
    @if (declaration()) {
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h3>{{ 'DECLARATIONS.DETAIL_TITLE' | translate }}: {{ declaration()!.declarationNumber }}</h3>
        <a [routerLink]="['/operations', declaration()!.operationId]" [queryParams]="{tab: 'declarations'}" class="btn btn-outline-secondary btn-sm">{{ 'ACTIONS.CLOSE' | translate }}</a>
      </div>
      @if (declaration()!.exchangeRate) {
        <div class="alert alert-info py-2 mb-3">
          <strong>{{ 'DECLARATIONS.EXCHANGE_RATE' | translate }}:</strong>
          1 USD = {{ declaration()!.exchangeRate | number:'1.4-4' }} DOP
          @if (declaration()!.exchangeRateDate) {
            <span class="text-muted ms-2">({{ declaration()!.exchangeRateDate }})</span>
          }
        </div>
      }
      <div class="card mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <dl>
                <dt>{{ 'DECLARATIONS.TYPE' | translate }}</dt><dd><app-status-badge [status]="declaration()!.declarationType" /></dd>
                <dt>{{ 'DECLARATIONS.FOB_VALUE' | translate }}</dt><dd>RD$ {{ declaration()!.fobValue | number:'1.2-2' }}</dd>
                @if (declaration()!.fobValueUsd != null) {
                  <dd class="text-muted small mt-n2">US$ {{ declaration()!.fobValueUsd | number:'1.2-2' }}</dd>
                }
                <dt>{{ 'DECLARATIONS.CIF_VALUE' | translate }}</dt><dd>RD$ {{ declaration()!.cifValue | number:'1.2-2' }}</dd>
                @if (declaration()!.cifValueUsd != null) {
                  <dd class="text-muted small mt-n2">US$ {{ declaration()!.cifValueUsd | number:'1.2-2' }}</dd>
                }
              </dl>
            </div>
            <div class="col-md-4">
              <dl>
                <dt>{{ 'DECLARATIONS.TAXABLE_BASE' | translate }}</dt><dd>RD$ {{ declaration()!.taxableBase | number:'1.2-2' }}</dd>
                <dt>{{ 'DECLARATIONS.TOTAL_TAXES' | translate }}</dt><dd>RD$ {{ declaration()!.totalTaxes | number:'1.2-2' }}</dd>
              </dl>
            </div>
            <div class="col-md-4">
              <dl>
                <dt>{{ 'DECLARATIONS.FREIGHT_VALUE' | translate }}</dt><dd>RD$ {{ declaration()!.freightValue | number:'1.2-2' }}</dd>
                @if (declaration()!.freightValueUsd != null) {
                  <dd class="text-muted small mt-n2">US$ {{ declaration()!.freightValueUsd | number:'1.2-2' }}</dd>
                }
                <dt>{{ 'DECLARATIONS.INSURANCE_VALUE' | translate }}</dt><dd>RD$ {{ declaration()!.insuranceValue | number:'1.2-2' }}</dd>
                @if (declaration()!.insuranceValueUsd != null) {
                  <dd class="text-muted small mt-n2">US$ {{ declaration()!.insuranceValueUsd | number:'1.2-2' }}</dd>
                }
              </dl>
            </div>
          </div>
          @if (declaration()!.notes) { <p><strong>{{ 'DECLARATIONS.NOTES' | translate }}:</strong> {{ declaration()!.notes }}</p> }
          @if (authService.hasRole(['ADMIN', 'SUPERVISOR', 'AGENT']) && canEdit()) {
            <a [routerLink]="['/operations', declaration()!.operationId, 'declarations', declaration()!.id, 'edit']" class="btn btn-sm btn-outline-primary mt-2">{{ 'ACTIONS.EDIT' | translate }}</a>
          }
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
        <h5>{{ 'DECLARATIONS.TARIFF_LINES' | translate }}</h5>
        @if (authService.hasRole(['ADMIN', 'SUPERVISOR', 'AGENT']) && canEdit()) {
          <button class="btn btn-sm btn-outline-primary" (click)="openTariffLineForm()">{{ 'DECLARATIONS.ADD_TARIFF_LINE' | translate }}</button>
        }
      </div>
      @if (tariffLines().length > 0) {
        <div class="table-responsive">
          <table class="table table-sm">
            <thead class="table-light">
              <tr>
                <th>{{ 'DECLARATIONS.LINE_NUMBER' | translate }}</th>
                <th>{{ 'DECLARATIONS.TARIFF_CODE' | translate }}</th>
                <th>{{ 'DECLARATIONS.DESCRIPTION' | translate }}</th>
                <th>{{ 'DECLARATIONS.QUANTITY' | translate }}</th>
                <th>{{ 'DECLARATIONS.UNIT_VALUE' | translate }}</th>
                <th>{{ 'DECLARATIONS.TOTAL_VALUE' | translate }}</th>
                <th>{{ 'DECLARATIONS.TAX_RATE' | translate }}</th>
                <th>{{ 'DECLARATIONS.TAX_AMOUNT' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (line of tariffLines(); track line.id) {
                <tr>
                  <td>{{ line.lineNumber }}</td>
                  <td>{{ line.tariffCode }}</td>
                  <td>{{ line.description }}</td>
                  <td>{{ line.quantity | number:'1.2-2' }}</td>
                  <td>{{ line.unitValue | number:'1.2-2' }}</td>
                  <td>{{ line.totalValue | number:'1.2-2' }}</td>
                  <td>{{ line.taxRate | number:'1.2-2' }}%</td>
                  <td>{{ line.taxAmount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="text-muted">{{ 'DECLARATIONS.NO_TARIFF_LINES' | translate }}</p>
      }
    }
  `
})
export class DeclarationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private declarationService = inject(DeclarationService);
  private operationService = inject(OperationService);
  private modal = inject(NgbModal);
  authService = inject(AuthService);

  declaration = signal<Declaration | null>(null);
  tariffLines = signal<TariffLine[]>([]);
  operationStatus = signal<string>('');

  private static readonly PRELIMINARY_EDITABLE_STATUSES = [
    'DRAFT', 'DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PENDING_CORRECTION',
    'PRELIQUIDATION_REVIEW', 'ANALYST_ASSIGNED', 'DECLARATION_IN_PROGRESS'
  ];

  private static readonly FINAL_EDITABLE_STATUSES = [
    'DRAFT', 'DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PENDING_CORRECTION',
    'PRELIQUIDATION_REVIEW', 'ANALYST_ASSIGNED', 'DECLARATION_IN_PROGRESS',
    'SUBMITTED_TO_CUSTOMS', 'VALUATION_REVIEW'
  ];

  canEdit = computed(() => {
    const decl = this.declaration();
    if (!decl) return false;
    const editableStatuses = decl.declarationType === DeclarationType.FINAL
      ? DeclarationDetailComponent.FINAL_EDITABLE_STATUSES
      : DeclarationDetailComponent.PRELIMINARY_EDITABLE_STATUSES;
    return editableStatuses.includes(this.operationStatus());
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    const opId = +this.route.snapshot.paramMap.get('operationId')!;
    const declId = +this.route.snapshot.paramMap.get('declarationId')!;
    this.declarationService.getDeclaration(opId, declId).subscribe(d => this.declaration.set(d));
    this.declarationService.getTariffLines(opId, declId).subscribe(lines => this.tariffLines.set(lines));
    this.operationService.getById(opId).subscribe(op => this.operationStatus.set(op.status));
  }

  openTariffLineForm(): void {
    const ref = this.modal.open(TariffLineFormComponent);
    ref.componentInstance.operationId = this.declaration()!.operationId;
    ref.componentInstance.declarationId = this.declaration()!.id;
    ref.result.then(() => this.load(), () => {});
  }
}
