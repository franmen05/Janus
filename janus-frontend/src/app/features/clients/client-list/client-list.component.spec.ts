import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ClientListComponent } from './client-list.component';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { Client } from '../../../core/models/client.model';

describe('ClientListComponent', () => {
  let component: ClientListComponent;
  let fixture: ComponentFixture<ClientListComponent>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockClients: Client[] = [
    { id: 1, name: 'Client A', taxId: '123-456', email: 'a@example.com', phone: '555-0001', address: '123 Main St', active: true, createdAt: '2024-01-01' },
    { id: 2, name: 'Client B', taxId: '789-012', email: 'b@example.com', phone: null, address: null, active: false, createdAt: '2024-01-02' }
  ];

  beforeEach(async () => {
    clientServiceSpy = jasmine.createSpyObj('ClientService', ['getAll']);
    clientServiceSpy.getAll.and.returnValue(of(mockClients));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [ClientListComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: ClientService, useValue: clientServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load clients on init', () => {
    fixture.detectChanges();
    expect(clientServiceSpy.getAll).toHaveBeenCalled();
    expect(component.clients().length).toBe(2);
  });

  it('should display client table', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Client A');
    expect(rows[1].textContent).toContain('Client B');
  });
});
