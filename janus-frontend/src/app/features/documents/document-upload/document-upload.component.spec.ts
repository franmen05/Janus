import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DocumentUploadComponent } from './document-upload.component';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentType } from '../../../core/models/document.model';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['upload']);
    documentServiceSpy.upload.and.returnValue(of({
      id: 1, documentType: 'BL', status: 'VALIDATED',
      latestVersionName: 'bl.pdf', latestVersionSize: 1024,
      createdAt: '2024-01-01', updatedAt: '2024-01-01'
    } as any));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DocumentUploadComponent, FormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '5' }) }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call upload service on submit', () => {
    spyOn(window, 'alert');
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    component.selectedFile = mockFile;
    component.selectedType = DocumentType.BL;

    component.onUpload();

    expect(documentServiceSpy.upload).toHaveBeenCalledWith(5, mockFile, DocumentType.BL, undefined);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operations', 5], { queryParams: { tab: 'documents' } });
  });

  it('should show document type selector', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const selectElement = compiled.querySelector('select.form-select') as HTMLSelectElement;
    expect(selectElement).toBeTruthy();
    expect(selectElement.options.length).toBe(component.documentTypes.length);
  });
});
