import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document.service';
import { Document } from '../../../core/models/document.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent, FileSizePipe, StatusLabelPipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">{{ 'DOCUMENTS.TITLE' | translate }}</h5>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a [routerLink]="['/operations', operationId, 'documents', 'upload']" class="btn btn-sm btn-primary">{{ 'DOCUMENTS.UPLOAD' | translate }}</a>
      }
    </div>
    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>{{ 'DOCUMENTS.TYPE' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'DOCUMENTS.FILE_NAME' | translate }}</th><th>{{ 'DOCUMENTS.SIZE' | translate }}</th><th>{{ 'DOCUMENTS.UPLOADED' | translate }}</th><th>{{ 'COMMON.ACTIONS' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (doc of documents(); track doc.id) {
              <tr [class.text-muted]="!doc.active" [style.text-decoration]="!doc.active ? 'line-through' : 'none'">
                <td>{{ doc.documentType | statusLabel }}</td>
                <td>
                  <app-status-badge [status]="doc.status" />
                  @if (!doc.active) {
                    <span class="badge bg-danger ms-1">{{ 'DOCUMENTS.DELETED' | translate }}</span>
                  }
                </td>
                <td>{{ doc.latestVersionName ?? '-' }}</td>
                <td>{{ doc.latestVersionSize | fileSize }}</td>
                <td>{{ doc.createdAt | date:'medium' }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    @if (!authService.hasRole(['CARRIER'])) {
                      <button class="btn btn-outline-primary" (click)="download(doc)">{{ 'ACTIONS.DOWNLOAD' | translate }}</button>
                      <button class="btn btn-outline-info" (click)="printDoc(doc)">{{ 'ACTIONS.PRINT' | translate }}</button>
                      <a [routerLink]="['/operations', operationId, 'documents', doc.id, 'versions']" class="btn btn-outline-secondary">{{ 'ACTIONS.VERSIONS' | translate }}</a>
                    }
                    @if (authService.hasRole(['ADMIN', 'AGENT']) && doc.active && operationStatus !== 'CLOSED' && operationStatus !== 'CANCELLED') {
                      <button class="btn btn-outline-danger" (click)="deleteDoc(doc)">{{ 'ACTIONS.DELETE' | translate }}</button>
                    }
                  </div>
                </td>
              </tr>
            }
            @if (documents().length === 0) {
              <tr><td colspan="6" class="text-center text-muted py-3">{{ 'DOCUMENTS.NO_DOCUMENTS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  @Input() operationId!: number;
  @Input() operationStatus?: string;
  documents = signal<Document[]>([]);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    const includeDeleted = this.authService.hasRole(['ADMIN']);
    this.documentService.getByOperation(this.operationId, includeDeleted).subscribe(docs => this.documents.set(docs));
  }

  download(doc: Document): void {
    this.documentService.download(this.operationId, doc.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.latestVersionName ?? 'document'; a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  deleteDoc(doc: Document): void {
    if (confirm(this.translate.instant('DELETE_CONFIRM.DOCUMENT'))) {
      this.documentService.delete(this.operationId, doc.id).subscribe(() => this.loadDocuments());
    }
  }

  printDoc1(doc: Document): void {
    const fileName = (doc.latestVersionName ?? '').toLowerCase();
    const printableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const isPrintable = printableExtensions.some(ext => fileName.endsWith(ext));
    if (!isPrintable) {
      this.toastService.warning(this.translate.instant('DOCUMENTS.PRINT_NOT_SUPPORTED'));
      return;
    }
    this.documentService.download(this.operationId, doc.id).subscribe(blob => {
      var blobUrl = URL.createObjectURL(blob);
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        // setTimeout(() => {
        //   document.body.removeChild(iframe);
        //   URL.revokeObjectURL(blobUrl);
        // }, 11000);
      };
    });
  }

  printDoc(doc: Document): void {
    const fileName = (doc.latestVersionName ?? '').toLowerCase();
    const printableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const isPrintable = printableExtensions.some(ext => fileName.endsWith(ext));
    if (!isPrintable) {
      this.toastService.warning(this.translate.instant('DOCUMENTS.PRINT_NOT_SUPPORTED'));
      return;
    }
    this.documentService.download(this.operationId, doc.id).subscribe(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        this.toastService.warning(this.translate.instant('DOCUMENTS.POPUP_BLOCKED'));
        URL.revokeObjectURL(blobUrl);
        return;
      }
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          // printWindow.close();
          URL.revokeObjectURL(blobUrl);
        };
      };
    });
  }
}
