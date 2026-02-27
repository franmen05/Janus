import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { Declaration, DeclarationType } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DeclarationFormComponent } from '../declaration-form/declaration-form.component';

@Component({
  selector: 'app-declaration-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent],
  template: `
    @if (authService.hasRole(['ADMIN', 'AGENT']) && !isTerminalStatus()) {
      <div class="mb-3 d-flex gap-2">
        @if (!canRegisterFinal()) {
          <button class="btn btn-sm btn-outline-primary" (click)="openForm('PRELIMINARY')">{{ 'DECLARATIONS.REGISTER_PRELIMINARY' | translate }}</button>
        }
        @if (canRegisterFinal()) {
          <button class="btn btn-sm btn-outline-primary" (click)="openForm('FINAL')">{{ 'DECLARATIONS.REGISTER_FINAL' | translate }}</button>
        }
      </div>
    }
    @if (declarations().length > 0) {
      <div class="table-responsive">
        <table class="table table-sm table-hover">
          <thead class="table-light">
            <tr>
              <th>{{ 'DECLARATIONS.TYPE' | translate }}</th>
              <th>{{ 'DECLARATIONS.DECLARATION_NUMBER' | translate }}</th>
              <th>{{ 'DECLARATIONS.FOB_VALUE' | translate }}</th>
              <th>{{ 'DECLARATIONS.CIF_VALUE' | translate }}</th>
              <th>{{ 'DECLARATIONS.TOTAL_TAXES' | translate }}</th>
              <th>{{ 'DECLARATIONS.SUBMITTED_AT' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (decl of declarations(); track decl.id) {
              <tr>
                <td><app-status-badge [status]="decl.declarationType" /></td>
                <td>{{ decl.declarationNumber }}</td>
                <td>{{ decl.fobValue | number:'1.2-2' }}</td>
                <td>{{ decl.cifValue | number:'1.2-2' }}</td>
                <td>{{ decl.totalTaxes | number:'1.2-2' }}</td>
                <td>{{ decl.createdAt | date:'shortDate' }}</td>
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
  `
})
export class DeclarationListComponent implements OnInit {
  operationId = input.required<number>();
  operationStatus = input<string>('');

  private declarationService = inject(DeclarationService);
  private modal = inject(NgbModal);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);
  declarations = signal<Declaration[]>([]);

  private static readonly FINAL_ALLOWED_STATUSES = [
    'DECLARATION_IN_PROGRESS', 'SUBMITTED_TO_CUSTOMS', 'VALUATION_REVIEW',
    'PAYMENT_PREPARATION', 'IN_TRANSIT'
  ];

  private static readonly PRELIMINARY_EDITABLE_STATUSES = [
    'DRAFT', 'DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PENDING_CORRECTION'
  ];

  canRegisterFinal(): boolean {
    return DeclarationListComponent.FINAL_ALLOWED_STATUSES.includes(this.operationStatus());
  }

  isTerminalStatus(): boolean {
    return ['CLOSED', 'CANCELLED'].includes(this.operationStatus());
  }

  canEditDeclaration(decl: Declaration): boolean {
    if (decl.declarationType === DeclarationType.PRELIMINARY) {
      return DeclarationListComponent.PRELIMINARY_EDITABLE_STATUSES.includes(this.operationStatus());
    }
    return true;
  }

  ngOnInit(): void { this.loadDeclarations(); }

  loadDeclarations(): void {
    this.declarationService.getDeclarations(this.operationId()).subscribe(d => this.declarations.set(d));
  }

  openForm(type: string): void {
    const ref = this.modal.open(DeclarationFormComponent, { size: 'lg' });
    ref.componentInstance.operationId = this.operationId();
    ref.componentInstance.declarationType = type;
    ref.result.then(() => this.loadDeclarations(), () => {});
  }

  registerDua(decl: Declaration): void {
    const duaNumber = prompt(this.translate.instant('DECLARATIONS.DUA_NUMBER'));
    if (!duaNumber) return;
    this.declarationService.registerDua(this.operationId(), decl.id, duaNumber).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('DECLARATIONS.DUA_REGISTERED'));
        this.loadDeclarations();
      },
      error: (err) => this.toastService.error(err.error?.error || 'Error')
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
      error: (err) => this.toastService.error(err.error?.error || 'Error')
    });
  }
}
