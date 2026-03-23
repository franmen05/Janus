import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PortService } from '../../../core/services/port.service';
import { ToastService } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';
import { getErrorMessage } from '../../../core/utils/error-message.util';
import { CatalogCountry, CatalogPort } from '../../../core/models/port.model';

@Component({
  selector: 'app-load-ports-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ 'PORTS.LOAD_PORTS' | translate }}</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <!-- Country selector -->
      <div class="mb-3">
        <label class="form-label">{{ 'PORTS.SELECT_COUNTRY' | translate }}</label>
        <select class="form-select" [ngModel]="selectedCountry()" (ngModelChange)="onCountryChange($event)">
          <option value="">{{ 'PORTS.SELECT_COUNTRY_PLACEHOLDER' | translate }}</option>
          @for (country of countries(); track country.code) {
            <option [value]="country.code">{{ getCountryName(country) }} ({{ country.code }})</option>
          }
        </select>
      </div>

      <!-- Loading spinner -->
      @if (loading()) {
        <div class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
          </div>
        </div>
      }

      <!-- Ports table -->
      @if (!loading() && selectedCountry() && catalogPorts().length > 0) {
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-hover table-sm mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 40px;">
                  <input type="checkbox" class="form-check-input"
                         [checked]="allSelectableChecked()"
                         [indeterminate]="someSelectableChecked() && !allSelectableChecked()"
                         (change)="toggleSelectAll($event)">
                </th>
                <th>{{ 'PORTS.CODE' | translate }}</th>
                <th>{{ 'PORTS.NAME' | translate }}</th>
                <th>{{ 'COMMON.STATUS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (port of catalogPorts(); track port.code) {
                <tr [class.table-secondary]="port.alreadyLoaded">
                  <td>
                    <input type="checkbox" class="form-check-input"
                           [checked]="port.alreadyLoaded || selectedCodes().has(port.code)"
                           [disabled]="port.alreadyLoaded"
                           (change)="togglePort(port.code, $event)">
                  </td>
                  <td class="fw-bold">{{ port.code }}</td>
                  <td>{{ port.name }}</td>
                  <td>
                    @if (port.alreadyLoaded) {
                      <span class="badge bg-secondary">{{ 'PORTS.ALREADY_LOADED' | translate }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="mt-2 text-muted small">
          {{ selectedCodes().size }} {{ 'PORTS.SELECTED_FOR_IMPORT' | translate }}
        </div>
      }

      <!-- No ports message -->
      @if (!loading() && selectedCountry() && catalogPorts().length === 0) {
        <div class="text-center text-muted py-3">{{ 'PORTS.NO_PORTS' | translate }}</div>
      }
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">{{ 'ACTIONS.CANCEL' | translate }}</button>
      <button type="button" class="btn btn-primary"
              [disabled]="selectedCodes().size === 0 || importing()"
              (click)="importSelected()">
        @if (importing()) {
          <span class="spinner-border spinner-border-sm me-1" role="status"></span>
        }
        {{ 'PORTS.IMPORT_SELECTED' | translate }}
      </button>
    </div>
  `
})
export class LoadPortsModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private portService = inject(PortService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  countries = signal<CatalogCountry[]>([]);
  catalogPorts = signal<CatalogPort[]>([]);
  selectedCountry = signal('');
  selectedCodes = signal<Set<string>>(new Set());
  loading = signal(false);
  importing = signal(false);

  allSelectableChecked = computed(() => {
    const selectable = this.catalogPorts().filter(p => !p.alreadyLoaded);
    return selectable.length > 0 && selectable.every(p => this.selectedCodes().has(p.code));
  });

  someSelectableChecked = computed(() => {
    const selectable = this.catalogPorts().filter(p => !p.alreadyLoaded);
    return selectable.some(p => this.selectedCodes().has(p.code));
  });

  ngOnInit(): void {
    this.portService.getCatalogCountries().subscribe(countries => this.countries.set(countries));
  }

  getCountryName(country: CatalogCountry): string {
    return this.languageService.currentLanguage() === 'es' ? country.nameEs : country.name;
  }

  onCountryChange(code: string): void {
    this.selectedCountry.set(code);
    this.selectedCodes.set(new Set());
    this.catalogPorts.set([]);
    if (!code) return;

    this.loading.set(true);
    this.portService.getCatalogPorts(code).subscribe({
      next: ports => {
        this.catalogPorts.set(ports);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error(getErrorMessage(err, this.translate));
        this.loading.set(false);
      }
    });
  }

  togglePort(code: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedCodes.update(codes => {
      const next = new Set(codes);
      if (checked) {
        next.add(code);
      } else {
        next.delete(code);
      }
      return next;
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selectable = this.catalogPorts().filter(p => !p.alreadyLoaded);
    this.selectedCodes.update(() => {
      if (checked) {
        return new Set(selectable.map(p => p.code));
      }
      return new Set();
    });
  }

  importSelected(): void {
    const codes = this.selectedCodes();
    if (codes.size === 0) return;

    const ports = this.catalogPorts()
      .filter(p => codes.has(p.code))
      .map(p => ({ code: p.code, name: p.name }));

    this.importing.set(true);
    this.portService.bulkImport({ country: this.selectedCountry(), ports }).subscribe({
      next: result => {
        this.importing.set(false);
        this.toastService.success(
          this.translate.instant('PORTS.IMPORT_SUCCESS', { imported: result.imported, skipped: result.skipped })
        );
        this.activeModal.close(result);
      },
      error: (err) => {
        this.importing.set(false);
        this.toastService.error(getErrorMessage(err, this.translate));
      }
    });
  }
}
