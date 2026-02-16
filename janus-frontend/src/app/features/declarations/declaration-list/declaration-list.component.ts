import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { Declaration } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DeclarationFormComponent } from '../declaration-form/declaration-form.component';

@Component({
  selector: 'app-declaration-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent],
  template: `
    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
      <div class="mb-3 d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" (click)="openForm('PRELIMINARY')">{{ 'DECLARATIONS.REGISTER_PRELIMINARY' | translate }}</button>
        <button class="btn btn-sm btn-outline-primary" (click)="openForm('FINAL')">{{ 'DECLARATIONS.REGISTER_FINAL' | translate }}</button>
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
                <td><a [routerLink]="['/operations', operationId(), 'declarations', decl.id]" class="btn btn-sm btn-outline-secondary">{{ 'ACTIONS.EDIT' | translate }}</a></td>
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

  private declarationService = inject(DeclarationService);
  private modal = inject(NgbModal);
  authService = inject(AuthService);
  declarations = signal<Declaration[]>([]);

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
}
