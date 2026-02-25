import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ 'CLIENTS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN'])) {
        <a routerLink="/clients/new" class="btn btn-primary">{{ 'CLIENTS.NEW' | translate }}</a>
      }
    </div>
    <div class="card">
      <div class="card-header">
        <input type="text" class="form-control"
               [placeholder]="'CLIENTS.SEARCH' | translate"
               [ngModel]="searchTerm()"
               (ngModelChange)="searchTerm.set($event)">
      </div>
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>{{ 'CLIENTS.NAME' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'CLIENTS.TAX_ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'CLIENTS.EMAIL' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'CLIENTS.PHONE' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'COMMON.ACTIONS' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (client of filteredClients(); track client.id) {
              <tr>
                <td class="fw-bold">{{ client.name }}</td>
                <td class="d-none d-sm-table-cell">{{ client.taxId }}</td>
                <td class="d-none d-md-table-cell">{{ client.email }}</td>
                <td class="d-none d-lg-table-cell">{{ client.phone ?? '-' }}</td>
                <td><span class="badge" [class]="client.active ? 'bg-success' : 'bg-secondary'">{{ (client.active ? 'CLIENTS.ACTIVE' : 'CLIENTS.INACTIVE') | translate }}</span></td>
                <td>
                  @if (authService.hasRole(['ADMIN'])) {
                    <a [routerLink]="['/clients', client.id, 'edit']" class="btn btn-sm btn-outline-primary me-1">{{ 'ACTIONS.EDIT' | translate }}</a>
                  }
                  @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                    <a [routerLink]="['/operations/new']" [queryParams]="{ clientId: client.id }"
                       class="btn btn-sm btn-outline-success">
                      {{ 'CLIENTS.OPERATIONS' | translate }}
                    </a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);
  authService = inject(AuthService);
  clients = signal<Client[]>([]);
  searchTerm = signal('');
  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.taxId.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => this.clients.set(clients));
  }
}
