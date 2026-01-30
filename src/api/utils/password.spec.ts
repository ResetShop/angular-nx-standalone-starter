import { generatePassword } from './password';

describe('generatePassword', () => {
	describe('Default behavior', () => {
		it('should return a string of the default length (16)', () => {
			const password = generatePassword();
			expect(password).toHaveLength(16);
		});

		it('should only contain valid base64url characters', () => {
			const password = generatePassword();
			const base64urlRegex = /^[A-Za-z0-9_-]+$/;
			expect(password).toMatch(base64urlRegex);
		});
	});

	describe('Custom length', () => {
		it('should return a string of the specified custom length (8)', () => {
			const password = generatePassword(8);
			expect(password).toHaveLength(8);
		});

		it('should return a string of the specified custom length (24)', () => {
			const password = generatePassword(24);
			expect(password).toHaveLength(24);
		});

		it('should return a string of the specified custom length (32)', () => {
			const password = generatePassword(32);
			expect(password).toHaveLength(32);
		});

		it('should return a string of the specified custom length (64)', () => {
			const password = generatePassword(64);
			expect(password).toHaveLength(64);
		});
	});

	describe('Character validation', () => {
		it('should only contain valid base64url characters for default length', () => {
			const password = generatePassword();
			const base64urlRegex = /^[A-Za-z0-9_-]+$/;
			expect(password).toMatch(base64urlRegex);
		});

		it('should only contain valid base64url characters for custom length (24)', () => {
			const password = generatePassword(24);
			const base64urlRegex = /^[A-Za-z0-9_-]+$/;
			expect(password).toMatch(base64urlRegex);
		});

		it('should not contain + or / or = characters (base64 padding)', () => {
			const password = generatePassword(32);
			expect(password).not.toContain('+');
			expect(password).not.toContain('/');
			expect(password).not.toContain('=');
		});
	});

	describe('Randomness', () => {
		it('should generate different passwords on consecutive calls', () => {
			const password1 = generatePassword();
			const password2 = generatePassword();
			expect(password1).not.toBe(password2);
		});

		it('should generate different passwords for multiple calls', () => {
			const passwords = Array.from({ length: 100 }, () => generatePassword());
			const uniquePasswords = new Set(passwords);
			expect(uniquePasswords.size).toBe(100);
		});
	});

	describe('Edge cases', () => {
		it('should handle length of 1', () => {
			const password = generatePassword(1);
			expect(password).toHaveLength(1);
			expect(/^[A-Za-z0-9_-]$/).toMatch(password);
		});

		it('should handle large length (128)', () => {
			const password = generatePassword(128);
			expect(password).toHaveLength(128);
			const base64urlRegex = /^[A-Za-z0-9_-]+$/;
			expect(password).toMatch(base64urlRegex);
		});
	});

	describe('Real-world use cases', () => {
		it('should generate a secure temporary password for new users', () => {
			const password = generatePassword();
			expect(password).toHaveLength(16);
			expect(/^[A-Za-z0-9_-]+$/).toMatch(password);
		});

		it('should generate a short password for SMS/PIN use case', () => {
			const password = generatePassword(8);
			expect(password).toHaveLength(8);
		});

		it('should generate a long password for high-security use case', () => {
			const password = generatePassword(32);
			expect(password).toHaveLength(32);
		});
	});
});
