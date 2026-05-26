import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isServerless } from './runtime'

describe('isServerless', () => {
	const originalEnv = process.env

	beforeEach(() => {
		process.env = { ...originalEnv }
	})

	afterEach(() => {
		process.env = originalEnv
	})

	it('returns true when IS_SERVERLESS is the literal string "true"', () => {
		process.env['IS_SERVERLESS'] = 'true'
		expect(isServerless()).toBe(true)
	})

	it('returns false when IS_SERVERLESS is absent', () => {
		delete process.env['IS_SERVERLESS']
		expect(isServerless()).toBe(false)
	})

	it('returns false when IS_SERVERLESS is any string other than "true"', () => {
		process.env['IS_SERVERLESS'] = '1'
		expect(isServerless()).toBe(false)
	})
})
