import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateService: TranslateService;
  let getBrowserLangSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()]
    }).compileComponents();

    // Clear localStorage before each test
    localStorage.removeItem('janus-lang');

    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'addLangs').and.callThrough();
    spyOn(translateService, 'setDefaultLang').and.callThrough();
    getBrowserLangSpy = spyOn(translateService, 'getBrowserLang').and.returnValue('en');
    spyOn(translateService, 'use').and.callThrough();

    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.removeItem('janus-lang');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should set default language to es', () => {
      service.init();

      expect(translateService.addLangs).toHaveBeenCalledWith(['es', 'en']);
      expect(translateService.setDefaultLang).toHaveBeenCalledWith('es');
    });

    it('should use stored language from localStorage', () => {
      localStorage.setItem('janus-lang', 'en');

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('en');
      expect(service.currentLanguage()).toBe('en');
    });

    it('should use browser language when no stored language and browser lang is supported', () => {
      getBrowserLangSpy.and.returnValue('en');

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('en');
      expect(service.currentLanguage()).toBe('en');
    });

    it('should fall back to es when browser language is not supported', () => {
      getBrowserLangSpy.and.returnValue('fr');

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('es');
      expect(service.currentLanguage()).toBe('es');
    });
  });

  describe('setLanguage', () => {
    it('should update currentLanguage signal', () => {
      service.setLanguage('en');

      expect(service.currentLanguage()).toBe('en');
    });

    it('should call translate.use with the language', () => {
      service.setLanguage('en');

      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should persist to localStorage', () => {
      service.setLanguage('en');

      expect(localStorage.getItem('janus-lang')).toBe('en');
    });
  });
});
