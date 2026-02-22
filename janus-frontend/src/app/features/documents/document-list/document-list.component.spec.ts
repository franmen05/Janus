import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DocumentListComponent } from './document-list.component';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockDocuments: any[] = [
    {
      id: 1, operationId: 1, documentType: 'BL', status: 'VALIDATED', active: true,
      latestVersionName: 'bl.pdf', latestVersionSize: 1024,
      createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 2, operationId: 1, documentType: 'COMMERCIAL_INVOICE', status: 'PENDING', active: true,
      latestVersionName: 'invoice.pdf', latestVersionSize: 2048,
      createdAt: '2024-01-02', updatedAt: '2024-01-02'
    }
  ];

  beforeEach(async () => {
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getByOperation', 'download', 'delete']);
    documentServiceSpy.getByOperation.and.returnValue(of(mockDocuments));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.callFake((roles: string[]) => roles.includes('ADMIN'));

    await TestBed.configureTestingModule({
      imports: [DocumentListComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;

    // Set the @Input before first detectChanges
    component.operationId = 1;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load documents on init', () => {
    fixture.detectChanges();
    expect(documentServiceSpy.getByOperation).toHaveBeenCalledWith(1, true);
    expect(component.documents().length).toBe(2);
  });

  it('should show download buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const downloadButtons = compiled.querySelectorAll('.btn-outline-primary');
    expect(downloadButtons.length).toBeGreaterThan(0);
  });
});
