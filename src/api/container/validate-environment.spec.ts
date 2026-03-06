import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateEnvironment } from './validate-environment';

describe('validateEnvironment', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('PASETO_SECRET_KEY', () => {
		it('should throw when PASETO_SECRET_KEY is missing', () => {
			delete process.env['PASETO_SECRET_KEY'];

			expect(() => validateEnvironment()).toThrow('PASETO_SECRET_KEY environment variable is required');
		});

		it('should throw when PASETO_SECRET_KEY is empty', () => {
			process.env['PASETO_SECRET_KEY'] = '';

			expect(() => validateEnvironment()).toThrow('PASETO_SECRET_KEY environment variable is required');
		});

		it('should throw when PASETO_SECRET_KEY is too short', () => {
			process.env['PASETO_SECRET_KEY'] = 'abcdef1234';

			expect(() => validateEnvironment()).toThrow('PASETO_SECRET_KEY must be at least 32 bytes');
		});

		it('should throw when PASETO_SECRET_KEY contains non-hex characters', () => {
			process.env['PASETO_SECRET_KEY'] = 'g'.repeat(64);

			expect(() => validateEnvironment()).toThrow('PASETO_SECRET_KEY must be at least 32 bytes');
		});

		it('should accept a valid 64-character hex key', () => {
			process.env['PASETO_SECRET_KEY'] = 'a'.repeat(64);

			expect(() => validateEnvironment()).not.toThrow();
		});

		it('should accept a hex key longer than 64 characters', () => {
			process.env['PASETO_SECRET_KEY'] = 'f'.repeat(128);

			expect(() => validateEnvironment()).not.toThrow();
		});

		it('should accept mixed-case hex characters', () => {
			process.env['PASETO_SECRET_KEY'] = 'aAbBcCdDeEfF00112233445566778899aAbBcCdDeEfF00112233445566778899';

			expect(() => validateEnvironment()).not.toThrow();
		});
	});

	describe('PASETO_ISSUER', () => {
		beforeEach(() => {
			process.env['PASETO_SECRET_KEY'] = 'a'.repeat(64);
		});

		it('should throw when PASETO_ISSUER is missing', () => {
			delete process.env['PASETO_ISSUER'];

			expect(() => validateEnvironment()).toThrow('PASETO_ISSUER environment variable is required');
		});

		it('should throw when PASETO_ISSUER is empty', () => {
			process.env['PASETO_ISSUER'] = '';

			expect(() => validateEnvironment()).toThrow('PASETO_ISSUER environment variable is required');
		});

		it('should accept a valid issuer string', () => {
			process.env['PASETO_ISSUER'] = 'my-app';

			expect(() => validateEnvironment()).not.toThrow();
		});
	});

	describe('EMAIL_PROVIDER', () => {
		beforeEach(() => {
			process.env['PASETO_SECRET_KEY'] = 'a'.repeat(64);
			process.env['PASETO_ISSUER'] = 'test-issuer';
		});

		it('should accept when EMAIL_PROVIDER is not set', () => {
			delete process.env['EMAIL_PROVIDER'];

			expect(() => validateEnvironment()).not.toThrow();
		});

		it('should accept nodemailer as a valid provider', () => {
			process.env['EMAIL_PROVIDER'] = 'nodemailer';

			expect(() => validateEnvironment()).not.toThrow();
		});

		it('should accept ethereal as a valid provider', () => {
			process.env['EMAIL_PROVIDER'] = 'ethereal';

			expect(() => validateEnvironment()).not.toThrow();
		});

		it('should throw for an invalid provider', () => {
			process.env['EMAIL_PROVIDER'] = 'sendgrid';

			expect(() => validateEnvironment()).toThrow('Invalid EMAIL_PROVIDER: "sendgrid"');
		});

		it('should include valid values in the error message', () => {
			process.env['EMAIL_PROVIDER'] = 'invalid';

			expect(() => validateEnvironment()).toThrow('Valid values: nodemailer, ethereal');
		});
	});
});
