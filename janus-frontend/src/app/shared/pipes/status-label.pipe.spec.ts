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

  it('should return translated key for transport mode MARITIME', () => {
    expect(pipe.transform('MARITIME')).toBe('translated:TRANSPORT_MODES.MARITIME');
  });

  it('should return translated key for transport mode AIR', () => {
    expect(pipe.transform('AIR')).toBe('translated:TRANSPORT_MODES.AIR');
  });

  it('should return translated key for operation category CATEGORY_1', () => {
    expect(pipe.transform('CATEGORY_1')).toBe('translated:OPERATION_CATEGORIES.CATEGORY_1');
  });

  it('should return translated key for operation category CATEGORY_2', () => {
    expect(pipe.transform('CATEGORY_2')).toBe('translated:OPERATION_CATEGORIES.CATEGORY_2');
  });

  it('should return translated key for operation category CATEGORY_3', () => {
    expect(pipe.transform('CATEGORY_3')).toBe('translated:OPERATION_CATEGORIES.CATEGORY_3');
  });

  it('should return translated key for IN_REVIEW status', () => {
    expect(pipe.transform('IN_REVIEW')).toBe('translated:STATUS.IN_REVIEW');
  });

  it('should return translated key for PENDING_CORRECTION status', () => {
    expect(pipe.transform('PENDING_CORRECTION')).toBe('translated:STATUS.PENDING_CORRECTION');
  });

  it('should return translated key for PRELIQUIDATION_REVIEW status', () => {
    expect(pipe.transform('PRELIQUIDATION_REVIEW')).toBe('translated:STATUS.PRELIQUIDATION_REVIEW');
  });

  it('should return translated key for ANALYST_ASSIGNED status', () => {
    expect(pipe.transform('ANALYST_ASSIGNED')).toBe('translated:STATUS.ANALYST_ASSIGNED');
  });
});
