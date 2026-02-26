import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, TranslateModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.login on submit', () => {
    component.loginForm.setValue({ username: 'admin', password: 'secret' });
    component.onLogin();
    expect(authServiceSpy.login).toHaveBeenCalledWith('admin', 'secret');
  });

  it('should bind form values', () => {
    component.loginForm.get('username')!.setValue('testuser');
    component.loginForm.get('password')!.setValue('testpass');

    expect(component.loginForm.get('username')!.value).toBe('testuser');
    expect(component.loginForm.get('password')!.value).toBe('testpass');
  });

  it('should have required username and password', () => {
    expect(component.loginForm.get('username')!.hasError('required')).toBeTrue();
    expect(component.loginForm.get('password')!.hasError('required')).toBeTrue();
    expect(component.loginForm.invalid).toBeTrue();
  });
});
