import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { ComplianceService } from '../../../core/services/compliance.service';
import { AuditService } from '../../../core/services/audit.service';
import { DeclarationService } from '../../../core/services/declaration.service';
import { Operation, OperationStatus } from '../../../core/models/operation.model';
import { CompletenessResponse, Document } from '../../../core/models/document.model';
import { Declaration } from '../../../core/models/declaration.model';
import { AuditLog } from '../../../core/models/audit.model';
import { DocumentService } from '../../../core/services/document.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { CompletenessIndicatorComponent } from '../../../shared/components/completeness-indicator/completeness-indicator.component';
import { OperationStatusComponent } from '../operation-status/operation-status.component';
import { DocumentListComponent } from '../../documents/document-list/document-list.component';
import { AuthService } from '../../../core/services/auth.service';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { OperationCommentsComponent } from '../operation-comments/operation-comments.component';
import { DeclarationListComponent } from '../../declarations/declaration-list/declaration-list.component';
import { CrossingResultComponent } from '../../declarations/crossing-result/crossing-result.component';
import { OperationAlertsComponent } from '../../alerts/operation-alerts/operation-alerts.component';
import { InspectionPanelComponent } from '../inspection-panel/inspection-panel.component';
import { ValuationPanelComponent } from '../valuation-panel/valuation-panel.component';
const REVIEW_STATUSES = ['IN_REVIEW', 'PENDING_CORRECTION', 'PRELIQUIDATION_REVIEW', 'ANALYST_ASSIGNED'];
const INSPECTION_VISIBLE_STATUSES = ['SUBMITTED_TO_CUSTOMS', 'VALUATION_REVIEW', 'PENDING_EXTERNAL_APPROVAL', 'PAYMENT_PREPARATION', 'IN_TRANSIT', 'CLOSED'];
const VALUATION_VISIBLE_STATUSES = ['VALUATION_REVIEW', 'PENDING_EXTERNAL_APPROVAL', 'PAYMENT_PREPARATION', 'IN_TRANSIT', 'CLOSED'];

@Component({
  selector: 'app-operation-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NgbNavModule, TranslateModule,
    StatusBadgeComponent, ProgressBarComponent, CompletenessIndicatorComponent,
    OperationStatusComponent, DocumentListComponent, StatusLabelPipe,
    OperationCommentsComponent,
    DeclarationListComponent, CrossingResultComponent, OperationAlertsComponent,
    InspectionPanelComponent, ValuationPanelComponent
  ],
  template: `
    @if (operation()) {
      <app-operation-alerts [operationId]="operation()!.id" />
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
        <div>
          <h2 class="mb-0 fs-4 fs-md-2">{{ operation()!.referenceNumber }}</h2>
          <small class="text-muted">{{ operation()!.clientName }}</small>
        </div>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <app-status-badge [status]="operation()!.status" />
          @if (authService.hasRole(['ADMIN', 'AGENT']) && operation()!.status !== 'CLOSED' && operation()!.status !== 'CANCELLED') {
            <a [routerLink]="['/operations', operation()!.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
          }
          @if (authService.hasRole(['ADMIN', 'AGENT']) && operation()!.status === 'DRAFT') {
            <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete()">{{ 'ACTIONS.DELETE' | translate }}</button>
          }
        </div>
      </div>

      <app-progress-bar [status]="operation()!.status" [interactive]="authService.hasRole(['ADMIN', 'AGENT'])" (stepClicked)="onProgressStepClick($event)" class="mb-4 d-block" />
      @if (statusChangeErrors().length > 0) {
        <div class="alert alert-danger alert-dismissible mb-3">
          <button type="button" class="btn-close" (click)="statusChangeErrors.set([])"></button>
          <strong>{{ 'COMPLIANCE.FAILED' | translate }}</strong>
          <ul class="mb-0 mt-1">
            @for (err of statusChangeErrors(); track err) {
              <li [innerHTML]="err"></li>
            }
          </ul>
        </div>
      }

      @if (isInReviewStatus()) {
        <div class="card mb-3 border-info">
          <div class="card-header bg-info bg-opacity-10">
            <h6 class="mb-0">{{ 'review.approvalPanel' | translate }}</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <dt>{{ 'review.subStatus' | translate }}</dt>
                <dd>
                  <span class="badge" [ngClass]="operation()!.status === 'PENDING_CORRECTION' ? 'bg-warning text-dark' : 'bg-info'">
                    {{ operation()!.status | statusLabel }}
                  </span>
                </dd>
              </div>
              <div class="col-md-8">
                <p class="text-muted mb-2">{{ getReviewDescription() }}</p>
                @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                  <div class="d-flex gap-2 flex-wrap">
                    @switch (operation()!.status) {
                      @case ('IN_REVIEW') {
                        <button class="btn btn-sm btn-primary" (click)="changeToStatus('PRELIQUIDATION_REVIEW')">
                          <i class="bi bi-arrow-right-circle me-1"></i>{{ 'review.advanceToPreliq' | translate }}
                        </button>
                        <button class="btn btn-sm btn-warning" (click)="changeToStatus('PENDING_CORRECTION')">
                          <i class="bi bi-arrow-return-left me-1"></i>{{ 'review.sendBackForCorrection' | translate }}
                        </button>
                      }
                      @case ('PENDING_CORRECTION') {
                        <div class="alert alert-warning py-2 px-3 mb-0 flex-grow-1">
                          <small><i class="bi bi-hourglass-split me-1"></i>{{ 'review.pendingCorrection' | translate }}</small>
                        </div>
                        <button class="btn btn-sm btn-info" (click)="changeToStatus('IN_REVIEW')">
                          <i class="bi bi-arrow-repeat me-1"></i>{{ 'review.returnToReview' | translate }}
                        </button>
                      }
                      @case ('PRELIQUIDATION_REVIEW') {
                        @if (declarations().length > 0) {
                          <button class="btn btn-sm btn-success" (click)="approveTechnical()" [disabled]="declarations()[0].technicalApprovedBy != null">{{ 'preliquidation.approveTechnical' | translate }}</button>
                          @if (authService.hasRole(['ADMIN'])) {
                            <button class="btn btn-sm btn-primary" (click)="approveFinal()" [disabled]="declarations()[0].technicalApprovedBy == null || declarations()[0].finalApprovedBy != null">{{ 'preliquidation.approveFinal' | translate }}</button>
                          }
                          <button class="btn btn-sm btn-danger" (click)="rejectDeclaration()" [disabled]="declarations()[0].rejectedBy != null">{{ 'preliquidation.reject' | translate }}</button>
                          <a [routerLink]="['/operations', operation()!.id, 'declarations', declarations()[0].id, 'preliquidation']" class="btn btn-sm btn-outline-info">{{ 'preliquidation.title' | translate }}</a>
                        } @else {
                          <div class="alert alert-info py-2 px-3 mb-0 flex-grow-1">
                            <small><i class="bi bi-info-circle me-1"></i>{{ 'review.noDeclarationsYet' | translate }}
                            <a href="javascript:void(0)" (click)="activeTab = 'declarations'" class="alert-link">{{ 'review.createDeclarationPrompt' | translate }}</a></small>
                          </div>
                        }
                        <button class="btn btn-sm btn-warning" (click)="changeToStatus('PENDING_CORRECTION')">
                          <i class="bi bi-arrow-return-left me-1"></i>{{ 'review.sendBackForCorrection' | translate }}
                        </button>
                      }
                      @case ('ANALYST_ASSIGNED') {
                        <button class="btn btn-sm btn-primary" (click)="changeToStatus('DECLARATION_IN_PROGRESS')">
                          <i class="bi bi-arrow-right-circle me-1"></i>{{ 'review.proceedToDeclaration' | translate }}
                        </button>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <ul ngbNav #nav="ngbNav" class="nav-tabs" [(activeId)]="activeTab">
        <li [ngbNavItem]="'info'">
          <button ngbNavLink>{{ 'TABS.INFO' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="card mt-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <dl>
                      <dt>{{ 'OPERATIONS.TRANSPORT_MODE' | translate }}</dt><dd>{{ operation()!.transportMode | statusLabel }}</dd>
                      @if (operation()!.cargoType) {
                        <dt>{{ 'OPERATIONS.CARGO_TYPE' | translate }}</dt><dd>{{ 'CARGO_TYPES.' + operation()!.cargoType | translate }}</dd>
                      }
                      <dt>{{ 'OPERATIONS.OPERATION_CATEGORY' | translate }}</dt><dd>{{ operation()!.operationCategory | statusLabel }}</dd>
                      <dt>{{ 'OPERATIONS.ASSIGNED_AGENT' | translate }}</dt><dd>{{ operation()!.assignedAgentName ?? ('OPERATIONS.NOT_ASSIGNED' | translate) }}</dd>
                      @if (operation()!.blNumber) {
                        <dt>{{ 'OPERATIONS.BL_NUMBER' | translate }}</dt><dd>{{ operation()!.blNumber }}</dd>
                      }
                      @if (operation()!.blType) {
                        <dt>{{ 'OPERATIONS.BL_TYPE' | translate }}</dt><dd>{{ 'BL_TYPES.' + operation()!.blType | translate }}</dd>
                      }
                      @if (operation()!.childBlNumber) {
                        <dt>{{ 'OPERATIONS.CHILD_BL_NUMBER' | translate }}</dt><dd>{{ operation()!.childBlNumber }}</dd>
                      }
                      @if (operation()!.containerNumber) {
                        <dt>{{ 'OPERATIONS.CONTAINER_NUMBER' | translate }}</dt><dd>{{ operation()!.containerNumber }}</dd>
                      }
                      @if (operation()!.incoterm) {
                        <dt>{{ 'OPERATIONS.INCOTERM' | translate }}</dt><dd>{{ operation()!.incoterm }}</dd>
                      }
                      @if (operation()!.inspectionType) {
                        <dt>{{ 'OPERATIONS.INSPECTION_TYPE' | translate }}</dt><dd>{{ 'INSPECTION.TYPE_' + operation()!.inspectionType | translate }}</dd>
                      }
                    </dl>
                  </div>
                  <div class="col-md-6">
                    <dl>
                      <dt>{{ 'OPERATIONS.CREATED' | translate }}</dt><dd>{{ operation()!.createdAt | date:'medium' }}</dd>
                      <dt>{{ 'OPERATIONS.LAST_UPDATED' | translate }}</dt><dd>{{ operation()!.updatedAt | date:'medium' }}</dd>
                      @if (operation()!.estimatedArrival) {
                        <dt>{{ 'OPERATIONS.ESTIMATED_ARRIVAL' | translate }}</dt><dd>{{ operation()!.estimatedArrival | date:'medium' }}</dd>
                      }
                      @if (operation()!.deadline) {
                        <dt>{{ 'OPERATIONS.DEADLINE' | translate }}</dt><dd>{{ operation()!.deadline | date:'medium' }}</dd>
                      }
                      <dt>{{ 'OPERATIONS.BL_AVAILABILITY' | translate }}</dt>
                      <dd class="d-flex align-items-center gap-2">
                        <span class="badge" [ngClass]="operation()!.blAvailability === 'ORIGINAL' ? 'bg-success' : operation()!.blAvailability === 'ENDORSED' ? 'bg-info' : 'bg-warning text-dark'">
                          {{ 'BL_AVAILABILITY.' + operation()!.blAvailability | translate }}
                        </span>
                        @if (authService.hasRole(['ADMIN', 'AGENT']) && operation()!.status !== 'CLOSED' && operation()!.status !== 'CANCELLED') {
                          <select class="form-select form-select-sm d-inline-block w-auto"
                                  [value]="operation()!.blAvailability"
                                  (change)="updateBlAvailability($event)">
                            <option value="ORIGINAL">{{ 'BL_AVAILABILITY.ORIGINAL' | translate }}</option>
                            <option value="ENDORSED">{{ 'BL_AVAILABILITY.ENDORSED' | translate }}</option>
                            <option value="NOT_AVAILABLE">{{ 'BL_AVAILABILITY.NOT_AVAILABLE' | translate }}</option>
                          </select>
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
                @if (operation()!.notes) { <p class="mt-2"><strong>{{ 'OPERATIONS.NOTES' | translate }}:</strong> {{ operation()!.notes }}</p> }
              </div>
            </div>
          </ng-template>
        </li>
        @if (!authService.hasRole(['CARRIER'])) {
          <li [ngbNavItem]="'documents'">
            <button ngbNavLink>{{ 'TABS.DOCUMENTS' | translate }}</button>
            <ng-template ngbNavContent>
              @if (completeness()) {
                <div class="card mt-3">
                  <div class="card-body">
                    <app-completeness-indicator [percentage]="completeness()!.percentage" [missing]="completeness()!.missingDocuments" [color]="completeness()!.color" />
                  </div>
                </div>
              }
              <div class="card mt-3">
                <div class="card-body">
                  <h6>{{ 'DOCUMENTS.TEMPLATES_SECTION' | translate }}</h6>
                  <div class="d-flex gap-2">
                    <a href="assets/templates/commercial_invoice_template.csv" download class="btn btn-sm btn-outline-secondary">
                      <i class="bi bi-download me-1"></i>{{ 'DOCUMENTS.INVOICE_TEMPLATE' | translate }}
                    </a>
                    <a href="assets/templates/packing_list_template.csv" download class="btn btn-sm btn-outline-secondary">
                      <i class="bi bi-download me-1"></i>{{ 'DOCUMENTS.PACKING_LIST_TEMPLATE' | translate }}
                    </a>
                  </div>
                </div>
              </div>
              <div class="mt-3"><app-document-list [operationId]="operation()!.id" [operationStatus]="operation()!.status" /></div>
            </ng-template>
          </li>
        }
        <li [ngbNavItem]="'comments'">
          <button ngbNavLink>{{ 'TABS.COMMENTS' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="mt-3"><app-operation-comments [operationId]="operation()!.id" /></div>
          </ng-template>
        </li>
        @if (authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING'])) {
          <li [ngbNavItem]="'declarations'">
            <button ngbNavLink>{{ 'TABS.DECLARATIONS' | translate }}</button>
            <ng-template ngbNavContent>
              <div class="mt-3">
                <app-declaration-list [operationId]="operation()!.id" [operationStatus]="operation()!.status" />
                <app-crossing-result [operationId]="operation()!.id" />
              </div>
            </ng-template>
          </li>
        }
        @if (isInspectionVisible()) {
          <li [ngbNavItem]="'inspection'">
            <button ngbNavLink>{{ 'TABS.INSPECTION' | translate }}</button>
            <ng-template ngbNavContent>
              <div class="mt-3">
                <app-inspection-panel [operationId]="operation()!.id" [operation]="operation()" (changed)="reload()" />
              </div>
            </ng-template>
          </li>
        }
        @if (isValuationVisible()) {
          <li [ngbNavItem]="'valuation'">
            <button ngbNavLink>{{ 'TABS.VALUATION' | translate }}</button>
            <ng-template ngbNavContent>
              <div class="mt-3">
                <app-valuation-panel [operationId]="operation()!.id" [operation]="operation()" (changed)="reload()" />
              </div>
            </ng-template>
          </li>
        }
        <li [ngbNavItem]="'history'">
          <button ngbNavLink>{{ 'TABS.HISTORY' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="mt-3">
              <app-operation-status [operationId]="operation()!.id" [currentStatus]="operation()!.status" [completeness]="completeness()" [documents]="documents()" (statusChanged)="reload()" />
            </div>
          </ng-template>
        </li>
        @if (authService.hasRole(['ADMIN'])) {
        <li [ngbNavItem]="'audit'">
          <button ngbNavLink>{{ 'TABS.AUDIT' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="card mt-3">
              <div class="card-body p-0 table-responsive">
                <table class="table table-sm mb-0">
                  <thead class="table-light"><tr><th>{{ 'AUDIT.ACTION' | translate }}</th><th>{{ 'AUDIT.USER' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.ENTITY' | translate }}</th><th class="d-none d-md-table-cell">{{ 'AUDIT.IP' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.DETAILS' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'AUDIT.CHANGES' | translate }}</th><th>{{ 'AUDIT.DATE' | translate }}</th></tr></thead>
                  <tbody>
                    @for (log of auditLogs(); track log.id) {
                      <tr>
                        <td><app-status-badge [status]="log.action" /></td>
                        <td>{{ log.username }}</td>
                        <td class="d-none d-sm-table-cell">
                          @if (log.entityName === 'Document' && log.entityId) {
                            <a [routerLink]="['/operations', operation()!.id, 'documents', log.entityId, 'versions']">{{ log.entityName }} #{{ log.entityId }}</a>
                          } @else {
                            {{ log.entityName }}
                          }
                        </td>
                        <td class="d-none d-md-table-cell"><small class="text-muted">{{ log.ipAddress ?? '-' }}</small></td>
                        <td class="d-none d-sm-table-cell"><small>{{ log.details }}</small></td>
                        <td class="d-none d-lg-table-cell">
                          @if (log.previousData || log.newData) {
                            <small>
                              @for (change of parseAuditChanges(log); track change.field) {
                                <div>
                                  <strong>{{ change.field }}:</strong>
                                  @if (change.oldValue !== null) {
                                    <span class="text-danger">{{ change.oldValue }}</span>
                                    <i class="bi bi-arrow-right mx-1"></i>
                                  }
                                  <span class="text-success">{{ change.newValue }}</span>
                                </div>
                              }
                            </small>
                          } @else {
                            <small class="text-muted">-</small>
                          }
                        </td>
                        <td>{{ log.createdAt | date:'medium' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </ng-template>
        </li>
        }
      </ul>
      <div [ngbNavOutlet]="nav"></div>
    }
  `
})
export class OperationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private operationService = inject(OperationService);
  private complianceService = inject(ComplianceService);
  private declarationService = inject(DeclarationService);
  private auditService = inject(AuditService);
  private documentService = inject(DocumentService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);

  operation = signal<Operation | null>(null);
  auditLogs = signal<AuditLog[]>([]);
  completeness = signal<CompletenessResponse | null>(null);
  documents = signal<Document[]>([]);
  declarations = signal<Declaration[]>([]);
  statusChangeErrors = signal<string[]>([]);
  activeTab = 'info';

  isInReviewStatus = computed(() => {
    const op = this.operation();
    return op !== null && REVIEW_STATUSES.includes(op.status);
  });

  isInspectionVisible = computed(() => {
    const op = this.operation();
    if (!op) return false;
    return INSPECTION_VISIBLE_STATUSES.includes(op.status) || op.inspectionType != null;
  });

  isValuationVisible = computed(() => {
    const op = this.operation();
    return op !== null && VALUATION_VISIBLE_STATUSES.includes(op.status);
  });

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) { this.activeTab = tab; }
    this.reload();
  }

  reload(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.operationService.getById(id).subscribe(op => this.operation.set(op));
    this.operationService.getCompleteness(id).subscribe(c => this.completeness.set(c));
    this.auditService.getByOperation(id).subscribe(logs => this.auditLogs.set(logs));
    this.documentService.getByOperation(id).subscribe(docs => this.documents.set(docs));
    this.declarationService.getDeclarations(id).subscribe(decls => this.declarations.set(decls));
  }

  getReviewDescription(): string {
    const status = this.operation()?.status;
    switch (status) {
      case 'IN_REVIEW': return this.translate.instant('review.inReview');
      case 'PENDING_CORRECTION': return this.translate.instant('review.pendingCorrection');
      case 'PRELIQUIDATION_REVIEW': return this.translate.instant('review.preliquidationReview');
      case 'ANALYST_ASSIGNED': return this.translate.instant('review.analystAssigned');
      default: return '';
    }
  }

  approveTechnical(): void {
    const decl = this.declarations()[0];
    if (!decl) return;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.declarationService.approveTechnical(this.operation()!.id, decl.id, comment || undefined).subscribe(() => this.reload());
  }

  approveFinal(): void {
    const decl = this.declarations()[0];
    if (!decl) return;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.declarationService.approveFinal(this.operation()!.id, decl.id, comment || undefined).subscribe(() => this.reload());
  }

  rejectDeclaration(): void {
    const decl = this.declarations()[0];
    if (!decl) return;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.declarationService.reject(this.operation()!.id, decl.id, comment || undefined).subscribe(() => this.reload());
  }

  updateBlAvailability(event: Event): void {
    const op = this.operation();
    if (!op) return;
    const value = (event.target as HTMLSelectElement).value;
    this.operationService.updateBlAvailability(op.id, value).subscribe(() => this.reload());
  }

  parseAuditChanges(log: AuditLog): Array<{field: string; oldValue: string | null; newValue: string | null}> {
    const changes: Array<{field: string; oldValue: string | null; newValue: string | null}> = [];
    try {
      const prev = log.previousData ? JSON.parse(log.previousData) : {};
      const next = log.newData ? JSON.parse(log.newData) : {};
      const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
      for (const key of allKeys) {
        changes.push({
          field: key,
          oldValue: prev[key] !== undefined ? String(prev[key]) : null,
          newValue: next[key] !== undefined ? String(next[key]) : null
        });
      }
    } catch {
      // If parsing fails, return empty
    }
    return changes;
  }

  changeToStatus(newStatus: string): void {

    this.statusChangeErrors.set([]);
    this.complianceService.validate(this.operation()!.id, newStatus).subscribe({
      next: (result) => {
        if (!result.passed) {
          this.statusChangeErrors.set(result.errors.map(e => {
            const key = 'COMPLIANCE.' + e.ruleCode;
            const translated = this.translate.instant(key);
            return translated !== key ? translated : e.message;
          }));
          return;
        }
        this.executeProgressStatusChange(newStatus);
      },
      error: () => this.executeProgressStatusChange(newStatus)
    });
  }

  onProgressStepClick(newStatus: string): void {
    const msg = this.translate.instant('COMMON.ARE_YOU_SURE');
    if (!confirm(msg)) return;

    this.statusChangeErrors.set([]);
    this.complianceService.validate(this.operation()!.id, newStatus).subscribe({
      next: (result) => {
        if (!result.passed) {
          this.statusChangeErrors.set(result.errors.map(e => {
            const key = 'COMPLIANCE.' + e.ruleCode;
            const translated = this.translate.instant(key);
            return translated !== key ? translated : e.message;
          }));
          return;
        }
        this.executeProgressStatusChange(newStatus);
      },
      error: () => this.executeProgressStatusChange(newStatus)
    });
  }

  private executeProgressStatusChange(newStatus: string): void {

    this.operationService.changeStatus(this.operation()!.id, {
      newStatus: newStatus as OperationStatus
    }).subscribe({
      next: () => this.reload(),
      error: (err) => {
        const msg = err.error?.error ?? '';
        const match = msg.match(/Invalid status transition from (\w+) to (\w+)/);
        if (match) {
          if(match[1] === match[2] ) {
            this.reload()
          }else {
            const from = this.translate.instant('STATUS.' + match[1]);
            const to = this.translate.instant('STATUS.' + match[2]);
            this.statusChangeErrors.set([this.translate.instant('STATUS_CHANGE.INVALID_TRANSITION', {from, to})]);
          }
        } else {
          this.statusChangeErrors.set([msg || this.translate.instant('STATUS_CHANGE.FAILED')]);
        }
      }
    });
  }

  confirmDelete(): void {
    const msg = this.translate.instant('COMMON.ARE_YOU_SURE');
    if (confirm(msg)) {
      this.operationService.delete(this.operation()!.id).subscribe(() => {
        this.router.navigate(['/operations']);
      });
    }
  }
}
