import { describeDbError } from './db-error-diagnostics'

/**
 * Models the Drizzle wrapper error: an outer error whose opaque message hides the real
 * pg/socket cause on its `cause` chain.
 */
function wrapInDrizzleError(cause: unknown): Error {
	return Object.assign(new Error('Failed query: SELECT 1'), { cause })
}

describe('describeDbError', () => {
	describe('pg SQLSTATE causes', () => {
		it('surfaces the 28P01 code, the cause message, and an auth hint', () => {
			const cause = Object.assign(new Error('password authentication failed for user "postgres"'), { code: '28P01' })

			const result = describeDbError(wrapInDrizzleError(cause))

			expect(result).toContain('28P01')
			expect(result).toContain('password authentication failed for user "postgres"')
			expect(result).toContain('verify the DB password')
			expect(result).not.toContain('Failed query: SELECT 1')
		})

		it('maps 3D000 to a missing-database hint', () => {
			const cause = Object.assign(new Error('database "wrong" does not exist'), { code: '3D000' })

			const result = describeDbError(wrapInDrizzleError(cause))

			expect(result).toContain('3D000')
			expect(result).toContain('database does not exist')
		})

		it('maps 28000 (invalid authorization) to the auth hint', () => {
			const cause = Object.assign(new Error('no pg_hba.conf entry for host'), { code: '28000' })

			const result = describeDbError(wrapInDrizzleError(cause))

			expect(result).toContain('28000')
			expect(result).toContain('verify the DB password')
		})
	})

	describe('Node socket causes', () => {
		it('includes address:port and a refused hint for ECONNREFUSED', () => {
			const cause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
				code: 'ECONNREFUSED',
				address: '127.0.0.1',
				port: 5432,
			})

			const result = describeDbError(cause)

			expect(result).toContain('ECONNREFUSED')
			expect(result).toContain('at 127.0.0.1:5432')
			expect(result).toContain('PG_CONNECTION_STRING is likely unset or misnamed')
		})

		it('maps ETIMEDOUT to the IPv4-pooler / paused-project hint', () => {
			const cause = Object.assign(new Error('connect ETIMEDOUT 54.232.77.43:5432'), {
				code: 'ETIMEDOUT',
				address: '54.232.77.43',
				port: 5432,
			})

			const result = describeDbError(wrapInDrizzleError(cause))

			expect(result).toContain('ETIMEDOUT')
			expect(result).toContain('IPv4 pooler')
			expect(result).toContain('paused')
		})

		it('maps ENOTFOUND to a DNS/host hint', () => {
			const cause = Object.assign(new Error('getaddrinfo ENOTFOUND db.example.supabase.co'), { code: 'ENOTFOUND' })

			const result = describeDbError(cause)

			expect(result).toContain('ENOTFOUND')
			expect(result).toContain('host not found')
		})

		it('maps EAI_AGAIN (transient DNS failure) to a DNS/host hint', () => {
			const cause = Object.assign(new Error('getaddrinfo EAI_AGAIN aws-1-sa-east-1.pooler.supabase.com'), {
				code: 'EAI_AGAIN',
			})

			const result = describeDbError(cause)

			expect(result).toContain('EAI_AGAIN')
			expect(result).toContain('host not found')
		})
	})

	describe('TLS causes', () => {
		it('detects a TLS error by code and suggests sslmode=require', () => {
			const cause = Object.assign(new Error('self-signed certificate in certificate chain'), {
				code: 'SELF_SIGNED_CERT_IN_CHAIN',
			})

			const result = describeDbError(cause)

			expect(result).toContain('sslmode=require')
		})

		it('detects a TLS error by message when no code is present', () => {
			const result = describeDbError(new Error('unable to verify the first certificate'))

			expect(result).toContain('sslmode=require')
		})
	})

	describe('cause-chain traversal', () => {
		it('reaches a code nested two levels deep', () => {
			const root = Object.assign(new Error('connect ETIMEDOUT 10.0.0.1:5432'), { code: 'ETIMEDOUT' })
			const middle = Object.assign(new Error('pool error'), { cause: root })

			const result = describeDbError(wrapInDrizzleError(middle))

			expect(result).toContain('ETIMEDOUT')
		})

		it('does not loop forever on a circular cause chain', () => {
			const a: Record<string, unknown> = { message: 'a' }
			const b: Record<string, unknown> = { message: 'b', cause: a }
			a['cause'] = b

			expect(() => describeDbError(a)).not.toThrow()
		})
	})

	describe('fallbacks (total, never throws)', () => {
		it('returns the message with no hint for an unknown error', () => {
			expect(describeDbError(new Error('something weird happened'))).toBe('something weird happened')
		})

		it('returns "Unknown error" for non-object inputs', () => {
			expect(describeDbError(undefined)).toBe('Unknown error')
			expect(describeDbError('a thrown string')).toBe('Unknown error')
			expect(describeDbError(null)).toBe('Unknown error')
		})
	})

	describe('credential safety', () => {
		it('never reflects connection-string or password fields into the output', () => {
			const cause = Object.assign(new Error('password authentication failed'), {
				code: '28P01',
				connectionString: 'postgresql://postgres:supersecret@db.example.com:5432/postgres',
				password: 'supersecret',
			})

			const result = describeDbError(wrapInDrizzleError(cause))

			expect(result).not.toContain('supersecret')
			expect(result).not.toContain('connectionString')
			expect(result).not.toContain('postgresql://')
		})
	})
})
