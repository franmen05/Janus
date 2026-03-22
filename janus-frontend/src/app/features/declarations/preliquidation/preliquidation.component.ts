import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { Declaration, TariffLine } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentListComponent } from '../../documents/document-list/document-list.component';

@Component({
  selector: 'app-preliquidation',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, DocumentListComponent],
  template: `
    @if (declaration()) {
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0">{{ 'preliquidation.title' | translate }} - {{ declaration()!.declarationNumber }}</h6>
        </div>
        <div class="card-body">
          @if (declaration()!.exchangeRate) {
            <div class="alert alert-info py-2 mb-3">
              <strong>{{ 'DECLARATIONS.EXCHANGE_RATE' | translate }}:</strong>
              1 USD = {{ declaration()!.exchangeRate | number:'1.4-4' }} DOP
              @if (declaration()!.exchangeRateDate) {
                <span class="text-muted ms-2">({{ declaration()!.exchangeRateDate }})</span>
              }
            </div>
          }
          <h6 class="text-muted mb-3">{{ 'preliquidation.taxSummary' | translate }}</h6>
          <div class="row">
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <small class="text-muted d-block">{{ 'preliquidation.fobValue' | translate }}</small>
                <strong class="fs-5">RD$ {{ declaration()!.fobValue | number:'1.2-2' }}</strong>
                @if (declaration()!.exchangeRate && declaration()!.fobValueUsd != null) {
                  <small class="text-muted d-block">US$ {{ declaration()!.fobValueUsd | number:'1.2-2' }}</small>
                }
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <small class="text-muted d-block">{{ 'preliquidation.cifValue' | translate }}</small>
                <strong class="fs-5">RD$ {{ declaration()!.cifValue | number:'1.2-2' }}</strong>
                @if (declaration()!.exchangeRate && declaration()!.cifValueUsd != null) {
                  <small class="text-muted d-block">US$ {{ declaration()!.cifValueUsd | number:'1.2-2' }}</small>
                }
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <small class="text-muted d-block">{{ 'preliquidation.taxableBase' | translate }}</small>
                <strong class="fs-5">RD$ {{ declaration()!.taxableBase | number:'1.2-2' }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center bg-light">
                <small class="text-muted d-block">{{ 'preliquidation.totalTaxes' | translate }}</small>
                <strong class="fs-5 text-primary">RD$ {{ declaration()!.totalTaxes | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>

          @if (tariffLines().length > 0) {
            <h6 class="text-muted mt-4 mb-2">{{ 'DECLARATIONS.TARIFF_LINES' | translate }}</h6>
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
                <tfoot class="table-light fw-bold">
                  <tr>
                    <td colspan="3">{{ 'DECLARATIONS.TARIFF_TOTALS' | translate }}</td>
                    <td>{{ tariffTotals().quantity | number:'1.2-2' }}</td>
                    <td></td>
                    <td>{{ tariffTotals().totalValue | number:'1.2-2' }}</td>
                    <td></td>
                    <td>{{ tariffTotals().taxAmount | number:'1.2-2' }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          }

          <div class="mt-4">
            <app-document-list [operationId]="declaration()!.operationId" />
          </div>

          <h6 class="text-muted mt-4 mb-3">{{ 'review.approvalPanel' | translate }}</h6>
          <div class="row g-3">
            <!-- Technical Approval -->
            <div class="col-md-4">
              <div class="card h-100" [class.border-success]="declaration()!.technicalApprovedBy">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <h6 class="mb-0">{{ 'review.technicalApproval' | translate }}</h6>
                    @if (declaration()!.technicalApprovedBy) {
                      <i class="bi bi-check-circle-fill text-success"></i>
                    }
                  </div>
                  @if (declaration()!.technicalApprovedBy) {
                    <span class="badge bg-success mb-1">{{ 'review.approvedBy' | translate }}: {{ declaration()!.technicalApprovedBy }}</span>
                    <small class="text-muted">{{ declaration()!.technicalApprovedAt | date:'medium' }}</small>
                    @if (declaration()!.technicalApprovalComment) {
                      <p class="mt-1 mb-0"><small>{{ declaration()!.technicalApprovalComment }}</small></p>
                    }
                  } @else {
                    <span class="badge bg-secondary mb-2">{{ 'STATUS.PENDING' | translate }}</span>
                    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                      <div class="mt-auto pt-2">
                        <button class="btn btn-success btn-sm w-100" (click)="approveTechnical()">{{ 'preliquidation.approveTechnical' | translate }}</button>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
            <!-- Final Approval -->
            <div class="col-md-4">
              <div class="card h-100" [class.border-success]="declaration()!.finalApprovedBy">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <h6 class="mb-0">{{ 'review.finalApproval' | translate }}</h6>
                    @if (declaration()!.finalApprovedBy) {
                      <i class="bi bi-check-circle-fill text-success"></i>
                    }
                  </div>
                  @if (declaration()!.finalApprovedBy) {
                    <span class="badge bg-success mb-1">{{ 'review.approvedBy' | translate }}: {{ declaration()!.finalApprovedBy }}</span>
                    <small class="text-muted">{{ declaration()!.finalApprovedAt | date:'medium' }}</small>
                    @if (declaration()!.finalApprovalComment) {
                      <p class="mt-1 mb-0"><small>{{ declaration()!.finalApprovalComment }}</small></p>
                    }
                  } @else {
                    <span class="badge bg-secondary mb-2">{{ 'STATUS.PENDING' | translate }}</span>
                    @if (authService.hasRole(['ADMIN', 'AGENT']) && declaration()!.technicalApprovedBy && !declaration()!.finalApprovedBy) {
                      <div class="mt-auto pt-2">
                        <button class="btn btn-success btn-sm w-100" (click)="approveFinal()">{{ 'preliquidation.approveFinal' | translate }}</button>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
            <!-- Reject -->
            <div class="col-md-4">
              <div class="card h-100" [class.border-danger]="declaration()!.rejectedBy">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <h6 class="mb-0">{{ 'preliquidation.reject' | translate }}</h6>
                    @if (declaration()!.rejectedBy) {
                      <i class="bi bi-x-circle-fill text-danger"></i>
                    }
                  </div>
                  @if (declaration()!.rejectedBy) {
                    <span class="badge bg-danger mb-1">{{ 'review.rejectedBy' | translate }}: {{ declaration()!.rejectedBy }}</span>
                    <small class="text-muted">{{ declaration()!.rejectedAt | date:'medium' }}</small>
                    @if (declaration()!.rejectionComment) {
                      <p class="mt-1 mb-0"><small>{{ declaration()!.rejectionComment }}</small></p>
                    }
                  } @else {
                    <span class="badge bg-secondary mb-2">-</span>
                    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                      <div class="mt-auto pt-2">
                        <button class="btn btn-outline-danger btn-sm w-100" (click)="reject()">{{ 'preliquidation.reject' | translate }}</button>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex mt-3">
            <button class="btn btn-outline-secondary btn-sm ms-auto" (click)="close()">{{ 'ACTIONS.CLOSE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class PreliquidationComponent implements OnInit {
  operationId = input<number>(0);
  declarationId = input<number>(0);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private declarationService = inject(DeclarationService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);

  declaration = signal<Declaration | null>(null);
  tariffLines = signal<TariffLine[]>([]);
  tariffTotals = computed(() => {
    const lines = this.tariffLines();
    return {
      quantity: lines.reduce((sum, l) => sum + (l.quantity || 0), 0),
      totalValue: lines.reduce((sum, l) => sum + (l.totalValue || 0), 0),
      taxAmount: lines.reduce((sum, l) => sum + (l.taxAmount || 0), 0)
    };
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    const opId = this.operationId() || +this.route.snapshot.paramMap.get('operationId')!;
    const declId = this.declarationId() || +this.route.snapshot.paramMap.get('declarationId')!;
    if (!opId || !declId) return;
    this.declarationService.getDeclaration(opId, declId).subscribe(d => this.declaration.set(d));
    this.declarationService.getTariffLines(opId, declId).subscribe(lines => this.tariffLines.set(lines));
  }

  approveTechnical(): void {
    const decl = this.declaration()!;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.declarationService.approveTechnical(decl.operationId, decl.id, comment || undefined).subscribe(() => this.load());
  }

  approveFinal(): void {
    const decl = this.declaration()!;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.declarationService.approveFinal(decl.operationId, decl.id, comment || undefined).subscribe(() => this.load());
  }

  close(): void {
    const opId = this.operationId() || +this.route.snapshot.paramMap.get('operationId')!;
    this.router.navigate(['/operations', opId]);
  }

  reject(): void {
    const decl = this.declaration()!;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.declarationService.reject(decl.operationId, decl.id, comment || undefined).subscribe(() => this.load());
  }
}
