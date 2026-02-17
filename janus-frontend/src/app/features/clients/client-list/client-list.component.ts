import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ 'CLIENTS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN'])) {
        <a routerLink="/clients/new" class="btn btn-primary">{{ 'CLIENTS.NEW' | translate }}</a>
      }
    </div>
    <div class="card">
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>{{ 'CLIENTS.NAME' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'CLIENTS.TAX_ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'CLIENTS.EMAIL' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'CLIENTS.PHONE' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'COMMON.ACTIONS' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (client of clients(); track client.id) {
              <tr>
                <td class="fw-bold">{{ client.name }}</td>
                <td class="d-none d-sm-table-cell">{{ client.taxId }}</td>
                <td class="d-none d-md-table-cell">{{ client.email }}</td>
                <td class="d-none d-lg-table-cell">{{ client.phone ?? '-' }}</td>
                <td><span class="badge" [class]="client.active ? 'bg-success' : 'bg-secondary'">{{ (client.active ? 'CLIENTS.ACTIVE' : 'CLIENTS.INACTIVE') | translate }}</span></td>
                <td>
                  @if (authService.hasRole(['ADMIN'])) {
                    <a [routerLink]="['/clients', client.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
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

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => this.clients.set(clients));
  }
}
