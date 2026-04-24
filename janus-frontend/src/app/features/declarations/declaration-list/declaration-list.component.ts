import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { Declaration, DeclarationType } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-declaration-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent, LoadingIndicatorComponent],
  styles: [`:host { display: block; background: var(--bs-body-bg); border-radius: 8px; padding: 1rem; }`],
  template: `
    @if (loading()) {
      <app-loading-indicator size="sm" />
    } @else {
    @if (authService.hasRole(['ADMIN', 'AGENT']) && !isTerminalStatus()) {
      <div class="mb-3 d-flex flex-wrap gap-2">
        @if (!canRegisterFinal() && !hasPreliminary()) {
          <button class="btn btn-sm btn-outline-primary" (click)="openForm('PRELIMINARY')">{{ 'DECLARATIONS.REGISTER_PRELIMINARY' | translate }}</button>
        }
        @if (canRegisterFinal() && !hasFinal()) {
          <button class="btn btn-sm btn-outline-primary" (click)="openForm('FINAL')">{{ 'DECLARATIONS.REGISTER_FINAL' | translate }}</button>
        }
      </div>
    }
    @if (declarations().length > 0) {
      <div class="table-responsive">
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>{{ 'DECLARATIONS.TYPE' | translate }}</th>
              <th>{{ 'DECLARATIONS.DECLARATION_NUMBER' | translate }}</th>
              <th class="d-none d-sm-table-cell">{{ 'DECLARATIONS.FOB_VALUE' | translate }}</th>
              <th class="d-none d-sm-table-cell">{{ 'DECLARATIONS.CIF_VALUE' | translate }}</th>
              <th>{{ 'DECLARATIONS.TOTAL_TAXES' | translate }}</th>
              <th class="d-none d-sm-table-cell">{{ 'DECLARATIONS.SUBMITTED_AT' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (decl of declarations(); track decl.id) {
              <tr>
                <td><app-status-badge [status]="decl.declarationType" /></td>
                <td>{{ decl.declarationNumber }}</td>
                <td class="d-none d-sm-table-cell">{{ decl.fobValue | number:'1.2-2' }}</td>
                <td class="d-none d-sm-table-cell">{{ decl.cifValue | number:'1.2-2' }}</td>
                <td>{{ decl.totalTaxes | number:'1.2-2' }}</td>
                <td class="d-none d-sm-table-cell">{{ decl.createdAt | date:'shortDate' }}</td>
                <td>
                  <div class="d-flex gap-1 flex-wrap">
                    <a [routerLink]="['/operations', operationId(), 'declarations', decl.id]" class="btn btn-sm btn-outline-secondary">{{ (canEditDeclaration(decl) ? 'ACTIONS.EDIT' : 'ACTIONS.VIEW') | translate }}</a>
                    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                      @if (!decl.declarationNumber) {
                        <button class="btn btn-sm btn-outline-info" (click)="registerDua(decl)">{{ 'DECLARATIONS.REGISTER_DUA' | translate }}</button>
                      }
                      @if (decl.declarationNumber && !decl.submittedAt) {
                        <button class="btn btn-sm btn-outline-success" (click)="submitToDga(decl)">{{ 'DECLARATIONS.SUBMIT_TO_DGA' | translate }}</button>
                      }
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="text-muted">{{ 'DECLARATIONS.NO_DECLARATIONS' | translate }}</p>
    }
    }
  `
})
export class DeclarationListComponent implements OnInit {
  operationId = input.required<number>();
  operationStatus = input<string>('');

  private declarationService = inject(DeclarationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);
  declarations = signal<Declaration[]>([]);
  loading = signal(true);

  private static readonly FINAL_ALLOWED_STATUSES = [
    'VALUATION_REVIEW', 'SUBMITTED_TO_CUSTOMS'
  ];

  private static readonly PRELIMINARY_EDITABLE_STATUSES = [
    'DRAFT', 'DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PENDING_CORRECTION',
    'PRELIQUIDATION_REVIEW', 'ANALYST_ASSIGNED', 'DECLARATION_IN_PROGRESS'
  ];

  private static readonly FINAL_EDITABLE_STATUSES = [
    'DRAFT', 'DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PENDING_CORRECTION',
    'PRELIQUIDATION_REVIEW', 'ANALYST_ASSIGNED', 'DECLARATION_IN_PROGRESS',
    'SUBMITTED_TO_CUSTOMS', 'VALUATION_REVIEW'
  ];

  canRegisterFinal(): boolean {
    return DeclarationListComponent.FINAL_ALLOWED_STATUSES.includes(this.operationStatus());
  }

  hasPreliminary(): boolean {
    return this.declarations().some(d => d.declarationType === DeclarationType.PRELIMINARY);
  }

  hasFinal(): boolean {
    return this.declarations().some(d => d.declarationType === DeclarationType.FINAL);
  }

  isTerminalStatus(): boolean {
    return ['CLOSED', 'CANCELLED'].includes(this.operationStatus());
  }

  canEditDeclaration(decl: Declaration): boolean {
    const editableStatuses = decl.declarationType === DeclarationType.FINAL
      ? DeclarationListComponent.FINAL_EDITABLE_STATUSES
      : DeclarationListComponent.PRELIMINARY_EDITABLE_STATUSES;
    return editableStatuses.includes(this.operationStatus());
  }

  ngOnInit(): void { this.loadDeclarations(); }

  loadDeclarations(): void {
    this.declarationService.getDeclarations(this.operationId()).subscribe(d => {
      this.declarations.set(d);
      this.loading.set(false);
    });
  }

  openForm(type: string): void {
    this.router.navigate(['/operations', this.operationId(), 'declarations', 'new'], { queryParams: { type } });
  }

  registerDua(decl: Declaration): void {
    const duaNumber = prompt(this.translate.instant('DECLARATIONS.REGISTER_DUA'));
    if (!duaNumber) return;
    this.declarationService.registerDua(this.operationId(), decl.id, duaNumber).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('DECLARATIONS.DUA_REGISTERED'));
        this.loadDeclarations();
      },
      error: (err) => {
        const errorCode = err.error?.errorCode;
        const message = errorCode
          ? this.translate.instant('ERRORS.' + errorCode)
          : (err.error?.error || this.translate.instant('ERRORS.GENERIC_ERROR'));
        this.toastService.error(message);
      }
    });
  }

  submitToDga(decl: Declaration): void {
    const msg = this.translate.instant('DECLARATIONS.DGA_SUBMISSION_CONFIRM');
    if (!confirm(msg)) return;
    this.declarationService.submitToDga(this.operationId(), decl.id).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('DECLARATIONS.DGA_SUBMITTED'));
        this.loadDeclarations();
      },
      error: (err) => {
        const errorCode = err.error?.errorCode;
        const message = errorCode
          ? this.translate.instant('ERRORS.' + errorCode)
          : (err.error?.error || this.translate.instant('ERRORS.GENERIC_ERROR'));
        this.toastService.error(message);
      }
    });
  }
}
