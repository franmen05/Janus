import { Component, input, output, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InspectionService } from '../../../core/services/inspection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { Operation, InspectionType } from '../../../core/models/operation.model';
import { InspectionPhoto, SetInspectionTypeRequest } from '../../../core/models/inspection.model';
import { getErrorMessage } from '../../../core/utils/error-message.util';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ChargesTableComponent } from '../../../shared/components/charges-table/charges-table.component';

@Component({
  selector: 'app-inspection-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, FileUploadComponent, StatusBadgeComponent, ChargesTableComponent],
  template: `
    <!-- Charges section: visible when inspection type is set -->
    @if (operation()?.inspectionType) {
      <app-charges-table class="mb-3 d-block"
        [operationId]="operationId()"
        [operation]="operation()"
        [operationSummary]="operationSummary()"
        [clients]="clients()"
        (changed)="onChargesChanged()" />
    }

    <div class="card mt-3">
      <div class="card-header">
        <h6 class="mb-0">{{ 'INSPECTION.TYPE_LABEL' | translate }}</h6>
      </div>
      <div class="card-body">
        <!-- Type selector: only for ADMIN/AGENT in appropriate statuses -->
        @if (canSetType()) {
          <div class="mb-3">
            <div class="btn-group" role="group">
              @for (type of inspectionTypes; track type) {
                <button type="button" class="btn"
                        [class.btn-primary]="operation()?.inspectionType === type"
                        [class.btn-outline-primary]="operation()?.inspectionType !== type"
                        (click)="setType(type)">
                  {{ 'INSPECTION.TYPE_' + type | translate }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Current type badge -->
        @if (operation()?.inspectionType) {
          <div class="mb-3">
            <app-status-badge [status]="operation()!.inspectionType!" />
            @if (operation()!.inspectionType === 'EXPRESO') {
              <small class="text-muted ms-2">{{ 'INSPECTION.EXPRESO_NOTE' | translate }}</small>
            }
          </div>
        }

        <!-- Photo section: only for VISUAL/FISICA -->
        @if (operation()?.inspectionType === 'VISUAL' || operation()?.inspectionType === 'FISICA') {
          <hr>
          <h6>{{ 'INSPECTION.PHOTOS_TITLE' | translate }}</h6>

          <!-- Photo gallery -->
          @if (photos().length > 0) {
            <div class="row g-3 mb-3">
              @for (photo of photos(); track photo.id) {
                <div class="col-sm-6 col-md-4 col-lg-3">
                  <div class="card h-100">
                    <div class="card-body p-2">
                      <p class="fw-bold mb-1 text-truncate" [title]="photo.originalName">{{ photo.originalName }}</p>
                      <small class="text-muted d-block">{{ photo.createdAt | date:'short' }}</small>
                      <small class="text-muted d-block">{{ photo.uploadedBy }}</small>
                      @if (photo.caption) {
                        <small class="d-block mt-1">{{ photo.caption }}</small>
                      }
                    </div>
                    <div class="card-footer p-2">
                      <a [href]="getDownloadUrl(photo.id)" class="btn btn-sm btn-outline-secondary w-100" target="_blank">
                        <i class="bi bi-download me-1"></i>{{ 'ACTIONS.DOWNLOAD' | translate }}
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted">{{ 'INSPECTION.NO_PHOTOS' | translate }}</p>
          }

          <!-- Photo upload: only ADMIN/AGENT -->
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <div class="border rounded p-3 mt-3">
              <h6>{{ 'INSPECTION.UPLOAD_PHOTO' | translate }}</h6>
              <div class="mb-2">
                <label class="form-label">{{ 'INSPECTION.PHOTO_CAPTION' | translate }}</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="caption">
              </div>
              <app-file-upload (fileSelected)="onFileSelected($event)" />
              @if (selectedFile) {
                <button class="btn btn-sm btn-primary mt-2" (click)="uploadPhoto()" [disabled]="uploading()">
                  @if (uploading()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  {{ 'ACTIONS.UPLOAD' | translate }}
                </button>
              }
            </div>
          }
        }

      </div>
    </div>
  `
})
export class InspectionPanelComponent implements OnInit {
  operationId = input.required<number>();
  operation = input.required<Operation | null>();
  changed = output<void>();

  private inspectionService = inject(InspectionService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  private clientService = inject(ClientService);
  authService = inject(AuthService);

  photos = signal<InspectionPhoto[]>([]);
  uploading = signal(false);
  selectedFile: File | null = null;
  caption = '';

  clients = signal<Client[]>([]);

  operationSummary = computed(() => {
    const op = this.operation();
    if (!op) return null;
    return {
      pieces: op.pieces,
      grossWeight: op.grossWeight,
      volumetricWeight: op.volumetricWeight,
      volume: op.volume,
      declaredValue: op.declaredValue,
      clientName: op.clientName,
      blNumber: op.blNumber
    };
  });

  inspectionTypes = Object.values(InspectionType);

  ngOnInit(): void {
    this.loadPhotos();
    this.clientService.getAll().subscribe(c => this.clients.set(c));
  }

  canSetType(): boolean {
    const op = this.operation();
    if (!op) return false;
    if (!this.authService.hasRole(['ADMIN', 'AGENT'])) return false;
    return op.status === 'SUBMITTED_TO_CUSTOMS' || op.status === 'VALUATION_REVIEW' || op.status === 'PAYMENT_PREPARATION';
  }

  setType(type: InspectionType): void {
    const msg = this.translate.instant('INSPECTION.CONFIRM_TYPE');
    if (!confirm(msg)) return;

    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    const request: SetInspectionTypeRequest = {
      inspectionType: type,
      comment: comment || undefined
    };
    this.inspectionService.setInspectionType(this.operationId(), request).subscribe({
      next: () => {
        this.changed.emit();
        this.loadPhotos();
      },
      error: (err) => this.toastService.error(getErrorMessage(err, this.translate))
    });
  }

  loadPhotos(): void {
    const op = this.operation();
    if (op?.inspectionType === 'VISUAL' || op?.inspectionType === 'FISICA') {
      this.inspectionService.getPhotos(this.operationId()).subscribe(p => this.photos.set(p));
    }
  }

  onFileSelected(file: File): void {
    this.selectedFile = file;
  }

  uploadPhoto(): void {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.inspectionService.uploadPhoto(this.operationId(), this.selectedFile, this.caption || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.selectedFile = null;
        this.caption = '';
        this.loadPhotos();
        this.toastService.success(this.translate.instant('INSPECTION.UPLOAD_SUCCESS'));
      },
      error: (err) => {
        this.uploading.set(false);
        this.toastService.error(getErrorMessage(err, this.translate));
      }
    });
  }

  getDownloadUrl(photoId: number): string {
    return this.inspectionService.getPhotoDownloadUrl(this.operationId(), photoId);
  }

  onChargesChanged(): void {
    this.changed.emit();
  }
}
