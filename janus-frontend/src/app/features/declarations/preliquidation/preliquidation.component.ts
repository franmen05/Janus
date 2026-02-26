import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { Declaration, TariffLine } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-preliquidation',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    @if (declaration()) {
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0">{{ 'preliquidation.title' | translate }} - {{ declaration()!.declarationNumber }}</h6>
        </div>
        <div class="card-body">
          <h6 class="text-muted mb-3">{{ 'preliquidation.taxSummary' | translate }}</h6>
          <div class="row">
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <small class="text-muted d-block">{{ 'preliquidation.fobValue' | translate }}</small>
                <strong class="fs-5">{{ declaration()!.fobValue | number:'1.2-2' }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <small class="text-muted d-block">{{ 'preliquidation.cifValue' | translate }}</small>
                <strong class="fs-5">{{ declaration()!.cifValue | number:'1.2-2' }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center">
                <small class="text-muted d-block">{{ 'preliquidation.taxableBase' | translate }}</small>
                <strong class="fs-5">{{ declaration()!.taxableBase | number:'1.2-2' }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="border rounded p-3 text-center bg-light">
                <small class="text-muted d-block">{{ 'preliquidation.totalTaxes' | translate }}</small>
                <strong class="fs-5 text-primary">{{ declaration()!.totalTaxes | number:'1.2-2' }}</strong>
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
              </table>
            </div>
          }

          <h6 class="text-muted mt-4 mb-2">{{ 'review.approvalPanel' | translate }}</h6>
          <div class="row">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h6>{{ 'review.technicalApproval' | translate }}</h6>
                  @if (declaration()!.technicalApprovedBy) {
                    <span class="badge bg-success mb-1">{{ 'review.approvedBy' | translate }}: {{ declaration()!.technicalApprovedBy }}</span>
                    <br><small class="text-muted">{{ declaration()!.technicalApprovedAt | date:'medium' }}</small>
                    @if (declaration()!.technicalApprovalComment) {
                      <p class="mt-1 mb-0"><small>{{ declaration()!.technicalApprovalComment }}</small></p>
                    }
                  } @else {
                    <span class="badge bg-secondary">{{ 'STATUS.PENDING' | translate }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h6>{{ 'review.finalApproval' | translate }}</h6>
                  @if (declaration()!.finalApprovedBy) {
                    <span class="badge bg-success mb-1">{{ 'review.approvedBy' | translate }}: {{ declaration()!.finalApprovedBy }}</span>
                    <br><small class="text-muted">{{ declaration()!.finalApprovedAt | date:'medium' }}</small>
                    @if (declaration()!.finalApprovalComment) {
                      <p class="mt-1 mb-0"><small>{{ declaration()!.finalApprovalComment }}</small></p>
                    }
                  } @else {
                    <span class="badge bg-secondary">{{ 'STATUS.PENDING' | translate }}</span>
                  }
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h6>{{ 'preliquidation.reject' | translate }}</h6>
                  @if (declaration()!.rejectedBy) {
                    <span class="badge bg-danger mb-1">{{ 'review.rejectedBy' | translate }}: {{ declaration()!.rejectedBy }}</span>
                    <br><small class="text-muted">{{ declaration()!.rejectedAt | date:'medium' }}</small>
                    @if (declaration()!.rejectionComment) {
                      <p class="mt-1 mb-0"><small>{{ declaration()!.rejectionComment }}</small></p>
                    }
                  } @else {
                    <span class="badge bg-secondary">-</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3">
            @if (authService.hasRole(['ADMIN', 'AGENT'])) {
              @if (!declaration()!.technicalApprovedBy) {
                <button class="btn btn-success btn-sm" (click)="approveTechnical()">{{ 'preliquidation.approveTechnical' | translate }}</button>
              }
              @if (authService.hasRole(['ADMIN']) && declaration()!.technicalApprovedBy && !declaration()!.finalApprovedBy) {
                <button class="btn btn-primary btn-sm" (click)="approveFinal()">{{ 'preliquidation.approveFinal' | translate }}</button>
              }
              @if (!declaration()!.rejectedBy) {
                <button class="btn btn-danger btn-sm" (click)="reject()">{{ 'preliquidation.reject' | translate }}</button>
              }
            }
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
