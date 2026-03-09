import type { OpenAPIHono } from '@hono/zod-openapi';
import { authenticatedRequest, loginAs, loginAsAdmin } from '../setup/auth-helpers';
import { getTestDb, seedRestrictedUser } from '../setup/db-helpers';
import { createTestApp } from '../setup/test-app';

describe('User management endpoints (/api/user)', () => {
	let app: OpenAPIHono;
	let adminCookies: Awaited<ReturnType<typeof loginAsAdmin>>;

	beforeAll(async () => {
		app = createTestApp();
		adminCookies = await loginAsAdmin(app);
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
			const db = getTestDb();
			const restricted = await seedRestrictedUser(db);
			const { cookies } = await loginAs(app, restricted.email, restricted.password);

			const response = await authenticatedRequest(app, '/api/user', { cookies });
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
			const rolesResponse = await authenticatedRequest(app, '/api/access/roles', {
				cookies: adminCookies,
			});
			const roleId = (await rolesResponse.json()).data[0].id;

			const response = await authenticatedRequest(app, '/api/user', {
				method: 'POST',
				cookies: adminCookies,
				body: {
					email: 'withrole@test.com',
					firstName: 'With',
					lastName: 'Role',
					roleIds: [roleId],
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
	});

	// ── Get User ──────────────────────────────────────────────────
	describe('GET /api/user/{id}', () => {
		it('returns user details with roles', async () => {
			const listResponse = await authenticatedRequest(app, '/api/user', {
				cookies: adminCookies,
			});
			const userId = (await listResponse.json()).data[0].id;

			const response = await authenticatedRequest(app, `/api/user/${userId}`, {
				cookies: adminCookies,
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.id).toBe(userId);
			expect(body.roles).toBeInstanceOf(Array);
		});

		it('returns 404 for non-existent user', async () => {
			const response = await authenticatedRequest(app, '/api/user/99999', {
				cookies: adminCookies,
			});
			expect(response.status).toBe(404);
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
	});
});
