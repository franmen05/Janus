import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  let pipe: StatusLabelPipe;
  const mockTranslateService = {
    instant: (key: string) => 'translated:' + key
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });

    pipe = TestBed.runInInjectionContext(() => new StatusLabelPipe());
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return translated key for DRAFT status', () => {
    expect(pipe.transform('DRAFT')).toBe('translated:STATUS.DRAFT');
  });

  it('should return translated key for CLOSED status', () => {
    expect(pipe.transform('CLOSED')).toBe('translated:STATUS.CLOSED');
  });

  it('should return translated key for document type BL', () => {
    expect(pipe.transform('BL')).toBe('translated:DOCUMENT_TYPES.BL');
  });

  it('should return value as-is for unknown status', () => {
    expect(pipe.transform('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
  });

  it('should return translated key for cargo type FCL', () => {
    expect(pipe.transform('FCL')).toBe('translated:CARGO_TYPES.FCL');
  });

  it('should return translated key for inspection type EXPRESS', () => {
    expect(pipe.transform('EXPRESS')).toBe('translated:INSPECTION_TYPES.EXPRESS');
  });
});
