import { getInternalErrorMessage, InternalAuthErrorCode } from '@contracts/auth/auth.errors'
import { UserStatus } from '@contracts/user/user.constants'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createPasswordHasher, createPasswordVerifier } from '../../services/password/password-hasher'
import type { UserData } from '../user/interfaces'
import { AuthPasswordService } from './auth-password.service'
import { InMemoryAuthenticationRepository } from './authentication.repository.mock'
import type { AuthenticationData } from './interfaces'

describe('AuthPasswordService', () => {
	let mockAuthRepo: InMemoryAuthenticationRepository
	let service: AuthPasswordService

	const testPassword = 'password123'
	let testPasswordHash: string

	const testUser: UserData = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		status: UserStatus.ACTIVE,
	}

	const buildAuthRecord = (overrides: Partial<AuthenticationData> = {}): AuthenticationData => ({
		id: 1,
		userId: testUser.id,
		passwordHash: testPasswordHash,
		failedLoginAttempts: 0,
		lockedUntil: null,
		mustChangePassword: false,
		...overrides,
	})

	beforeAll(async () => {
		testPasswordHash = await createPasswordHasher()(testPassword)
	})

	beforeEach(() => {
		mockAuthRepo = new InMemoryAuthenticationRepository()
		service = new AuthPasswordService({ authRepository: mockAuthRepo, verifyPassword: createPasswordVerifier() })
	})

	afterEach(() => {
		mockAuthRepo.clear()
	})

	describe('validateCredentials', () => {
		it('returns the user and auth record on valid credentials', async () => {
			const authRecord = buildAuthRecord()

			const result = await service.validateCredentials(testUser, authRecord, testPassword)

			expect(result).toEqual({ user: testUser, authRecord })
		})

		it('throws INVALID_CREDENTIALS and increments failed attempts on a wrong password', async () => {
			await expect(service.validateCredentials(testUser, buildAuthRecord(), 'wrong-password')).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS),
			)
			expect(mockAuthRepo.incrementedUsers).toContain(testUser.id)
		})

		it('throws INVALID_CREDENTIALS without incrementing when the user is not found (timing-safe)', async () => {
			await expect(service.validateCredentials(null, null, testPassword)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS),
			)
			expect(mockAuthRepo.incrementedUsers).toHaveLength(0)
		})

		it('throws INVALID_CREDENTIALS without incrementing when the auth record is missing', async () => {
			await expect(service.validateCredentials(testUser, null, testPassword)).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS),
			)
			expect(mockAuthRepo.incrementedUsers).toHaveLength(0)
		})

		it('throws INVALID_CREDENTIALS for a disabled user even with the correct password', async () => {
			await expect(
				service.validateCredentials({ ...testUser, status: UserStatus.DISABLED }, buildAuthRecord(), testPassword),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('throws INVALID_CREDENTIALS for a deleted user even with the correct password', async () => {
			await expect(
				service.validateCredentials({ ...testUser, status: UserStatus.DELETED }, buildAuthRecord(), testPassword),
			).rejects.toThrow(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
		})

		it('locks the account when failed attempts reach the configured threshold', async () => {
			// maxFailedAttempts: 1 → a single wrong password trips the lockout branch
			const lockingAuthRepo = new InMemoryAuthenticationRepository({ maxFailedAttempts: 1 })
			lockingAuthRepo.addAuthRecord(testUser.id, { passwordHash: testPasswordHash })
			const lockingService = new AuthPasswordService({
				authRepository: lockingAuthRepo,
				verifyPassword: createPasswordVerifier(),
			})

			await expect(lockingService.validateCredentials(testUser, buildAuthRecord(), 'wrong-password')).rejects.toThrow(
				getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS),
			)
			expect(lockingAuthRepo.lockedUsers).toHaveLength(1)
		})
	})
})
