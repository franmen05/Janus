import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DocumentVersionsComponent } from './document-versions.component';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentVersion } from '../../../core/models/document.model';

describe('DocumentVersionsComponent', () => {
  let component: DocumentVersionsComponent;
  let fixture: ComponentFixture<DocumentVersionsComponent>;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;

  const mockVersions: DocumentVersion[] = [
    {
      id: 1, versionNumber: 1, originalName: 'bl-v1.pdf', fileSize: 1024,
      mimeType: 'application/pdf', uploadedByUsername: 'admin', uploadedAt: '2024-01-01T10:00:00'
    },
    {
      id: 2, versionNumber: 2, originalName: 'bl-v2.pdf', fileSize: 2048,
      mimeType: 'application/pdf', uploadedByUsername: 'agent1', uploadedAt: '2024-01-02T10:00:00'
    }
  ];

  beforeEach(async () => {
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getVersions', 'downloadVersion']);
    documentServiceSpy.getVersions.and.returnValue(of(mockVersions));

    await TestBed.configureTestingModule({
      imports: [DocumentVersionsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ operationId: '5', documentId: '3' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentVersionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load versions on init', () => {
    fixture.detectChanges();
    expect(documentServiceSpy.getVersions).toHaveBeenCalledWith(5, 3);
    expect(component.versions().length).toBe(2);
  });

  it('should display version list', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });
});
