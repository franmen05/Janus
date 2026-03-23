import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PortService } from '../../../core/services/port.service';
import { Port } from '../../../core/models/port.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadPortsModalComponent } from '../load-ports-modal/load-ports-modal.component';

@Component({
  selector: 'app-port-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'PORTS.TITLE' | translate }}</h2>
      @if (authService.hasRole(['ADMIN'])) {
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" (click)="openLoadPortsModal()">{{ 'PORTS.LOAD_PORTS' | translate }}</button>
          <a routerLink="/ports/new" class="btn btn-primary">{{ 'PORTS.NEW' | translate }}</a>
        </div>
      }
    </div>
    <div class="card">
      <div class="card-header">
        <input type="text" class="form-control"
               [placeholder]="'PORTS.SEARCH' | translate"
               [ngModel]="searchTerm()"
               (ngModelChange)="searchTerm.set($event)">
      </div>
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'PORTS.CODE' | translate }}</th>
              <th>{{ 'PORTS.NAME' | translate }}</th>
              <th>{{ 'PORTS.COUNTRY' | translate }}</th>
              <th class="d-none d-md-table-cell">{{ 'PORTS.DESCRIPTION' | translate }}</th>
              <th class="d-none d-md-table-cell">{{ 'PORTS.ADDRESS' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (port of filteredPorts(); track port.id) {
              <tr>
                <td class="fw-bold">{{ port.code }}</td>
                <td>{{ port.name }}</td>
                <td>{{ port.country ?? '-' }}</td>
                <td class="d-none d-md-table-cell">{{ port.description ?? '-' }}</td>
                <td class="d-none d-md-table-cell">{{ port.address ?? '-' }}</td>
                <td>
                  @if (authService.hasRole(['ADMIN'])) {
                    <a [routerLink]="['/ports', port.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                  }
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="text-center text-muted py-3">{{ 'PORTS.NO_PORTS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PortListComponent implements OnInit {
  private portService = inject(PortService);
  private modalService = inject(NgbModal);
  authService = inject(AuthService);
  ports = signal<Port[]>([]);
  searchTerm = signal('');
  filteredPorts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.ports();
    return this.ports().filter(p =>
      p.code.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      (p.address?.toLowerCase().includes(term) ?? false) ||
      (p.country?.toLowerCase().includes(term) ?? false)
    );
  });

  ngOnInit(): void {
    this.loadPorts();
  }

  private loadPorts(): void {
    this.portService.getAll().subscribe(ports => this.ports.set(ports));
  }

  openLoadPortsModal(): void {
    const ref = this.modalService.open(LoadPortsModalComponent, { size: 'lg' });
    ref.result.then(
      () => this.loadPorts(),
      () => {}
    );
  }
}
