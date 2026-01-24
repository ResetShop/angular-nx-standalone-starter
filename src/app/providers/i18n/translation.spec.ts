import { TestBed } from '@angular/core/testing';
import { Translation } from './translation';

describe('Translation Service', () => {
	let service: Translation;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(Translation);
	});

	describe('Service Creation', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should be a singleton (providedIn: root)', () => {
			const service1 = TestBed.inject(Translation);
			const service2 = TestBed.inject(Translation);
			expect(service1).toBe(service2);
		});

		it('should have default language from environment', () => {
			const currentLang = service.getCurrentLanguage();
			expect(['en', 'es']).toContain(currentLang);
		});
	});

	describe('loadDefaultLanguage()', () => {
		it('should load translations for the default language', async () => {
			await service.loadDefaultLanguage();

			// Should not throw when calling instant after loading
			const result = service.instant('AUTH.ERRORS.GENERIC');
			expect(typeof result).toBe('string');
			expect(result).not.toBe('AUTH.ERRORS.GENERIC');
		});
	});

	describe('instant()', () => {
		beforeEach(async () => {
			await service.loadDefaultLanguage();
		});

		it('should return translated string for valid key', () => {
			const result = service.instant('AUTH.ERRORS.INVALID_CREDENTIALS');

			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe('AUTH.ERRORS.INVALID_CREDENTIALS');
		});

		it('should return the key as fallback for non-existent key path', () => {
			// Force a runtime call with an invalid key structure
			const invalidKey = 'AUTH.NONEXISTENT.KEY' as Parameters<typeof service.instant>[0];
			const result = service.instant(invalidKey);

			expect(result).toBe('AUTH.NONEXISTENT.KEY');
		});

		it('should throw error when translations are not loaded', () => {
			// Create a fresh service instance without loading translations
			const freshService = new Translation();

			expect(() => {
				freshService.instant('AUTH.ERRORS.GENERIC');
			}).toThrow(/not loaded/);
		});

		it('should navigate nested keys correctly', () => {
			const result = service.instant('AUTH.ERRORS.ACCOUNT_LOCKED');

			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('setLanguage()', () => {
		it('should change the current language', async () => {
			await service.setLanguage('en');
			expect(service.getCurrentLanguage()).toBe('en');

			await service.setLanguage('es');
			expect(service.getCurrentLanguage()).toBe('es');
		});

		it('should load translations for the new language', async () => {
			await service.setLanguage('en');
			const enResult = service.instant('AUTH.ERRORS.INVALID_CREDENTIALS');

			await service.setLanguage('es');
			const esResult = service.instant('AUTH.ERRORS.INVALID_CREDENTIALS');

			// Both should return valid translations (not the key itself)
			expect(enResult).not.toBe('AUTH.ERRORS.INVALID_CREDENTIALS');
			expect(esResult).not.toBe('AUTH.ERRORS.INVALID_CREDENTIALS');

			// They should be different (different languages)
			expect(enResult).not.toBe(esResult);
		});
	});

	describe('getCurrentLanguage()', () => {
		it('should return the current language', () => {
			const lang = service.getCurrentLanguage();
			expect(['en', 'es']).toContain(lang);
		});

		it('should reflect language changes', async () => {
			await service.setLanguage('en');
			expect(service.getCurrentLanguage()).toBe('en');

			await service.setLanguage('es');
			expect(service.getCurrentLanguage()).toBe('es');
		});
	});

	describe('Translation Caching', () => {
		it('should not reload already loaded translations', async () => {
			await service.setLanguage('en');
			const firstResult = service.instant('AUTH.ERRORS.GENERIC');

			// Call setLanguage again for the same language
			await service.setLanguage('en');
			const secondResult = service.instant('AUTH.ERRORS.GENERIC');

			expect(firstResult).toBe(secondResult);
		});

		it('should cache multiple languages independently', async () => {
			await service.setLanguage('en');
			const enResult = service.instant('AUTH.ERRORS.GENERIC');

			await service.setLanguage('es');
			const esResult = service.instant('AUTH.ERRORS.GENERIC');

			// Switch back to English - should use cached version
			await service.setLanguage('en');
			const enResultCached = service.instant('AUTH.ERRORS.GENERIC');

			expect(enResult).toBe(enResultCached);
			expect(enResult).not.toBe(esResult);
		});
	});
});
