import { LEGACY_ROLES } from '@contracts/role/legacy-roles'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { parseDurationToMs } from '@resetshop/util'
import { authentication } from '@schema/authentication'
import { passwordResetToken } from '@schema/password-reset-token'
import { role } from '@schema/role'
import { user, userRole } from '@schema/user'
import { eq, sql, TransactionRollbackError } from 'drizzle-orm'
import { DrizzleLegacyUserImportTarget } from '../../../db/legacy-import/drizzle-legacy-user-target'
import {
	buildDump,
	buildReferenceInsert,
	buildUserInsert,
	buildUserRoleInsert,
} from '../../../db/legacy-import/legacy-dump.testing'
import { runLegacyUserImport } from '../../../db/legacy-import/legacy-user-import'
import { MysqlDumpUserSource } from '../../../db/legacy-import/mysql-dump-user-source'
import { DrizzleOnboardingTarget } from '../../../db/onboarding/drizzle-onboarding-target'
import { runOnboarding } from '../../../db/onboarding/onboarding'
import { seedLegacyRoles } from '../../../db/seed-legacy-roles'
import { seedHttpEnv } from '../../config/http.env'
import { ONBOARDING_RESET_TOKEN_EXPIRY } from '../../constants/auth.constants'
import type { DrizzleTransaction } from '../../helpers/drizzle-postgres-connector'
import { hashResetToken } from '../../modules/auth/reset-token'
import { createPasswordHasher } from '../../services/password/password-hasher'
import { loginAs } from '../setup/auth-helpers'
import { getTestDb } from '../setup/db-helpers'
import { createTestApp } from '../setup/test-app'

/** Invented legacy staff: two active ones, a disabled one, one without email, and a customer. */
const dump = buildDump(
	buildUserInsert([
		{ id: 2, firstName: 'Omar', lastName: 'Owner', email: 'omar@onboarding.example' },
		{ id: 3, firstName: 'Eli', lastName: 'Staff', email: 'eli@onboarding.example' },
		{ id: 4, firstName: 'Dina', lastName: 'Disabled', email: 'dina@onboarding.example', enabled: false },
		{ id: 5, firstName: 'Nora', lastName: 'Nomail', email: null },
		{ id: 9, firstName: 'Cleo', lastName: 'Customer', email: 'cleo@onboarding.example' },
	]),
	buildUserRoleInsert([
		{ userId: 2, roleId: 2 },
		{ userId: 3, roleId: 6 },
		{ userId: 4, roleId: 3 },
		{ userId: 5, roleId: 6 },
		{ userId: 9, roleId: 5 },
	]),
	buildReferenceInsert('sh_cash_transaction', 'created_user_id', [2]),
	buildReferenceInsert('sh_fix_repair_status_history', 'modified_user_id', [3]),
	buildReferenceInsert('sh_fix_repair', 'usuario_creador', [2]),
	buildReferenceInsert('sh_fix_repair', 'usuario_modificador', [null]),
	buildReferenceInsert('sh_fix_customer', 'created_by', [null]),
	buildReferenceInsert('sh_fix_customer', 'updated_by', [null]),
)

async function inRolledBackTransaction(work: (tx: DrizzleTransaction) => Promise<void>): Promise<void> {
	await getTestDb()
		.transaction(async (tx) => {
			// REASON: the test database client is built with a subset of the schema, which makes its transaction type
			// nominally different from the connector's; both run the same queries against the same tables.
			await work(tx as unknown as DrizzleTransaction)
			tx.rollback()
		})
		.catch((error: unknown) => {
			if (!(error instanceof TransactionRollbackError)) throw error
		})
}

/** A database like production after the import: the admin (user 1, with a password) and the imported staff. */
async function seedAndImport(tx: DrizzleTransaction): Promise<void> {
	await tx.execute(sql`
		TRUNCATE TABLE
			role_history, role_permission_history, user_profile_history, user_role_history, user_status_history,
			permission_route, role_permission, user_role, refresh_token, password_reset_token, authentication, role, "user"
		CASCADE
	`)
	await tx.insert(role).values({ ...LEGACY_ROLES[0] })
	await seedLegacyRoles(tx)
	await tx.insert(user).values({ id: 1, firstName: 'Seeded', lastName: 'Admin', email: 'admin@onboarding.example' })
	await tx.insert(userRole).values({ userId: 1, roleId: 1 })
	await tx.insert(authentication).values({
		userId: 1,
		passwordHash: await createPasswordHasher()('Seeded-Admin-1!'),
		mustChangePassword: false,
	})
	await runLegacyUserImport(
		new MysqlDumpUserSource(dump),
		new DrizzleLegacyUserImportTarget(tx, createPasswordHasher()),
		{
			dryRun: false,
			alreadyProvisionedLegacyUserIds: [1],
		},
	)
}

describe('onboarding of the imported users', () => {
	beforeEach(() => {
		seedHttpEnv({ CORS_ORIGIN: 'https://app.test' })
	})

	it('mails only the active imported users who still need a password, each with a one-day link', async () => {
		await inRolledBackTransaction(async (tx) => {
			await seedAndImport(tx)
			const sent: string[] = []
			const before = Date.now()

			const result = await runOnboarding(
				new DrizzleOnboardingTarget(tx),
				{ send: async (to) => void sent.push(to) },
				{
					dryRun: false,
					requestedUserIds: null,
					tokenLifetimeMs: parseDurationToMs(ONBOARDING_RESET_TOKEN_EXPIRY),
					pauseBetweenSendsMs: 0,
				},
			)

			expect(result.sentUserIds).toEqual([2, 3])
			expect(sent).toEqual(['omar@onboarding.example', 'eli@onboarding.example'])
			const stored = await tx.select().from(passwordResetToken).orderBy(passwordResetToken.userId)
			expect(stored.map((row) => row.userId)).toEqual([2, 3])
			for (const row of stored) {
				const lifetime = row.expiresAt.getTime() - before
				expect(lifetime).toBeGreaterThanOrEqual(parseDurationToMs('1d'))
				expect(lifetime).toBeLessThan(parseDurationToMs('1d') + parseDurationToMs('1m'))
			}
		})
	})

	it('stores only the hash of each token', async () => {
		await inRolledBackTransaction(async (tx) => {
			await seedAndImport(tx)

			const raw = await new DrizzleOnboardingTarget(tx).issueResetToken(2, new Date(Date.now() + 1000))

			const [row] = await tx.select().from(passwordResetToken).where(eq(passwordResetToken.userId, 2))
			expect(row.tokenHash).toBe(hashResetToken(raw))
			expect(row.tokenHash).not.toBe(raw)
		})
	})

	it('replaces the unused token when a user is mailed again, so only the latest link works', async () => {
		await inRolledBackTransaction(async (tx) => {
			await seedAndImport(tx)
			const target = new DrizzleOnboardingTarget(tx)

			const first = await target.issueResetToken(2, new Date(Date.now() + 1000))
			const second = await target.issueResetToken(2, new Date(Date.now() + 1000))

			const rows = await tx.select().from(passwordResetToken).where(eq(passwordResetToken.userId, 2))
			expect(rows.map((row) => row.tokenHash)).toEqual([hashResetToken(second)])
			expect(first).not.toBe(second)
		})
	})

	it('writes and sends nothing on a dry run', async () => {
		await inRolledBackTransaction(async (tx) => {
			await seedAndImport(tx)

			const result = await runOnboarding(
				new DrizzleOnboardingTarget(tx),
				{ send: async () => Promise.reject(new Error('must not send')) },
				{ dryRun: true, requestedUserIds: null, tokenLifetimeMs: 1000, pauseBetweenSendsMs: 0 },
			)

			expect(result.sentUserIds).toEqual([])
			expect(await tx.select().from(passwordResetToken)).toEqual([])
		})
	})
})

describe('redeeming an onboarding link', () => {
	const email = 'onboarding-e2e@onboarding.example'
	const chosenPassword = 'Chosen-By-The-User-9!'
	let app: OpenAPIHono
	let userId: number

	beforeAll(() => {
		app = createTestApp()
	})

	beforeEach(async () => {
		seedHttpEnv({ CORS_ORIGIN: 'https://app.test' })
		const db = getTestDb()
		const [created] = await db
			.insert(user)
			.values({ firstName: 'Ola', lastName: 'Onboarded', email })
			.returning({ id: user.id })
		userId = created.id
		await db.insert(authentication).values({
			userId,
			passwordHash: await createPasswordHasher()('unusable-random-secret'),
			mustChangePassword: true,
		})
	})

	afterEach(async () => {
		// Cascades to the authentication and password_reset_token rows.
		await getTestDb().delete(user).where(eq(user.email, email))
	})

	async function mail(): Promise<{ token: string; sent: number[] }> {
		const target = new DrizzleOnboardingTarget(getTestDb() as unknown as DrizzleTransaction)
		let text = ''
		const result = await runOnboarding(
			target,
			{ send: async (_to, content) => void (text = content.text) },
			{ dryRun: false, requestedUserIds: [userId], tokenLifetimeMs: parseDurationToMs('1d'), pauseBetweenSendsMs: 0 },
		)
		return { token: /token=([\w-]+)/.exec(text)?.[1] ?? '', sent: [...result.sentUserIds] }
	}

	it('lets the user choose a password with the emailed link, and a re-run no longer mails them', async () => {
		const { token, sent } = await mail()
		expect(sent).toEqual([userId])

		const reset = await app.request('/api/auth/reset-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.52.0.1' },
			body: JSON.stringify({ token, newPassword: chosenPassword }),
		})
		expect(reset.status).toBe(200)
		expect((await loginAs(app, email, chosenPassword)).response.status).toBe(200)

		const rerun = await mail()
		expect(rerun.sent).toEqual([])
	})
})
