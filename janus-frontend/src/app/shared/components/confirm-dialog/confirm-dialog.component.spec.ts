import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let mockModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    mockModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NgbActiveModal, useValue: mockModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title "Confirm"', () => {
    expect(component.title()).toBe('Confirm');
  });

  it('should have default message "Are you sure?"', () => {
    expect(component.message()).toBe('Are you sure?');
  });

  it('should call modal.close(true) on confirm', () => {
    component.modal.close(true);
    expect(mockModal.close).toHaveBeenCalledWith(true);
  });

  it('should call modal.dismiss() on cancel', () => {
    component.modal.dismiss();
    expect(mockModal.dismiss).toHaveBeenCalled();
  });
});
