import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxSize of 10485760 (10 MB)', () => {
    expect(component.maxSize()).toBe(10485760);
  });

  it('should select file and emit fileSelected', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    spyOn(component.fileSelected, 'emit');

    component.selectFile(file);

    expect(component.selectedFile).toBe(file);
    expect(component.fileSelected.emit).toHaveBeenCalledWith(file);
  });

  it('should reject file exceeding maxSize', () => {
    spyOn(window, 'alert');
    spyOn(component.fileSelected, 'emit');

    const largeContent = new Array(10485761).fill('a').join('');
    const largeFile = new File([largeContent], 'huge.pdf', { type: 'application/pdf' });

    component.selectFile(largeFile);

    expect(window.alert).toHaveBeenCalled();
    expect(component.selectedFile).toBeNull();
    expect(component.fileSelected.emit).not.toHaveBeenCalled();
  });

  it('should clear selected file', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    component.selectedFile = file;

    component.clear();

    expect(component.selectedFile).toBeNull();
  });

  it('should format size correctly in bytes', () => {
    expect(component.formatSize(500)).toBe('500 B');
  });

  it('should format size correctly in KB', () => {
    expect(component.formatSize(2048)).toBe('2.0 KB');
  });

  it('should format size correctly in MB', () => {
    expect(component.formatSize(1048576)).toBe('1.0 MB');
  });
});
