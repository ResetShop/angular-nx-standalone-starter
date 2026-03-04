import { clearAllMocks } from '@test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { PasetoService } from './paseto.service';

describe('PasetoService', () => {
	let pasetoService: PasetoService;

	const validKey = 'a'.repeat(64); // 32 bytes in hex
	const testPayload = {
		sub: '1',
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
	};

	beforeEach(() => {
		clearAllMocks();
		process.env['PASETO_SECRET_KEY'] = validKey;
		delete process.env['PASETO_ISSUER'];
		delete process.env['PASETO_ACCESS_TOKEN_EXPIRY'];
		delete process.env['PASETO_REFRESH_TOKEN_EXPIRY'];
		delete process.env['PASETO_CLOCK_TOLERANCE'];
		pasetoService = new PasetoService();
	});

	describe('constructor', () => {
		it('should throw when PASETO_SECRET_KEY is not configured', () => {
			delete process.env['PASETO_SECRET_KEY'];

			expect(() => new PasetoService()).toThrow('PASETO_SECRET_KEY not configured');
		});

		it('should throw when secret key is too short', () => {
			process.env['PASETO_SECRET_KEY'] = 'abcd';

			expect(() => new PasetoService()).toThrow('PASETO_SECRET_KEY must be at least 32 bytes');
		});

		it('should accept a valid 32-byte hex key', () => {
			expect(() => new PasetoService()).not.toThrow();
		});
	});

	describe('generateAccessToken', () => {
		it('should generate a PASETO v3.local token string', async () => {
			const token = await pasetoService.generateAccessToken(testPayload);

			expect(token).toMatch(/^v3\.local\./);
		});

		it('should generate different tokens for different payloads', async () => {
			const token1 = await pasetoService.generateAccessToken(testPayload);
			const token2 = await pasetoService.generateAccessToken({ ...testPayload, sub: '2' });

			expect(token1).not.toBe(token2);
		});
	});

	describe('generateRefreshToken', () => {
		it('should generate a PASETO v3.local token string', async () => {
			const token = await pasetoService.generateRefreshToken('1');

			expect(token).toMatch(/^v3\.local\./);
		});

		it('should accept an optional token family', async () => {
			const token = await pasetoService.generateRefreshToken('1', 'family-uuid');

			expect(token).toMatch(/^v3\.local\./);
		});
	});

	describe('verifyAccessToken', () => {
		it('should verify and return the payload of a valid token', async () => {
			const token = await pasetoService.generateAccessToken(testPayload);

			const result = await pasetoService.verifyAccessToken(token);

			expect(result.sub).toBe(testPayload.sub);
			expect(result.email).toBe(testPayload.email);
			expect(result.firstName).toBe(testPayload.firstName);
			expect(result.lastName).toBe(testPayload.lastName);
		});

		it('should include issuer claim in verified payload', async () => {
			const token = await pasetoService.generateAccessToken(testPayload);

			const result = await pasetoService.verifyAccessToken(token);

			expect(result.iss).toBe('Reset Shop');
		});

		it('should respect custom issuer from env', async () => {
			process.env['PASETO_ISSUER'] = 'Custom Issuer';
			const customService = new PasetoService();
			const token = await customService.generateAccessToken(testPayload);

			const result = await customService.verifyAccessToken(token);

			expect(result.iss).toBe('Custom Issuer');
		});

		it('should throw for a tampered token', async () => {
			const token = await pasetoService.generateAccessToken(testPayload);
			const tampered = token.slice(0, -5) + 'XXXXX';

			await expect(pasetoService.verifyAccessToken(tampered)).rejects.toThrow('Invalid or expired token');
		});

		it('should throw for a completely invalid token string', async () => {
			await expect(pasetoService.verifyAccessToken('not-a-token')).rejects.toThrow('Invalid or expired token');
		});

		it('should reject a token generated with a different key', async () => {
			const token = await pasetoService.generateAccessToken(testPayload);

			process.env['PASETO_SECRET_KEY'] = 'b'.repeat(64);
			const otherService = new PasetoService();

			await expect(otherService.verifyAccessToken(token)).rejects.toThrow('Invalid or expired token');
		});

		it('should reject a token with wrong issuer', async () => {
			process.env['PASETO_ISSUER'] = 'Issuer A';
			const serviceA = new PasetoService();
			const token = await serviceA.generateAccessToken(testPayload);

			process.env['PASETO_ISSUER'] = 'Issuer B';
			const serviceB = new PasetoService();

			await expect(serviceB.verifyAccessToken(token)).rejects.toThrow('Invalid or expired token');
		});
	});

	describe('verifyRefreshToken', () => {
		it('should verify and return the payload of a valid refresh token', async () => {
			const token = await pasetoService.generateRefreshToken('42', 'test-family');

			const result = await pasetoService.verifyRefreshToken(token);

			expect(result.sub).toBe('42');
			expect(result.tokenFamily).toBe('test-family');
		});

		it('should throw for a tampered refresh token', async () => {
			const token = await pasetoService.generateRefreshToken('1');
			const tampered = token.slice(0, -5) + 'XXXXX';

			await expect(pasetoService.verifyRefreshToken(tampered)).rejects.toThrow('Invalid or expired refresh token');
		});

		it('should throw for a completely invalid token string', async () => {
			await expect(pasetoService.verifyRefreshToken('not-a-token')).rejects.toThrow('Invalid or expired refresh token');
		});

		it('should generate a token family UUID when none is provided', async () => {
			const token = await pasetoService.generateRefreshToken('1');

			const result = await pasetoService.verifyRefreshToken(token);

			expect(result.tokenFamily).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		});
	});
});
