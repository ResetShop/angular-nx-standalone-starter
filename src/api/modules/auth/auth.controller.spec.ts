import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock function that can be referenced
const mockCleanupExpiredTokens = vi.fn();

// Mock the container
vi.mock('../../container', () => {
	return {
		container: {
			cradle: {
				get authService() {
					return {
						cleanupExpiredTokens: mockCleanupExpiredTokens,
					};
				},
			},
		},
	};
});

// Import controller after mocking
import authController from './auth.controller';

describe('Auth Controller - cleanup-tokens endpoint', () => {
	const app = new Hono();
	app.route('/auth', authController);

	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset env vars
		process.env = { ...originalEnv };
		delete process.env['CRON_SECRET'];
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('Authorization', () => {
		it('should return 401 when no authorization provided', async () => {
			const res = await app.request('/auth/cleanup-tokens');

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe('Unauthorized');
		});

		it('should return 401 when CRON_SECRET is too short', async () => {
			process.env['CRON_SECRET'] = 'short'; // Less than 32 chars

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: 'Bearer short',
				},
			});

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe('Unauthorized');
		});

		it('should return 401 when CRON_SECRET does not match', async () => {
			const validSecret = 'a'.repeat(32); // 32 chars minimum
			process.env['CRON_SECRET'] = validSecret;

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: 'Bearer wrong-secret-that-is-long-enough',
				},
			});

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe('Unauthorized');
		});

		it('should return 401 when Authorization header format is wrong', async () => {
			const validSecret = 'a'.repeat(32);
			process.env['CRON_SECRET'] = validSecret;

			// Missing "Bearer " prefix
			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: validSecret,
				},
			});

			expect(res.status).toBe(401);
			const data = await res.json();
			expect(data.error).toBe('Unauthorized');
		});

		it('should succeed with valid CRON_SECRET', async () => {
			const validSecret = 'a'.repeat(32);
			process.env['CRON_SECRET'] = validSecret;
			mockCleanupExpiredTokens.mockResolvedValue({ deletedCount: 5, incomplete: false });

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: `Bearer ${validSecret}`,
				},
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Cleanup completed');
			expect(data.deletedCount).toBe(5);
			expect(data.incomplete).toBe(false);
		});
	});

	describe('Cleanup Results', () => {
		const validSecret = 'b'.repeat(32);

		beforeEach(() => {
			process.env['CRON_SECRET'] = validSecret;
		});

		it('should return cleanup completed message with count', async () => {
			mockCleanupExpiredTokens.mockResolvedValue({ deletedCount: 100, incomplete: false });

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: `Bearer ${validSecret}`,
				},
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Cleanup completed');
			expect(data.deletedCount).toBe(100);
			expect(data.incomplete).toBe(false);
		});

		it('should return incomplete message when max batch limit reached', async () => {
			mockCleanupExpiredTokens.mockResolvedValue({ deletedCount: 100000, incomplete: true });

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: `Bearer ${validSecret}`,
				},
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Cleanup incomplete - max batch limit reached');
			expect(data.deletedCount).toBe(100000);
			expect(data.incomplete).toBe(true);
		});

		it('should return "already in progress" when cleanup returns null', async () => {
			mockCleanupExpiredTokens.mockResolvedValue(null);

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: `Bearer ${validSecret}`,
				},
			});

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.message).toBe('Cleanup already in progress');
			expect(data.deletedCount).toBe(0);
			expect(data.incomplete).toBe(false);
		});

		it('should return 500 when cleanup throws an error', async () => {
			mockCleanupExpiredTokens.mockRejectedValue(new Error('Database connection failed'));

			const res = await app.request('/auth/cleanup-tokens', {
				headers: {
					Authorization: `Bearer ${validSecret}`,
				},
			});

			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data.error).toBe('Cleanup failed');
		});
	});
});
