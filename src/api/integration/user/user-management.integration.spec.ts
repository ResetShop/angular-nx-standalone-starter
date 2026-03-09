import type { OpenAPIHono } from '@hono/zod-openapi';
import { authenticatedRequest, loginAsAdmin, loginAsRestricted } from '../setup/auth-helpers';
import { getSeededAdminIds, getTestDb } from '../setup/db-helpers';
import { createTestApp } from '../setup/test-app';

describe('User management endpoints (/api/user)', () => {
	let app: OpenAPIHono;
	let adminCookies: Awaited<ReturnType<typeof loginAsAdmin>>;
	let adminUserId: number;
	let adminRoleId: number;

	beforeAll(async () => {
		app = createTestApp();
		adminCookies = await loginAsAdmin(app);
		const ids = await getSeededAdminIds(getTestDb());
		adminUserId = ids.adminUserId;
		adminRoleId = ids.adminRoleId;
	});

	// ── List Users ────────────────────────────────────────────────
	describe('GET /api/user', () => {
		it('returns paginated list of users', async () => {
			const response = await authenticatedRequest(app, '/api/user', {
				cookies: adminCookies,
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data).toBeInstanceOf(Array);
			expect(body.data.length).toBeGreaterThan(0);
		});

		it('supports search parameter', async () => {
			const response = await authenticatedRequest(app, '/api/user?search=admin', {
				cookies: adminCookies,
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data.length).toBeGreaterThan(0);
		});

		it('returns 401 without authentication', async () => {
			const response = await app.request('/api/user');
			expect(response.status).toBe(401);
		});

		it('returns 403 without required permission', async () => {
			const restrictedCookies = await loginAsRestricted(app);

			const response = await authenticatedRequest(app, '/api/user', { cookies: restrictedCookies });
			expect(response.status).toBe(403);
		});
	});

	// ── Create User ───────────────────────────────────────────────
	describe('POST /api/user', () => {
		it('creates a new user and returns 201', async () => {
			const response = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: {
					email: 'newuser@test.com',
					firstName: 'New',
					lastName: 'User',
				},
			});

			expect(response.status).toBe(201);
			const body = await response.json();
			expect(body).toMatchObject({
				email: 'newuser@test.com',
				firstName: 'New',
				lastName: 'User',
				status: 'active',
			});
			expect(body.id).toBeDefined();
		});

		it('creates a user with role assignments', async () => {
			const response = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: {
					email: 'withrole@test.com',
					firstName: 'With',
					lastName: 'Role',
					roleIds: [adminRoleId],
				},
			});

			expect(response.status).toBe(201);
			const body = await response.json();

			// Verify roles via GET — the create response may return roles inline or empty
			const getResponse = await authenticatedRequest(app, `/api/user/${body.id}`, {
				cookies: adminCookies,
			});
			const userData = await getResponse.json();
			expect(userData.roles).toBeInstanceOf(Array);
			expect(userData.roles.length).toBeGreaterThan(0);
		});

		it('returns 409 for duplicate email', async () => {
			const response = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: {
					email: 'newuser@test.com',
					firstName: 'Duplicate',
					lastName: 'User',
				},
			});
			expect(response.status).toBe(409);
		});

		it('returns 401 without authentication', async () => {
			const response = await app.request('/api/user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'unauth@test.com', firstName: 'U', lastName: 'A' }),
			});
			expect(response.status).toBe(401);
		});

		it('returns 403 without required permission', async () => {
			const restrictedCookies = await loginAsRestricted(app);
			const response = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: restrictedCookies,
				body: { email: 'forbidden@test.com', firstName: 'F', lastName: 'B' },
			});
			expect(response.status).toBe(403);
		});
	});

	// ── Get User ──────────────────────────────────────────────────
	describe('GET /api/user/{id}', () => {
		it('returns user details with roles', async () => {
			const response = await authenticatedRequest(app, `/api/user/${adminUserId}`, {
				cookies: adminCookies,
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.id).toBe(adminUserId);
			expect(body.roles).toBeInstanceOf(Array);
		});

		it('returns 404 for non-existent user', async () => {
			const response = await authenticatedRequest(app, '/api/user/99999', {
				cookies: adminCookies,
			});
			expect(response.status).toBe(404);
		});

		it('returns 401 without authentication', async () => {
			const response = await app.request(`/api/user/${adminUserId}`);
			expect(response.status).toBe(401);
		});

		it('returns 403 without required permission', async () => {
			const restrictedCookies = await loginAsRestricted(app);
			const response = await authenticatedRequest(app, `/api/user/${adminUserId}`, {
				cookies: restrictedCookies,
			});
			expect(response.status).toBe(403);
		});
	});

	// ── Update User ───────────────────────────────────────────────
	describe('PATCH /api/user/{id}', () => {
		it('updates user details', async () => {
			const createResponse = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: { email: 'updatable@test.com', firstName: 'Updatable', lastName: 'User' },
			});
			const created = await createResponse.json();

			const response = await authenticatedRequest(app, `/api/user/${created.id}`, {
				method: 'PATCH',
				cookies: adminCookies,
				body: { firstName: 'Updated', lastName: 'Name' },
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.firstName).toBe('Updated');
			expect(body.lastName).toBe('Name');
		});

		it('returns 404 for non-existent user', async () => {
			const response = await authenticatedRequest(app, '/api/user/99999', {
				method: 'PATCH',
				cookies: adminCookies,
				body: { firstName: 'Ghost' },
			});
			expect(response.status).toBe(404);
		});

		it('returns 409 for duplicate email', async () => {
			const create1 = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: { email: 'unique-email@test.com', firstName: 'Unique', lastName: 'Email' },
			});
			const user1 = await create1.json();

			await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: { email: 'another-email@test.com', firstName: 'Another', lastName: 'Email' },
			});

			const response = await authenticatedRequest(app, `/api/user/${user1.id}`, {
				method: 'PATCH',
				cookies: adminCookies,
				body: { email: 'another-email@test.com' },
			});
			expect(response.status).toBe(409);
		});

		it('returns 401 without authentication', async () => {
			const response = await app.request(`/api/user/${adminUserId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ firstName: 'Unauth' }),
			});
			expect(response.status).toBe(401);
		});

		it('returns 403 without required permission', async () => {
			const restrictedCookies = await loginAsRestricted(app);
			const response = await authenticatedRequest(app, `/api/user/${adminUserId}`, {
				method: 'PATCH',
				cookies: restrictedCookies,
				body: { firstName: 'Forbidden' },
			});
			expect(response.status).toBe(403);
		});
	});

	// ── Update User Status ────────────────────────────────────────
	describe('PATCH /api/user/{id}/status', () => {
		it('disables a user', async () => {
			const createResponse = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: { email: 'disableable@test.com', firstName: 'Disable', lastName: 'User' },
			});
			const created = await createResponse.json();

			const response = await authenticatedRequest(app, `/api/user/${created.id}/status`, {
				method: 'PATCH',
				cookies: adminCookies,
				body: { status: 'disabled' },
			});

			expect(response.status).toBe(200);
			expect((await response.json()).status).toBe('disabled');
		});

		it('returns 404 for non-existent user', async () => {
			const response = await authenticatedRequest(app, '/api/user/99999/status', {
				method: 'PATCH',
				cookies: adminCookies,
				body: { status: 'disabled' },
			});
			expect(response.status).toBe(404);
		});

		it('returns 401 without authentication', async () => {
			const response = await app.request(`/api/user/${adminUserId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'disabled' }),
			});
			expect(response.status).toBe(401);
		});

		it('returns 403 without required permission', async () => {
			const restrictedCookies = await loginAsRestricted(app);
			const response = await authenticatedRequest(app, `/api/user/${adminUserId}/status`, {
				method: 'PATCH',
				cookies: restrictedCookies,
				body: { status: 'disabled' },
			});
			expect(response.status).toBe(403);
		});
	});

	// ── Delete User ───────────────────────────────────────────────
	describe('DELETE /api/user/{id}', () => {
		it('soft-deletes a user', async () => {
			const createResponse = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: { email: 'deleteable@test.com', firstName: 'Delete', lastName: 'User' },
			});
			const created = await createResponse.json();

			const response = await authenticatedRequest(app, `/api/user/${created.id}`, {
				method: 'DELETE',
				cookies: adminCookies,
			});

			expect(response.status).toBe(200);
			expect((await response.json()).message).toBeDefined();
		});

		it('returns 404 for non-existent user', async () => {
			const response = await authenticatedRequest(app, '/api/user/99999', {
				method: 'DELETE',
				cookies: adminCookies,
			});
			expect(response.status).toBe(404);
		});

		it('returns 401 without authentication', async () => {
			const response = await app.request('/api/user/99999', { method: 'DELETE' });
			expect(response.status).toBe(401);
		});

		it('returns 403 without required permission', async () => {
			const restrictedCookies = await loginAsRestricted(app);
			const response = await authenticatedRequest(app, `/api/user/${adminUserId}`, {
				method: 'DELETE',
				cookies: restrictedCookies,
			});
			expect(response.status).toBe(403);
		});
	});
});
