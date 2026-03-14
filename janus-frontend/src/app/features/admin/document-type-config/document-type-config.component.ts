import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentTypeConfig } from '../../../core/models/document.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-document-type-config',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ 'DOCUMENT_TYPES_CONFIG.TITLE' | translate }}</h2>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
        </div>
      </div>
    } @else {
      <div class="card">
        <div class="card-body p-0 table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>{{ 'DOCUMENT_TYPES_CONFIG.TYPE' | translate }}</th>
                <th>{{ 'DOCUMENT_TYPES_CONFIG.CODE' | translate }}</th>
                <th>{{ 'DOCUMENT_TYPES_CONFIG.ALLOW_MULTIPLE' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (config of configs(); track config.code) {
                <tr>
                  <td>{{ 'DOCUMENT_TYPES.' + config.code | translate }}</td>
                  <td><code>{{ config.code }}</code></td>
                  <td>
                    <div class="form-check form-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        [checked]="config.allowMultiple"
                        (change)="toggleAllowMultiple(config)"
                        [id]="'switch-' + config.code" />
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="text-center text-muted py-4">{{ 'COMMON.NO_DATA' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class DocumentTypeConfigComponent implements OnInit {
  private documentService = inject(DocumentService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  configs = signal<DocumentTypeConfig[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadConfigs();
  }

  toggleAllowMultiple(config: DocumentTypeConfig): void {
    const newValue = !config.allowMultiple;
    this.documentService.updateDocumentType(config.code, newValue).subscribe({
      next: () => {
        this.configs.update(list =>
          list.map(c => c.code === config.code ? { ...c, allowMultiple: newValue } : c)
        );
        this.toastService.success(this.translate.instant('DOCUMENT_TYPES_CONFIG.UPDATED'));
      },
      error: () => {
        this.toastService.error(this.translate.instant('TOAST.GENERIC_ERROR'));
      }
    });
  }

  private loadConfigs(): void {
    this.loading.set(true);
    this.documentService.getDocumentTypes().subscribe({
      next: configs => {
        this.configs.set(configs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error(this.translate.instant('TOAST.GENERIC_ERROR'));
      }
    });
  }
}
