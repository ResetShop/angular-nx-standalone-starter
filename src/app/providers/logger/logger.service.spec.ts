import { TestBed } from '@angular/core/testing'
import { clearAllMocks, fn } from '@test-utils'
import { LoggerService } from './logger.service'

describe('LoggerService', () => {
	let service: LoggerService
	const originalError = console.error
	const originalWarn = console.warn
	let mockError: ReturnType<typeof fn>
	let mockWarn: ReturnType<typeof fn>

	beforeEach(() => {
		clearAllMocks()
		mockError = fn()
		mockWarn = fn()
		console.error = mockError
		console.warn = mockWarn
		service = TestBed.inject(LoggerService)
	})

	afterEach(() => {
		console.error = originalError
		console.warn = originalWarn
	})

	describe('error', () => {
		it('should log with [context] prefix and error argument', () => {
			const err = new Error('test')
			service.error('UsersStore', 'loadUsers failed', err)
			expect(mockError.calls).toHaveLength(1)
			expect(mockError.calls[0]).toEqual(['[UsersStore] loadUsers failed', err])
		})

		it('should not pass trailing undefined when error is omitted', () => {
			service.error('UsersStore', 'loadUsers failed')
			expect(mockError.calls).toHaveLength(1)
			expect(mockError.calls[0]).toEqual(['[UsersStore] loadUsers failed'])
		})
	})

	describe('warn', () => {
		it('should log with [context] prefix via console.warn', () => {
			service.warn('HasPermission', 'Invalid identifier')
			expect(mockWarn.calls).toHaveLength(1)
			expect(mockWarn.calls[0]).toEqual(['[HasPermission] Invalid identifier'])
		})
	})
})
