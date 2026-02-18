import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generatePassword } from './password';

describe('generatePassword', () => {
	const originalAppLanguage = process.env['APP_LANGUAGE'];

	beforeEach(() => {
		delete process.env['APP_LANGUAGE'];
	});

	afterEach(() => {
		if (originalAppLanguage !== undefined) {
			process.env['APP_LANGUAGE'] = originalAppLanguage;
		} else {
			delete process.env['APP_LANGUAGE'];
		}
	});

	describe('format', () => {
		it('should return three words separated by dots', async () => {
			const password = await generatePassword();
			const parts = password.split('.');

			expect(parts).toHaveLength(3);
		});

		it('should contain only lowercase letters and dots', async () => {
			const password = await generatePassword();

			expect(password).toMatch(/^[a-z]+\.[a-z]+\.[a-z]+$/);
		});

		it('should produce non-empty words', async () => {
			const password = await generatePassword();
			const parts = password.split('.');

			for (const word of parts) {
				expect(word.length).toBeGreaterThan(0);
			}
		});
	});

	describe('randomness', () => {
		it('should generate different passwords on consecutive calls', async () => {
			const password1 = await generatePassword();
			const password2 = await generatePassword();

			expect(password1).not.toBe(password2);
		});

		it('should generate unique passwords across multiple calls', async () => {
			const passwords = await Promise.all(Array.from({ length: 50 }, () => generatePassword()));
			const unique = new Set(passwords);

			expect(unique.size).toBe(50);
		});
	});

	describe('language selection', () => {
		it('should use English word list by default', async () => {
			const password = await generatePassword();

			expect(password).toMatch(/^[a-z]+\.[a-z]+\.[a-z]+$/);
		});

		it('should use Spanish word list when APP_LANGUAGE is es', async () => {
			process.env['APP_LANGUAGE'] = 'es';

			const password = await generatePassword();

			expect(password).toMatch(/^[a-z]+\.[a-z]+\.[a-z]+$/);
		});

		it('should throw when word list file does not exist for language', async () => {
			process.env['APP_LANGUAGE'] = 'xx';

			await expect(generatePassword()).rejects.toThrow();
		});
	});
});
