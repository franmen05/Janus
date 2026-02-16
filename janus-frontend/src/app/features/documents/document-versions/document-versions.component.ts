import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentVersion } from '../../../core/models/document.model';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-document-versions',
  standalone: true,
  imports: [CommonModule, TranslateModule, FileSizePipe],
  template: `
    <h2 class="mb-4">{{ 'DOCUMENTS.VERSIONS_TITLE' | translate }}</h2>
    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>{{ 'DOCUMENTS.VERSION' | translate }}</th><th>{{ 'DOCUMENTS.FILE_NAME' | translate }}</th><th>{{ 'DOCUMENTS.SIZE' | translate }}</th><th>{{ 'DOCUMENTS.UPLOADED_BY' | translate }}</th><th>{{ 'DOCUMENTS.DATE' | translate }}</th><th>{{ 'AUDIT.ACTION' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (v of versions(); track v.id) {
              <tr>
                <td><span class="badge bg-secondary">v{{ v.versionNumber }}</span></td>
                <td>{{ v.originalName }}</td>
                <td>{{ v.fileSize | fileSize }}</td>
                <td>{{ v.uploadedByUsername }}</td>
                <td>{{ v.uploadedAt | date:'medium' }}</td>
                <td><button class="btn btn-sm btn-outline-primary" (click)="downloadVersion(v)">{{ 'ACTIONS.DOWNLOAD' | translate }}</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DocumentVersionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private documentService = inject(DocumentService);
  versions = signal<DocumentVersion[]>([]);

  ngOnInit(): void {
    const operationId = +this.route.snapshot.paramMap.get('operationId')!;
    const documentId = +this.route.snapshot.paramMap.get('documentId')!;
    this.documentService.getVersions(operationId, documentId).subscribe(v => this.versions.set(v));
  }

  downloadVersion(v: DocumentVersion): void {
    const operationId = +this.route.snapshot.paramMap.get('operationId')!;
    const documentId = +this.route.snapshot.paramMap.get('documentId')!;
    this.documentService.downloadVersion(operationId, documentId, v.versionNumber).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = v.originalName; a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
