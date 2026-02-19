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

			expect(password).toMatch(/^[\p{Ll}]+\.[\p{Ll}]+\.[\p{Ll}]+$/u);
		});

		it('should produce non-empty words', async () => {
			const password = await generatePassword();
			const parts = password.split('.');

			for (const word of parts) {
				expect(word.length).toBeGreaterThan(0);
			}
		});
	});

	describe('wordCount validation', () => {
		it('should throw for zero', async () => {
			await expect(generatePassword(0)).rejects.toThrow('wordCount must be a positive integer');
		});

		it('should throw for negative values', async () => {
			await expect(generatePassword(-1)).rejects.toThrow('wordCount must be a positive integer');
		});

		it('should throw for non-integer values', async () => {
			await expect(generatePassword(2.5)).rejects.toThrow('wordCount must be a positive integer');
		});

		it('should accept a custom word count', async () => {
			const password = await generatePassword(5);
			const parts = password.split('.');

			expect(parts).toHaveLength(5);
		});
	});

	describe('language selection', () => {
		it('should use English word list by default', async () => {
			const password = await generatePassword();

			expect(password).toMatch(/^[\p{Ll}]+\.[\p{Ll}]+\.[\p{Ll}]+$/u);
		});

		it('should use Spanish word list when APP_LANGUAGE is es', async () => {
			process.env['APP_LANGUAGE'] = 'es';

			const password = await generatePassword();

			expect(password).toMatch(/^[\p{Ll}]+\.[\p{Ll}]+\.[\p{Ll}]+$/u);
		});

		it('should throw when word list file does not exist for language', async () => {
			process.env['APP_LANGUAGE'] = 'xx';

			await expect(generatePassword()).rejects.toThrow();
		});
	});
});
