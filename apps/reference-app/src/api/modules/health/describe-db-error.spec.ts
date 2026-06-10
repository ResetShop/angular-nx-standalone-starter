import { describe, expect, it } from 'vitest'
import { describeDbError } from './describe-db-error'

describe('describeDbError', () => {
	it('returns the message verbatim for a plain Error with no cause', () => {
		expect(describeDbError(new Error('Connection refused'))).toBe('Connection refused')
	})

	it('returns a string error verbatim', () => {
		expect(describeDbError('boom')).toBe('boom')
	})

	it('returns "Unknown error" for non-Error, non-string, or empty values', () => {
		expect(describeDbError(42)).toBe('Unknown error')
		expect(describeDbError(null)).toBe('Unknown error')
		expect(describeDbError(undefined)).toBe('Unknown error')
	})

	it('surfaces a PostgreSQL auth failure (SQLSTATE 28P01) from the cause chain with a hint', () => {
		const cause = Object.assign(new Error('password authentication failed for user "postgres.abc"'), {
			code: '28P01',
			severity: 'FATAL',
			routine: 'auth_failed',
		})
		const wrapper = Object.assign(new Error('Failed query: SELECT 1'), { cause })

		const result = describeDbError(wrapper)

		expect(result).toContain('Failed query: SELECT 1')
		expect(result).toContain('password authentication failed')
		expect(result).toContain('code=28P01')
		expect(result).toContain('severity=FATAL')
		expect(result).toContain('PG_CONNECTION_STRING')
	})

	it('surfaces a refused connection (ECONNREFUSED) with address/port and a hint', () => {
		const cause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
			code: 'ECONNREFUSED',
			errno: -111,
			syscall: 'connect',
			address: '127.0.0.1',
			port: 5432,
		})
		const wrapper = Object.assign(new Error('Failed query: SELECT 1'), { cause })

		const result = describeDbError(wrapper)

		expect(result).toContain('code=ECONNREFUSED')
		expect(result).toContain('address=127.0.0.1')
		expect(result).toContain('port=5432')
		expect(result).toContain('localhost')
	})

	it('adds an SSL hint when the cause mentions SSL', () => {
		const cause = new Error('The server does not support SSL connections')
		const wrapper = Object.assign(new Error('Failed query: SELECT 1'), { cause })

		expect(describeDbError(wrapper)).toContain('sslmode=require')
	})

	it('does not loop forever on a self-referential cause', () => {
		const error = new Error('cyclic')
		Object.assign(error, { cause: error })

		expect(describeDbError(error)).toBe('cyclic')
	})

	it('caps the cause chain at the maximum depth', () => {
		let current = new Error('L7')
		for (const message of ['L6', 'L5', 'L4', 'L3', 'L2', 'L1']) {
			current = Object.assign(new Error(message), { cause: current })
		}

		const segments = describeDbError(current).split(' | cause: ')

		expect(segments).toHaveLength(5)
		expect(segments[0]).toContain('L1')
		expect(describeDbError(current)).not.toContain('L7')
	})
})
