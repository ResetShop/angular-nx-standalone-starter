import { fn } from '@test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
	const originalLog = console.log
	const originalWarn = console.warn
	const originalError = console.error

	let mockLog: ReturnType<typeof fn>
	let mockWarn: ReturnType<typeof fn>
	let mockError: ReturnType<typeof fn>

	beforeEach(() => {
		mockLog = fn()
		mockWarn = fn()
		mockError = fn()
		console.log = mockLog
		console.warn = mockWarn
		console.error = mockError
	})

	afterEach(() => {
		console.log = originalLog
		console.warn = originalWarn
		console.error = originalError
	})

	describe('info', () => {
		it('should log with [context] prefix via console.log', () => {
			logger.info('AuthService', 'User logged in')
			expect(mockLog.calls).toHaveLength(1)
			expect(mockLog.calls[0]).toEqual(['[AuthService] User logged in'])
		})
	})

	describe('warn', () => {
		it('should log with [context] prefix via console.warn', () => {
			logger.warn('generatePassword', 'Invalid wordCount')
			expect(mockWarn.calls).toHaveLength(1)
			expect(mockWarn.calls[0]).toEqual(['[generatePassword] Invalid wordCount'])
		})
	})

	describe('error', () => {
		it('should log with error argument via console.error', () => {
			const err = new Error('test error')
			logger.error('TokenCleanup', 'Failed', err)
			expect(mockError.calls).toHaveLength(1)
			expect(mockError.calls[0]).toEqual(['[TokenCleanup] Failed', err])
		})

		it('should not pass trailing undefined when error is omitted', () => {
			logger.error('TokenCleanup', 'Failed')
			expect(mockError.calls).toHaveLength(1)
			expect(mockError.calls[0]).toEqual(['[TokenCleanup] Failed'])
		})
	})

	describe('security', () => {
		it('should emit valid JSON with _type and timestamp', () => {
			logger.security('login_success', { userId: 1 })
			expect(mockLog.calls).toHaveLength(1)
			const parsed = JSON.parse(mockLog.calls[0][0] as string)
			expect(parsed._type).toBe('security_event')
			expect(parsed.event).toBe('login_success')
			expect(parsed.userId).toBe(1)
			expect(parsed.timestamp).toBeDefined()
		})

		it('should include _type and timestamp even without payload', () => {
			logger.security('token_refresh')
			expect(mockLog.calls).toHaveLength(1)
			const parsed = JSON.parse(mockLog.calls[0][0] as string)
			expect(parsed._type).toBe('security_event')
			expect(parsed.event).toBe('token_refresh')
			expect(parsed.timestamp).toBeDefined()
		})
	})
})
