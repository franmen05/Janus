import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Clients</h2>
      @if (authService.hasRole(['ADMIN'])) {
        <a routerLink="/clients/new" class="btn btn-primary">New Client</a>
      }
    </div>
    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>Name</th><th>Tax ID</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (client of clients(); track client.id) {
              <tr>
                <td class="fw-bold">{{ client.name }}</td>
                <td>{{ client.taxId }}</td>
                <td>{{ client.email }}</td>
                <td>{{ client.phone ?? '-' }}</td>
                <td><span class="badge" [class]="client.active ? 'bg-success' : 'bg-secondary'">{{ client.active ? 'Active' : 'Inactive' }}</span></td>
                <td>
                  @if (authService.hasRole(['ADMIN'])) {
                    <a [routerLink]="['/clients', client.id, 'edit']" class="btn btn-sm btn-outline-primary">Edit</a>
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
