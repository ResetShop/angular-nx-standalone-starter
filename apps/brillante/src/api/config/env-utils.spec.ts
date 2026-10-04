import { clearAllMocks, spyOn } from '@resetshop/util/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dbEnv, resetDbEnv, seedDbEnv } from './db.env'
import { EnvValidationError } from './env-utils'

// Generic fail-fast contract of the createEnvHandler proxy, exercised through a concrete domain
// (db) that has a required field. Reading a required field that is absent from process.env prints a
// FATAL message and throws an EnvValidationError. The process is never terminated: on Cloudflare
// Workers `process.exit` cancels the request with no message, so the error has to surface as a
// normal exception. This lives here (not in a domain spec) because it tests the shared factory
// behavior, not the db schema.
describe('createEnvHandler proxy — validation failure contract', () => {
	beforeEach(() => {
		clearAllMocks()
		resetDbEnv()
	})

	afterEach(() => {
		// Restore the handler's test-defaults so other specs in the same worker see them.
		resetDbEnv()
		seedDbEnv()
	})

	function withMissingConnectionString(run: () => void): void {
		const originalConnString = process.env['PG_CONNECTION_STRING']
		try {
			delete process.env['PG_CONNECTION_STRING']
			resetDbEnv()
			run()
		} finally {
			if (originalConnString === undefined) {
				delete process.env['PG_CONNECTION_STRING']
			} else {
				process.env['PG_CONNECTION_STRING'] = originalConnString
			}
			// Self-contained cleanup: clear the cache unconditionally so a failed assertion above
			// never leaves the proxy in an uninitialized state for the next test.
			resetDbEnv()
		}
	}

	it('throws an EnvValidationError naming the domain and the failing field when a required field is absent', () => {
		const errorSpy = spyOn(console, 'error')

		withMissingConnectionString(() => {
			let thrown: unknown
			try {
				void dbEnv.PG_CONNECTION_STRING
			} catch (error) {
				thrown = error
			}

			expect(thrown).toBeInstanceOf(EnvValidationError)
			expect((thrown as EnvValidationError).domainName).toBe('db')
			expect((thrown as EnvValidationError).issues.join(' ')).toContain('PG_CONNECTION_STRING')
			expect(errorSpy.calls.some(([msg]) => String(msg).includes('FATAL'))).toBe(true)
		})
	})

	it('never calls process.exit when validation fails', () => {
		const exitSpy = spyOn(process, 'exit')
		exitSpy.mockImplementation((() => {
			throw new Error('process.exit called')
		}) as never)

		withMissingConnectionString(() => {
			expect(() => dbEnv.PG_CONNECTION_STRING).toThrow(EnvValidationError)
			expect(exitSpy.calls).toHaveLength(0)
		})
	})

	it('does not cache a failed validation, so the next access succeeds once the variable is present', () => {
		withMissingConnectionString(() => {
			expect(() => dbEnv.PG_CONNECTION_STRING).toThrow(EnvValidationError)

			process.env['PG_CONNECTION_STRING'] = 'postgres://recovered'
			expect(dbEnv.PG_CONNECTION_STRING).toBe('postgres://recovered')
		})
	})
})
