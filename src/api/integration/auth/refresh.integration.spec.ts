import type { OpenAPIHono } from '@hono/zod-openapi';
import { loginAsAdmin, parseCookies } from '../setup/auth-helpers';
import { createTestApp } from '../setup/test-app';

describe('POST /api/auth/refresh', () => {
	let app: OpenAPIHono;

	beforeAll(() => {
		app = createTestApp();
	});

	describe('happy path', () => {
		it('returns 200 and rotates tokens on valid refresh token', async () => {
			const adminCookies = await loginAsAdmin(app);

			const response = await app.request('/api/auth/refresh', {
				method: 'POST',
				headers: { Cookie: `refresh_token=${adminCookies.refreshToken}` },
			});

			expect(response.status).toBe(200);

			const newCookies = parseCookies(response);
			expect(newCookies.accessToken).toBeTruthy();
			expect(newCookies.refreshToken).toBeTruthy();
			expect(newCookies.accessToken).not.toBe(adminCookies.accessToken);
			expect(newCookies.refreshToken).not.toBe(adminCookies.refreshToken);
		});
	});

	describe('authentication errors', () => {
		it('returns 401 when no refresh token is provided', async () => {
			const response = await app.request('/api/auth/refresh', {
				method: 'POST',
			});

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.message).toContain('No refresh token');
		});

		it('returns 401 when refresh token is invalid', async () => {
			const response = await app.request('/api/auth/refresh', {
				method: 'POST',
				headers: { Cookie: 'refresh_token=invalid-token' },
			});

			expect(response.status).toBe(401);
		});
	});
});
