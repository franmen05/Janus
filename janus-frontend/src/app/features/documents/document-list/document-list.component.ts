import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentService } from '../../../core/services/document.service';
import { Document } from '../../../core/models/document.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, FileSizePipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Documents</h5>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a [routerLink]="['/operations', operationId, 'documents', 'upload']" class="btn btn-sm btn-primary">Upload Document</a>
      }
    </div>
    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>Type</th><th>Status</th><th>File Name</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (doc of documents(); track doc.id) {
              <tr>
                <td>{{ doc.documentType }}</td>
                <td><app-status-badge [status]="doc.status" /></td>
                <td>{{ doc.latestVersionName ?? '-' }}</td>
                <td>{{ doc.latestVersionSize | fileSize }}</td>
                <td>{{ doc.createdAt | date:'medium' }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" (click)="download(doc)">Download</button>
                    <a [routerLink]="['/operations', operationId, 'documents', doc.id, 'versions']" class="btn btn-outline-secondary">Versions</a>
                    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                      <button class="btn btn-outline-danger" (click)="deleteDoc(doc)">Delete</button>
                    }
                  </div>
                </td>
              </tr>
            }
            @if (documents().length === 0) {
              <tr><td colspan="6" class="text-center text-muted py-3">No documents uploaded yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  authService = inject(AuthService);

  @Input() operationId!: number;
  documents = signal<Document[]>([]);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.documentService.getByOperation(this.operationId).subscribe(docs => this.documents.set(docs));
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
    if (confirm('Are you sure you want to delete this document?')) {
      this.documentService.delete(this.operationId, doc.id).subscribe(() => this.loadDocuments());
    }
  }
}
