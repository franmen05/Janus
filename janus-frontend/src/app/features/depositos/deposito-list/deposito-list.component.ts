import { Component, inject, OnInit, signal, computed } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DepositoService } from '../../../core/services/deposito.service';
import { Deposito } from '../../../core/models/deposito.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-deposito-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'DEPOSITOS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
        <div class="d-flex gap-2">
          <a routerLink="/depositos/new" class="btn btn-primary">{{ 'DEPOSITOS.NEW' | translate }}</a>
        </div>
      }
    </div>
    @if (loading()) {
      <app-loading-indicator />
    } @else {
    <div class="card">
      <div class="card-header">
        <input type="text" class="form-control"
               [placeholder]="'DEPOSITOS.SEARCH' | translate"
               [ngModel]="searchTerm()"
               (ngModelChange)="searchTerm.set($event)">
      </div>
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'DEPOSITOS.CODE' | translate }}</th>
              <th>{{ 'DEPOSITOS.NAME' | translate }}</th>
              <th class="d-none d-md-table-cell">{{ 'DEPOSITOS.DESCRIPTION' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (dep of filteredDepositos(); track dep.id) {
              <tr>
                <td class="fw-bold">{{ dep.code }}</td>
                <td>{{ dep.name }}</td>
                <td class="d-none d-md-table-cell text-truncate" style="max-width: 300px;" [title]="dep.description ?? ''">{{ dep.description ?? '-' }}</td>
                <td>
                  @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
                    <a [routerLink]="['/depositos', dep.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                  }
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="4" class="text-center text-muted py-3">{{ 'DEPOSITOS.NO_DEPOSITOS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    }
  `
})
export class DepositoListComponent implements OnInit {
  private depositoService = inject(DepositoService);
  authService = inject(AuthService);
  loading = signal(true);
  depositos = signal<Deposito[]>([]);
  searchTerm = signal('');
  filteredDepositos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.depositos();
    return this.depositos().filter(d =>
      d.code.toLowerCase().includes(term) ||
      d.name.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadDepositos();
  }

  private loadDepositos(): void {
    this.depositoService.getAll().subscribe(depositos => {
      this.depositos.set(depositos);
      this.loading.set(false);
    });
  }
}
